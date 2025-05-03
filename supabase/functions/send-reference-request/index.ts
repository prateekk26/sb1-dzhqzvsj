import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";
import { corsHeaders } from '../_shared/cors.ts';

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const BASE_URL = Deno.env.get("BASE_URL") || "https://thehireiq.com"; // Production URL
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "references@hireiq.com";

// Create Supabase client with service role for admin access
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Request interface
interface SendReferenceRequestPayload {
  referenceId: string;
}

serve(async (req) => {
  // Handle preflight CORS requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
  
  try {
    // Parse the request payload
    const payload: SendReferenceRequestPayload = await req.json();
    
    // Validate payload
    if (!payload.referenceId) {
      throw new Error("Reference ID is required");
    }
    
    // Get reference information
    const { data: reference, error: refError } = await supabaseAdmin
      .from("references")
      .select(`
        id, 
        referee_name, 
        referee_email, 
        relationship, 
        company, 
        status,
        user_id,
        users_profile!inner(
          first_name,
          last_name,
          email
        )
      `)
      .eq("id", payload.referenceId)
      .single();
    
    if (refError || !reference) {
      throw new Error(`Failed to fetch reference: ${refError?.message || "Not found"}`);
    }
    
    // Check if reference is in the correct state
    if (reference.status !== "pending") {
      throw new Error(`Cannot send request for reference in '${reference.status}' status`);
    }
    
    // Generate a unique token for this reference
    const token = uuidv4();
    
    // Set expiry date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Save the token
    const { error: tokenError } = await supabaseAdmin
      .from("reference_tokens")
      .insert({
        reference_id: reference.id,
        token,
        expires_at: expiresAt.toISOString()
      });
    
    if (tokenError) {
      throw new Error(`Failed to create reference token: ${tokenError.message}`);
    }
    
    // Generate the reference submission URL
    const referenceUrl = `${BASE_URL}/references/submit/${token}`;
    
    // Get the user's name for the email
    const userName = `${reference.users_profile.first_name || ''} ${reference.users_profile.last_name || ''}`.trim() || 'A candidate';
    
    // Send the email using Resend API
    if (!RESEND_API_KEY) {
      console.error("Resend API key is not configured, using fallback");
      console.log(`
        Would send email to: ${reference.referee_email}
        Subject: Reference Request from ${userName}
        URL: ${referenceUrl}
      `);
    } else {
      try {
        console.log(`Sending email to ${reference.referee_email} via Resend API`);
        
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: reference.referee_email,
            subject: `Reference Request from ${userName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2 style="color: #FF8A00; margin-bottom: 20px;">Professional Reference Request</h2>
                
                <p>Dear ${reference.referee_name},</p>
                
                <p>${userName} has listed you as a professional reference from their time at <strong>${reference.company}</strong> 
                where you were their <strong>${reference.relationship}</strong>.</p>
                
                <p>They are currently applying for jobs and would appreciate if you could provide a reference by answering 
                a few questions about your experience working with them.</p>
                
                <div style="margin: 30px 0; text-align: center;">
                  <a href="${referenceUrl}" style="background-color: #FF8A00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    Provide Reference
                  </a>
                </div>
                
                <p style="font-size: 0.9em; color: #666;">This link will expire in 30 days.</p>
                
                <p>Thank you,<br>HireIQ Team</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                
                <p style="font-size: 0.8em; color: #999; text-align: center;">
                  If you didn't expect this email, please disregard it.
                </p>
              </div>
            `
          })
        });
        
        if (!emailResponse.ok) {
          const emailError = await emailResponse.json();
          throw new Error(`Failed to send email: ${JSON.stringify(emailError)}`);
        }
        
        console.log("Email sent successfully via Resend API");
      } catch (emailError) {
        console.error("Error sending email via Resend:", emailError);
        throw new Error(`Failed to send email: ${emailError instanceof Error ? emailError.message : "Unknown error"}`);
      }
    }
    
    // Update the reference status to 'sent'
    const { error: updateError } = await supabaseAdmin
      .from("references")
      .update({ 
        status: "sent",
        sent_at: new Date().toISOString()
      })
      .eq("id", reference.id);
    
    if (updateError) {
      throw new Error(`Failed to update reference status: ${updateError.message}`);
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error sending reference request:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
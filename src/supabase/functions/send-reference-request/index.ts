import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const BASE_URL = Deno.env.get("BASE_URL") || "https://yourdomain.com"; // Replace with your application base URL

// Create Supabase client with service role for admin access
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, x-supabase-client, x-supabase-auth-token"
};

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
    const userName = `${reference.users_profile.first_name} ${reference.users_profile.last_name}`.trim();
    
    // Send the email - in a real implementation, this would call an email service
    console.log(`
      Sending reference request email to: ${reference.referee_email}
      Subject: Reference Request from ${userName}
      
      Dear ${reference.referee_name},
      
      ${userName} has listed you as a professional reference from their time at ${reference.company} 
      where you were their ${reference.relationship}.
      
      They are currently applying for jobs and would appreciate if you could provide a reference by answering 
      a few questions about your experience working with them.
      
      Please click the link below to submit your reference:
      ${referenceUrl}
      
      This link will expire in 30 days.
      
      Thank you,
      HireIQ Team
    `);
    
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
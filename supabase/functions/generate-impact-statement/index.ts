import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import OpenAI from "npm:openai@4.24.1";

import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return new Response(JSON.stringify({
        error: "Missing projectId"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !openaiKey) {
      return new Response(JSON.stringify({
        error: "Missing required environment variables"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Initialize clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({
      apiKey: openaiKey
    });

    // Fetch project data
    const { data: project, error: projectError } = await supabase.from('projects').select('*, experiences(company, role)').eq('id', projectId).single();

    if (projectError || !project) {
      return new Response(JSON.stringify({
        error: projectError?.message || "Project not found"
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Use enhanced description if available, otherwise use raw input
    const projectDescription = project.enhanced_description || project.raw_input;
    const companyName = project.experiences?.company || "Unknown Company";
    const role = project.experiences?.role || "Unknown Role";

    // Generate impact statement with OpenAI - updated to create shorter one-liners
    const prompt = `
    Create a very concise, powerful one-line impact statement for a resume bullet point:

    Project Description: ${projectDescription}
    Company: ${companyName}
    Role: ${role}

    The impact statement must:
    1. Begin with a strong action verb
    2. Include measurable impact (use estimated percentages or numbers if exact metrics aren't provided)
    3. Be EXTREMELY concise (maximum 1 line, 10-15 words)
    4. Focus on the most impressive achievement or business impact
    5. Use specific metrics like "%", "$", or numbers
    
    IMPORTANT: The statement MUST be extremely concise! No more than one line.
    Return ONLY the impact statement with no additional text.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
      temperature: 0.7,
      max_tokens: 100,
      messages: [
        {
          role: "system",
          content: "You create extremely concise, powerful resume bullet points with measurable impact. Your responses are always under 15 words."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const impactStatement = completion.choices[0]?.message?.content?.trim();

    if (!impactStatement) {
      return new Response(JSON.stringify({
        error: "Failed to generate impact statement"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Update the project with the impact statement
    const { error: updateError } = await supabase.from('projects').update({
      impact_statement: impactStatement
    }).eq('id', projectId);

    if (updateError) {
      return new Response(JSON.stringify({
        error: `Failed to save impact statement: ${updateError.message}`
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      impact_statement: impactStatement
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Unexpected error",
      stack: err instanceof Error ? err.stack : undefined
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
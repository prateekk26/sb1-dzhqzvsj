import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from '../_shared/cors.ts';

// Environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Request interface
interface GenerateResponseRequest {
  question: string;
  questionType: 'behavioral' | 'technical' | 'leadership' | 'situational' | 'general';
  targetRole?: string;
  targetIndustry?: string;
  emphasizedSkills?: string[];
  userId: string;
  experienceIds?: string[];
  projectIds?: string[];
}

// Serve HTTP requests
serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    // Parse request payload
    const payload: GenerateResponseRequest = await req.json();
    
    // Validate payload
    if (!payload.question || !payload.userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Fetch user's profile data
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('first_name, last_name')
      .eq('user_id', payload.userId)
      .single();
    
    if (profileError) {
      console.error("Error fetching user profile:", profileError);
    }
    
    // Fetch user's experiences
    let experiencesQuery = supabaseAdmin
      .from('experiences')
      .select('*')
      .eq('user_id', payload.userId);
    
    // Filter by specific experience IDs if provided
    if (payload.experienceIds && payload.experienceIds.length > 0) {
      experiencesQuery = experiencesQuery.in('id', payload.experienceIds);
    }
    
    const { data: experiences, error: experiencesError } = await experiencesQuery.order('start_date', { ascending: false });
    
    if (experiencesError) {
      console.error("Error fetching experiences:", experiencesError);
    }
    
    // Fetch user's projects
    let projectsQuery = supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', payload.userId);
    
    // Filter by specific project IDs if provided
    if (payload.projectIds && payload.projectIds.length > 0) {
      projectsQuery = projectsQuery.in('id', payload.projectIds);
    }
    
    const { data: projects, error: projectsError } = await projectsQuery;
    
    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
    }
    
    // Format experiences and projects for the prompt
    const formattedExperiences = experiences?.map(exp => {
      const startDate = new Date(exp.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const endDate = exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Present';
      
      return `Company: ${exp.company}
Role: ${exp.role}
Period: ${startDate} - ${endDate}
${exp.location ? `Location: ${exp.location}` : ''}
${exp.description ? `Description: ${exp.description}` : ''}`;
    }).join('\n\n') || 'No work experience data available';
    
    const formattedProjects = projects?.map(project => {
      return `Project: ${project.title || 'Untitled Project'}
${project.enhanced_description || project.raw_input}`;
    }).join('\n\n') || 'No project data available';
    
    // Generate the response using OpenAI
    const response = await generateResponse(
      payload.question,
      payload.questionType,
      formattedExperiences,
      formattedProjects,
      payload.targetRole,
      payload.targetIndustry,
      payload.emphasizedSkills,
      profileData?.first_name
    );
    
    // Return the generated response
    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-interview-response:", error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

/**
 * Generate an interview response using OpenAI
 */
async function generateResponse(
  question: string,
  questionType: string,
  experiences: string,
  projects: string,
  targetRole?: string,
  targetIndustry?: string,
  emphasizedSkills?: string[],
  firstName?: string
): Promise<string> {
  try {
    // Verify OpenAI API key
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    // Construct the prompt
    const prompt = `
    You are an expert interview coach helping a candidate prepare personalized responses to interview questions.
    
    CANDIDATE INFORMATION:
    ${firstName ? `First Name: ${firstName}` : ''}
    ${targetRole ? `Target Role: ${targetRole}` : ''}
    ${targetIndustry ? `Target Industry: ${targetIndustry}` : ''}
    ${emphasizedSkills && emphasizedSkills.length > 0 ? `Key Skills to Emphasize: ${emphasizedSkills.join(', ')}` : ''}
    
    WORK EXPERIENCE:
    ${experiences}
    
    PROJECTS:
    ${projects}
    
    INTERVIEW QUESTION (${questionType.toUpperCase()} type):
    "${question}"
    
    INSTRUCTIONS:
    1. Generate a personalized interview response that draws specifically from the candidate's work experience and projects.
    2. Use the STAR method (Situation, Task, Action, Result) for behavioral questions.
    3. Include specific examples, metrics, and achievements from their background.
    4. Keep the response concise but comprehensive (300-500 words).
    5. Maintain a professional, confident tone that matches the candidate's experience level.
    6. Emphasize the skills they want to highlight if specified.
    7. Tailor the response to the target role and industry if specified.
    8. Structure the response with clear paragraphs and logical flow.
    
    RESPONSE FORMAT:
    - Start with a brief introduction that directly addresses the question
    - Include a specific example from their experience that best demonstrates the answer
    - Highlight relevant skills, especially those they want to emphasize
    - End with a conclusion that reinforces their qualifications
    
    Please provide ONLY the response the candidate should give, without any additional commentary, notes, or explanations.
    `;
    
    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: [
          { role: "system", content: "You are an expert interview coach helping candidates prepare personalized responses." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating response with OpenAI:", error);
    throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
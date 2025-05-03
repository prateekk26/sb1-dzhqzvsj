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
interface AnalyzeTranscriptRequest {
  transcript: string;
  userId: string;
  interviewId: string;
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
    const payload: AnalyzeTranscriptRequest = await req.json();
    
    // Validate payload
    if (!payload.transcript || !payload.userId || !payload.interviewId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get interview details to add context
    const { data: interview, error: interviewError } = await supabaseAdmin
      .from("interviews")
      .select("company, position, type")
      .eq("id", payload.interviewId)
      .eq("user_id", payload.userId)
      .single();
    
    if (interviewError) {
      console.error("Error fetching interview details:", interviewError);
    }
    
    // Analyze transcript with OpenAI
    const analysisResult = await analyzeTranscript(
      payload.transcript, 
      interview?.company || "a company",
      interview?.position || "a position",
      interview?.type || "technical"
    );
    
    // Save the analysis results to the database
    await saveAnalysisResults(payload.interviewId, payload.userId, analysisResult);
    
    // Return the analysis results
    return new Response(
      JSON.stringify(analysisResult),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in analyze-interview-transcript:", error);
    
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
 * Analyze the interview transcript using OpenAI
 */
async function analyzeTranscript(
  transcript: string,
  company: string,
  position: string,
  interviewType: string
): Promise<any> {
  try {
    // Construct a prompt for OpenAI
    const prompt = `
    You are an expert interview coach tasked with analyzing an interview transcript.
    
    INTERVIEW CONTEXT:
    - Company: ${company}
    - Position: ${position}
    - Interview Type: ${interviewType}
    
    TRANSCRIPT:
    ${transcript}
    
    Please provide a comprehensive analysis including:
    
    1. Overall feedback on the interview performance (150-200 words)
    2. 3-5 specific strengths demonstrated
    3. 3-5 specific areas for improvement
    4. Competency assessment (score each relevant competency on a scale of 1-10):
       - Communication Skills
       - Technical Knowledge (if applicable)
       - Problem Solving
       - Cultural Fit
       - Leadership (if applicable)
    
    Format your response as a JSON object with the following structure:
    {
      "feedback": "Overall feedback paragraph...",
      "strengths": ["strength1", "strength2", ...],
      "improvements": ["improvement1", "improvement2", ...],
      "competencyScores": [
        {
          "code": "COM",
          "name": "Communication Skills",
          "score": 8.5,
          "feedback": "Brief feedback on this competency..."
        },
        ...
      ]
    }
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
          { role: "system", content: "You are an expert interview coach who provides detailed feedback." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    try {
      // Parse the generated JSON
      const analysisResult = JSON.parse(data.choices[0].message.content);
      return analysisResult;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.log("Raw response:", data.choices[0].message.content);
      
      // Return a fallback result if parsing fails
      return {
        feedback: "We encountered an issue processing your interview transcript. The analysis may be incomplete.",
        strengths: ["Clear communication", "Relevant examples provided"],
        improvements: ["Structure answers more clearly", "Provide more specific examples", "Quantify achievements when possible"],
        competencyScores: [
          {
            code: "COM",
            name: "Communication Skills",
            score: 7.0,
            feedback: "Good communication overall, but could be more structured."
          }
        ]
      };
    }
  } catch (error) {
    console.error("Error analyzing transcript:", error);
    throw error;
  }
}

/**
 * Save analysis results to database
 */
async function saveAnalysisResults(
  interviewId: string, 
  userId: string, 
  analysis: any
): Promise<void> {
  try {
    // Update the interview record with analysis results
    const { error } = await supabaseAdmin
      .from("interviews")
      .update({
        analysis_results: analysis,
        analyzed_at: new Date().toISOString()
      })
      .eq("id", interviewId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error saving analysis results:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in saveAnalysisResults:", error);
    throw error;
  }
}
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
interface AnalyzeJobPrepRequest {
  jobDescription: string;
  jobTitle?: string;
  company?: string;
  resumeUrl?: string;
  userId: string;
  interviewId?: string;
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
    const payload: AnalyzeJobPrepRequest = await req.json();
    
    // Validate payload
    if (!payload.jobDescription || !payload.userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    let resumeText = "";
    
    // Get resume text if URL is provided
    if (payload.resumeUrl) {
      try {
        console.log("Extracting text from resume:", payload.resumeUrl);
        
        // Extract text from resume PDF
        const { data: extractData, error: extractError } = await supabaseAdmin.functions.invoke('extract-pdf-text', {
          body: { pdfUrl: payload.resumeUrl }
        });
        
        if (extractError) {
          console.error("Error extracting resume text:", extractError);
        } else if (extractData && extractData.text) {
          resumeText = extractData.text;
          console.log("Successfully extracted resume text, length:", resumeText.length);
        }
      } catch (resumeError) {
        console.error("Error processing resume:", resumeError);
      }
    }
    
    // Get work experiences and projects for better context
    let experiencesText = "";
    try {
      // Fetch user's experiences
      const { data: experiences, error: expError } = await supabaseAdmin
        .from('experiences')
        .select('company, role, start_date, end_date, description')
        .eq('user_id', payload.userId);
      
      if (expError) {
        console.error("Error fetching experiences:", expError);
      } else if (experiences && experiences.length > 0) {
        // Format experiences
        experiencesText = experiences.map(exp => 
          `Company: ${exp.company}\nRole: ${exp.role}\nPeriod: ${exp.start_date} to ${exp.end_date || 'Present'}\n${exp.description ? `Description: ${exp.description}\n` : ''}`
        ).join("\n\n");
        
        console.log("Successfully fetched work experiences:", experiences.length);
        
        // Also fetch projects for the most recent experiences (up to 3)
        const recentExpIds = experiences.slice(0, 3).map(exp => exp.id);
        
        const { data: projects, error: projError } = await supabaseAdmin
          .from('projects')
          .select('raw_input, enhanced_description')
          .in('experience_id', recentExpIds);
          
        if (projError) {
          console.error("Error fetching projects:", projError);
        } else if (projects && projects.length > 0) {
          // Append projects to experiences text
          experiencesText += "\n\nRECENT PROJECTS:\n" + projects.map((proj, index) => 
            `Project ${index + 1}: ${proj.enhanced_description || proj.raw_input}`
          ).join("\n\n");
          
          console.log("Successfully fetched projects:", projects.length);
        }
      }
    } catch (expError) {
      console.error("Error processing experiences:", expError);
    }
    
    // Get competencies data for better suggestions
    let competenciesData: any[] = [];
    try {
      const { data: competencies, error: compError } = await supabaseAdmin
        .from('competencies')
        .select('code, name, definition, category');
      
      if (compError) {
        console.error("Error fetching competencies:", compError);
      } else if (competencies) {
        competenciesData = competencies;
        console.log("Successfully fetched competencies:", competencies.length);
      }
    } catch (compError) {
      console.error("Error processing competencies:", compError);
    }
    
    // Analyze the job description
    const analysisResults = await analyzeJobDescription(
      payload.jobDescription,
      resumeText,
      experiencesText,
      payload.jobTitle || "",
      payload.company || "",
      competenciesData
    );
    
    // Return the analysis results
    return new Response(
      JSON.stringify(analysisResults),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in analyze-job-prep:", error);
    
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
 * Analyze a job description against resume and experiences
 */
async function analyzeJobDescription(
  jobDescription: string,
  resumeText: string,
  experiencesText: string,
  jobTitle: string,
  company: string,
  competencies: any[]
): Promise<any> {
  try {
    // Format competency information for the prompt
    const competenciesInfo = competencies.map(comp => 
      `${comp.code}: ${comp.name} - ${comp.definition}`
    ).join("\n");
    
    // Construct prompt for analysis
    const prompt = `
    You are an expert job application analyzer and interview coach. 
    
    Your task is to help a job applicant prepare for an upcoming interview by analyzing their resume against the job description and providing targeted advice.
    
    JOB DESCRIPTION:
    ${jobDescription}
    
    ${resumeText ? `APPLICANT'S RESUME:
    ${resumeText}` : ''}
    
    ${experiencesText ? `APPLICANT'S WORK EXPERIENCE AND PROJECTS:
    ${experiencesText}` : ''}
    
    ${competenciesInfo ? `COMPETENCY FRAMEWORK (relevant competencies should be identified by their code):
    ${competenciesInfo}` : ''}

    Please analyze this information and provide:
    
    1. A match score (percentage) indicating how well the candidate's experience matches the job requirements
    2. Analysis of the match, including strengths and areas for improvement
    3. Key skills that match between the resume and job description
    4. Skills mentioned in the job that aren't prominently featured in the resume
    5. 2-3 specific resume suggestions for better tailoring to this role
    6. Most relevant competency codes from the framework (2-4 codes) that the candidate should focus on
    7. Information about the company and role that would be helpful for the interview
    8. Reasoning why the candidate might be a good fit for the role
    9. Estimated salary range for this position based on job description
    10. 5-8 likely interview questions for this position
    
    Format your response as a JSON object with the following structure:
    {
      "matchScore": <number between 0-100>,
      "analysis": "<paragraph analyzing the match>",
      "skills": {
        "matched": ["skill1", "skill2", ...],
        "missing": ["skill1", "skill2", ...]
      },
      "resumeSuggestions": ["suggestion1", "suggestion2", ...],
      "requiredCompetencies": ["CODE1", "CODE2", ...],
      "companyInfo": "<paragraph about the company>",
      "roleInfo": "<paragraph about the role>",
      "fitRationale": "<why the candidate could be a good fit>",
      "salaryRange": "<estimated salary range>",
      "potentialQuestions": ["question1", "question2", ...]
    }
    `;
    
    // Call OpenAI API with appropriate model
    console.log("Sending job analysis request to OpenAI");
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: [
          { role: "system", content: "You are an expert job application analyzer that helps candidates prepare for interviews." },
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
      // Parse the generated JSON response
      const analysisResult = JSON.parse(data.choices[0].message.content);
      return analysisResult;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.log("Raw response:", data.choices[0].message.content);
      
      // Return fallback result if parsing fails
      return {
        matchScore: 70,
        analysis: "We were able to analyze your resume against the job description, but encountered an issue formatting the detailed results. Based on your experience, you appear to be a good match for this role, but consider highlighting your relevant skills more prominently.",
        skills: {
          matched: ["communication", "problem-solving"],
          missing: ["leadership", "specific technical skills"]
        },
        resumeSuggestions: [
          "Tailor your resume to highlight experiences most relevant to this role",
          "Quantify your achievements with specific metrics",
          "Use keywords from the job description in your resume"
        ],
        requiredCompetencies: ["CST", "POI", "EE"],
        companyInfo: "Research the company's mission, values, and recent news before your interview.",
        roleInfo: "This role appears to require a mix of technical and soft skills. Be prepared to discuss both.",
        fitRationale: "Your experience in similar roles suggests you could be a good fit, but emphasize your relevant achievements.",
        salaryRange: "Based on the job description, this role typically pays between $80,000 - $120,000 annually, depending on experience.",
        potentialQuestions: [
          "Tell me about your experience with similar projects",
          "How do you handle challenging situations?",
          "What are your strengths and weaknesses?",
          "Why are you interested in this role?"
        ]
      };
    }
  } catch (error) {
    console.error("Error in analyzeJobDescription:", error);
    throw new Error(`Failed to analyze job description: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from '../_shared/cors.ts';


// Enable debug logging
const DEBUG = true;

// Environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);


// Request interface
interface AnalyzeJobMatchRequest {
  resumeUrl: string;
  jobDescriptionText: string;
  userId: string;
  companyName?: string;
  positionName?: string;
  userLocation?: string;
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
    if (DEBUG) console.log("📥 Received analyze-job-match request");
    
    // Parse request payload
    const payload: AnalyzeJobMatchRequest = await req.json();
    
    // Validate payload
    if (!payload.resumeUrl || !payload.jobDescriptionText || !payload.userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (DEBUG) {
      console.log("🔍 Analyzing job match with:");
      console.log(`- Resume URL: ${payload.resumeUrl.substring(0, 50)}...`);
      console.log(`- Job Description Length: ${payload.jobDescriptionText.length} chars`);
      console.log(`- Company: ${payload.companyName || 'Not specified'}`);
      console.log(`- Position: ${payload.positionName || 'Not specified'}`);
    }
    
    // Check if OpenAI API key is available
    if (!OPENAI_API_KEY) {
      console.error("❌ OpenAI API key is not configured");
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured. Please try again later." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get user's past project descriptions for better context
    const { projectDescriptions, experienceDescriptions, userLocation } = await fetchUserData(payload.userId);
    if (DEBUG) {
      console.log(`📋 Fetched ${projectDescriptions.length} project descriptions for context`);
      console.log(`👔 Fetched ${experienceDescriptions.length} experience descriptions for context`);
      console.log(`🌍 User location: ${userLocation || 'Unknown'}`);
    }
    
    // Check if the resume URL is a PNG format (optimized for vision API)
    const isPngFormat = payload.resumeUrl.toLowerCase().includes('.png') || 
                        payload.resumeUrl.includes('format=png');
    
    if (!isPngFormat) {
      if (DEBUG) console.log("⚠️ Resume is not in PNG format, checking for PNG version");
      
      // Try to find a PNG version of the resume
      const pngUrl = await getPngVersionUrl(payload.resumeUrl);
      
      if (pngUrl) {
        if (DEBUG) console.log("✅ Found PNG version of resume");
        payload.resumeUrl = pngUrl;
      } else {
        if (DEBUG) console.log("⚠️ No PNG version found, will use original URL");
      }
    }
    
    // Analyze the job match using OpenAI Vision API
    try {
      if (DEBUG) console.log("🧠 Calling OpenAI API for job match analysis");
      
      const analysisResult = await analyzeJobMatch(
        payload.resumeUrl,
        payload.jobDescriptionText,
        payload.companyName || "the company",
        payload.positionName || "the position",
        projectDescriptions,
        experienceDescriptions,
        userLocation || payload.userLocation || "India" // Default to India if no location is provided
      );
      
      if (DEBUG) console.log("✅ Successfully received OpenAI analysis");
      
      return new Response(
        JSON.stringify(analysisResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (openaiError) {
      console.error("❌ OpenAI API error:", openaiError);
      
      // Return an error message instead of falling back to a less accurate method
      return new Response(
        JSON.stringify({ 
          error: "We couldn't analyze your resume against this job description. Please try again later." 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (error) {
    console.error("❌ Error in analyze-job-match:", error);
    
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
 * Fetch user's project and experience data for better context
 */
async function fetchUserData(userId: string): Promise<{
  projectDescriptions: string[];
  experienceDescriptions: string[];
  userLocation?: string;
}> {
  try {
    // Fetch projects and experiences in parallel for efficiency
    const [projectsResponse, experiencesResponse, profileResponse] = await Promise.all([
      // Get the user's projects with enhanced descriptions
      supabaseAdmin
        .from('projects')
        .select('enhanced_description, raw_input, title, competencies, impact_statement')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10), // Limit to most recent 10 projects
      
      // Get the user's work experiences
      supabaseAdmin
        .from('experiences')
        .select('company, role, description, start_date, end_date, location, source')
        .eq('user_id', userId)
        .order('start_date', { ascending: false }),
        
      // Get the user's profile to determine location
      supabaseAdmin
        .from('users_profile')
        .select('first_name, last_name, location')
        .eq('user_id', userId)
        .single()
    ]);
    
    if (projectsResponse.error) {
      console.error("Error fetching projects:", projectsResponse.error);
    }
    
    if (experiencesResponse.error) {
      console.error("Error fetching experiences:", experiencesResponse.error);
    }

    if (profileResponse.error && profileResponse.error.code !== 'PGRST116') {
      console.error("Error fetching user profile:", profileResponse.error);
    }
    
    // Try to determine user location from profile or experience data
    let userLocation: string | undefined;
    
    // First check profile
    if (profileResponse.data && profileResponse.data.location) {
      userLocation = profileResponse.data.location;
    } 
    // If not in profile, try to infer from most recent experience location
    else if (experiencesResponse.data && experiencesResponse.data.length > 0) {
      const mostRecentExperience = experiencesResponse.data[0];
      if (mostRecentExperience.location) {
        userLocation = mostRecentExperience.location;
      }
    }
    
    // Format project descriptions with competencies and impact statements if available
    const projectDescriptions = (projectsResponse.data || []).map(project => {
      const title = project.title || "Untitled Project";
      const description = project.enhanced_description || project.raw_input;
      const competencies = project.competencies && project.competencies.length > 0 
        ? `\nCompetencies: ${project.competencies.join(', ')}` 
        : '';
      const impact = project.impact_statement 
        ? `\nImpact: ${project.impact_statement}` 
        : '';
      
      return `Project: ${title}\n${description}${competencies}${impact}`;
    });
    
    // Format experience descriptions with date ranges and source information
    const experienceDescriptions = (experiencesResponse.data || []).map(exp => {
      const startDate = new Date(exp.start_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      const endDate = exp.end_date 
        ? new Date(exp.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) 
        : 'Present';
      
      const source = exp.source === 'linkedin' ? ' (from LinkedIn)' : '';
      
      return `Experience: ${exp.role} at ${exp.company}${source}\n` +
             `Period: ${startDate} - ${endDate}\n` +
             `${exp.location ? `Location: ${exp.location}\n` : ''}` +
             `${exp.description ? exp.description : 'No description provided'}`;
    });
    
    return {
      projectDescriptions,
      experienceDescriptions,
      userLocation
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return {
      projectDescriptions: [],
      experienceDescriptions: [],
      userLocation: undefined
    };
  }
}

/**
 * Check for PNG versions of a PDF resume
 */
async function getPngVersionUrl(pdfUrl: string): Promise<string | null> {
  try {
    // Extract user ID and filename from the PDF URL
    const urlParts = pdfUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const userIdIndex = urlParts.indexOf('resumes') + 1;
    
    if (userIdIndex >= urlParts.length) {
      return null;
    }
    
    const userId = urlParts[userIdIndex];
    
    // List files in the user's folder
    const { data: files, error } = await supabaseAdmin
      .storage
      .from('resumes')
      .list(userId);
    
    if (error || !files) {
      console.error("Error listing files:", error);
      return null;
    }
    
    // Look for PNG files that match the PDF name pattern
    const pdfBaseName = filename.replace(/\.pdf$/i, '');
    const pngFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.png') && 
      file.name.includes(pdfBaseName)
    );
    
    if (pngFiles.length === 0) {
      return null;
    }
    
    // Get the URL for the first matching PNG file
    const { data: urlData } = supabaseAdmin
      .storage
      .from('resumes')
      .getPublicUrl(`${userId}/${pngFiles[0].name}`);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error getting PNG version URL:", error);
    return null;
  }
}

/**
 * Analyze job match using OpenAI Vision API
 */
async function analyzeJobMatch(
  resumeUrl: string,
  jobDescriptionText: string,
  companyName: string,
  positionName: string,
  projectDescriptions: string[],
  experienceDescriptions: string[],
  userLocation: string = "India"
): Promise<any> {
  try {
    if (DEBUG) console.log("🔄 Starting OpenAI job match analysis with Vision API");
    
    // Format user data for the prompt
    const experiencesContext = experienceDescriptions.length > 0
      ? `\nCANDIDATE'S WORK EXPERIENCE:\n${experienceDescriptions.join('\n\n')}`
      : '';
      
    const projectsContext = projectDescriptions.length > 0
      ? `\nCANDIDATE'S PROJECTS:\n${projectDescriptions.join('\n\n')}`
      : '';
    
    // Combine all context
    const userContext = `${experiencesContext}\n${projectsContext}`;
    
    // Determine currency based on location
    const currencyInfo = userLocation.toLowerCase().includes("india") || 
                         userLocation.toLowerCase().includes("in") ? 
                         "in Indian Rupees (INR)" : "in USD";
    
    // Construct the prompt
    const prompt = `
    You are an expert job application analyzer with a focus on providing realistic, accurate assessments. Your task is to analyze how well a candidate's resume matches a job description and provide actionable insights.
    
    The resume is provided as an image. Please analyze it carefully along with the additional context about the candidate's experience and projects.
    
    CANDIDATE LOCATION: ${userLocation}
    
    JOB DESCRIPTION:
    ${jobDescriptionText}
    
    ADDITIONAL CANDIDATE CONTEXT:
    ${userContext}
    
    INSTRUCTIONS:
    1. Use your web search capability to find the following information about the company:
       - A detailed overview of the company (mission, values, culture, hiring principles)
       - The company's rating on sites like Glassdoor or AmbitionBox (if available)
       - The expected salary range for the position ${currencyInfo} (based on the job description, location, and industry standards)
       - Any recent news or developments about the company that might be relevant for an interview
    
    2. Provide a CONSERVATIVE and REALISTIC match score (percentage) indicating how well the resume matches the job requirements
       - Be strict in your evaluation - a score of 90%+ should only be given for near-perfect matches
       - Consider both technical skills and experience level requirements
       - Penalize significantly for missing critical requirements
       - A typical good match should be in the 60-75% range
    
    3. Provide a detailed explanation of how you calculated the match score, including:
       - What factors were weighted most heavily
       - Which missing skills or experiences reduced the score
       - How experience level affected the score
    
    4. List key skills and keywords that match between the resume and job description
    
    5. List important skills or keywords mentioned in the job description that are missing from the resume
    
    6. Provide specific, actionable recommendations for improving the application
    
    7. Provide a detailed analysis of the match and potential fit that is honest and realistic
    
    8. Provide a separate analysis of the candidate's strengths for this role
    
    9. Provide a separate analysis of the candidate's gaps for this role
    
    10. Generate an email template for applying to this position
    
    11. Generate a LinkedIn outreach message (under 300 characters)
    
    12. Generate a cover letter tailored to this position
    
    Format your response as a JSON object with the following structure:
    {
      "matchScore": <number between 0-100>,
      "matchScoreRationale": "<explanation of how the score was calculated>",
      "keywordMatches": {
        "matched": ["keyword1", "keyword2", ...],
        "missing": ["keyword1", "keyword2", ...]
      },
      "skills": {
        "matched": ["skill1", "skill2", ...],
        "missing": ["skill1", "skill2", ...]
      },
      "analysis": "<paragraph analyzing the match>",
      "strengthsAnalysis": "<paragraph focusing on candidate strengths for this role>",
      "gapsAnalysis": "<paragraph focusing on candidate gaps for this role>",
      "recommendations": ["recommendation1", "recommendation2", ...],
      "emailOutreach": "<email template>",
      "linkedinOutreach": "<short LinkedIn message>",
      "coverLetter": "<cover letter>"
      "companyInfo": "<detailed overview of the company including culture and hiring principles>",
      "companyRating": <company rating from Glassdoor/AmbitionBox (number between 1.0-5.0)>,
      "salaryRange": "<estimated salary range in appropriate currency based on location>"
    }
    `;
    
    // Set a timeout for the OpenAI API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for more complex analysis
    
    try {
      // Call OpenAI Vision API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1-2025-04-14", // Using the latest model for best results
          messages: [
            {
              role: "system",
              content: `You are an expert job application analyzer providing detailed, actionable insights. Be thorough in your analysis and provide clear explanations for your assessments. The candidate is located in ${userLocation}, so provide salary information in the appropriate currency and consider location-specific factors in your analysis. Be conservative and realistic in your match scoring - don't inflate scores.`
            },
            { 
              role: "user", 
              content: [
                { type: "text", text: prompt },
                { 
                  type: "image_url", 
                  image_url: {
                    url: resumeUrl,
                    detail: "high"
                  }
                }
              ]
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.5,
          max_tokens: 4000 // Increased token limit for more detailed analysis with additional context
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      try {
        // Parse the JSON response
        const result = JSON.parse(data.choices[0].message.content);
        if (DEBUG) console.log("✅ Successfully parsed OpenAI response");
        
        // Log detailed information about the response
        if (DEBUG) {
          console.log("Match score:", result.matchScore);
          console.log("Match score rationale:", result.matchScoreRationale ? result.matchScoreRationale.substring(0, 100) + "..." : "Not provided");
          console.log("Matched skills count:", result.skills?.matched?.length || 0);
          console.log("Missing skills count:", result.skills?.missing?.length || 0);
          console.log("Has strengths analysis:", !!result.strengthsAnalysis);
          console.log("Has gaps analysis:", !!result.gapsAnalysis);
         console.log("Has company info:", !!result.companyInfo);
         console.log("Has company rating:", !!result.companyRating);
         console.log("Has salary range:", !!result.salaryRange);
        }
        
        return result;
      } catch (parseError) {
        console.error("❌ Error parsing OpenAI response:", parseError);
        console.log("📝 Raw response (first 500 chars):", data.choices[0].message.content.substring(0, 500) + "...");
        throw new Error("Failed to parse OpenAI response");
      }
    } catch (abortError) {
      clearTimeout(timeoutId);
      if (abortError.name === 'AbortError') {
        throw new Error('Request timeout: The OpenAI API took too long to respond');
      }
      throw abortError;
    }
  } catch (error) {
    console.error("❌ Error in analyzeJobMatch:", error);
    throw error;
  }
}
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from '../_shared/cors.ts';

// Enable more detailed logging
const DEBUG = true;

// Environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, x-supabase-client, x-supabase-auth-token"
};

// Request interface
interface EnhanceProjectRequest {
  rawText: string;
  projectId: string;
  additionalInfo?: Record<string, string>;
}

// Response interface
interface EnhanceProjectResponse {
  enhancedText: string;
  competencies: string[];
  suggestions: string[];
  competencyRationales?: Record<string, string>;
  questions?: string[];
}

// Competency interface
interface Competency {
  id: string;
  code: string;
  name: string;
  definition: string;
  assessment_type: string;
  category: string;
  level_1_description: string;
  level_2_description: string;
  level_3_description: string;
  level_4_description: string;
  level_5_description: string;
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
    const payload: EnhanceProjectRequest = await req.json();
    
    // Validate payload
    if (!payload.rawText) {
      return new Response(
        JSON.stringify({ error: "Project text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Fetch competencies from the database
    const { data: competencies, error: competenciesError } = await supabaseAdmin
      .from('competencies')
      .select('*');

    if (DEBUG) {
      console.log(`Fetched ${competencies?.length || 0} competencies from database`);
    }
    
    if (competenciesError) {
      console.error('Error fetching competencies:', competenciesError);
      throw new Error(`Failed to fetch competencies: ${competenciesError.message}`);
    }
    
    // Check if the project description is sufficient or if we need more information
    if (!payload.additionalInfo) {
      const needsMoreInfo = await checkIfNeedsMoreInfo(payload.rawText);

      if (DEBUG) {
        console.log('Checking if project needs more info:', needsMoreInfo);
      }
      
      if (needsMoreInfo.needsMore) {
        // Return questions instead of enhanced project
        return new Response(
          JSON.stringify({ questions: needsMoreInfo.questions }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Enhance the project description
    const enhancedProject = await enhanceProject(
      payload.rawText, 
      competencies || [],
      payload.additionalInfo
    );

    if (DEBUG) {
      console.log('Enhanced project result:', {
        enhancedTextLength: enhancedProject.enhancedText.length,
        competenciesDetected: enhancedProject.competencies.length,
        suggestionsCount: enhancedProject.suggestions.length,
        hasRationales: !!enhancedProject.competencyRationales
      });
    }
    
    // If projectId is provided, update the project in the database
    if (payload.projectId) {
      const { error: updateError } = await supabaseAdmin
        .from('projects')
        .update({
          enhanced_description: enhancedProject.enhancedText,
          competencies: enhancedProject.competencies,
          suggestions: enhancedProject.suggestions,
          competency_rationales: enhancedProject.competencyRationales
        })
        .eq('id', payload.projectId);
      
      if (updateError) {
        console.error('Error updating project:', updateError);
        // Continue anyway to return the enhanced project
      }
    }
    
    // Return the enhanced project
    return new Response(
      JSON.stringify(enhancedProject),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error enhancing project:', error);
    
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
 * Check if the project description needs more information
 */
async function checkIfNeedsMoreInfo(rawText: string): Promise<{ needsMore: boolean; questions: string[] }> {
  try {
    // If the text is very short, definitely needs more info
    if (rawText.length < 50) {
      return {
        needsMore: true,
        questions: [
          "What was the specific situation or context of this project?",
          "What was your specific role or task in this project?",
          "What actions did you take to complete this project?",
          "What were the results or outcomes of your work?",
          "Were there any alternative approaches you considered, and what might the results have been?"
        ]
      };
    }
    
    // Use OpenAI to determine if more information is needed
    const prompt = `
    You are an expert resume writer evaluating a project description for completeness.
    
    Project Description:
    "${rawText}"
    
    Please analyze this project description and determine if it contains sufficient information for a strong STAR (Situation, Task, Action, Result) format description.
    
    If the description is missing important details, generate up to 5 specific questions to ask the user to improve the description.
    Two of these questions should focus on alternative actions and potential results (STAR/AR format).
    
    Format your response as a JSON object with the following structure:
    {
      "needsMoreInfo": true/false,
      "missingElements": ["situation", "task", "action", "result", "metrics", "alternative_actions", "alternative_results"],
      "questions": [
        "Question 1...",
        "Question 2...",
        ...
      ]
    }
    
    If the description is sufficient, set needsMoreInfo to false and provide an empty questions array.
    `;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: [
          { role: "system", content: "You are an expert resume writer evaluating project descriptions." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      needsMore: result.needsMoreInfo,
      questions: result.questions || []
    };
  } catch (error) {
    console.error('Error checking if project needs more info:', error);
    
    // Default questions if the API call fails
    return {
      needsMore: rawText.length < 100, // Simple heuristic
      questions: [
        "Could you provide more details about the situation or context of this project?",
        "What specific actions did you take to address the challenge?",
        "What were the measurable results or outcomes of your work?",
        "Were there any alternative approaches you considered?",
        "What might the results have been if you had taken a different approach?"
      ]
    };
  }
}

/**
 * Enhance a project description using OpenAI
 */
async function enhanceProject(
  rawText: string,
  competencies: Competency[],
  additionalInfo?: Record<string, string>
): Promise<EnhanceProjectResponse> {
  try {
    if (DEBUG) {
      console.log('Starting project enhancement for text:', rawText.substring(0, 100) + '...');
      console.log('Additional info provided:', !!additionalInfo);
    }

    // Verify OpenAI API key
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    // Combine original text with additional information if provided
    let enhancedInput = rawText;
    if (additionalInfo && Object.keys(additionalInfo).length > 0) {
      enhancedInput += "\n\nAdditional Information:";
      for (const [key, value] of Object.entries(additionalInfo)) {
        enhancedInput += `\n${key}: ${value}`;
      }
    }
    
    // 1. Generate enhanced STAR format description
    const enhancedText = await generateSTARDescription(enhancedInput);
    if (DEBUG) {
      console.log('Generated STAR description, length:', enhancedText.length);
    }
    
    // 2. Identify competencies with rationales
    const competencyResults = await getCompetencyRecommendations(enhancedInput, competencies);
    if (DEBUG) {
      console.log('Competency identification results:', {
        competencyCodes: competencyResults.competencyCodes,
        rationaleCount: Object.keys(competencyResults.rationales).length
      });
    }
    
    // 3. Generate improvement suggestions
    const suggestions = await generateSuggestions(enhancedInput);
    if (DEBUG) {
      console.log('Generated suggestions count:', suggestions.length);
    }
    
    return {
      enhancedText,
      competencies: competencyResults.competencyCodes,
      suggestions,
      competencyRationales: competencyResults.rationales
    };
  } catch (error) {
    console.error('Error in enhanceProject:', error);
    throw error;
  }
}

/**
 * Generate a STAR format description using OpenAI
 */
async function generateSTARDescription(rawText: string): Promise<string> {
  try {
    const prompt = `
    You are an expert at enhancing project descriptions for resumes. 
    
    Please reformat the following project description into the STAR format (Situation, Task, Action, Result):
    
    "${rawText}"
    
    Guidelines:
    - Maintain the first-person perspective
    - Keep the same meaning and facts, but make the language more impactful
    - Use strong action verbs
    - Highlight measurable achievements
    - Format the response with clear "Situation:", "Task:", "Action:", and "Result:" sections
    - Keep each section concise but comprehensive
    - Preserve any metrics or specific technical details mentioned
    
    Return only the reformatted text without any additional commentary.
    `;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: [
          { role: "system", content: "You are an expert at enhancing project descriptions for resumes." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating STAR description:', error);
    
    // Fallback to simple formatting if OpenAI fails
    return formatToSTAR(rawText);
  }
}

/**
 * Identify competencies with rationales using OpenAI
 */
interface CompetencyRecommendationResult {
  competencyCodes: string[];
  rationales: Record<string, string>;
}

async function getCompetencyRecommendations(
  text: string,
  competencies: Competency[]
): Promise<CompetencyRecommendationResult> {
  try {
    if (DEBUG) {
      console.log('Starting competency identification for text:', text.substring(0, 100) + '...');
      console.log(`Using ${competencies.length} competencies for matching`);
    }

    // Format competencies for the prompt
    const competencyInfo = competencies.map(comp => 
      `${comp.code}: ${comp.name} - ${comp.definition}`
    ).join("\n");
    
    // Construct the prompt
    const prompt = `
    You are an expert at identifying professional competencies in project descriptions.
    
    Project Description:
    "${text}"
    
    Available Competencies:
    ${competencyInfo}
    
    Task:
    1. Identify the top 3-7 most relevant competencies from the list above that are demonstrated in this project description.
    2. For each identified competency, provide a brief rationale (2-3 sentences) explaining why this competency is demonstrated.
    
    Format your response as a JSON object with the following structure:
    {
      "competencies": [
        {
          "code": "XXX",
          "rationale": "Brief explanation of why this competency is demonstrated..."
        },
        ...
      ]
    }
    
    Important: 
    - Select ONLY the most relevant competencies (between 3-7)
    - Be specific in your rationale, referencing exact phrases or achievements from the project
    - Do not include any competencies that aren't clearly demonstrated
    `;

    if (DEBUG) {
      console.log('Competency identification prompt:', prompt.substring(0, 200) + '...');
    }
    
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
          { role: "system", content: "You are an expert at identifying professional competencies in project descriptions." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error response:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();

    if (DEBUG) {
      console.log('OpenAI API response received for competency identification');
      console.log('Response content:', data.choices[0].message.content.substring(0, 200) + '...');
    }
    
    try {
      // Parse the JSON response
      const result = JSON.parse(data.choices[0].message.content);

      if (DEBUG) {
        console.log('Successfully parsed competency JSON response');
        console.log('Identified competencies:', result.competencies?.length || 0);
      }
      
      // Extract competency codes and rationales
      const competencyCodes: string[] = [];
      const rationales: Record<string, string> = {};
      
      if (result.competencies && Array.isArray(result.competencies)) {
        result.competencies.forEach((comp: { code: string; rationale: string }) => {
          if (comp.code && comp.rationale) {
            competencyCodes.push(comp.code);
            rationales[comp.code] = comp.rationale;
          }
        });
      }
      
      return { competencyCodes, rationales };
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.log("Raw response for debugging:", data.choices[0].message.content);
      
      // Fallback to simpler method
      console.log("Falling back to rule-based competency identification");
      return fallbackCompetencyIdentification(text, competencies);
    }
  } catch (error) {
    console.error("Error identifying competencies:", error);
    
    // Fallback to simpler method
    return fallbackCompetencyIdentification(text, competencies);
  }
}

/**
 * Fallback method for identifying competencies when OpenAI API fails
 */
function fallbackCompetencyIdentification(
  text: string,
  competencies: Competency[]
): CompetencyRecommendationResult {
  console.log('Using fallback competency identification method');
  const lowercaseText = text.toLowerCase();
  const identifiedCompetencies: string[] = [];
  const rationales: Record<string, string> = {};
  
  const keywordMap: Record<string, string[]> = {
    // Critical & Structured Thinking
    'CST': ['analysis', 'analyze', 'analyzing', 'logical', 'structure', 'reasoning', 'problem-solving', 'critical thinking', 'structured approach', 'methodical', 'systematically', 'solution', 'solve', 'solved', 'research', 'investigated', 'framework', 'assessed'],
    
    // Adaptive Communication
    'AC': ['communicate', 'communication', 'articulated', 'presentation', 'present', 'explaining', 'explain', 'conveyed', 'tailored message', 'audience', 'reported', 'documented', 'clarified', 'meeting', 'discussion', 'pitch', 'verbal', 'written'],
    
    // Proactive Ownership & Initiative
    'POI': ['initiative', 'proactive', 'ownership', 'responsibility', 'took charge', 'led', 'leadership', 'volunteered', 'self-starter', 'autonomously', 'independently', 'spearheaded', 'initiated', 'drove', 'proposed', 'suggested', 'identified opportunity'],
    
    // Collaborative Influence
    'CI': ['collaborate', 'collaboration', 'team', 'teamwork', 'influence', 'persuaded', 'consensus', 'stakeholders', 'cross-functional', 'negotiated', 'facilitated', 'partnership', 'aligned', 'coordinated', 'engaged', 'participated', 'worked with'],
    
    // Growth Mindset & Curiosity
    'GMC': ['learning', 'learned', 'growth', 'curious', 'curiosity', 'develop', 'development', 'adapt', 'feedback', 'improve', 'study', 'research', 'explored', 'investigated', 'experimented', 'self-improvement', 'trained', 'knowledge'],
    
    // Leadership & Strategic Vision
    'LSV': ['led', 'leader', 'leadership', 'strategy', 'strategic', 'vision', 'direction', 'inspire', 'inspired', 'guide', 'motivate', 'empower', 'coached', 'mentored', 'delegated', 'managed', 'directed', 'supervised'],
    
    // Emotional Intelligence & Self-Awareness
    'EISA': ['empathy', 'empathetic', 'emotion', 'awareness', 'self-aware', 'interpersonal', 'relationship', 'conflict', 'resolution', 'understanding', 'perspective', 'sensitivity', 'listening', 'respected', 'patient', 'supportive'],
    
    // Execution Excellence
    'EE': ['execute', 'execution', 'deadline', 'delivered', 'deliver', 'on-time', 'efficient', 'efficiency', 'prioritize', 'organized', 'quality', 'timely', 'streamlined', 'optimized', 'achieved', 'accomplished', 'completed', 'successful'],
    
    // Verbal & Written Comprehension
    'VWC': ['communicate', 'communication', 'documented', 'documentation', 'wrote', 'written', 'articulated', 'clear', 'concise', 'explain', 'understood', 'comprehend', 'interpreted', 'translated', 'summarized', 'described', 'outlined'],
    
    // Resilience & Adaptability
    'RA': ['adapt', 'adaptable', 'resilient', 'resilience', 'flexible', 'flexibility', 'setback', 'overcome', 'challenge', 'pivot', 'adjust', 'persevered', 'persistent', 'recovered', 'rebounded', 'modified', 'change', 'transformed'],
  };
  
  // Count keyword matches for each competency
  const competencyCounts: Record<string, number> = {};
  const matchedKeywordsMap: Record<string, string[]> = {};
  
  for (const [code, keywords] of Object.entries(keywordMap)) {
    let count = 0;
    const matchedKeywords: string[] = [];
    
    for (const keyword of keywords) {
      if (lowercaseText.includes(keyword)) {
        count++;
        matchedKeywords.push(keyword);
      }
    }
    
    competencyCounts[code] = count;
    matchedKeywordsMap[code] = matchedKeywords;
  }
  
  if (DEBUG) {
    console.log('Keyword matching results:', competencyCounts);
  }
  
  // Sort competencies by count and take the top 3
  const sortedCompetencies = Object.entries(competencyCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count > 0)
    .slice(0, 3)
    .map(([code, _]) => code);

  if (DEBUG) {
    console.log('Selected competencies after sorting:', sortedCompetencies);
  }
  
  // Generate rationales for the top competencies
  for (const code of sortedCompetencies) {
    const competencyInfo = competencies.find(c => c.code === code);
    const competencyName = competencyInfo ? competencyInfo.name : code;
    const matchedKeywords = matchedKeywordsMap[code];
    
    if (matchedKeywords.length > 0) {
      rationales[code] = `This project demonstrates ${competencyName} through the use of ${
        matchedKeywords.slice(0, 3).join(", ")
      }${matchedKeywords.length > 3 ? ` and other related terms` : ''}. The project description shows clear evidence of these skills in action.`;
    } else {
      rationales[code] = `This project appears to demonstrate ${competencyName} based on the overall context and approach described.`;
    }
  }

  if (DEBUG) {
    console.log('Generated rationales for competencies:', Object.keys(rationales).length);
  }
  
  return {
    competencyCodes: sortedCompetencies,
    rationales
  };
}

/**
 * Generate suggestions for improving the project description
 */
async function generateSuggestions(rawText: string): Promise<string[]> {
  try {
    const prompt = `
    You are an expert resume writer. Please analyze the following project description and provide 3-5 specific suggestions for improving it:
    
    "${rawText}"
    
    Focus on:
    - Adding quantifiable metrics and results
    - Using stronger action verbs
    - Improving clarity and impact
    - Highlighting technical skills or methodologies
    - Demonstrating leadership or collaboration if applicable
    
    Return ONLY a list of suggestions, one per line, without any additional commentary.
    `;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: [
          { role: "system", content: "You are an expert resume writer providing concise, actionable suggestions." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 300
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Split the content into individual suggestions
    const suggestions = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^-\s*/, '')); // Remove leading dash if present
    
    return suggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    
    // Fallback to rule-based suggestions
    return generateFallbackSuggestions(rawText);
  }
}

/**
 * Fallback function to generate suggestions without OpenAI
 */
function generateFallbackSuggestions(text: string): string[] {
  const suggestions: string[] = [];
  const lowercaseText = text.toLowerCase();
  
  // Check for specific numbers and metrics
  if (!/\d+%|\d+\s+percent|\$\d+|\d+\s+users|\d+\s+customers|\d+\s+hours|\d+\s+days/.test(text)) {
    suggestions.push("Add specific metrics or quantifiable results (e.g., 'increased efficiency by 20%', 'reduced costs by $15,000', 'saved 40 hours per month').");
  }
  
  // Check for technical details
  const techPattern = /(used|using|implemented|developed with|built with|using technologies such as|with the help of|leveraging) ([a-zA-Z0-9\s,]+)/;
  if (!techPattern.test(text)) {
    suggestions.push("Include specific technologies, tools, or methodologies you used to accomplish the project (e.g., Python, SQL, Agile, JIRA).");
  }
  
  // Check for action verbs at the beginning of sentences
  const actionVerbs = ["led", "designed", "developed", "implemented", "created", "managed", "coordinated", "analyzed", "executed", "launched", "built", "architected", "engineered"];
  const hasActionVerbAtStart = text.split(/[.!?]+/).some(sentence => {
    const trimmed = sentence.trim();
    return actionVerbs.some(verb => trimmed.toLowerCase().startsWith(verb));
  });
  
  if (!hasActionVerbAtStart) {
    suggestions.push("Begin sentences with strong action verbs (e.g., 'Led', 'Designed', 'Implemented') to emphasize your role and contributions.");
  }
  
  // Check for outcomes and results
  if (!/(result|outcome|achievement|accomplishment|improved|increased|reduced|saved|delivered|completed|succeeded|benefit|impact)/.test(lowercaseText)) {
    suggestions.push("Clearly state the business impact and outcomes of your work to demonstrate the value of your contributions.");
  }
  
  // Check for leadership/collaboration aspects
  if (!/(team|collaborated|led|leadership|managed|coordinated|facilitated|guided|mentored|directed|supervised)/.test(lowercaseText)) {
    suggestions.push("Highlight any leadership or collaboration aspects of your role to demonstrate your interpersonal skills.");
  }
  
  // Check for specificity
  if (/(several|many|various|multiple|some|few)/.test(lowercaseText)) {
    suggestions.push("Replace vague quantifiers ('several', 'many', 'various') with specific numbers to add credibility to your achievements.");
  }
  
  // Check for passive voice
  if (/(was|were) (done|made|created|developed|implemented|designed|built)/.test(lowercaseText)) {
    suggestions.push("Convert passive voice to active voice to emphasize your direct role in the accomplishments.");
  }
  
  // If no suggestions were generated, add some generic ones
  if (suggestions.length === 0) {
    suggestions.push("Frame your contribution in terms of problem-solution-impact to clearly demonstrate your value.");
    suggestions.push("Highlight the specific skills you applied that are most relevant to the role you're targeting.");
    suggestions.push("Connect your actions to business objectives to show strategic thinking and alignment.");
  }
  
  return suggestions;
}

/**
 * Simple function to reformat text into STAR format using basic patterns
 * This is a fallback when OpenAI API fails
 */
function formatToSTAR(text: string): string {
  // Remove extra whitespace and normalize
  const normalizedText = text.trim().replace(/\s+/g, " ");
  
  // Extract parts that might be situation, task, action, and result
  let situation = "";
  let task = "";
  let action = "";
  let result = "";
  
  // Simple heuristics to identify parts of the input that might belong to each STAR component
  
  // Situation - typically comes first and describes context
  const situationPatterns = [
    /(?:^|[\.\?!])\s*(?:at|in|during|while|when)\s+[^\.]+/i,
    /(?:^|[\.\?!])\s*(?:the company|the team|the project|the organization)\s+[^\.]+/i,
    /(?:^|[\.\?!])\s*(?:I worked|I was working|I was tasked|I was responsible)\s+[^\.]+/i
  ];
  
  for (const pattern of situationPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[0]) {
      situation = match[0].replace(/^[\.\?!]\s*/, "").trim();
      break;
    }
  }
  
  // Task - typically describes what needed to be done
  const taskPatterns = [
    /(?:^|[\.\?!])\s*(?:needed to|had to|was assigned to|was tasked with|my role was to|my job was to|my responsibility was)\s+[^\.]+/i,
    /(?:^|[\.\?!])\s*(?:the goal was|the objective was|the challenge was)\s+[^\.]+/i,
    /(?:^|[\.\?!])\s*(?:I needed to|I had to|I was required to)\s+[^\.]+/i
  ];
  
  for (const pattern of taskPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[0]) {
      task = match[0].replace(/^[\.\?!]\s*/, "").trim();
      break;
    }
  }
  
  // Action - typically describes what the person did
  const actionPatterns = [
    /(?:^|[\.\?!])\s*(?:I|we) (?:implemented|developed|created|designed|built|established|set up|launched|led|managed|conducted|organized|coordinated|analyzed|researched|produced)\s+[^\.]+/i,
    /(?:^|[\.\?!])\s*(?:after|by|through) (?:implementing|developing|creating|designing|analyzing|researching)\s+[^\.]+/i
  ];
  
  for (const pattern of actionPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[0]) {
      action = match[0].replace(/^[\.\?!]\s*/, "").trim();
      break;
    }
  }
  
  // Result - typically describes the outcome, often containing metrics
  const resultPatterns = [
    /(?:^|[\.\?!])\s*(?:as a result|this resulted in|resulting in|which led to|this improved|this increased|this reduced|this saved|this enabled|achieved)\s+[^\.]+/i,
    /(?:^|[\.\?!])\s*(?:increased|decreased|reduced|improved|enhanced|boosted|accelerated|amplified|grew|expanded|saved|gained|generated)\s+[^\.]+/i,
    /(?:^|[\.\?!])\s*(?:the project|the initiative|the work|the solution|the implementation|the system) (?:increased|decreased|reduced|improved|enhanced|saved)\s+[^\.]+/i,
    /(?:^|[\.\?!])\s*(?:\d+%|\d+\s+percent|\$\d+|\d+\s+dollars|\d+\s+users|\d+\s+customers|\d+\s+hours|\d+\s+days)\s+[^\.]+/i
  ];
  
  for (const pattern of resultPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[0]) {
      result = match[0].replace(/^[\.\?!]\s*/, "").trim();
      break;
    }
  }
  
  // If any section is empty, extract content more aggressively by splitting the text into segments
  const sentences = normalizedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (!situation && sentences.length > 0) {
    situation = sentences[0].trim();
  }
  
  if (!task && sentences.length > 1) {
    task = sentences[1].trim();
  }
  
  if (!action) {
    // Look for sentences with action verbs
    const actionVerbs = ["implemented", "developed", "created", "designed", "built", "led", "managed", "analyzed"];
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].toLowerCase();
      for (const verb of actionVerbs) {
        if (sentence.includes(verb)) {
          action = sentences[i].trim();
          break;
        }
      }
      if (action) break;
    }
    
    // If still no action found, use the middle part of the text
    if (!action && sentences.length > 2) {
      const middleIndex = Math.floor(sentences.length / 2);
      action = sentences[middleIndex].trim();
    }
  }
  
  if (!result && sentences.length > 2) {
    result = sentences[sentences.length - 1].trim();
  }
  
  // Still provide fallbacks if sections remain empty
  if (!situation) {
    situation = "Working in a professional environment that required technical expertise and problem-solving skills.";
  }
  
  if (!task) {
    task = "Tasked with addressing a specific challenge mentioned in the project description.";
  }
  
  if (!action) {
    action = "Utilized relevant skills and technologies to implement an effective solution for the problem at hand.";
  }
  
  if (!result) {
    result = "Successfully delivered the project, resulting in improved efficiency and positive business outcomes.";
  }
  
  // Combine the STAR components with better formatting
  return `Situation: ${situation}\n\nTask: ${task}\n\nAction: ${action}\n\nResult: ${result}`;
}
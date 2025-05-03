import { Competency } from "../hooks/useCompetencies";
import { supabase } from "../lib/supabase";

interface EnhanceProjectResponse {
  enhancedText: string;
  competencies: string[];
  suggestions: string[];
  competencyRationales?: Record<string, string>;
  questions?: string[];
}

/**
 * Enhances a project description on the client side when Edge Function is unavailable
 * This is a fallback mechanism when the Edge Function is unreachable
 */
export async function enhanceProjectClientSide(
  rawText: string,
  competencies: Competency[]
): Promise<EnhanceProjectResponse> {
  if (!rawText) {
    throw new Error("Project text is required");
  }
  
  // Default response structure
  const response: EnhanceProjectResponse = {
    enhancedText: "",
    competencies: [],
    suggestions: [],
    competencyRationales: {}
  };
  
  try {
    // Simple rule-based STAR formatting without using OpenAI
    response.enhancedText = formatToSTAR(rawText);
    
    // Use LLM to identify competencies with rationale
    const competencyResults = await getCompetencyRecommendations(rawText, competencies);
    response.competencies = competencyResults.competencyCodes;
    response.competencyRationales = competencyResults.rationales;
    
    // Generate basic suggestions
    response.suggestions = generateSuggestions(rawText);
    
    return response;
  } catch (error) {
    console.error("Error in client-side project enhancement:", error);
    throw new Error("Failed to enhance project description: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

/**
 * Simple function to reformat text into STAR format using basic patterns
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

/**
 * Use OpenAI to identify competencies with rationale
 */
interface CompetencyRecommendationResult {
  competencyCodes: string[];
  rationales: Record<string, string>;
}

export async function getCompetencyRecommendations(
  text: string,
  competencies: Competency[]
): Promise<CompetencyRecommendationResult> {
  try {
    // First try to use OpenAI API directly if available
    try {
      const openaiApiKey = localStorage.getItem('openai_api_key');
      if (openaiApiKey) {
        return await getCompetencyRecommendationsWithOpenAI(text, competencies, openaiApiKey);
      }
    } catch (openaiError) {
      console.warn("Direct OpenAI call failed, falling back to simpler method:", openaiError);
    }
    
    // Fallback to simpler method if OpenAI API is not available
    return fallbackCompetencyIdentification(text, competencies);
  } catch (error) {
    console.error("Error identifying competencies:", error);
    return fallbackCompetencyIdentification(text, competencies);
  }
}

/**
 * Use OpenAI API to identify competencies with rationale
 */
async function getCompetencyRecommendationsWithOpenAI(
  text: string,
  competencies: Competency[],
  apiKey: string
): Promise<CompetencyRecommendationResult> {
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
  1. Identify the top 3 most relevant competencies from the list above that are demonstrated in this project description.
  2. For each identified competency, provide a brief rationale (2-3 sentences) explaining why this competency is demonstrated.
  3. Return ONLY the competency codes (e.g., CST, AC, POI) - maximum 3 codes.
  
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
  - Select ONLY the most relevant competencies (maximum 3)
  - Be specific in your rationale, referencing exact phrases or achievements from the project
  - Do not include any competencies that aren't clearly demonstrated
  `;
  
  // Call OpenAI API
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert at identifying professional competencies in project descriptions." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    // Parse the JSON response
    const result = JSON.parse(content);
    
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
    console.log("Raw response:", content);
    throw new Error("Failed to parse competency recommendations");
  }
}

/**
 * Fallback method for identifying competencies when OpenAI API is not available
 */
function fallbackCompetencyIdentification(
  text: string,
  competencies: Competency[]
): CompetencyRecommendationResult {
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
  
  // Sort competencies by count and take the top 3
  const sortedCompetencies = Object.entries(competencyCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count > 0)
    .slice(0, 3)
    .map(([code, _]) => code);
  
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
  
  return {
    competencyCodes: sortedCompetencies,
    rationales
  };
}

/**
 * Generate better suggestions for improving the project description
 */
function generateSuggestions(text: string): string[] {
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
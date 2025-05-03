import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from '../_shared/cors.ts';


// Environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);


// Define interface for request payload
interface GradeInterviewRequest {
  transcripts: Array<{
    questionId: string;
    transcript: string;
    feedback?: string;
  }>;
  userId: string;
  sessionId?: string;
  audioUrl?: string;
}

// Define grading response interfaces
interface CompetencyScore {
  code: string;
  name: string;
  score: number; // 1-10 scale with one decimal
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface GradingResult {
  overallScore: number;
  competencyScores: CompetencyScore[];
  summary: string;
  strengths: string[];
  improvements: string[];
}

interface GradeInterviewResponse {
  success: boolean;
  result?: GradingResult;
  error?: string;
}

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Method not allowed. Only POST requests are supported."
      }),
      { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }

  try {
    // Parse request body
    const requestData: GradeInterviewRequest = await req.json();
    console.log(`Received grading request for user ${requestData.userId} with ${requestData.transcripts.length} transcripts`);

    // Validate request data
    if (!requestData.transcripts || !requestData.transcripts.length) {
      throw new Error("No transcripts provided for grading");
    }

    if (!requestData.userId) {
      throw new Error("User ID is required");
    }

    // Process and grade each transcript
    const fullGradingResult = await processAndGradeInterview(requestData);

    // Save grading results to database if successful
    if (fullGradingResult.success && fullGradingResult.result) {
      await saveGradingResults(requestData.userId, fullGradingResult.result, requestData.audioUrl);
    }

    // Return grading results
    return new Response(
      JSON.stringify(fullGradingResult),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing grading request:", error);
    
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

/**
 * Process and grade the interview transcripts
 */
async function processAndGradeInterview(requestData: GradeInterviewRequest): Promise<GradeInterviewResponse> {
  try {
    // Fetch competency data for each question
    const questionCompetencies = await fetchQuestionCompetencies(
      requestData.transcripts.map(t => t.questionId)
    );

    // Grade each transcript
    const competencyScores: CompetencyScore[] = [];
    
    for (const transcript of requestData.transcripts) {
      if (!transcript.questionId || !transcript.transcript) {
        console.warn("Skipping transcript with missing questionId or transcript text");
        continue;
      }

      const questionData = questionCompetencies.find(q => q.questionId === transcript.questionId);
      if (!questionData) {
        console.warn(`No competency data found for question ID: ${transcript.questionId}`);
        continue;
      }

      // Grade the transcript against primary and secondary competencies
      const primaryScore = await gradeTranscript(
        transcript.transcript,
        transcript.questionId,
        questionData.primaryCompetency,
        questionData.question
      );

      let secondaryScore = null;
      if (questionData.secondaryCompetency) {
        secondaryScore = await gradeTranscript(
          transcript.transcript,
          transcript.questionId,
          questionData.secondaryCompetency,
          questionData.question
        );
      }

      // Add primary score
      competencyScores.push(primaryScore);
      
      // Add secondary score if available
      if (secondaryScore) {
        competencyScores.push(secondaryScore);
      }
    }

    // Calculate overall score (weighted average)
    const overallScore = calculateOverallScore(competencyScores);

    // Generate interview summary
    const summary = await generateInterviewSummary(competencyScores, overallScore);

    // Compile all strengths and improvements
    const allStrengths = competencyScores.flatMap(score => score.strengths)
      .filter((item, index, self) => self.indexOf(item) === index) // Remove duplicates
      .slice(0, 5); // Limit to top 5
    
    const allImprovements = competencyScores.flatMap(score => score.improvements)
      .filter((item, index, self) => self.indexOf(item) === index) // Remove duplicates
      .slice(0, 5); // Limit to top 5

    // Compile final result
    const result: GradingResult = {
      overallScore,
      competencyScores,
      summary,
      strengths: allStrengths,
      improvements: allImprovements
    };

    return {
      success: true,
      result
    };
  } catch (error) {
    console.error("Error in processAndGradeInterview:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to grade interview"
    };
  }
}

/**
 * Fetch question and competency data for the given question IDs
 */
async function fetchQuestionCompetencies(questionIds: string[]): Promise<Array<{
  questionId: string;
  question: string;
  primaryCompetency: {
    code: string;
    name: string;
    definition: string;
    level_descriptions: string[];
  };
  secondaryCompetency?: {
    code: string;
    name: string;
    definition: string;
    level_descriptions: string[];
  };
}>> {
  const result = [];

  // Fetch question data
  const { data: questionsData, error: questionsError } = await supabaseAdmin
    .from("interview_questions")
    .select("id, question, primary_competency_code, secondary_competency_code")
    .in("id", questionIds);

  if (questionsError) {
    console.error("Error fetching questions:", questionsError);
    throw new Error(`Failed to fetch question data: ${questionsError.message}`);
  }

  if (!questionsData || questionsData.length === 0) {
    console.warn("No question data found for IDs:", questionIds);
    return [];
  }

  // Get all unique competency codes
  const competencyCodes = questionsData
    .flatMap(q => [q.primary_competency_code, q.secondary_competency_code])
    .filter(Boolean)
    .filter((code, index, self) => self.indexOf(code) === index) as string[];

  // Fetch competency data
  const { data: competenciesData, error: competenciesError } = await supabaseAdmin
    .from("competencies")
    .select("*")
    .in("code", competencyCodes);

  if (competenciesError) {
    console.error("Error fetching competencies:", competenciesError);
    throw new Error(`Failed to fetch competency data: ${competenciesError.message}`);
  }

  if (!competenciesData || competenciesData.length === 0) {
    console.warn("No competency data found for codes:", competencyCodes);
    return [];
  }

  // Map competency data to questions
  for (const question of questionsData) {
    const primaryCompetencyData = competenciesData.find(c => c.code === question.primary_competency_code);
    
    if (!primaryCompetencyData) {
      console.warn(`Primary competency not found for code: ${question.primary_competency_code}`);
      continue;
    }

    const primaryCompetency = {
      code: primaryCompetencyData.code,
      name: primaryCompetencyData.name,
      definition: primaryCompetencyData.definition,
      level_descriptions: [
        primaryCompetencyData.level_1_description,
        primaryCompetencyData.level_2_description,
        primaryCompetencyData.level_3_description,
        primaryCompetencyData.level_4_description,
        primaryCompetencyData.level_5_description
      ]
    };

    // Optional secondary competency
    let secondaryCompetency = undefined;
    if (question.secondary_competency_code) {
      const secondaryCompetencyData = competenciesData.find(c => c.code === question.secondary_competency_code);
      if (secondaryCompetencyData) {
        secondaryCompetency = {
          code: secondaryCompetencyData.code,
          name: secondaryCompetencyData.name,
          definition: secondaryCompetencyData.definition,
          level_descriptions: [
            secondaryCompetencyData.level_1_description,
            secondaryCompetencyData.level_2_description,
            secondaryCompetencyData.level_3_description,
            secondaryCompetencyData.level_4_description,
            secondaryCompetencyData.level_5_description
          ]
        };
      }
    }

    result.push({
      questionId: question.id,
      question: question.question,
      primaryCompetency,
      secondaryCompetency
    });
  }

  return result;
}

/**
 * Grade a transcript against a specific competency using OpenAI
 */
async function gradeTranscript(
  transcript: string,
  questionId: string,
  competency: {
    code: string;
    name: string;
    definition: string;
    level_descriptions: string[];
  },
  questionText: string
): Promise<CompetencyScore> {
  try {
    // Create prompt for OpenAI
    const prompt = `
    You are an expert interview evaluator tasked with assessing a candidate's response to a technical or behavioral interview question.

    Question: "${questionText}"
    
    Candidate's Answer: "${transcript}"
    
    You need to evaluate this response against the following competency:
    
    Competency: ${competency.code} - ${competency.name}
    Definition: ${competency.definition}
    
    Assessment levels:
    Level 1: ${competency.level_descriptions[0]}
    Level 2: ${competency.level_descriptions[1]}
    Level 3: ${competency.level_descriptions[2]}
    Level 4: ${competency.level_descriptions[3]}
    Level 5: ${competency.level_descriptions[4]}
    
    Please:
    1. Determine which level (1-5) best matches their performance
    2. Convert this to a score on a 1-10 scale (e.g., Level 3 = 6.0, Level 4 = 8.0)
    3. Identify 2-3 specific strengths in their response
    4. Identify 2-3 specific areas for improvement
    5. Provide brief, helpful feedback (50-100 words)
    
    Return your evaluation in the following JSON format:
    {
      "score": <number from 1.0 to 10.0, with one decimal place>,
      "level": <number from 1 to 5>,
      "strengths": [<array of 2-3 specific strengths>],
      "improvements": [<array of 2-3 specific areas for improvement>],
      "feedback": <brief, helpful feedback paragraph>
    }`;

    // Call OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.5
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const evaluationJson = JSON.parse(data.choices[0].message.content);

    // Validate and format result
    if (!evaluationJson.score || !evaluationJson.strengths || !evaluationJson.improvements || !evaluationJson.feedback) {
      throw new Error("Invalid response from OpenAI: missing required fields");
    }

    return {
      code: competency.code,
      name: competency.name,
      score: parseFloat(evaluationJson.score.toFixed(1)),
      feedback: evaluationJson.feedback,
      strengths: evaluationJson.strengths,
      improvements: evaluationJson.improvements
    };
  } catch (error) {
    console.error(`Error grading transcript for ${competency.code}:`, error);
    // Return a default score in case of error
    return {
      code: competency.code,
      name: competency.name,
      score: 5.0,
      feedback: "Due to technical difficulties, we couldn't fully analyze this response. Please try again later.",
      strengths: ["Unable to evaluate due to processing error"],
      improvements: ["Please try again with this competency"]
    };
  }
}

/**
 * Calculate overall weighted score from individual competency scores
 */
function calculateOverallScore(competencyScores: CompetencyScore[]): number {
  if (!competencyScores.length) {
    return 0;
  }

  // Group by competency code to avoid double-counting
  const scoresByCompetency: Record<string, number[]> = {};
  for (const score of competencyScores) {
    if (!scoresByCompetency[score.code]) {
      scoresByCompetency[score.code] = [];
    }
    scoresByCompetency[score.code].push(score.score);
  }

  // Calculate average for each competency
  const competencyAverages = Object.entries(scoresByCompetency).map(([code, scores]) => {
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return {
      code,
      average: sum / scores.length
    };
  });

  // Calculate overall average
  const overallSum = competencyAverages.reduce((acc, comp) => acc + comp.average, 0);
  const overallAverage = overallSum / competencyAverages.length;

  // Round to one decimal place
  return parseFloat(overallAverage.toFixed(1));
}

/**
 * Generate an interview summary based on competency scores
 */
async function generateInterviewSummary(competencyScores: CompetencyScore[], overallScore: number): Promise<string> {
  try {
    // Create a summary of all competency scores
    const competencySummary = competencyScores.map(cs => 
      `${cs.code} (${cs.name}): ${cs.score}/10`
    ).join("\n");

    // Create a summary of strengths and improvements
    const strengthsList = competencyScores.flatMap(cs => cs.strengths);
    const improvementsList = competencyScores.flatMap(cs => cs.improvements);

    // Create prompt for OpenAI
    const prompt = `
    You are an expert interview coach summarizing a candidate's interview performance.

    Overall Score: ${overallScore}/10
    
    Individual Competency Scores:
    ${competencySummary}
    
    Key Strengths:
    ${strengthsList.map(s => `- ${s}`).join("\n")}
    
    Areas for Improvement:
    ${improvementsList.map(i => `- ${i}`).join("\n")}
    
    Please write a concise and encouraging summary of the candidate's performance (about 100-150 words). Focus on:
    1. Overall impression and main strengths
    2. Key areas for improvement
    3. General advice going forward

    Keep the tone positive and constructive. Be specific but brief.`;

    // Call OpenAI for summary
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 250
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating interview summary:", error);
    // Return default summary in case of error
    return `Your overall interview score is ${overallScore}/10. You demonstrated several strengths and have some areas to improve. Continue practicing your interview skills, focusing on structure and specific examples.`;
  }
}

/**
 * Save grading results to the database
 */
async function saveGradingResults(userId: string, gradingResult: GradingResult, audioUrl?: string): Promise<void> {
  try {
    // Create a record in the mock_interviews table
    const { data, error } = await supabaseAdmin
      .from("mock_interviews")
      .insert({
        user_id: userId,
        competency_scores: gradingResult,
        overall_score: gradingResult.overallScore,
        feedback: gradingResult.summary,
        audio_url: audioUrl,
        status: "completed",
        ended_at: new Date().toISOString(),
        competencies_assessed: gradingResult.competencyScores.map(cs => cs.code)
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving grading results to database:", error);
      throw new Error(error.message);
    }

    console.log("Successfully saved interview grading results");
  } catch (error) {
    console.error("Failed to save grading results:", error);
    throw error;
  }
}
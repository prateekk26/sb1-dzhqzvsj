// supabase/functions/interview-websocket/index.ts
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from '../_shared/cors.ts';


// Environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase clients
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



interface InterviewRequest {
  audioChunk?: string; // base64 encoded audio
  questionId?: string; // ID of the question
  userId?: string; // ID of the user
  followUpContext?: {
    originalResponse: string;
    followUpQuestion: string;
  };
  generateSpeech?: boolean; // flag to generate speech instead of transcribing
  useCustomIntro?: boolean; // flag to use custom intro text
  customIntroText?: string; // custom intro text to use
  conversationHistory?: string; // the full conversation history for context
}

interface CompetencyData {
  id: string;
  code: string;
  name: string;
  definition: string;
  level_1_description: string;
  level_2_description: string;
  level_3_description: string;
  level_4_description: string;
  level_5_description: string;
  assessment_type: string;
  category: string;
}

interface QuestionData {
  id: string;
  question: string;
  primary_competency_code: string | null;
  secondary_competency_code: string | null;
  type: string | null;
}

interface InterviewFeedback {
  competency_analysis: {
    level: number;
    strengths: string[];
    gaps: string[];
  };
  feedback: string;
  follow_up_question?: string;
  follow_up_type?: 'clarification' | 'deeper_dive'; // Type of follow-up
}

serve(async (req) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Received request to interview-websocket");
    // Log request headers for debugging
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));

    const requestData: InterviewRequest = await req.json();
    console.log("Request type:", requestData.generateSpeech ? "speech generation" : "audio processing");
    
    // If generateSpeech flag is true, handle speech generation
    if (requestData.generateSpeech && requestData.questionId) {
      console.log("Handling speech generation for question ID:", requestData.questionId);
      return await handleSpeechGeneration(requestData, corsHeaders);
    }

    // For regular interview analysis flow
    if (!requestData.audioChunk) {
      return new Response(
        JSON.stringify({ error: "Audio data is required" }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // Process the audio and generate feedback
    const { transcription, analysis } = await processAudioAndGenerateFeedback(requestData);

    return new Response(
      JSON.stringify({ transcription, analysis }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An error occurred processing the request",
        stack: error.stack || "No stack trace available"
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});

/**
 * Generate speech for a question using OpenAI TTS API
 */
async function handleSpeechGeneration(requestData: InterviewRequest, headers: Record<string, string>) {
  try {
    // Fetch question from database
    console.log("Fetching question data for question ID:", requestData.questionId);
    const { data: questionData, error: questionError } = await supabaseAdmin
      .from("interview_questions")
      .select("question")
      .eq("id", requestData.questionId)
      .single();
      
    if (questionError || !questionData) {
      console.error("Error fetching question:", questionError);
      throw new Error(`Failed to fetch question: ${questionError?.message || "Not found"}`);
    }
    
    console.log("Successfully fetched question text:", questionData.question.substring(0, 50) + "...");
    
    // Format the text to be spoken
    // First, determine if we should use direct question or add an introduction
    let textToSpeak: string;
    
    if (requestData.useCustomIntro && requestData.customIntroText) {
      // Use provided custom intro text if available
      textToSpeak = requestData.customIntroText.replace("{question}", questionData.question);
    } else {
      // If no custom intro is provided, just speak the question directly
      textToSpeak = questionData.question;
    }
    
    console.log("Text to be spoken:", textToSpeak.substring(0, 100) + (textToSpeak.length > 100 ? "..." : ""));
    
    // Generate speech using OpenAI TTS API
    console.log("Generating speech with OpenAI TTS API");
    const speech = await generateSpeechWithOpenAI(textToSpeak);
    console.log("Speech generation successful, returning response");
    
    return new Response(
      JSON.stringify({ speech }),
      { 
        headers: { 
          ...headers, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Speech generation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to generate speech",
        stack: error.stack || "No stack trace available" 
      }),
      { 
        status: 500, 
        headers: { 
          ...headers, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
}

/**
 * Generate speech using OpenAI TTS API
 */
async function generateSpeechWithOpenAI(text: string): Promise<string> {
  try {
    console.log("Generating speech for text (length):", text.length);
    
    // Verify OpenAI API key
    if (!OPENAI_API_KEY || OPENAI_API_KEY === "") {
      throw new Error("OpenAI API key is not configured");
    }
    
    console.log("Calling OpenAI TTS API...");
    
    // Call OpenAI TTS API
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "alloy", // Using alloy voice for clarity
        input: text,
        response_format: "mp3"
      })
    });
    
    console.log("TTS API response status:", response.status);
    
    if (!response.ok) {
      // Try to get error details
      let errorDetails = "Unknown error";
      try {
        const error = await response.json();
        errorDetails = JSON.stringify(error);
        console.error("OpenAI TTS error details:", error);
      } catch (e) {
        errorDetails = await response.text();
        console.error("OpenAI TTS error (raw):", errorDetails);
      }
      
      throw new Error(`OpenAI TTS API error (${response.status}): ${errorDetails}`);
    }
    
    console.log("TTS API response successful, processing audio data");
    
    // Convert response to base64
    const audioBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(audioBuffer);
    
    // Log sample of data to verify we're getting actual audio
    console.log(`Received audio data (${bytes.length} bytes), first 20 bytes:`, 
      Array.from(bytes.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
    
    // Check if we have valid MP3 data (MP3 files start with ID3 or with 0xFF 0xFB)
    const isValidMP3 = (
      (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || // "ID3"
      (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) // MPEG frame sync
    );
    
    if (!isValidMP3 && bytes.length > 0) {
      console.warn("Warning: Audio data doesn't appear to be a valid MP3 file");
    }
    
    // Convert to base64
    let base64Audio = "";
    for (let i = 0; i < bytes.length; i++) {
      base64Audio += String.fromCharCode(bytes[i]);
    }
    
    base64Audio = btoa(base64Audio);
    console.log(`Successfully converted to base64 (length: ${base64Audio.length})`);
    
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech with OpenAI:", error);
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}

/**
 * Process audio and generate feedback
 */
async function processAudioAndGenerateFeedback(requestData: InterviewRequest): Promise<{ transcription: string; analysis: InterviewFeedback }> {
  try {
    // Step 1: Transcribe audio using Whisper API
    const transcription = await transcribeAudio(requestData.audioChunk!);
    console.log("Transcription result:", transcription.substring(0, 100) + "...");
    
    // Step 2: Fetch the question data and competency info
    const { questionData, competencyData } = await fetchInterviewContext(requestData.questionId);
    
    // Step 3: Fetch user's profile data to get first name
    let firstName = '';
    if (requestData.userId) {
      try {
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('users_profile')
          .select('first_name')
          .eq('user_id', requestData.userId)
          .single();
          
        if (!profileError && profileData && profileData.first_name) {
          firstName = profileData.first_name;
          console.log(`Found user's first name: ${firstName}`);
        } else {
          console.log('No first name found or error fetching profile');
        }
      } catch (profileErr) {
        console.error('Error fetching user profile:', profileErr);
      }
    }
    
    // Step 4: Generate feedback based on transcription and question context
    const analysis = await generateFeedback(
      transcription, 
      questionData, 
      competencyData,
      requestData.followUpContext,
      firstName,
      requestData.conversationHistory
    );
    
    return { transcription, analysis };
  } catch (error) {
    console.error("Error in processAudioAndGenerateFeedback:", error);
    throw error;
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeAudio(base64Audio: string): Promise<string> {
  try {
    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
    
    // Create form data
    const formData = new FormData();
    formData.append("file", new Blob([binaryData], { type: "audio/webm" }), "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "en");
    
    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI Whisper error:", error);
      throw new Error(`OpenAI Whisper API error: ${error.error?.message || response.statusText}`);
    }
    
    const result = await response.json();
    return result.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

/**
 * Fetch question and competency data from the database
 */
async function fetchInterviewContext(questionId?: string): Promise<{ questionData: QuestionData, competencyData: CompetencyData }> {
  if (!questionId) {
    throw new Error("Question ID is required");
  }
  
  // Fetch question data
  const { data: questionData, error: questionError } = await supabaseAdmin
    .from("interview_questions")
    .select("id, question, primary_competency_code, secondary_competency_code, type")
    .eq("id", questionId)
    .single();
    
  if (questionError || !questionData) {
    throw new Error(`Failed to fetch question: ${questionError?.message || "Not found"}`);
  }
  
  // Get the competency code to use (primary by default, fallback to secondary)
  const competencyCode = questionData.primary_competency_code || 
                        questionData.secondary_competency_code || 
                        "CST"; // Default to Critical & Structured Thinking
  
  // Fetch competency data
  const { data: competencyData, error: competencyError } = await supabaseAdmin
    .from("competencies")
    .select("*")
    .eq("code", competencyCode)
    .single();
    
  if (competencyError || !competencyData) {
    console.error(`Competency not found: ${competencyCode}. Using default.`);
    
    // Provide default competency data if not found
    return {
      questionData,
      competencyData: {
        id: "default",
        code: competencyCode,
        name: "General Competency",
        definition: "Demonstrates effective skills relevant to the question topic",
        level_1_description: "Poor response with significant gaps",
        level_2_description: "Basic response with limited depth",
        level_3_description: "Adequate response with moderate detail",
        level_4_description: "Strong response with good examples and insight",
        level_5_description: "Exceptional response with comprehensive understanding and excellent examples",
        assessment_type: "General",
        category: "General"
      }
    };
  }
  
  return { questionData, competencyData };
}

/**
 * Generate feedback using OpenAI with competency context
 */
async function generateFeedback(
  transcript: string, 
  questionData: QuestionData,
  competencyData: CompetencyData,
  followUpContext?: { originalResponse: string; followUpQuestion: string },
  firstName: string = '',
  conversationHistory?: string
): Promise<InterviewFeedback> {
  try {
    // Build a prompt that includes competency info and grading criteria
    const messages = [
      {
        role: "system",
        content: `You are an expert interviewer providing feedback on candidates' responses.

                 INTERVIEW PROCESS INSTRUCTIONS:
                 1. As soon as the session is created, greet the user${firstName ? " as " + firstName : ""} and ask how they are doing.
                 2. Respond accordingly and tell the user that you are here to conduct their interview and give them unbiased and actionable feedback. Ask them to keep the responses professional, structured, and limited to the questions asked.
                 3. Begin asking the questions one by one.
                 4. If the user responds with anything irrelevant or inappropriate, try to bring them back on track once and end the interview session thereafter.
                 5. If the user shows that they did not understand the question, try once more and then move on to the next question.
                 6. If the user says they don't have relevant experience to answer the question, you can go to a fallback question for the same competency up to 2 times.
                 7. If the answers are unclear or unstructured, you are free to ask up to 2 follow-up or clarifying questions to get a fair idea of the response. These follow-up questions should be only on a need basis.
                 8. Share the feedback at the end of the interview.

                 FOLLOW-UP QUESTIONS:
                 When providing a follow-up question, please identify its type:
                 - "clarification" - when you need the candidate to explain something unclear in their response
                 - "deeper_dive" - when you want the candidate to provide more details or examples
                 
                 Include this information in the response so the UI can appropriately display the type of follow-up.

                 COMPETENCY INFORMATION:
                 Code: ${competencyData.code}
                 Name: ${competencyData.name}
                 Definition: ${competencyData.definition}
                 
                 ASSESSMENT LEVELS AND CRITERIA:
                 Level 1: ${competencyData.level_1_description}
                 Level 2: ${competencyData.level_2_description}
                 Level 3: ${competencyData.level_3_description}
                 Level 4: ${competencyData.level_4_description}
                 Level 5: ${competencyData.level_5_description}
                 
                 ASSESSMENT INSTRUCTIONS:
                 1. Analyze the candidate's response against the level criteria above.
                 2. Determine which level (1-5) best matches their performance.
                 3. Identify 2-3 specific strengths demonstrated in the response.
                 4. Identify 2-3 specific areas for improvement.
                 5. Provide constructive feedback (100-150 words).
                 6. Create an appropriate follow-up question IF NEEDED.
                 
                 LANGUAGE INSTRUCTIONS:
                 1. Always provide your responses in clear, professional English.
                 2. Use natural, conversational language that is easy to understand.
                 3. Avoid jargon unless it is directly relevant to the interview context.
                 ${firstName ? `4. Address the candidate by their first name (${firstName}) occasionally to personalize the feedback.` : ''}`
      },
      {
        role: "user",
        content: `Interview Question: "${questionData.question}"`
      }
    ];
    
    // Add any follow-up context if it exists
    if (followUpContext) {
      messages.push({
        role: "user",
        content: `Previous Question: "${followUpContext.followUpQuestion}"
                  Previous Response: "${followUpContext.originalResponse}"`
      });
    }
    
    // Add conversation history if available
    if (conversationHistory) {
      messages.push({
        role: "user",
        content: `Full conversation history for context:
                  ${conversationHistory}`
      });
    }
    
    // Add the current transcript
    messages.push({
      role: "user",
      content: `Candidate's Response: "${transcript}"`
    });
    
    // Add instructions for output format
    messages.push({
      role: "user",
      content: `Please provide feedback in the following JSON format:
                {
                  "competency_analysis": {
                    "level": <number 1-5 based on the competency level descriptions>,
                    "strengths": [<list of 2-3 specific strengths>],
                    "gaps": [<list of 2-3 specific areas for improvement>]
                  },
                  "feedback": <detailed feedback paragraph based on competency criteria>,
                  "follow_up_question": <optional follow-up question to probe deeper>,
                  "follow_up_type": <optional "clarification" or "deeper_dive" if providing a follow-up>
                }`
    });
    
    // Call OpenAI API with the constructed prompt
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        messages,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    try {
      // Parse the response to ensure it's valid JSON
      const parsedFeedback = JSON.parse(data.choices[0].message.content);
      
      // Validate the response structure
      if (!parsedFeedback.competency_analysis || 
          typeof parsedFeedback.competency_analysis.level !== 'number' || 
          !Array.isArray(parsedFeedback.competency_analysis.strengths) ||
          !Array.isArray(parsedFeedback.competency_analysis.gaps) ||
          typeof parsedFeedback.feedback !== 'string') {
        throw new Error("Invalid response structure");
      }
      
      return parsedFeedback;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.error("Raw response:", data.choices[0].message.content);
      
      // Return a fallback response if parsing fails
      return {
        competency_analysis: {
          level: 3,
          strengths: ["Provided a coherent response", "Demonstrated basic understanding of the question"],
          gaps: ["Could provide more specific examples", "Consider structuring your response more clearly"]
        },
        feedback: "You provided a reasonable response but could improve by including more specific examples and structuring your answer more clearly.",
        follow_up_question: "Can you give a specific example of a time when you demonstrated this skill?",
        follow_up_type: "deeper_dive"
      };
    }
  } catch (error) {
    console.error("Error generating feedback:", error);
    
    // Return default feedback if API call fails
    return {
      competency_analysis: {
        level: 3,
        strengths: ["Provided a coherent response", "Demonstrated basic understanding of the question"],
        gaps: ["Could provide more specific examples", "Consider structuring your response more clearly"]
      },
      feedback: "You provided a reasonable response but could improve by including more specific examples and structuring your answer more clearly.",
      follow_up_question: "Can you give a specific example of a time when you demonstrated this skill?",
      follow_up_type: "deeper_dive"
    };
  }
}
// supabase/functions/realtime-interview/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

// Environment variables
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create Supabase clients
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



interface InterviewSession {
  sessionId: string;
  userId: string;
  questionId: string;
  question: string;
  competency: {
    code: string;
    name: string;
  };
}

interface TranscriptChunk {
  type: 'transcript' | 'final_transcript';
  text: string;
  start_time?: number;
  end_time?: number;
}

// Websocket connection handler
serve(async (req) => {
  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Handle WebSocket connection
  try {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    // Stores the interview session data
    let interviewSession: InterviewSession | null = null;
    
    // State for tracking the conversation
    let currentTranscript = '';
    let finalTranscripts: string[] = [];
    let isListening = false;
    let feedbackSent = false;
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      socket.send(JSON.stringify({ type: 'connected', message: 'Connected to interview service' }));
    };
    
    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'interview_start':
            // Initialize interview session
            interviewSession = message.data as InterviewSession;
            
            // Clear previous state
            currentTranscript = '';
            finalTranscripts = [];
            isListening = false;
            feedbackSent = false;
            
            // Confirm session started
            socket.send(JSON.stringify({ 
              type: 'session_started', 
              sessionId: interviewSession.sessionId
            }));
            break;
            
          case 'start_listening':
            // Start listening mode
            isListening = true;
            feedbackSent = false;
            
            // Send confirmation
            socket.send(JSON.stringify({ 
              type: 'listening_started',
              message: 'Listening for your answer'
            }));
            break;
            
          case 'stop_listening':
            // Stop listening and generate feedback
            isListening = false;
            
            if (currentTranscript && !feedbackSent) {
              // Process the transcript and generate feedback
              const feedback = await generateFeedback(
                currentTranscript,
                interviewSession?.question || '',
                interviewSession?.competency?.code || 'CST'
              );
              
              socket.send(JSON.stringify({
                type: 'ai_message',
                content: feedback.feedback
              }));
              
              // If we have a follow-up question
              if (feedback.follow_up_question) {
                socket.send(JSON.stringify({
                  type: 'follow_up',
                  content: feedback.follow_up_question
                }));
              }
              
              feedbackSent = true;
              
              // Save interview record to database
              if (interviewSession?.userId) {
                try {
                  await supabaseAdmin
                    .from('mock_interviews')
                    .insert({
                      user_id: interviewSession.userId,
                      transcript: currentTranscript,
                      competency_scores: feedback,
                      status: feedback.follow_up_question ? 'in_progress' : 'completed'
                    });
                } catch (err) {
                  console.error('Error saving interview record:', err);
                }
              }
            }
            break;
            
          case 'audio_data':
            // Process audio data
            if (isListening && interviewSession) {
              // In a real implementation, this would send audio to OpenAI for transcription
              // For this example, we'll simulate transcription
              simulateTranscription(message.data, socket);
            }
            break;
            
          case 'end_interview':
            // End the interview session
            socket.close();
            break;
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
        socket.send(JSON.stringify({
          type: 'error',
          content: 'Error processing message'
        }));
      }
    };
    
    socket.onerror = (event) => {
      console.error('WebSocket error:', event);
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    return response;
  } catch (error) {
    console.error('Error handling WebSocket upgrade:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to establish WebSocket connection' }),
      { 
        status: 500, 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});

// Mock function to simulate transcription (would be replaced with actual OpenAI API call)
function simulateTranscription(audioData: Uint8Array, socket: WebSocket) {
  // In real implementation, this would send the audio data to the OpenAI API
  // and stream back the transcription results
  
  setTimeout(() => {
    const transcript = "This is a simulated transcript of what the user might say during their interview.";
    
    socket.send(JSON.stringify({
      type: 'transcript',
      text: transcript,
      start_time: Date.now() - 3000,
      end_time: Date.now()
    }));
    
    // Send final transcript after a delay
    setTimeout(() => {
      socket.send(JSON.stringify({
        type: 'final_transcript',
        text: transcript,
        start_time: Date.now() - 3000,
        end_time: Date.now()
      }));
    }, 2000);
  }, 1500);
}

// Function to generate feedback using OpenAI
async function generateFeedback(
  transcript: string, 
  question: string,
  competencyCode: string
): Promise<any> {
  try {
    // In real implementation, this would call OpenAI to generate feedback
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        messages: [
          {
            role: 'system',
            content: `You are an expert interviewer providing feedback on candidates' responses.
                      Evaluate the response to the interview question, focusing on the candidate's 
                      demonstration of the ${competencyCode} competency.
                      Provide constructive feedback on strengths and areas for improvement.
                      Include a follow-up question if appropriate.`
          },
          { role: 'user', content: `Interview Question: "${question}"` },
          { role: 'user', content: `Candidate's Response: "${transcript}"` },
          { 
            role: 'user', 
            content: `Please provide feedback in the following JSON format:
                      {
                        "competency_analysis": {
                          "level": <number 1-5>,
                          "strengths": [<list of strengths>],
                          "gaps": [<list of improvement areas>]
                        },
                        "feedback": <detailed feedback paragraph>,
                        "follow_up_question": <optional follow-up question>
                      }`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.error('Error generating feedback:', err);
    // Return default feedback if API call fails
    return {
      competency_analysis: {
        level: 3,
        strengths: ['Provided a coherent response', 'Demonstrated basic understanding of the question'],
        gaps: ['Could provide more specific examples', 'Consider structuring your response more clearly']
      },
      feedback: 'You provided a reasonable response but could improve by including more specific examples and structuring your answer more clearly.',
      follow_up_question: 'Can you give a specific example of a time when you demonstrated this skill?'
    };
  }
}
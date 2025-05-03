// test-harness.ts
// This file is for local testing of the interview-websocket function

// Set environment variables for testing
Deno.env.set("MOCK_TRANSCRIPTION", "true");
Deno.env.set("MOCK_TTS", "true");
Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
Deno.env.set("SUPABASE_ANON_KEY", "mock-anon-key");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
Deno.env.set("OPENAI_API_KEY", "mock-openai-key");

// Mock Supabase client responses
const mockCompetencyData = {
  id: "mock-id",
  code: "CST",
  name: "Critical & Structured Thinking",
  definition: "Clearly analyzing and solving problems logically",
  level_1_description: "Answer is confusing, illogical, lacks clarity or structure, misses key points completely.",
  level_2_description: "Shows basic logic; analysis is superficial, partially answers question, lacks depth or structure.",
  level_3_description: "Clear, logical thinking; answers core parts correctly with structured reasoning, though some complexity missed.",
  level_4_description: "Strong logical reasoning; consistently addresses complexities clearly and precisely, good analytical structure.",
  level_5_description: "Exceptional clarity and analytical depth; consistently synthesizes complex information, demonstrates insightful and original reasoning.",
  assessment_type: "Explicit",
  category: "Intellectual"
};

const mockQuestionData = {
  id: "mock-question-id",
  question: "Tell me about a time when you had to solve a complex problem under tight time constraints.",
  primary_competency_code: "CST",
  secondary_competency_code: null,
  type: "behavioral"
};

// Mock create-session response
const mockCreateSessionResponse = {
  client_secret: {
    value: "mock_token_" + Math.random().toString(36).substring(2, 15),
    expires_at: Math.floor(Date.now() / 1000) + 3600
  }
};

// Mock the fetch function for testing
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
  const url = input instanceof Request ? input.url : input.toString();
  console.log(`Mocking fetch to ${url}`);
  
  // Mock Supabase responses
  if (url.includes('supabase')) {
    if (url.includes('interview_questions')) {
      return new Response(
        JSON.stringify({ data: mockQuestionData, error: null }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } else if (url.includes('competencies')) {
      return new Response(
        JSON.stringify({ data: mockCompetencyData, error: null }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } else if (url.includes('mock_interviews')) {
      return new Response(
        JSON.stringify({ data: { id: "mock-interview-id" }, error: null }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // Mock OpenAI API responses
  if (url.includes('api.openai.com')) {
    if (url.includes('/v1/chat/completions')) {
      // Mock chat completion response
      return new Response(
        JSON.stringify({
          choices: [{
            message: {
              content: JSON.stringify({
                competency_analysis: {
                  level: 3,
                  strengths: ["Good problem description", "Clear explanation of solution"],
                  gaps: ["Could provide more quantifiable results", "Needs more detail about collaboration"]
                },
                feedback: "You provided a good explanation of the problem and your approach to solving it. Your thought process was clear and logical. To improve, try to quantify the results of your solution and provide more details about how you collaborated with others during the process.",
                follow_up_question: "How did you measure the success of your solution?"
              })
            }
          }]
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } else if (url.includes('/v1/audio/transcriptions')) {
      // Mock transcription response
      return new Response(
        JSON.stringify({ text: "This is a test transcription response." }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } else if (url.includes('/v1/audio/speech')) {
      // Mock TTS response
      return new Response(
        new Uint8Array([1, 2, 3, 4, 5]), // Mock binary audio data
        { headers: { 'Content-Type': 'audio/mpeg' } }
      );
    } else if (url.includes('/v1/realtime/sessions')) {
      // Mock realtime session creation
      return new Response(
        JSON.stringify(mockCreateSessionResponse),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // Mock /api/create-session endpoint
  if (url.includes('/api/create-session') || url.endsWith('create-session')) {
    console.log('Mocking /api/create-session endpoint');
    return new Response(
      JSON.stringify({
        success: true,
        data: mockCreateSessionResponse,
        error: null
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // For any other requests, use the original fetch
  return originalFetch(input, init);
};

// Mock WebSocket functionality
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  
  constructor(url: string) {
    console.log(`Creating mock WebSocket connection to ${url}`);
    // Simulate connection opening
    setTimeout(() => {
      if (this.onopen) this.onopen();
      
      // Simulate receiving messages
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({
            data: JSON.stringify({
              type: "transcript",
              text: "This is a simulated transcript."
            })
          });
        }
      }, 2000);
    }, 500);
  }
  
  send(data: string): void {
    console.log('Mock WebSocket sending data:', data);
  }
  
  close(): void {
    console.log('Mock WebSocket closed');
    if (this.onclose) this.onclose();
  }
}

// Assign mock WebSocket to global scope
(globalThis as any).WebSocket = MockWebSocket;

// Test the function directly
const testTranscribeAndAnalyze = async () => {
  try {
    // Import the processing function from the Edge Function
    const { processAudioAndGenerateFeedback } = await import("./index.ts");
    
    // Call the function with test data
    const result = await processAudioAndGenerateFeedback({
      audioChunk: "dGVzdA==", // base64 for "test"
      questionId: "mock-question-id",
      userId: "test-user"
    });
    
    console.log("Test result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test error:", error);
  }
};

// Test create-session endpoint
const testCreateSession = async () => {
  try {
    console.log("Testing create-session endpoint...");
    
    const response = await fetch("/api/create-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer mock_auth_token"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        voice: "nova"
      })
    });
    
    const responseText = await response.text();
    console.log("Response status:", response.status);
    console.log("Response text:", responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log("Parsed response:", data);
      
      if (data.success && data.data?.client_secret?.value) {
        console.log("Successfully obtained mock token:", data.data.client_secret.value);
      } else if (data.error) {
        console.error("Error from create-session:", data.error);
      }
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
    }
    
  } catch (error) {
    console.error("Test error:", error);
  }
};

// Run tests
testTranscribeAndAnalyze();
testCreateSession();

console.log("Test harness completed");
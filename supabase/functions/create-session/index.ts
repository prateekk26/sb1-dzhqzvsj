import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let requestData;
    try {
      requestData = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const sessionPayload = {
      model: requestData.model || 'gpt-4o-mini',
      voice: requestData.voice || 'alloy',
      instructions: requestData.instructions,
      modalities: requestData.modalities || ["audio", "text"],
      temperature: requestData.temperature ?? 0.7,
      input_audio_format: requestData.input_audio_format || "pcm16",
      output_audio_format: requestData.output_audio_format || "pcm16",
      max_response_output_tokens: requestData.max_response_output_tokens || "inf",
      tool_choice: requestData.tool_choice || "auto",
      tools: requestData.tools || [],
      turn_detection: requestData.turn_detection || {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
        create_response: true
      },
      default_response_modality: ["audio", "text"],
      input_audio_noise_reduction: requestData.input_audio_noise_reduction || {
        type: "far_field"
      },
      input_audio_transcription: requestData.input_audio_transcription || {
        model: "gpt-4o-transcribe",
        language: "en"
      }
    };

    const openAIResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime',
        'User-Agent': 'HireIQ/1.0'
      },
      body: JSON.stringify(sessionPayload),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json().catch(() => ({}));
      const message = errorData?.error?.message || openAIResponse.statusText;
      return new Response(JSON.stringify({ error: message }), {
        status: openAIResponse.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const data = await openAIResponse.json();
    console.log('✅ Session created. Expires at:', data?.client_secret?.expires_at);

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected server error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
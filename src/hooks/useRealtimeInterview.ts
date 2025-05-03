import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

interface UseRealtimeInterviewOptions {
  onTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onFeedback?: (text: string) => void;
  onFollowUp?: (text: string) => void;
  onStatusChange?: (status: 'connecting' | 'ready' | 'active' | 'thinking' | 'feedback' | 'error') => void;
  onError?: (message: string, details?: string) => void;
}

export function useRealtimeInterview(options: UseRealtimeInterviewOptions = {}) {
  const [sessionId] = useState<string>(uuidv4());
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'ready' | 'active' | 'thinking' | 'feedback' | 'error'>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const updateStatus = useCallback((newStatus: typeof status) => {
    setStatus(newStatus);
    options.onStatusChange?.(newStatus);
  }, [options]);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up WebRTC resources');
    dataChannelRef.current?.close();
    peerConnectionRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    dataChannelRef.current = null;
    peerConnectionRef.current = null;
    mediaStreamRef.current = null;
    setConnectionState('disconnected');
    setStatus('idle');
  }, []);

  const getToken = async (): Promise<string> => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      throw new Error('Failed to retrieve auth token');
    }
    return data.session.access_token;
  };

  const connect = useCallback(async () => {
    try {
      setConnectionState('connecting');
      setError(null);
      updateStatus('connecting');

      const token = await getToken();
      // Call the Edge Function directly
      const { data, error } = await supabase.functions.invoke('create-session', {
        body: {
          model: 'gpt-4o-mini',
          voice: 'alloy',
          instructions: `You are a professional interviewer conducting a mock interview. Start by greeting the candidate warmly and ask for their name if available. Introduce yourself and explain the process. After each response, analyze using a grading rubric and give constructive feedback. Ask follow-ups if needed.`,
          modalities: ['audio', 'text'],
          temperature: 0.8,
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
            create_response: true
          }
        }
      });
      
      if (error) {
        throw new Error(`Failed to create session: ${error.message}`);
      }
      
      if (!data || !data.client_secret?.value) {
        throw new Error('Missing client_secret in response');
      }
      
      const clientSecret = data.client_secret.value;

      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = e => {
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = e.streams[0];
      };

      const dataChannel = pc.createDataChannel('oai-events');
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        console.log('✅ Data channel opened');
        setConnectionState('connected');
        setIsListening(true);
        updateStatus('ready');

        dataChannel.send(JSON.stringify({
          type: 'session.update',
          session: {
            instructions: `You are a professional interviewer conducting a mock interview...`,
            modalities: ['audio', 'text'],
            output_audio_format: 'pcm16',
          },
        }));
      };

      dataChannel.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('📨 Message received:', message.type);

        switch (message.type) {
          case 'transcript':
            setTranscript(message.text);
            setIsListening(true);
            updateStatus('active');
            options.onTranscript?.(message.text);
            break;
          case 'final_transcript':
            setTranscript(message.transcript);
            setIsListening(false);
            updateStatus('thinking');
            options.onFinalTranscript?.(message.transcript);
            dataChannel.send(JSON.stringify({ type: 'response.create', response: { modalities: ['audio', 'text'] } }));
            break;
          case 'ai_message':
            setFeedback(message.content);
            setIsListening(false);
            updateStatus('feedback');
            options.onFeedback?.(message.content);
            break;
          case 'follow_up':
            updateStatus('ready');
            setIsListening(true);
            options.onFollowUp?.(message.content);
            break;
          case 'thinking':
            updateStatus('thinking');
            break;
          case 'error':
            setError(message.content);
            updateStatus('error');
            options.onError?.(message.content);
            break;
          case 'response.done':
  // Handle text output from response.done
  const textOutput = message.response?.output?.find((item: any) =>
    item.type === 'message' &&
    item.content?.[0]?.type === 'text'
  );

  if (textOutput) {
    const content = textOutput.content[0].text;
    setFeedback(content);
    updateStatus('feedback');
    if (options.onFeedback) {
      options.onFeedback(content);
    }
  } else {
    console.warn('No usable text content found in response.done', message.response?.output);
  }
  break;
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-mini`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp,
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to connect with OpenAI Realtime API');
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      console.log('✅ WebRTC session established successfully.');
    } catch (err) {
      console.error('Connection error', err);
      setError(err instanceof Error ? err.message : 'Connection error');
      setConnectionState('error');
      updateStatus('error');
      cleanup();
    }
  }, [cleanup, updateStatus, options]);

  const disconnect = useCallback(() => {
    console.log('🛑 Disconnecting...');
    cleanup();
  }, [cleanup]);

  const sendText = useCallback(async (text: string) => {
    if (!text.trim() || !dataChannelRef.current) return false;
    try {
      dataChannelRef.current.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text }],
        },
      }));
      return true;
    } catch (err) {
      console.error('Error sending text:', err);
      return false;
    }
  }, []);

  const sendResponseTrigger = useCallback(async () => {
    if (!dataChannelRef.current) return false;
    try {
      dataChannelRef.current.send(JSON.stringify({
        type: 'response.create',
        response: { modalities: ['audio', 'text'] },
      }));
      return true;
    } catch (err) {
      console.error('Error triggering response:', err);
      return false;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return {
    connect,
    disconnect,
    sendText,
    sendResponseTrigger,
    sessionId,
    isListening,
    connectionState,
    status,
    transcript,
    setTranscript,
    feedback,
    error,
    remoteAudioRef,
  };
}

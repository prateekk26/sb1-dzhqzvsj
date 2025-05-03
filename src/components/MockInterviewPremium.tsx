import React, { useState, useRef, useEffect, useCallback, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mic, 
  StopCircle, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  MessageSquare,
  RotateCw,
  Volume2,
  UserSquare2,
  Waves
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card';
import { Alert } from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { LoadingState, LoadingSpinner } from '../components/LoadingState';
import { useInterviewQuestions, InterviewQuestion } from '../hooks/useInterviewQuestions';
import { useCompetencies } from '../hooks/useCompetencies';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { EphemeralSessionResponse, RealtimeMessage, ConnectionStatus } from '../utils/types';

// ... your existing reducer and state logic remains unchanged ...

// Modified data channel message handler:
const handleDataChannelMessage = useCallback((event: MessageEvent) => {
  if (!event.data) return;

  try {
    const message = JSON.parse(event.data);
    console.log('Received message:', message);

    switch (message.type) {
      case 'transcript':
        dispatch({ type: 'SET_TRANSCRIPT', payload: message.text });
        if (state.status === 'active') {
          dispatch({ type: 'SET_STATUS', payload: 'thinking' });
        }
        break;
      case 'final_transcript':
        dispatch({ type: 'SET_GENERATING_RESPONSE', payload: true });
        dispatch({ type: 'SET_STATUS', payload: 'thinking' });

        // ✅ Trigger audio response from OpenAI
        const responseCreate = {
          type: "response.create",
          response: {
            modalities: ["audio", "text"]
          }
        };
        dataChannelRef.current?.send(JSON.stringify(responseCreate));
        break;
      case 'ai_message':
        dispatch({ type: 'SET_FEEDBACK', payload: message.content });
        dispatch({ type: 'SET_STATUS', payload: 'feedback' });
        break;
      case 'follow_up':
        dispatch({ type: 'SET_FOLLOW_UP_QUESTION', payload: message.content });
        dispatch({ type: 'SET_STATUS', payload: 'active' });
        dispatch({ type: 'SET_TRANSCRIPT', payload: '' });
        break;
      case 'thinking':
        dispatch({ type: 'SET_STATUS', payload: 'thinking' });
        break;
      case 'error':
        dispatch({ type: 'SET_ERROR', payload: message.content || 'An error occurred during the interview' });
        dispatch({ type: 'SET_STATUS', payload: 'error' });
        break;
      case 'connected':
      case 'session_started':
        console.log(`Received ${message.type} confirmation from server`);
        break;
      case 'listening_started':
        dispatch({ type: 'SET_STATUS', payload: 'active' });
        break;
    }
  } catch (err) {
    console.error('Error parsing data channel message:', err);
  }
}, [state.status]);

// Modified greeting message during session.update:
const greetingMessage = {
  type: "session.update",
  session: {
    instructions: `You are an expert interviewer providing detailed, context-aware feedback on candidates' responses.\nAs soon as the session is created, greet the candidate by name (if available) and ask how they are doing.\nExplain that you will conduct their interview and provide unbiased, actionable feedback.\nPlease ask the candidate to keep their responses professional and structured. Then, begin asking the interview questions one by one.`,
    modalities: ["audio", "text"],
    output_audio_format: "pcm16"
  }
};

// Replace your previous session update code inside dataChannel.onopen with:
dataChannelRef.current.onopen = () => {
  console.log('Data channel opened');
  dataChannelRef.current?.send(JSON.stringify(greetingMessage));
};

// ✅ With these updates, the assistant should now speak back responses via WebRTC audio stream.
// Make sure your browser and OS allow autoplay and output audio on the right device.

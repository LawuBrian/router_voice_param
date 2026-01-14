// ============================================
// PathRAG Session Connect API Route
// Simplified approach - like param_demo
// ============================================

import { NextRequest, NextResponse } from 'next/server';

// Azure Realtime API configuration
const AZURE_SESSIONS_URL = process.env.AZURE_REALTIME_SESSIONS_URL || 
  'https://ai-marieclairemangue29080362ai608865481959.cognitiveservices.azure.com/openai/realtimeapi/sessions?api-version=2025-04-01-preview';
const AZURE_WEBRTC_URL = process.env.AZURE_REALTIME_WEBRTC_URL || 
  'https://eastus2.realtimeapi-preview.ai.azure.com/v1/realtimertc?model=gpt-realtime';
const AZURE_API_KEY = process.env.AZURE_REALTIME_API_KEY || '';

interface ConnectRequest {
  voice?: string;
  sdp: string;
  initialInstruction?: string;
}

interface SessionResponse {
  id?: string;
  model?: string;
  client_secret?: {
    value: string;
    expires_at: number;
  };
}

// Simple prompt - minimal, focused
const SYSTEM_PROMPT = `You are Akili, a router support assistant.

CRITICAL RULES:
1. When told to say something specific, say ONLY that - nothing more
2. Do NOT add your own questions or suggestions
3. Do NOT say "Great!", "Perfect!", "Sure!" or any filler
4. Keep responses to exactly what is requested
5. English only

You follow a structured script. Say only what the script tells you.`;

export async function POST(request: NextRequest) {
  try {
    const body: ConnectRequest = await request.json();

    if (!body.sdp) {
      return NextResponse.json(
        { error: 'SDP is required' },
        { status: 400 }
      );
    }

    if (!AZURE_API_KEY) {
      return NextResponse.json(
        { error: 'Azure API key not configured' },
        { status: 500 }
      );
    }

    const voice = body.voice || 'verse';
    const initialInstruction = body.initialInstruction || "Hi! I'm Akili. I'll help fix your internet. Ready to start?";

    // Simple prompt with initial greeting
    const fullPrompt = SYSTEM_PROMPT + `

YOUR FIRST MESSAGE:
Say exactly: "${initialInstruction}"
Then wait for the user to respond.`;

    console.log(`[Session] Creating session with voice=${voice}`);

    // Create Azure Realtime session - SIMPLE, like param_demo
    const sessionResponse = await fetch(AZURE_SESSIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_API_KEY,
      },
      body: JSON.stringify({
        model: 'gpt-realtime',
        voice: voice,
        instructions: fullPrompt,
        input_audio_transcription: { 
          model: 'whisper-1',
        },
        // No tools, no VAD customization - keep it simple
      }),
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('[Session] Azure session creation failed:', errorText);
      return NextResponse.json(
        { error: `Azure session failed: ${errorText}` },
        { status: sessionResponse.status }
      );
    }

    const session: SessionResponse = await sessionResponse.json();

    if (!session.client_secret?.value) {
      return NextResponse.json(
        { error: 'Could not retrieve ephemeral token from Azure' },
        { status: 500 }
      );
    }

    console.log('[Session] Session created successfully');

    // Negotiate SDP with Azure WebRTC endpoint
    const sdpResponse = await fetch(AZURE_WEBRTC_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.client_secret.value}`,
        'Content-Type': 'application/sdp',
      },
      body: body.sdp,
    });

    if (!sdpResponse.ok) {
      const errorText = await sdpResponse.text();
      console.error('[Session] SDP exchange failed:', errorText);
      return NextResponse.json(
        { error: `SDP exchange failed: ${errorText}` },
        { status: sdpResponse.status }
      );
    }

    const answerSdp = await sdpResponse.text();

    console.log('[Session] SDP exchange successful');

    return NextResponse.json({ sdp: answerSdp });

  } catch (error) {
    console.error('[Session] Connection error:', error);
    return NextResponse.json(
      { error: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

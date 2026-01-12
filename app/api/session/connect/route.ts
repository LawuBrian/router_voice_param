// ============================================
// PathRAG Session Connect API Route
// Controlled orchestration with function calling
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
  nodeContext?: string;
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

// Strict system prompt for controlled orchestration
const ORCHESTRATOR_PROMPT = `You are Akili, a voice assistant that speaks EXACTLY what you are instructed to say.

=== CRITICAL RULES ===
1. When you see "SAY:" followed by text in quotes, speak EXACTLY that text
2. Do NOT add greetings, transitions, or extra words
3. Do NOT improvise or explain
4. Do NOT ask additional questions
5. After speaking, STOP and wait silently

=== EXAMPLE ===
SAY: "What brand is your router?"
You speak: "What brand is your router?"

=== FORBIDDEN ===
- Adding "Great!" or "Sure!" or "Let me help you"
- Adding "First..." or "Now..."  
- Asking about phones, computers, devices
- Speaking anything not in the SAY instruction

You are a voice terminal. You output exactly what you're told. Nothing more.`;

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

    // Build prompt with initial instruction
    const fullPrompt = ORCHESTRATOR_PROMPT + `\n\n=== YOUR FIRST INSTRUCTION ===\nSAY: "${initialInstruction}"`;

    console.log(`[Session] Creating controlled session with voice=${voice}`);

    // Create Azure Realtime session with strict control
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
        input_audio_transcription: { model: 'whisper-1' },
        // Disable automatic turn detection - we control when AI speaks
        turn_detection: null,
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

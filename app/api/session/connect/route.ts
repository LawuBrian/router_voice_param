// ============================================
// PathRAG Session Connect API Route
// FUNCTION CALLING for solid workflow control
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

// System prompt - STRICT script reader
const ORCHESTRATOR_PROMPT = `You are Akili, a voice assistant that reads diagnostic scripts.

=== CRITICAL RULES ===
1. You receive a SCRIPT to read aloud
2. Say ONLY what the script says - do not add your own diagnosis or suggestions
3. If the user answers, STOP and WAIT - do not continue to the next step
4. NEVER try to fix the problem yourself - that's not your job
5. NEVER suggest solutions or troubleshooting steps on your own
6. Keep responses to 1-2 sentences maximum

=== WHAT YOU CAN DO ===
- Read the script naturally in English
- Rephrase the script slightly for clarity
- If user is confused, repeat/simplify the SAME instruction

=== WHAT YOU CANNOT DO ===
- Add extra questions not in the script
- Suggest fixes or solutions
- Diagnose problems
- Jump to different topics
- Give technical advice

=== LANGUAGE ===
English ONLY. No other languages.

=== AFTER SPEAKING ===
Call step_complete() and WAIT silently for the user.`;

// Define the tools/functions the AI must use
const PATHRAG_TOOLS = [
  {
    type: 'function',
    name: 'step_complete',
    description: 'ALWAYS call this immediately after reading the script. This signals you are done and must wait silently.',
    parameters: {
      type: 'object',
      properties: {
        spoken_text: {
          type: 'string',
          description: 'What you said (for logging)'
        }
      },
      required: ['spoken_text']
    }
  },
  {
    type: 'function',
    name: 'clarify_step',
    description: 'Call this ONLY if user asks for clarification. Rephrase the same script, do not add new information.',
    parameters: {
      type: 'object',
      properties: {
        clarification: {
          type: 'string',
          description: 'The rephrased script'
        }
      },
      required: ['clarification']
    }
  }
];

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

    // Build prompt with initial script
    const fullPrompt = ORCHESTRATOR_PROMPT + `

=== SCRIPT TO READ ===
"${initialInstruction}"

Read this greeting, then call step_complete() and WAIT silently for the user.`;

    console.log(`[Session] Creating function-calling session with voice=${voice}`);

    // Create Azure Realtime session with function calling
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
        // Define the functions the AI can call
        tools: PATHRAG_TOOLS,
        tool_choice: 'auto',  // AI decides when to call functions
        // Force English transcription
        input_audio_transcription: { 
          model: 'whisper-1',
          language: 'en',
        },
        // Output configuration - strict and controlled
        modalities: ['audio', 'text'],
        temperature: 0.6,  // Azure minimum - prompt strictness handles control
        max_response_output_tokens: 300, // Enough for full sentences, prevents rambling
        // Server VAD - balanced for natural conversation
        turn_detection: {
          type: 'server_vad',
          threshold: 0.6,           // Balanced sensitivity
          prefix_padding_ms: 300,   // Standard padding
          silence_duration_ms: 700, // Wait for user to finish speaking
          create_response: false,   // We control when AI responds
        },
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

    console.log('[Session] Function-calling session created successfully');

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

// POST /api/stt/transcribe
// Transcribe audio using Google Cloud Speech-to-Text
import { NextRequest, NextResponse } from 'next/server';

const SA_EMAIL = 'tus-aguacates-tts@project-557cb46f-d6e4-41fa-8a8.iam.gserviceaccount.com';
const SA_PRIVATE_KEY = process.env.GCP_TTS_SA_PRIVATE_KEY!;
const TOKEN_URI = 'https://oauth2.googleapis.com/token';

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(JSON.stringify({
    iss: SA_EMAIL,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: TOKEN_URI,
    iat: now,
    exp: now + 3600
  })).replace(/=/g, '');

  const encoder = new TextEncoder();
  const keyData = encoder.encode(header + '.' + payload);

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(SA_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, keyData);
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const jwt = header + '.' + payload + '.' + sig;
  const body = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;

  const resp = await fetch(TOKEN_URI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error('Token error: ' + JSON.stringify(data));
  return data.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN.*?-----/g, '').replace(/-----END.*?-----/g, '').replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function POST(req: NextRequest) {
  try {
    if (!SA_PRIVATE_KEY) {
      return NextResponse.json({ error: 'GCP_TTS_SA_PRIVATE_KEY not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { audioUrl, audioBase64, encoding, sampleRate, language } = body;

    let audioContent: string;

    if (audioBase64) {
      audioContent = audioBase64;
    } else if (audioUrl) {
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        return NextResponse.json({ error: 'Failed to download audio: ' + audioResponse.status }, { status: 400 });
      }
      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      audioContent = audioBuffer.toString('base64');
    } else if (body.mediaId) {
      // Download from WhatsApp/YCloud using media ID
      // Requires YCloud API key passed in header
      const ycloudApiKey = request.headers.get('x-ycloud-api-key') || body.ycloudApiKey;
      if (!ycloudApiKey) {
        return NextResponse.json({ error: 'Provide ycloudApiKey or x-ycloud-api-key header for mediaId downloads' }, { status: 400 });
      }
      // First get the media URL
      const mediaResp = await fetch(`https://api.ycloud.com/v2/whatsapp/media/${body.mediaId}`, {
        headers: { 'X-API-Key': ycloudApiKey }
      });
      if (!mediaResp.ok) {
        return NextResponse.json({ error: 'Failed to get media URL: ' + mediaResp.status }, { status: 400 });
      }
      const mediaData = await mediaResp.json();
      const downloadUrl = mediaData.url;
      if (!downloadUrl) {
        return NextResponse.json({ error: 'No download URL in media response' }, { status: 400 });
      }
      const audioResp = await fetch(downloadUrl);
      if (!audioResp.ok) {
        return NextResponse.json({ error: 'Failed to download audio file' }, { status: 400 });
      }
      const audioBuffer = Buffer.from(await audioResp.arrayBuffer());
      audioContent = audioBuffer.toString('base64');
    } else {
      return NextResponse.json({ error: 'Provide audioUrl, audioBase64, or mediaId' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    // Call Google Cloud Speech-to-Text
    const sttResponse = await fetch(
      'https://speech.googleapis.com/v1/speech:recognize',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: encoding || 'OGG_OPUS',
            sampleRateHertz: sampleRate || 16000,
            languageCode: language || 'es-CO',
            enableAutomaticPunctuation: true,
            model: 'latest_long',
          },
          audio: {
            content: audioContent,
          },
        }),
      }
    );

    const sttData = await sttResponse.json();

    if (sttData.error) {
      return NextResponse.json({ error: sttData.error.message }, { status: 500 });
    }

    const transcript = sttData.results?.[0]?.alternatives?.[0]?.transcript || '';

    return NextResponse.json({
      transcript,
      confidence: sttData.results?.[0]?.alternatives?.[0]?.confidence || 0,
    });
  } catch (error: any) {
    console.error('STT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    usage: 'POST with { audioUrl: "..." } or { audioBase64: "..." }',
    params: { encoding: 'OGG_OPUS (default)', sampleRate: '16000 (default)', language: 'es-CO (default)' },
  });
}

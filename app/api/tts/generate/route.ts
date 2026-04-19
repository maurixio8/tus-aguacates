// GET /api/tts/generate?text=...&nombre=...
// Genera audio TTS con Google Cloud y lo devuelve como archivo OGG
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

  const sign = crypto.subtle
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

export async function GET(req: NextRequest) {
  try {
    const text = req.nextUrl.searchParams.get('text');
    if (!text) {
      return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
    }

    const token = await getAccessToken();

    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { ssml: `<speak>${text}<break time="150ms"/></speak>` },
        voice: { languageCode: 'es-US', name: 'es-US-Chirp3-HD-Callirrhoe' },
        audioConfig: { audioEncoding: 'OGG_OPUS' }
      })
    });

    const data = await response.json();
    if (!data.audioContent) {
      return NextResponse.json({ error: data.error?.message || 'TTS failed' }, { status: 500 });
    }

    const audioBuffer = Buffer.from(data.audioContent, 'base64');

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/ogg; codecs=opus',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400',
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;

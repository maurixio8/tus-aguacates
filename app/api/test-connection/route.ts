import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const timestamp = new Date().toISOString();
  const env = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwt_secret: !!process.env.JWT_SECRET,
    node_env: process.env.NODE_ENV
  };

  return NextResponse.json({
    status: 'API Working',
    timestamp,
    environment: env,
    deployment_time: '2025-12-16T12:36:00Z'
  });
}
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'tus-aguacates-api',
    timestamp: new Date().toISOString(),
  });
}

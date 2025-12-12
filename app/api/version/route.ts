import { NextResponse } from 'next/server';

export async function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || '';
  const ref = process.env.VERCEL_GIT_COMMIT_REF || '';
  const msg = process.env.VERCEL_GIT_COMMIT_MESSAGE || '';
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || '';
  return NextResponse.json({ sha, ref, msg, env });
}

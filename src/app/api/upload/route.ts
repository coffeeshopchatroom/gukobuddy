
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ message: 'No filename provided' }, { status: 400 });
  }

  try {
    const blob = await put(filename, request.body, {
      access: 'public',
    });
    return NextResponse.json(blob);
  } catch (error) {
    console.error("Upload to Vercel Blob failed", error);
    const message = (error instanceof Error) ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Upload failed', error: message }, { status: 500 });
  }
}

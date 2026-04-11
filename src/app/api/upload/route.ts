
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  // The request body is a ReadableStream. The Vercel Blob SDK is designed to stream this directly.
  if (!filename || !request.body) {
    return NextResponse.json({ message: 'No filename or body provided' }, { status: 400 });
  }

  try {
    // Pass the ReadableStream directly to put.
    const blob = await put(filename, request.body, {
      access: 'public',
    });
    return NextResponse.json(blob);
  } catch (error) {
    console.error("Upload to Vercel Blob failed", error);
    const message = (error instanceof Error) ? error.message : 'An unknown error occurred';
    if (message.includes('No store found')) {
        return NextResponse.json({ message: "Vercel Blob store not connected. Please connect a store in your Vercel project settings.", error: message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Upload failed', error: message }, { status: 500 });
  }
}

import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

/**
 * Server-side upload route.
 * Handles binary file uploads to Vercel Blob storage.
 * Requires a 'filename' query parameter in the URL.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  // The filename is required to define the path in blob storage.
  if (!filename) {
    return NextResponse.json(
      { error: 'Missing filename parameter in query string.' }, 
      { status: 400 }
    );
  }

  try {
    // Check if the request body exists (binary stream)
    if (!request.body) {
      return NextResponse.json({ error: 'No file body provided' }, { status: 400 });
    }

    // Upload the binary stream directly to Vercel Blob.
    // This automatically uses the BLOB_READ_WRITE_TOKEN environment variable.
    const blob = await put(filename, request.body, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error: any) {
    console.error('Vercel Blob upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file to storage.' }, 
      { status: 500 }
    );
  }
}

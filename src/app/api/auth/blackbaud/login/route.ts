
import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_BLACKBAUD_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/blackbaud/callback`;
  
  if (!clientId) {
    return NextResponse.json({ error: 'Blackbaud Client ID not configured' }, { status: 500 });
  }

  const authUrl = `https://app.blackbaud.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(authUrl);
}

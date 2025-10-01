import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successfully exchanged code for session
      return NextResponse.redirect(`${origin}${next}`)
    }

    // If there's an error, redirect to login with error message
    return NextResponse.redirect(`${origin}/login?error=Unable to verify email. Please try again.`)
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}

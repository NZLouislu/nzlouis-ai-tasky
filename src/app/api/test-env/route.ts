import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.BLOG_SUPABASE_URL
  const supabaseKey = process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY

  return NextResponse.json({
    supabaseUrl: supabaseUrl ? 'loaded' : 'not loaded',
    supabaseKey: supabaseKey ? 'loaded' : 'not loaded',
    url: supabaseUrl,
    keyLength: supabaseKey?.length
  })
}
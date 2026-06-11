import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return { error: 'Non authentifié', status: 401 }
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon')
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return { error: 'Token invalide', status: 401 }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key', { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!prof?.is_admin) return { error: 'Admin requis', status: 403 }
  return { admin, user }
}

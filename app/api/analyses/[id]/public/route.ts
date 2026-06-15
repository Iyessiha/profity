// PROFITYX — PATCH /api/analyses/[id]/public
// Toggle partage public d'une analyse (appartient à l'utilisateur)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key'
  )

  // Vérifier le token et récupérer l'user
  const { data: { user }, error: authErr } = await db.auth.getUser(auth)
  if (authErr || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { is_public } = await req.json()

  // Mettre à jour uniquement si l'analyse appartient à l'user
  const { error } = await db
    .from('chart_analyses')
    .update({ is_public: !!is_public })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, is_public: !!is_public })
}

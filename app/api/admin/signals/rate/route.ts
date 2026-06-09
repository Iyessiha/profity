import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { signal_id, result } = await req.json()
  if (!signal_id || !['WIN','LOSS','win','loss'].includes(result))
    return NextResponse.json({ error: 'signal_id et result (WIN|LOSS) requis' }, { status: 400 })

  // Toujours stocker en minuscule pour cohérence avec le front
  const normalizedResult = (result as string).toLowerCase()

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await admin.from('chart_analyses')
    .update({ trade_result: normalizedResult, rated_at: new Date().toISOString() })
    .eq('id', signal_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Bonus +1 crédit si WIN
  if (normalizedResult === 'win') {
    const { data: sig } = await admin.from('chart_analyses').select('user_id').eq('id', signal_id).single()
    if (sig?.user_id) {
      await admin.rpc('add_credits', { p_user_id: sig.user_id, p_amount: 1, p_type: 'win_bonus', p_description: 'Bonus WIN — signal vérifié' })
    }
  }
  return NextResponse.json({ success: true })
}

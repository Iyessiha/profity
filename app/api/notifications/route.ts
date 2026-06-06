// ============================================================
// PROFITYX — /api/notifications (GET + PATCH + POST admin)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUser(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await sb.auth.getUser(token)
  return user
}

// GET : récupérer les notifs de l'utilisateur
export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success:false, error:'Non authentifié' }, { status:401 })

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ success:false, error:error.message }, { status:500 })
  return NextResponse.json({ success:true, data })
}

// PATCH : marquer une/toutes les notifs comme lues
export async function PATCH(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success:false, error:'Non authentifié' }, { status:401 })

  const body = await req.json().catch(() => ({}))
  const { id, all } = body

  if (all) {
    await supabaseAdmin.from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
  } else if (id) {
    await supabaseAdmin.from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id)
  }

  return NextResponse.json({ success:true })
}

// POST : admin envoie une notification ciblée
export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success:false }, { status:401 })

  const { data: prof } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!prof?.is_admin) return NextResponse.json({ success:false, error:'Admin requis' }, { status:403 })

  const body = await req.json()
  const { target_user_id, target_plan, type, title, message, action_url, action_label, priority } = body

  if (!title || !message) return NextResponse.json({ success:false, error:'title et message requis' }, { status:400 })

  let count = 0
  if (target_user_id) {
    // Notif à un utilisateur spécifique
    await supabaseAdmin.from('notifications').insert({
      user_id: target_user_id, type: type || 'admin_message',
      title, message, action_url, action_label, priority: priority || 'normal'
    })
    count = 1
  } else {
    // Broadcast (tous ou filtre par plan)
    const { data: users } = await supabaseAdmin.from('profiles')
      .select('id')
      .match(target_plan ? { user_plan: target_plan } : {})

    if (users && users.length > 0) {
      await supabaseAdmin.from('notifications').insert(
        users.map((u: { id: string }) => ({
          user_id: u.id, type: type || 'announcement',
          title, message, action_url, action_label, priority: priority || 'normal'
        }))
      )
      count = users.length
    }
  }

  return NextResponse.json({ success:true, sent_to: count })
}

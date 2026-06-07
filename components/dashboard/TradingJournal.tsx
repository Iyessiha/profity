'use client'
import { useState, useEffect, useCallback } from 'react'
const HUD = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

const EMOTIONS = ['CONFIANT','DISCIPLINÉ','NEUTRE','ANXIEUX','FOMO']
const EMOTION_EMOJI: Record<string,string> = { CONFIANT:'😤', DISCIPLINÉ:'🧘', NEUTRE:'😐', ANXIEUX:'😰', FOMO:'😱' }
const PAIRS = ['XAU/USD','EUR/USD','GBP/USD','USD/JPY','BTC/USD','ETH/USD','GBP/JPY','NAS100','V75']

interface Trade {
  id:string; pair:string; direction:'LONG'|'SHORT'; entry:number; exit?:number
  stop_loss?:number; result?:string; pnl_amount?:number; pnl_pips?:number
  emotion?:string; notes?:string; trade_date:string; lot_size?:number
}
interface Stats { wins:number; losses:number; winrate:number; total_pnl:number }

export default function TradingJournal({ token }: { token:string }) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [stats,  setStats]  = useState<Stats>({ wins:0, losses:0, winrate:0, total_pnl:0 })
  const [open,   setOpen]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Trade|null>(null)
  const [form, setForm] = useState({ pair:'XAU/USD', direction:'LONG', entry:'', exit:'', stop_loss:'', tp:'', lot_size:'0.01', result:'', pnl_pips:'', pnl_amount:'', emotion:'NEUTRE', notes:'' })

  const load = useCallback(async () => {
    const r = await fetch('/api/journal', { headers:{ Authorization:`Bearer ${token}` } })
    const j = await r.json()
    if (j.success) { setTrades(j.trades); setStats(j.stats) }
  }, [token])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    const payload = { ...form, entry:Number(form.entry)||undefined, exit:Number(form.exit)||undefined, stop_loss:Number(form.stop_loss)||undefined, pnl_pips:Number(form.pnl_pips)||undefined, pnl_amount:Number(form.pnl_amount)||undefined, lot_size:Number(form.lot_size)||0.01, result:form.result||undefined, emotion:form.emotion||undefined }
    const method = editing ? 'PATCH' : 'POST'
    const body   = editing ? { id:editing.id, ...payload } : payload
    await fetch('/api/journal', { method, headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify(body) })
    setOpen(false); setEditing(null); setForm({ pair:'XAU/USD', direction:'LONG', entry:'', exit:'', stop_loss:'', tp:'', lot_size:'0.01', result:'', pnl_pips:'', pnl_amount:'', emotion:'NEUTRE', notes:'' }); load()
    setSaving(false)
  }

  const del = async (id:string) => {
    await fetch('/api/journal', { method:'DELETE', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ id }) })
    load()
  }

  const inp = { background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:5, padding:'9px 12px', color:'var(--tx0)', fontFamily:BODY, fontSize:13, width:'100%', boxSizing:'border-box' as const, outline:'none' }
  const lbl = { fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', marginBottom:5, display:'block' as const }

  return (
    <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, overflow:'hidden', marginTop:'1.25rem' }}>
      <div style={{ height:2, background:'linear-gradient(90deg,transparent,var(--ac2),transparent)' }} />
      <div style={{ padding:'1rem 1.25rem' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'color-mix(in srgb,var(--ac2) 12%,transparent)', border:'1px solid color-mix(in srgb,var(--ac2) 25%,transparent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="ti ti-notebook" style={{ fontSize:18, color:'var(--ac2)' }} />
            </div>
            <div>
              <div style={{ fontFamily:HUD, fontSize:11, color:'var(--tx0)', letterSpacing:1 }}>JOURNAL DE TRADING</div>
              <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>{trades.length} trades logués</div>
            </div>
          </div>
          <button onClick={() => setOpen(v=>!v)} style={{ background:open?'color-mix(in srgb,var(--ac2) 15%,transparent)':'var(--bg2)', border:'1px solid var(--bd)', borderRadius:6, padding:'7px 12px', cursor:'pointer', color:'var(--ac2)', fontFamily:HUD, fontSize:8, letterSpacing:1 }}>
            {open ? '✕ FERMER' : '+ TRADE'}
          </button>
        </div>

        {/* Stats rapides */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom: open || trades.length > 0 ? '1rem' : 0 }}>
          {[
            { l:'WINRATE',  v:`${stats.winrate}%`, c: stats.winrate >= 50 ? 'var(--ok)' : 'var(--red)' },
            { l:'WINS',     v:String(stats.wins),   c:'var(--ok)'  },
            { l:'LOSSES',   v:String(stats.losses), c:'var(--red)' },
            { l:'P&L',      v:`${stats.total_pnl >= 0 ? '+' : ''}${Math.round(stats.total_pnl).toLocaleString('fr-FR')}`, c: stats.total_pnl >= 0 ? 'var(--ok)' : 'var(--red)' },
          ].map(s => (
            <div key={s.l} style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:8, padding:'0.6rem', textAlign:'center' }}>
              <div style={{ fontFamily:HUD, fontSize:13, fontWeight:900, color:s.c, lineHeight:1, marginBottom:3 }}>{s.v}</div>
              <div style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'var(--tx3)' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Formulaire */}
        {open && (
          <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:8, padding:'1rem', marginBottom:'1rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <div>
                <span style={lbl}>PAIRE</span>
                <select value={form.pair} onChange={e=>setForm(f=>({...f,pair:e.target.value}))} style={inp}>
                  {PAIRS.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <span style={lbl}>DIRECTION</span>
                <div style={{ display:'flex', gap:6 }}>
                  {(['LONG','SHORT'] as const).map(d => (
                    <button key={d} onClick={()=>setForm(f=>({...f,direction:d}))}
                      style={{ flex:1, padding:'9px', border:`1px solid ${form.direction===d?d==='LONG'?'rgba(0,255,178,0.4)':'rgba(255,58,92,0.4)':'var(--bd)'}`, borderRadius:5, background:form.direction===d?d==='LONG'?'rgba(0,255,178,0.08)':'rgba(255,58,92,0.08)':'transparent', color:form.direction===d?d==='LONG'?'#00FFB2':'#FF3A5C':'var(--tx3)', fontFamily:HUD, fontSize:9, cursor:'pointer' }}>
                      {d === 'LONG' ? '▲ LONG' : '▼ SHORT'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:10 }}>
              <div><span style={lbl}>ENTRÉE</span><input style={inp} type="number" value={form.entry} onChange={e=>setForm(f=>({...f,entry:e.target.value}))} placeholder="2318.50" /></div>
              <div><span style={lbl}>SORTIE</span><input style={inp} type="number" value={form.exit}  onChange={e=>setForm(f=>({...f,exit:e.target.value}))}  placeholder="2351.20" /></div>
              <div><span style={lbl}>STOP LOSS</span><input style={inp} type="number" value={form.stop_loss} onChange={e=>setForm(f=>({...f,stop_loss:e.target.value}))} placeholder="2302.00" /></div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:10 }}>
              <div>
                <span style={lbl}>RÉSULTAT</span>
                <select value={form.result} onChange={e=>setForm(f=>({...f,result:e.target.value}))} style={inp}>
                  <option value="">En cours...</option>
                  <option value="WIN">✅ WIN</option>
                  <option value="LOSS">❌ LOSS</option>
                  <option value="BREAKEVEN">⚖️ BREAKEVEN</option>
                </select>
              </div>
              <div><span style={lbl}>PIPS</span><input style={inp} type="number" value={form.pnl_pips} onChange={e=>setForm(f=>({...f,pnl_pips:e.target.value}))} placeholder="+32.5" /></div>
              <div><span style={lbl}>P&L (FCFA)</span><input style={inp} type="number" value={form.pnl_amount} onChange={e=>setForm(f=>({...f,pnl_amount:e.target.value}))} placeholder="+15000" /></div>
            </div>

            <div style={{ marginBottom:10 }}>
              <span style={lbl}>ÉTAT ÉMOTIONNEL</span>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {EMOTIONS.map(em => (
                  <button key={em} onClick={()=>setForm(f=>({...f,emotion:em}))}
                    style={{ padding:'6px 10px', border:`1px solid ${form.emotion===em?'var(--ac2)':'var(--bd)'}`, borderRadius:6, background:form.emotion===em?'color-mix(in srgb,var(--ac2) 12%,transparent)':'transparent', color:form.emotion===em?'var(--ac2)':'var(--tx3)', fontFamily:BODY, fontSize:12, cursor:'pointer' }}>
                    {EMOTION_EMOJI[em]} {em}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <span style={lbl}>NOTES / LEÇONS</span>
              <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2}
                placeholder="Pourquoi ce trade ? Qu'est-ce que j'aurais dû faire différemment ?"
                style={{ ...inp, resize:'vertical', fontFamily:BODY }} />
            </div>

            <button onClick={save} disabled={saving || !form.pair || !form.entry}
              style={{ width:'100%', background:saving||!form.entry?'var(--bd)':'var(--ac2)', border:'none', borderRadius:6, padding:'11px', color:saving||!form.entry?'var(--tx3)':'#020408', fontFamily:HUD, fontSize:9, letterSpacing:2, fontWeight:700, cursor:'pointer' }}>
              {saving ? '...' : editing ? '✏️ MODIFIER LE TRADE' : '💾 ENREGISTRER LE TRADE'}
            </button>
          </div>
        )}

        {/* Liste des trades */}
        {trades.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {trades.slice(0,10).map(t => (
              <div key={t.id} style={{ background:'var(--bg2)', border:`1px solid ${t.result==='WIN'?'rgba(0,230,118,0.2)':t.result==='LOSS'?'rgba(220,38,38,0.2)':'var(--bd)'}`, borderRadius:8, padding:'10px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                    <span style={{ fontFamily:HUD, fontSize:10, color: t.direction==='LONG'?'#00FFB2':'#FF3A5C', flexShrink:0 }}>
                      {t.direction==='LONG'?'▲':'▼'} {t.pair}
                    </span>
                    {t.result && (
                      <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'2px 7px', borderRadius:3, background:t.result==='WIN'?'rgba(0,230,118,0.1)':t.result==='LOSS'?'rgba(220,38,38,0.1)':'var(--bd)', color:t.result==='WIN'?'var(--ok)':t.result==='LOSS'?'var(--red)':'var(--tx3)' }}>
                        {t.result}
                      </span>
                    )}
                    {t.emotion && <span style={{ fontSize:14 }}>{EMOTION_EMOJI[t.emotion]}</span>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    {t.pnl_amount !== null && t.pnl_amount !== undefined && (
                      <span style={{ fontFamily:HUD, fontSize:11, fontWeight:700, color:t.pnl_amount>=0?'var(--ok)':'var(--red)' }}>
                        {t.pnl_amount>=0?'+':''}{Math.round(t.pnl_amount).toLocaleString('fr-FR')} F
                      </span>
                    )}
                    <button onClick={()=>del(t.id)} style={{ background:'transparent', border:'none', color:'var(--tx3)', cursor:'pointer', fontSize:14, padding:0 }}>✕</button>
                  </div>
                </div>
                {t.notes && <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginTop:5, lineHeight:1.4 }}>{t.notes}</div>}
              </div>
            ))}
          </div>
        )}

        {trades.length === 0 && !open && (
          <div style={{ textAlign:'center', padding:'1.5rem 0', color:'var(--tx3)' }}>
            <i className="ti ti-notebook-off" style={{ fontSize:28, display:'block', marginBottom:8 }} />
            <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, marginBottom:4 }}>JOURNAL VIDE</div>
            <div style={{ fontFamily:BODY, fontSize:12 }}>Enregistrez vos trades pour suivre vos performances.</div>
          </div>
        )}
      </div>
    </div>
  )
}

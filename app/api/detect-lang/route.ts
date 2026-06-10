// ============================================================
// PROFITYX — GET /api/detect-lang
// Détecte le pays via Vercel Edge + retourne la langue
// ============================================================
import { NextRequest, NextResponse } from 'next/server'

const FR_COUNTRIES = new Set([
  'CI','SN','ML','BF','BJ','TG','GN','GW','MR','NE',
  'CM','CD','CG','CF','GA','GQ','TD','BI','RW',
  'MG','KM','DJ','MU','SC','RE','YT',
  'FR','BE','CH','LU','MC','HT','CA',
])

const EN_COUNTRIES = new Set([
  'NG','GH','SL','LR','GM','ZA','KE','UG','TZ',
  'ZM','ZW','BW','NA','ET','SS','SD',
  'GB','US','AU','NZ','IE','JM','TT',
])

export async function GET(req: NextRequest) {
  const country    = req.headers.get('x-vercel-ip-country') ?? ''
  const acceptLang = req.headers.get('accept-language') ?? ''
  const browserLang = acceptLang.split(',')[0].split('-')[0].toLowerCase()

  let lang: 'fr' | 'en' = 'fr'

  if (country) {
    const cc = country.toUpperCase()
    if      (EN_COUNTRIES.has(cc)) lang = 'en'
    else if (FR_COUNTRIES.has(cc)) lang = 'fr'
    else if (browserLang === 'en') lang = 'en'
  } else {
    if (browserLang === 'en') lang = 'en'
  }

  return NextResponse.json({ lang, country: country || null })
}

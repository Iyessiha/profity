// ============================================================
// PROFITYX — Dictionnaire i18n partagé
// Utilisé depuis login, dashboard, analysis, settings
// ============================================================
export type Lang = 'fr' | 'en'

export function getLang(): Lang {
  if (typeof localStorage === 'undefined') return 'fr'
  return (localStorage.getItem('pxLang') as Lang) || 'fr'
}

export function setLang(lang: Lang) {
  if (typeof localStorage !== 'undefined') localStorage.setItem('pxLang', lang)
}

export const T = {
  fr: {
    // Login / Signup
    login_title:      'CONNEXION',
    register_title:   'INSCRIPTION',
    email:            'Adresse email',
    password:         'Mot de passe',
    name:             'Nom complet',
    login_btn:        'SE CONNECTER',
    register_btn:     "S'INSCRIRE",
    no_account:       "Pas encore de compte ?",
    has_account:      'Déjà un compte ?',
    sign_up:          "S'inscrire",
    sign_in:          'Se connecter',
    forgot:           'Mot de passe oublié ?',
    free_credits:     '10 crédits offerts · Sans carte bancaire',
    welcome_back:     'Bon retour,',
    or:               'ou',

    // Dashboard
    dashboard:        'TABLEAU DE BORD',
    analyze:          'ANALYSER',
    history:          'HISTORIQUE',
    settings:         'PARAMÈTRES',
    credits:          'CRÉDITS',
    upgrade:          'UPGRADER',
    logout:           'Déconnexion',
    good_morning:     'Bonjour',
    good_afternoon:   'Bon après-midi',
    good_evening:     'Bonsoir',
    your_plan:        'Votre plan',
    analyses_done:    'analyses effectuées',

    // Analysis
    upload_chart:     'UPLOADER TON CHART',
    select_asset:     'Sélectionne ton actif',
    analyze_btn:      'ANALYSER MON CHART',
    analyzing:        'ANALYSE EN COURS...',
    no_credits:       'Crédits insuffisants',
    result_signal:    'SIGNAL GÉNÉRÉ',
    entry:            'Entrée',
    stop_loss:        'Stop Loss',
    take_profit:      'Take Profit',
    direction_long:   'LONG',
    direction_short:  'SHORT',
    confidence:       'Confiance',

    // Errors
    err_login:        'Email ou mot de passe incorrect',
    err_register:     'Erreur lors de la création du compte',
  },

  en: {
    // Login / Signup
    login_title:      'SIGN IN',
    register_title:   'CREATE ACCOUNT',
    email:            'Email address',
    password:         'Password',
    name:             'Full name',
    login_btn:        'SIGN IN',
    register_btn:     'CREATE ACCOUNT',
    no_account:       "Don't have an account?",
    has_account:      'Already have an account?',
    sign_up:          'Sign up',
    sign_in:          'Sign in',
    forgot:           'Forgot password?',
    free_credits:     '10 free credits · No credit card needed',
    welcome_back:     'Welcome back,',
    or:               'or',

    // Dashboard
    dashboard:        'DASHBOARD',
    analyze:          'ANALYZE',
    history:          'HISTORY',
    settings:         'SETTINGS',
    credits:          'CREDITS',
    upgrade:          'UPGRADE',
    logout:           'Log out',
    good_morning:     'Good morning',
    good_afternoon:   'Good afternoon',
    good_evening:     'Good evening',
    your_plan:        'Your plan',
    analyses_done:    'analyses done',

    // Analysis
    upload_chart:     'UPLOAD YOUR CHART',
    select_asset:     'Select your asset',
    analyze_btn:      'ANALYZE MY CHART',
    analyzing:        'ANALYZING...',
    no_credits:       'Not enough credits',
    result_signal:    'SIGNAL GENERATED',
    entry:            'Entry',
    stop_loss:        'Stop Loss',
    take_profit:      'Take Profit',
    direction_long:   'LONG',
    direction_short:  'SHORT',
    confidence:       'Confidence',

    // Errors
    err_login:        'Invalid email or password',
    err_register:     'Error creating your account',
  },
} as const

export type TKeys = keyof typeof T['fr']
export function t(lang: Lang, key: TKeys): string {
  return (T[lang]?.[key] ?? T['fr'][key]) as string
}

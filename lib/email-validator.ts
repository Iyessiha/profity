// ============================================================
// PROFITYX — Validation email : bloque les domaines jetables
// ============================================================

// Domaines jetables / temporaires les plus courants
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org',
  'guerrillamail.de','guerrillamail.biz','guerrillamail.info','grr.la',
  'tempmail.com','temp-mail.org','tempr.email','dispostable.com',
  'yopmail.com','yopmail.fr','cool.fr.nf','jetable.fr.nf','nospam.ze.tc',
  'nomail.xl.cx','mega.zik.dj','speed.1s.fr','courriel.fr.nf',
  'moncourrier.fr.nf','monemail.fr.nf','monmail.fr.nf',
  'throwam.com','throwam.net','throwam.org',
  'mailnull.com','spamgourmet.com','spamgourmet.net','spamgourmet.org',
  'trashmail.com','trashmail.me','trashmail.net','trashmail.at',
  'trashmail.io','trashmail.xyz','trashmail.eu','trashmail.org',
  'maildrop.cc','mailnesia.com','mailnull.com','spamthisplease.com',
  'sharklasers.com','guerrillamailblock.com','spam4.me','trashcanmail.com',
  'discard.email','discardmail.com','discardmail.de','spambog.com',
  'spamfree24.org','spamhereplease.com','spamtrail.com',
  'spam.la','spamobox.com','spamoff.de',
  'fakeinbox.com','filzmail.com','fleckens.hu',
  'getonemail.com','getonemail.net','harakirimail.com',
  'hushmail.com','inoutmail.de','inoutmail.eu','inoutmail.info','inoutmail.net',
  'jetable.com','jetable.net','jetable.org',
  'kasmail.com','klassmaster.com','klassmaster.net',
  'kurzepost.de','letthemeatspam.com','lol.ovpn.to',
  'lonestarwickedwhiskey.com','lookugly.com',
  'mail-temporaire.fr','mailbab.com','mailbidon.com','mailblocks.com',
  'mailbot.com','mailbucket.org','mailcat.biz','mailcatch.com',
  'mailconsult.de','maildu.de','maileater.com','mailexpire.com',
  'mailfa.tk','mailforspam.com','mailfreeonline.com','mailguard.me',
  'mailimate.com','mailme.lv','mailme24.com','mailmetrash.com',
  'mailmoat.com','mailnew.com','mailnull.com','mailNull.com',
  'mailsiphon.com','mailslite.com','mailsucker.net','mailtemp.info',
  'mailtome.de','mailtothis.com','mailtrash.net','mailzilla.com',
  'meltmail.com','mierdamail.com','mohmal.com','mytempemail.com',
  'nada.email','nadaemail.com','neverbox.com','no-spam.ws',
  'nobulk.com','nomail.pw','nomail2me.com','nospamfor.us',
  'notsharingmy.info','nowmymail.com','objectmail.com','obobbo.com',
  'odnorazovoe.ru','oneoffemail.com','oneoffmail.com','onewaymail.com',
  'online.ms','opayq.com','owlpic.com','pookmail.com',
  'powered.name','privacy.net','proxymail.eu','putthisinyourspamdatabase.com',
  'quickinbox.com','rcpt.at','reallymymail.com','reclame.co',
  'recursor.net','regbypass.comsafe-mail.net','safetymail.info',
  'safetypost.de','sandelf.de','saynotospams.com','scatmail.com',
  'schafmail.de','secure-email.org','selfdestructingmail.com','sendspamhere.com',
  'sharklasers.com','shieldedmail.com','shitmail.de','shitmail.me',
  'shitmail.org','shortmail.net','sibmail.com','skeefmail.com',
  'slopsbox.com','slushmail.com','smellfear.com','snakemail.com',
  'sneakemail.com','sneakmail.de','sofimail.com','sogetthis.com',
  'soodonims.com','spam-be-gone.com','spam.care','spam4.me',
  'spambog.com','spambog.de','spambog.ru','spambooger.com',
  'spamgap.com','spamgok.com','spamgourmet.com','spamherelots.com',
  'spamhereplease.com','spamhole.com','spamify.com','spamkill.info',
  'spammotel.com','spammy.host','spamspot.com','spamstack.net',
  'suremail.info','tafmail.com','tagyourself.com','tempalias.com',
  'tempe-mail.com','tempemail.biz','tempemail.com','tempemail.net',
  'tempr.email','tempsky.com','tempthe.net','thankyou2010.com',
  'thisisnotmyrealemail.com','throam.com','throwam.com',
  'throwam.net','throwam.org','throwaway.email','throwam.com',
  'tilien.com','tittbit.in','tmail.com','tmailinator.com',
  'toiea.com','tradermail.info','trash-amil.com','trash-mail.at',
  'trash-mail.com','trash-mail.de','trash-mail.ga','trash-mail.io',
  'trash2009.com','trash2010.com','trash2011.com','trashdevil.com',
  'trashdevil.net','trashemail.de','trashimail.com','trashmail.app',
  'trashmail.at','trashmail.be','trashmail.com','trashmail.cool',
  'trashmail.eu','trashmail.fr','trashmail.gdn','trashmail.guru',
  'trashmail.io','trashmail.me','trashmail.net','trashmail.ninja',
  'trashmail.org','trashmail.pw','trashmail.se','trashmail.top',
  'trashmail.win','trashmail.xyz','trashmailer.com','trashmails.com',
  'trbvm.com','turual.com','twinmail.de','tyldd.com',
  'uggsrock.com','umail.net','upliftnow.com','uplipht.com',
  'uroid.com','venompen.com','viditag.com','votiputox.org',
  'vpn.st','vsimcard.com','vubby.com','wasteland.raptors.dk',
  'welikecookies.com','wh4f.org','whyspam.me','willselfdestruct.com',
  'wuzupmail.net','xemaps.com','xents.com','xmaily.com',
  'xsmail.com','yomail.info','yopmail.com','yopmail.fr','yopmail.gq',
  'you-spam.com','youmail.ga','yourdomain.com','ypmail.webarnak.fr.eu.org',
  'yuurok.com','z1p.biz','za.com','zehnminuten.de','zehnminurenmail.de',
  'zetmail.com','zippymail.info','zoemail.net','zoemail.org',
])

/**
 * Valide un email : format correct + domaine non jetable
 * Retourne null si OK, un message d'erreur sinon
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase()

  // Format basique
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(trimmed)) {
    return 'Adresse email invalide'
  }

  // Domaine jetable
  const domain = trimmed.split('@')[1]
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return 'Les adresses email temporaires ne sont pas acceptées. Utilisez votre email principal.'
  }

  return null
}

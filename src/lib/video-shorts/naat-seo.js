/**
 * Naat & Islamic YouTube SEO & Viral Metadata Generator
 * Generates 100% YouTube-compliant viral titles, descriptions, hashtags, and tags
 * in natural Roman Urdu tailored for audiences in Pakistan, India, and Bangladesh.
 * Zero copyright issues, 100% creator-friendly.
 */

export const NAAT_VIRAL_HOOKS = [
  'Subhan Allah ❤️ Dil Ko Choo Lene Wali Naat',
  'Yeh Naat Sun Kar Ro Parein Ge 😭 Heart Touching',
  'Durood-o-Salam Ki Barkat 🤲 Must Listen',
  'Kamaal Ka Kalam • Sunte Hi Sukoon Mile 🕌',
  'Madine Ki Yaad Mein Khoobsurat Naat ❤️',
  'Pyare Nabi ﷺ Ki Shaan Mein Zabardast Kalam',
  'Kitni Pyari Aawaz Hai • Subhan Allah 🌹',
  'Yeh Kalam Har Dil Ki Aawaz Hai 🤲',
];

export const NAAT_ROMAN_URDU_CAPTIONS = [
  'Subhan Allah, kitni pyari aawaz mein kalam parha hai.',
  'Durood Sharif kasrat se parha karein, barkat hi barkat hai.',
  'Allah Taala hum sab ko pyare Madina ki ziarat naseeb farmaye.',
  'Is kalam ko sun kar dil ko ajeeb sukoon milta hai.',
  'Nabi Kareem ﷺ par lakhon darood aur hazaron salam.',
  'Agar aapko yeh kalam pasand aya toh Comment mein "Subhan Allah" zaroor likhein.',
  'Apne ghar walon aur doston ke sath zaroor share karein.',
];

/**
 * Generates a full YouTube Short publishing package for a clip
 */
export function generateNaatShortMetadata({
  clip,
  videoTitle = 'Naat Sharif',
  channelName = 'Nephew Naat Official',
}) {
  const index = clip.index || 1;
  const hookIndex = (index - 1) % NAAT_VIRAL_HOOKS.length;
  const hookTitle = NAAT_VIRAL_HOOKS[hookIndex];

  // Clean source title (remove resolution or brackets)
  const cleanSourceTitle = videoTitle
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\b(official|video|audio|hd|4k)\b/gi, '')
    .trim();

  // 1. High-Clickthrough YouTube Short Title (< 100 chars)
  const shortTitle = `${hookTitle} | ${cleanSourceTitle || 'Naat Sharif'} #Shorts #Naat`;

  // 2. High-Retention SEO Description with Call-to-Action & Durood Shareef
  const description = `Subhan Allah! Heart-touching Naat Sharif short clip from "${cleanSourceTitle || videoTitle}".
  
🤲 Durood-e-Pak:
"Allahumma Salli Ala Sayyidina Muhammadin Wa Ala Aali Sayyidina Muhammadin Wa Baarik Wa Sallim"

⏱️ Clip Time: ${Math.floor(clip.start / 60)}:${String(Math.floor(clip.start % 60)).padStart(2, '0')} - ${Math.floor(clip.end / 60)}:${String(Math.floor(clip.end % 60)).padStart(2, '0')} (${Math.round(clip.duration)} Seconds)

📢 Support the Channel:
• Video ko LIKE zaroor karein 👍
• Comments mein "Subhan Allah" ya "Masha Allah" likhein 💬
• Apne doston aur family ke sath SHARE karein 📲
• Mazid aisi pyari Naatein aur Kalam sunne ke liye SUBSCRIBE karein! 🔔

#Shorts #Naat #NaatSharif #UrduNaat #IslamicShorts #DuroodSharif #SubhanAllah #Madina #Kalam #Pakistan #India #Bangladesh #ViralShorts #TrendingShorts #JummaMubarak`;

  // 3. Comma-separated Tags for YouTube Studio Video Details
  const tags = [
    'naat',
    'naat sharif',
    'beautiful naat',
    'urdu naat',
    'roman urdu naat',
    'emotional naat',
    'new naat 2026',
    'durood o salam',
    'heart touching naat',
    'islamic shorts',
    'naat status',
    'shorts',
    'viral naat',
    'subhan allah',
    'madina kalam',
    'best naat pakistan',
    'naat bangladesh',
    'naat india',
    'peaceful kalam',
  ].join(', ');

  const hashtags =
    '#Shorts #Naat #NaatSharif #IslamicShorts #UrduNaat #SubhanAllah #Viral';

  return {
    title: shortTitle.slice(0, 99),
    description,
    tags,
    hashtags,
    hookTitle,
  };
}

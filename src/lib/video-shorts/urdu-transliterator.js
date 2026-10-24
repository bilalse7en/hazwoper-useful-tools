/**
 * Urdu Script to Roman Urdu Linguistic Transliteration Engine
 * 100% Free, local, open-source rule-based and context-aware transliteration.
 * Preserves exact poetic stanzas, word order, honorifics, and word-level audio timestamps.
 */

// Context-Aware Lexicon for Common Urdu, Islamic Naat, and Conversational Words
export const URDU_LEXICON = {
  // Classical Naat & Islamic Recitation Vocabulary
  میری: { conversational: 'Meri', poetic: 'Merī', phonetic: 'Meri' },
  مری: { conversational: 'Meri', poetic: 'Marī', phonetic: 'Meri' },
  الفت: { conversational: 'Ulfat', poetic: 'Ulfat', phonetic: 'Ulfat' },
  مدینے: { conversational: 'Madine', poetic: 'Madīne', phonetic: 'Madiney' },
  مدینہ: { conversational: 'Madinah', poetic: 'Madīnah', phonetic: 'Madina' },
  سے: { conversational: 'Se', poetic: 'Se', phonetic: 'Sey' },
  یوں: { conversational: 'Yun', poetic: 'Yūn', phonetic: 'Yoon' },
  ہی: { conversational: 'Hi', poetic: 'Hī', phonetic: 'Hee' },
  نہیں: { conversational: 'Nahi', poetic: 'Nahīn', phonetic: 'Naheen' },
  نہ: { conversational: 'Na', poetic: 'Na', phonetic: 'Na' },
  مرے: { conversational: 'Mere', poetic: 'Mere', phonetic: 'Merey' },
  میرے: { conversational: 'Mere', poetic: 'Mere', phonetic: 'Merey' },
  آقا: { conversational: 'Aaqa', poetic: 'Āqā', phonetic: 'Aaqa' },
  کا: { conversational: 'Ka', poetic: 'Kā', phonetic: 'Ka' },
  کی: { conversational: 'Ki', poetic: 'Kī', phonetic: 'Kee' },
  کے: { conversational: 'Ke', poetic: 'Ke', phonetic: 'Key' },
  کو: { conversational: 'Ko', poetic: 'Ko', phonetic: 'Ko' },
  روضہ: { conversational: 'Roza', poetic: 'Rauzah', phonetic: 'Roza' },
  میں: { conversational: 'Mein', poetic: 'Meiñ', phonetic: 'Main' },
  ہے: { conversational: 'Hai', poetic: 'Hai', phonetic: 'Hai' },
  ہیں: { conversational: 'Hain', poetic: 'Haiñ', phonetic: 'Hain' },
  جانب: { conversational: 'Jaanib', poetic: 'Jānib', phonetic: 'Jaanib' },
  کیسے: { conversational: 'Kaise', poetic: 'Kaise', phonetic: 'Kaisey' },
  کھنچوں: {
    conversational: 'Khinchu',
    poetic: 'Khin̄chūñ',
    phonetic: 'Khinchon',
  },
  کھینچوں: {
    conversational: 'Khinchu',
    poetic: 'Khīñchūñ',
    phonetic: 'Kheenchoon',
  },
  مرا: { conversational: 'Mera', poetic: 'Merā', phonetic: 'Mera' },
  میرا: { conversational: 'Mera', poetic: 'Merā', phonetic: 'Mera' },
  دین: { conversational: 'Deen', poetic: 'Dīn', phonetic: 'Deen' },
  اور: { conversational: 'Aur', poetic: 'Aur', phonetic: 'Aur' },
  دنیا: { conversational: 'Duniya', poetic: 'Dunyā', phonetic: 'Dunya' },
  عرش: { conversational: 'Arsh', poetic: '‘Arsh', phonetic: 'Arsh' },
  اعظم: { conversational: 'Aazam', poetic: 'A‘ẓam', phonetic: 'Aazam' },
  عرشِ: { conversational: 'Arsh-e', poetic: '‘Arsh-i', phonetic: 'Arsh-e' },
  اعظم: { conversational: 'Aazam', poetic: 'A‘zam', phonetic: 'Aazam' },
  پہ: { conversational: 'Pe', poetic: 'Pe', phonetic: 'Pey' },
  پر: { conversational: 'Par', poetic: 'Par', phonetic: 'Par' },
  جس: { conversational: 'Jis', poetic: 'Jis', phonetic: 'Jis' },
  بڑی: { conversational: 'Bari', poetic: 'Baṛī', phonetic: 'Bari' },
  شان: { conversational: 'Shaan', poetic: 'Shān', phonetic: 'Shaan' },
  مصطفیٰ: { conversational: 'Mustafa', poetic: 'Muṣṭafā', phonetic: 'Mustafa' },
  پہچان: { conversational: 'Pehchaan', poetic: 'Pehchān', phonetic: 'Pehchan' },
  ہم: { conversational: 'Hum', poetic: 'Ham', phonetic: 'Hum' },
  پلہ: { conversational: 'Palla', poetic: 'Pallah', phonetic: 'Palla' },
  پلّہ: { conversational: 'Palla', poetic: 'Pallah', phonetic: 'Palla' },
  کوئی: { conversational: 'Koi', poetic: 'Ko’ī', phonetic: 'Koyi' },
  محلہ: { conversational: 'Mohalla', poetic: 'Maḥallah', phonetic: 'Mohalla' },
  اک: { conversational: 'Ek', poetic: 'Ik', phonetic: 'Ek' },
  ایک: { conversational: 'Ek', poetic: 'Ek', phonetic: 'Aik' },
  ایسا: { conversational: 'Aisa', poetic: 'Aisā', phonetic: 'Aisa' },
  پھر: { conversational: 'Phir', poetic: 'Phir', phonetic: 'Phir' },
  مجھے: { conversational: 'Mujhe', poetic: 'Mujhe', phonetic: 'Mujhey' },
  موت: { conversational: 'Maut', poetic: 'Maut', phonetic: 'Maut' },
  خطرہ: { conversational: 'Khatra', poetic: 'Khaṭrah', phonetic: 'Khatra' },
  کیا: { conversational: 'Kya', poetic: 'Kyā', phonetic: 'Kya' },
  زندگی: { conversational: 'Zindagi', poetic: 'Zindagī', phonetic: 'Zindagi' },
  بھی: { conversational: 'Bhi', poetic: 'Bhī', phonetic: 'Bhee' },
  پروا: { conversational: 'Parwah', poetic: 'Parwā', phonetic: 'Parwah' },
  پرواہ: { conversational: 'Parwah', poetic: 'Parwāh', phonetic: 'Parwah' },
  کاش: { conversational: 'Kaash', poetic: 'Kāsh', phonetic: 'Kaash' },
  سرکار: { conversational: 'Sarkaar', poetic: 'Sarkār', phonetic: 'Sarkaar' },
  بار: { conversational: 'Baar', poetic: 'Bār', phonetic: 'Baar' },
  مجھ: { conversational: 'Mujh', poetic: 'Mujh', phonetic: 'Mujh' },
  کہیں: { conversational: 'Kahein', poetic: 'Kahīñ', phonetic: 'Kahein' },
  کہے: { conversational: 'Kahe', poetic: 'Kahe', phonetic: 'Kahey' },
  آ: { conversational: 'Aa', poetic: 'Ā', phonetic: 'Aa' },
  تیرا: { conversational: 'Tera', poetic: 'Terā', phonetic: 'Tera' },
  ترا: { conversational: 'Tera', poetic: 'Trā', phonetic: 'Tera' },
  جینا: { conversational: 'Jeena', poetic: 'Jīnā', phonetic: 'Jeena' },
  مرنا: { conversational: 'Marna', poetic: 'Marnā', phonetic: 'Marna' },
  جب: { conversational: 'Jab', poetic: 'Jab', phonetic: 'Jab' },
  نظر: { conversational: 'Nazar', poetic: 'Naẓar', phonetic: 'Nazar' },
  سوئے: { conversational: 'Soo-e', poetic: 'Sū-i', phonetic: 'Soo-e' },
  طیبہ: { conversational: 'Taiba', poetic: 'Ṭaibah', phonetic: 'Tayyaba' },
  روانہ: { conversational: 'Rawana', poetic: 'Rawānah', phonetic: 'Rawana' },
  ہوئی: { conversational: 'Hui', poetic: 'Hū’ī', phonetic: 'Hui' },
  ساتھ: { conversational: 'Saath', poetic: 'Sāth', phonetic: 'Saath' },
  دل: { conversational: 'Dil', poetic: 'Dil', phonetic: 'Dil' },
  گیا: { conversational: 'Gaya', poetic: 'Gayā', phonetic: 'Gaya' },
  جان: { conversational: 'Jaan', poetic: 'Jān', phonetic: 'Jaan' },
  گئی: { conversational: 'Gai', poetic: 'Ga’ī', phonetic: 'Gayi' },
  منیر: { conversational: 'Muneer', poetic: 'Munīr', phonetic: 'Muneer' },
  اب: { conversational: 'Ab', poetic: 'Ab', phonetic: 'Ab' },
  رہوں: { conversational: 'Rahunga', poetic: 'Rahūñ', phonetic: 'Rahoon' },
  'رہوں گا': {
    conversational: 'Rahunga',
    poetic: 'Rahūñ gā',
    phonetic: 'Rahoon Ga',
  },
  یہاں: { conversational: 'Yahan', poetic: 'Yahāñ', phonetic: 'Yahan' },
  کس: { conversational: 'Kis', poetic: 'Kis', phonetic: 'Kis' },
  لیے: { conversational: 'Liye', poetic: 'Liye', phonetic: 'Lie' },
  سارا: { conversational: 'Saara', poetic: 'Sārā', phonetic: 'Saara' },
  اثاثہ: { conversational: 'Asasa', poetic: 'Asāsah', phonetic: 'Asasa' },
  فاصلوں: { conversational: 'Faslon', poetic: 'Fāṣloñ', phonetic: 'Faaslon' },
  تکلف: {
    conversational: 'Takalluf',
    poetic: 'Takalluf',
    phonetic: 'Takalluf',
  },
  اگر: { conversational: 'Agar', poetic: 'Agar', phonetic: 'Agar' },
  بے: { conversational: 'Be', poetic: 'Be', phonetic: 'Bey' },
  دست: { conversational: 'Dast', poetic: 'Dast', phonetic: 'Dast' },
  پا: { conversational: 'Paa', poetic: 'Pā', phonetic: 'Paa' },
  تو: { conversational: 'Toh', poetic: 'To', phonetic: 'Toh' },
  ان: { conversational: 'Un', poetic: 'Un', phonetic: 'Un' },
  انکی: { conversational: 'Unki', poetic: 'Unkī', phonetic: 'Unkee' },
  'ان کی': { conversational: 'Un Ki', poetic: 'Un Kī', phonetic: 'Un Kee' },
  چوکھٹ: {
    conversational: 'Chaukhat',
    poetic: 'Chaukhaṭ',
    phonetic: 'Chokhat',
  },
  سر: { conversational: 'Sar', poetic: 'Sar', phonetic: 'Sar' },
  جھکائے: { conversational: 'Jhukaye', poetic: 'Jhukā’e', phonetic: 'Jhukaye' },
  ہوئے: { conversational: 'Hue', poetic: 'Hū’e', phonetic: 'Hue' },
  کھڑے: { conversational: 'Khare', poetic: 'Khaṛe', phonetic: 'Kharey' },
  تاجدار: { conversational: 'Tajdar', poetic: 'Tājdār', phonetic: 'Tajdaar' },
  حرم: { conversational: 'Haram', poetic: 'Ḥaram', phonetic: 'Haram' },
  اے: { conversational: 'Ae', poetic: 'Ai', phonetic: 'Ae' },
  شہنشاہ: {
    conversational: 'Shehenshah',
    poetic: 'Shahanshāh',
    phonetic: 'Shehenshah',
  },
  دیں: { conversational: 'Deen', poetic: 'Dīñ', phonetic: 'Deen' },
  تم: { conversational: 'Tum', poetic: 'Tum', phonetic: 'Tum' },
  ہر: { conversational: 'Har', poetic: 'Har', phonetic: 'Har' },
  دم: { conversational: 'Dam', poetic: 'Dam', phonetic: 'Dam' },
  کروڑوں: { conversational: 'Karoron', poetic: 'Karoṛoñ', phonetic: 'Karoron' },
  درود: { conversational: 'Durood', poetic: 'Durūd', phonetic: 'Durood' },
  سلام: { conversational: 'Salam', poetic: 'Salām', phonetic: 'Salaam' },
  قسمت: { conversational: 'Kismat', poetic: 'Qismat', phonetic: 'Kismat' },
  مارا: { conversational: 'Maara', poetic: 'Mārā', phonetic: 'Maara' },
  پکارے: { conversational: 'Pukare', poetic: 'Pukāre', phonetic: 'Pukarey' },
  آپ: { conversational: 'Aap', poetic: 'Āp', phonetic: 'Aap' },
  دیتے: { conversational: 'Dete', poetic: 'Dete', phonetic: 'Detey' },
  اس: { conversational: 'Us', poetic: 'Us', phonetic: 'Us' },
  مدد: { conversational: 'Madad', poetic: 'Madad', phonetic: 'Madad' },
  پیام: { conversational: 'Payaam', poetic: 'Payām', phonetic: 'Payaam' },
  پیغام: { conversational: 'Paigham', poetic: 'Paighām', phonetic: 'Paigham' },
  سبحان: { conversational: 'Subhan', poetic: 'Subḥān', phonetic: 'Subhan' },
  اللہ: { conversational: 'Allah', poetic: 'Allāh', phonetic: 'Allah' },
  محمد: {
    conversational: 'Muhammad',
    poetic: 'Muḥammad',
    phonetic: 'Muhammad',
  },
  صل: { conversational: 'Salla', poetic: 'Ṣallā', phonetic: 'Salla' },
  علی: { conversational: 'Ala', poetic: '‘Alā', phonetic: 'Ala' },
  علیہ: { conversational: 'Alayhi', poetic: '‘Alayhi', phonetic: 'Alayhi' },
  وسلم: {
    conversational: 'Wasallam',
    poetic: 'Wa Sallam',
    phonetic: 'Wasallam',
  },
  کلام: { conversational: 'Kalam', poetic: 'Kalām', phonetic: 'Kalaam' },
  حمد: { conversational: 'Hamd', poetic: 'Ḥamd', phonetic: 'Hamd' },
  نعت: { conversational: 'Naat', poetic: 'Na‘at', phonetic: 'Naat' },
  خوبصورت: {
    conversational: 'Khoobsurat',
    poetic: 'Khūbṣūrat',
    phonetic: 'Khoobsoorat',
  },
  بات: { conversational: 'Baat', poetic: 'Bāt', phonetic: 'Baat' },
  کام: { conversational: 'Kaam', poetic: 'Kām', phonetic: 'Kaam' },
  سچ: { conversational: 'Sach', poetic: 'Sach', phonetic: 'Sach' },
  جھوٹ: { conversational: 'Jhoot', poetic: 'Jhūṭ', phonetic: 'Jhoot' },
  خدا: { conversational: 'Khuda', poetic: 'Khudā', phonetic: 'Khuda' },
  رب: { conversational: 'Rabb', poetic: 'Rabb', phonetic: 'Rab' },
  رسول: { conversational: 'Rasool', poetic: 'Rasūl', phonetic: 'Rasool' },
  نبی: { conversational: 'Nabi', poetic: 'Nabī', phonetic: 'Nabi' },
  عشق: { conversational: 'Ishq', poetic: '‘Ishq', phonetic: 'Ishq' },
  محبت: {
    conversational: 'Mohabbat',
    poetic: 'Muḥabbat',
    phonetic: 'Mohabbat',
  },
  دل: { conversational: 'Dil', poetic: 'Dil', phonetic: 'Dil' },
  آنکھ: { conversational: 'Aankh', poetic: 'Āñkh', phonetic: 'Aankh' },
  آنکھیں: {
    conversational: 'Aankhein',
    poetic: 'Āñkheñ',
    phonetic: 'Aankhein',
  },
  آنسو: { conversational: 'Aansoo', poetic: 'Āñsū', phonetic: 'Aansoo' },
  روشنی: { conversational: 'Roshni', poetic: 'Roshnī', phonetic: 'Roshni' },
  نور: { conversational: 'Noor', poetic: 'Nūr', phonetic: 'Noor' },
  گناہ: { conversational: 'Gunah', poetic: 'Gunāh', phonetic: 'Gunah' },
  بخشش: {
    conversational: 'Bakhshish',
    poetic: 'Bakhshish',
    phonetic: 'Bakhshish',
  },
  رحمت: { conversational: 'Rehmat', poetic: 'Raḥmat', phonetic: 'Rehmat' },
  برکت: { conversational: 'Barkat', poetic: 'Barkat', phonetic: 'Barkat' },
  خوشی: { conversational: 'Khushi', poetic: 'Khushī', phonetic: 'Khushi' },
  غم: { conversational: 'Gham', poetic: 'Gham', phonetic: 'Gham' },
  صبر: { conversational: 'Sabr', poetic: 'Ṣabr', phonetic: 'Sabr' },
  شکر: { conversational: 'Shukr', poetic: 'Shukr', phonetic: 'Shukr' },
};

// Urdu Character to Roman Letter Map for Unknown / Freeform Words
const URDU_CHAR_MAP = {
  // Consonants & Digraphs
  ا: 'a',
  آ: 'aa',
  ب: 'b',
  پ: 'p',
  ت: 't',
  ٹ: 't',
  ث: 's',
  ج: 'j',
  چ: 'ch',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ڈ: 'd',
  ذ: 'z',
  ر: 'r',
  ڑ: 'r',
  ز: 'z',
  ژ: 'zh',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'z',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ک: 'k',
  گ: 'g',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ں: 'n',
  و: 'o',
  ہ: 'h',
  ۂ: 'h',
  ۃ: 'h',
  ھ: 'h',
  ء: '',
  ی: 'i',
  ئ: 'i',
  ے: 'e',
  // Diacritics
  'َ': 'a', // Zabar
  'ِ': 'i', // Zer
  'ُ': 'u', // Pesh
  'ً': 'an',
  'ٍ': 'in',
  'ٌ': 'un',
  'ّ': '', // Tashdeed handled by doubling consonant
  'ْ': '', // Jazm
};

// Two-character Urdu Digraphs (Do Chashmi He Compounds)
const URDU_DIGRAPHS = {
  بھ: 'bh',
  پھ: 'ph',
  تھ: 'th',
  ٹھ: 'th',
  جھ: 'jh',
  چھ: 'chh',
  دھ: 'dh',
  ڈھ: 'dh',
  رھ: 'rh',
  ڑھ: 'rh',
  کھ: 'kh',
  گھ: 'gh',
};

/**
 * Normalizes Urdu string by cleaning zero-width characters and normalizing punctuation.
 */
export function normalizeUrduText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width spaces
    .replace(/[\u064B-\u065F]/g, '') // Strip excessive diacritics for dictionary lookup
    .replace(/[؟]/g, '?')
    .replace(/[،]/g, ',')
    .replace(/[؛]/g, ';')
    .replace(/[۔]/g, '.')
    .trim();
}

/**
 * Transliterates a single Urdu word into Roman Urdu based on context lexicon or phonetics.
 */
export function transliterateUrduWord(word, style = 'conversational') {
  if (!word) return '';

  // Preserve English words if mixed Urdu-English speech
  if (/^[a-zA-Z0-9_\-]+$/.test(word)) {
    return word;
  }

  // Preserve punctuation
  const punctMatch = word.match(
    /^([^\u0600-\u06FF]*)([\u0600-\u06FF]+)([^\u0600-\u06FF]*)$/
  );
  let prefix = '';
  let core = word;
  let suffix = '';

  if (punctMatch) {
    prefix = punctMatch[1] || '';
    core = punctMatch[2] || '';
    suffix = punctMatch[3] || '';
  }

  // 1. Direct Lexicon Match (Highest Accuracy for Urdu Recitation & Poetry)
  const normalizedCore = normalizeUrduText(core);
  if (URDU_LEXICON[normalizedCore]) {
    const entry = URDU_LEXICON[normalizedCore];
    const trans = entry[style] || entry.conversational || entry.poetic || core;
    return `${prefix}${trans}${suffix}`;
  }

  // 2. Multi-letter Digraph scanning
  let result = '';
  let i = 0;
  const chars = Array.from(core);

  while (i < chars.length) {
    // Check 2-letter digraphs (e.g. Do Chashmi He compounds)
    if (i < chars.length - 1) {
      const twoChar = chars[i] + chars[i + 1];
      if (URDU_DIGRAPHS[twoChar]) {
        result += URDU_DIGRAPHS[twoChar];
        i += 2;
        continue;
      }
    }

    const ch = chars[i];
    const isFirst = i === 0;
    const isLast = i === chars.length - 1;

    // Special contextual rules
    if (ch === 'و') {
      if (isFirst) {
        result += 'w';
      } else if (isLast) {
        result += style === 'poetic' ? 'ū' : 'o';
      } else {
        result += 'o';
      }
    } else if (ch === 'ی') {
      if (isFirst) {
        result += 'y';
      } else if (isLast) {
        result += style === 'poetic' ? 'ī' : 'i';
      } else {
        result += 'ee';
      }
    } else if (ch === 'ے') {
      result += style === 'phonetic' ? 'ey' : 'e';
    } else if (ch === 'ں') {
      result += style === 'poetic' ? 'ñ' : 'n';
    } else if (ch === 'ہ' && isLast && chars.length > 2) {
      // Final silent 'he' in words like 'dastah' or 'deewanah'
      result += 'ah';
    } else if (URDU_CHAR_MAP[ch] !== undefined) {
      result += URDU_CHAR_MAP[ch];
    } else {
      result += ch;
    }

    i++;
  }

  // Capitalize first letter for readability
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return `${prefix}${result}${suffix}`;
}

/**
 * Transliterates a complete Urdu sentence or stanza into natural Roman Urdu.
 * Maintains line breaks, word order, and phrase cadence.
 */
export function transliterateUrduSentence(
  urduSentence,
  style = 'conversational'
) {
  if (!urduSentence || typeof urduSentence !== 'string') return '';

  const lines = urduSentence.split(/\r?\n/);
  const romanLines = lines.map((line) => {
    const tokens = line.trim().split(/\s+/);
    return tokens
      .map((tok) => transliterateUrduWord(tok, style))
      .filter(Boolean)
      .join(' ');
  });

  return romanLines.join('\n');
}

/**
 * Maps word-level Urdu captions to Roman Urdu with identical 1:1 timestamps.
 * Returns enriched caption objects containing:
 * - textUrdu (native Nastaliq script)
 * - textRoman (natural Roman Urdu)
 * - textCombined (Urdu on top, Roman below)
 * - words: array of { wordUrdu, wordRoman, start, end }
 */
export function transliterateUrduCaptions(captions, style = 'conversational') {
  if (!captions || !Array.isArray(captions)) return [];

  return captions.map((cap, idx) => {
    const rawUrdu = cap.textUrdu || cap.text || '';
    const isAlreadyRoman = !/[\u0600-\u06FF]/.test(rawUrdu);

    let textUrdu = isAlreadyRoman ? cap.textUrdu || '' : rawUrdu;
    let textRoman = isAlreadyRoman
      ? cap.textRoman || rawUrdu
      : transliterateUrduSentence(rawUrdu, style);

    // Synchronize word-level timings
    let enrichedWords = [];
    if (cap.words && Array.isArray(cap.words)) {
      enrichedWords = cap.words.map((w) => {
        const wordUrdu = w.wordUrdu || w.word || '';
        const wordRoman =
          w.wordRoman ||
          (/[\u0600-\u06FF]/.test(wordUrdu)
            ? transliterateUrduWord(wordUrdu, style)
            : wordUrdu);

        return {
          start: w.start,
          end: w.end,
          wordUrdu,
          wordRoman,
          word: wordUrdu || wordRoman, // Default displayed word in Urdu script
        };
      });
    } else {
      // If no words array, derive word tokens from caption duration
      const urduWords = rawUrdu.split(/\s+/).filter(Boolean);
      const romanWords = textRoman.split(/\s+/).filter(Boolean);
      const totalWords = Math.max(urduWords.length, romanWords.length, 1);
      const capDuration = Math.max(0.1, cap.end - cap.start);
      const step = capDuration / totalWords;

      enrichedWords = [];
      for (let wIdx = 0; wIdx < totalWords; wIdx++) {
        const wStart = parseFloat((cap.start + wIdx * step).toFixed(2));
        const wEnd = parseFloat((cap.start + (wIdx + 1) * step).toFixed(2));
        const uWord = urduWords[wIdx] || '';
        const rWord =
          romanWords[wIdx] ||
          (uWord ? transliterateUrduWord(uWord, style) : '');

        enrichedWords.push({
          start: wStart,
          end: wEnd,
          wordUrdu: uWord,
          wordRoman: rWord,
          word: uWord || rWord, // Default displayed word in Urdu script
        });
      }
    }

    // Two-line stacked dual mode: Urdu Nastaliq top line, Roman Urdu bottom line
    const textCombined =
      textUrdu && textRoman
        ? `${textUrdu}\n${textRoman}`
        : textUrdu || textRoman;

    return {
      ...cap,
      id: cap.id || `cap-${idx + 1}`,
      text: textUrdu || textRoman, // Authentic Urdu script by default
      textUrdu,
      textRoman,
      textCombined,
      words: enrichedWords,
      captionMode: cap.captionMode || 'dual-urdu-roman',
    };
  });
}

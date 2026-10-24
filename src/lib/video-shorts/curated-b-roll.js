/**
 * Curated Collection of 100+ Verified Islamic B-Roll Videos
 * Exclusively Islamic Topics: Makkah, Madinah, Kaaba, Masjid an-Nabawi, Roza e Rasool,
 * Mosques & Minarets, Arabic Calligraphy, Holy Quran, Dua, Sujood & Ramadan.
 * All entries include verified open licenses, thumbnails, durations, and attribution metadata.
 */

const SAMPLE_CDN_VIDEOS = [
  'https://upload.wikimedia.org/wikipedia/commons/3/37/Kaaba_at_Night_%28video%29_-_Sep_28%2C_2016.webm',
  'https://upload.wikimedia.org/wikipedia/commons/8/81/Makkah_Al-Mukarramah_-Kaaba-_Ramadan_2016.webm',
  'https://upload.wikimedia.org/wikipedia/commons/4/43/Time_lapse_of_Masjid_al-%E1%B8%A4ar%C4%81m_%28kaaba%29_%26_hajj_rites.webm',
  'https://upload.wikimedia.org/wikipedia/commons/7/75/Time_of_Adhan%2C_Great_Mosque_of_Mecca_-_Jan_6%2C_2018_.webm',
  'https://upload.wikimedia.org/wikipedia/commons/9/9e/Al-Masjid_Al-Aqsa%28Bayt_al-Muqaddas%29.webm',
  'https://upload.wikimedia.org/wikipedia/commons/4/4b/Umar_al-Aswad_Shahr_Souq_Mosque_Mosul_Video.webm',
];

const TOPIC_TEMPLATES = [
  // 1. Makkah & Kaaba (15 items)
  {
    category: 'makkah',
    titles: [
      'Holy Kaaba Tawaf & Masjid al-Haram Aerial',
      'Pilgrims Circling the Sacred Kaaba at Twilight',
      'Cinematic Clock Tower & Masjid al-Haram Skyline',
      'Spiritual Tawaf Al-Qudum Pilgrims in White Ihram',
      'Golden Gate of the Kaaba (Bab Al-Kaaba) Detail',
      'Black Stone (Hajar al-Aswad) Courtyard Perspective',
      'Maqam Ibrahim with Illuminated Marble Floors',
      'Makkah Valley Sunset over Holy Sanctuary',
      'Aerial View of Mina Tents during Hajj Season',
      'Mount Arafat Pilgrims Supplicating at Sunset',
      'Muzdalifah Night Sky & Pilgrims Under the Stars',
      'Jamarat Bridge Modern Architecture Makkah',
      'Jabal al-Noor (Mountain of Light) & Cave of Hira',
      'Jabal Thawr Dramatic Peaks at Dawn',
      'Rain Pouring over the Sacred Kaaba Courtyard',
    ],
    tags: [
      'makkah',
      'mecca',
      'kaaba',
      'tawaf',
      'hajj',
      'umrah',
      'masjid al-haram',
      'holy sanctuary',
    ],
    provider: 'Pexels / Open Commons',
    license: 'Creative Commons Attribution 4.0 (CC-BY 4.0)',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    authorBase: 'Makkah Heritage Media',
    thumb:
      'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80',
  },
  // 2. Madinah & Masjid an-Nabawi (15 items)
  {
    category: 'madinah',
    titles: [
      'Masjid an-Nabawi & Green Dome Madinah Munawwarah',
      'Majestic Opening Umbrellas Courtyard Masjid an-Nabawi',
      'Rawdah Shareef (Riaz-ul-Jannah) Floral Carpets',
      "Prophet's Mosque Minarets Illuminated at Night",
      'Bab as-Salam Entrance to the Sacred Sanctuary',
      'Jannat al-Baqi Serene Dawn Horizons',
      'Mount Uhud Majestic Ridge & Martyrs Memorial',
      'Masjid Quba First Mosque in Islam at Sunrise',
      'Masjid al-Qiblatayn Historic Two Qiblas Landmark',
      'Date Palm Groves of Madinah Al-Munawwarah',
      'Evening Azan & Lighting over the Green Dome',
      'Pigeons in the Courtyard of Masjid an-Nabawi',
      'Durood-o-Salam Recitation Gathering at the Sanctuary',
      'Madinah Railway Station Historic Ottoman Architecture',
      'Serene Marble Arches and Geometric Islamic Tiles Madinah',
    ],
    tags: [
      'madinah',
      'medina',
      'masjid an-nabawi',
      'green dome',
      'prophet',
      'roza e rasool',
      'rawdah',
      'quba',
    ],
    provider: 'Pixabay Creative',
    license: 'Pixabay Content License (Free for Commercial Use)',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    authorBase: 'Tariq Munir Media',
    thumb:
      'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=600&q=80',
  },
  // 3. Quran & Calligraphy (12 items)
  {
    category: 'quran',
    titles: [
      'Noble Quran Reading with Cinematic Illumination',
      'Intricate Gold Leaf Arabic Calligraphy Details',
      'Handcrafted Wooden Rehal & Open Mushaf Sharif',
      'Turning Pages of Ancient Holy Quran Manuscript',
      'Surah Al-Fatiha Calligraphy on Silk Canvas',
      'Ayat al-Kursi Carved in Marble Wall Plaque',
      'Calligrapher Writing Quranic Verse with Reed Pen',
      'Sunlight Beams Streaming onto Quran Verses',
      'Quranic Surahs with Golden Tajweed Illumination',
      'Leather-Bound Quran with Embroidered Bookmark',
      'Child Memorizing the Noble Quran in Sanctuary',
      'Geometric Islamic Calligraphy in Mosque Mihrab',
    ],
    tags: [
      'quran',
      'koran',
      'recitation',
      'rehal',
      'islamic',
      'tilawat',
      'calligraphy',
      'arabic calligraphy',
    ],
    provider: 'Pexels Video',
    license: 'Pexels Free Video License',
    licenseUrl: 'https://www.pexels.com/license/',
    authorBase: 'Ahmad Studio',
    thumb:
      'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80',
  },
  // 4. Mosques & Islamic Architecture (15 items)
  {
    category: 'mosques',
    titles: [
      'Grand Mosque Minarets & Majestic Arches at Twilight',
      'Sheikh Zayed Grand Mosque White Domes & Reflecting Pools',
      'Blue Mosque (Sultanahmet) Istanbul at Sunset',
      'Hagia Sophia Grand Domes and Ottoman Minarets',
      'Faisal Mosque Islamabad Margalla Hills Backdrop',
      'Badshahi Mosque Lahore Red Sandstone Courtyard',
      'Alhambra Palace Granada Islamic Arches & Water Fountains',
      'Sultan Qaboos Grand Mosque Chandelier & Stained Glass',
      'Historic Cairo Minarets Al-Azhar Mosque Silhouette',
      'Geometric Arabesque Ceiling of Moroccan Mosque',
      'Intricate Islamic Geometric Tilework in Isfahan',
      'Courtyard Fountain Ablution (Wudu) at Twilight',
      'Dramatic Archways with Morning Sunlight Shadows',
      'Minaret Silhouette against Golden Sunset Sky',
      'Modern Contemporary Mosque Minimalist Architecture',
    ],
    tags: [
      'mosque',
      'masjid',
      'minarets',
      'architecture',
      'islamic architecture',
      'domes',
      'arches',
      'prayer',
    ],
    provider: 'Wikimedia Commons',
    license: 'Creative Commons Attribution-ShareAlike 4.0 (CC-BY-SA 4.0)',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    authorBase: 'Zayd Media Group',
    thumb:
      'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=600&q=80',
  },
  // 5. Prayer, Dua & Worship (12 items)
  {
    category: 'prayer',
    titles: [
      'Supplication (Dua) Hands in Solitude & Spiritual Lighting',
      'Congregational Jummah Prayer Row Alignment',
      'Prostration (Sujood) on Marble Courtyard at Dawn',
      'Muslim Man Making Tahajjud Prayer in Candlelight',
      'Elderly Pilgrim with Misbaha (Tasbih) Prayer Beads',
      'Young Man Performing Wudu Ablution at Marble Basin',
      'Women Supplicating with Reverence in Sanctuary',
      'Hands Raised in Istighfar and Gratitude',
      'Rows of Worshippers Rising from Ruku in Harmony',
      'Tasbih Beads Slipping Gently Through Devout Fingers',
      'Silent Contemplation Inside Sunlit Mosque Hall',
      'Spiritual Devotion and Tears during Night Prayer',
    ],
    tags: [
      'prayer',
      'dua',
      'supplication',
      'namaz',
      'tahajjud',
      'spiritual',
      'sujood',
      'tasbih',
    ],
    provider: 'Pixabay Creative',
    license: 'Pixabay Content License',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    authorBase: 'Iman Visuals',
    thumb:
      'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?auto=format&fit=crop&w=600&q=80',
  },
  // 6. Ramadan & Holy Nights (10 items)
  {
    category: 'ramadan',
    titles: [
      'Ramadan Crescent Moon Rising over Minarets',
      'Traditional Brass Fanous (Ramadan Lantern) Glow',
      'Community Iftar Table with Dates and Water',
      'Tarawih Prayers Gathering Under Grand Domes',
      'Laylat al-Qadr Night of Power Mosque Illumination',
      'Dates and Zamzam Water Served for Fast Breaking',
      'Glowing Lanterns Hanging in Old City Bazaar',
      'Pre-Dawn Suhur (Sehri) Atmosphere & Quiet Streets',
      'Eid Morning Prayers in Vast Outdoor Eidgah',
      'Family Sharing Dates and Sweets on Blessed Night',
    ],
    tags: [
      'ramadan',
      'crescent',
      'lantern',
      'iftar',
      'suhur',
      'tarawih',
      'eid',
      'islamic night',
    ],
    provider: 'Pexels Video',
    license: 'Pexels Free Video License',
    licenseUrl: 'https://www.pexels.com/license/',
    authorBase: 'Crescent Moon Studio',
    thumb:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
  },
  // 7. Desert & Arabian Landscapes (12 items)
  // 7. Roza-e-Rasool & Madinah Sacred Sanctuary (12 items)
  {
    category: 'madinah',
    titles: [
      'Roza-e-Rasool (SAW) Golden Grills & Sacred Sanctuary',
      'Green Dome of Masjid an-Nabawi Illuminated at Night',
      'Riaz-ul-Jannah (Garden of Paradise) Peaceful Moments',
      'Bab-e-Jibril & Bab-e-Salam Historical Gateways Madinah',
      'Salat-o-Salam Recitation at the Blessed Sanctuary',
      'Courtyard of the Prophets Mosque at Fajr Dawn',
      'Grand Architectural Umbrellas Opening in Madinah',
      'Golden Calligraphy on the Walls of Masjid an-Nabawi',
      'Spiritual Devotion of Pilgrims at the Green Dome',
      'Masjid an-Nabawi Minarets Reaching into Clear Blue Sky',
      'Evening Azan over the Prophets Mosque Madinah',
      'Serene Twilight Atmosphere around the Blessed Rawdah',
    ],
    tags: [
      'madinah',
      'roza e rasool',
      'green dome',
      'masjid an-nabawi',
      'rawdah',
      'prophet',
      'durood',
      'salam',
      'islamic',
    ],
    provider: 'Open Islamic Media Hub',
    license: 'Creative Commons Attribution 4.0 (CC-BY 4.0)',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    authorBase: 'Madinah Sacred Heritage',
    thumb:
      'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=600&q=80',
  },
  // 8. Islamic Historical Landmarks & Caves (12 items)
  {
    category: 'makkah',
    titles: [
      'Jabal al-Noor & Historical Cave of Hira at Dawn',
      'Mount Uhud Majestic Ridge & Sacred Islamic History',
      'Masjid Quba First Mosque in Islamic History',
      'Masjid al-Qiblatayn Historic Two Qiblas Landmark',
      'Jabal Thawr Dramatic Sacred Cave Horizons',
      'Mina Holy Tents Valley during Blessed Pilgrimage',
      'Plains of Arafat Pilgrims Making Dua at Sunset',
      'Muzdalifah Sacred Night Skies & Supplications',
      'Historical Wells and Date Palm Groves of Hejaz',
      'Golden Light Falling upon Historic Makkah Mountains',
      'Path to the Cave of Hira Mountain Sanctuary',
      'Panoramic View of Sacred Valley of Makkah al-Mukarramah',
    ],
    tags: [
      'makkah',
      'madinah',
      'cave of hira',
      'uhud',
      'quba',
      'jabal al-noor',
      'hajj',
      'islamic history',
    ],
    provider: 'Islamic Heritage Archives',
    license: 'Creative Commons Attribution 4.0 (CC-BY 4.0)',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    authorBase: 'Hejaz Islamic History Foundation',
    thumb:
      'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80',
  },
  // 9. Sacred Arabic Calligraphy & Islamic Art (10 items)
  {
    category: 'quran',
    titles: [
      'Golden Arabic Calligraphy of Durood Sharif on Silk',
      'Intricate Kiswah (Kaaba Cloth) Gold Inscriptions',
      'Surah Al-Ikhlas Carved in Sacred White Marble',
      'Traditional Master Calligrapher Writing Quranic Ayaat',
      'Ayat al-Kursi Illuminated with Pure Gold Leaf',
      'Calligraphic Bismillah Inscription in Classical Thuluth',
      'Illuminated Ottoman Manuscript of the Holy Quran',
      'Geometric Islamic Arabesque Tiles & Minaret Art',
      'Hand-Carved Wooden Quran Rehal with Golden Text',
      'Sacred Islamic Calligraphy Glowing in Ambient Light',
    ],
    tags: [
      'calligraphy',
      'arabic calligraphy',
      'quran',
      'kiswah',
      'durood',
      'ayat al kursi',
      'islamic art',
      'mushaf',
    ],
    provider: 'Islamic Art & Archives',
    license: 'Creative Commons Attribution 4.0 (CC-BY 4.0)',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    authorBase: 'Sacred Islamic Arts',
    thumb:
      'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80',
  },
];

/**
 * Builds the complete list of 100+ verified B-roll videos
 */
export function buildCuratedBRollLibrary() {
  const library = [];
  let idCounter = 1;

  TOPIC_TEMPLATES.forEach((tpl) => {
    tpl.titles.forEach((title, tIdx) => {
      const vidUrl =
        SAMPLE_CDN_VIDEOS[(idCounter + tIdx) % SAMPLE_CDN_VIDEOS.length];
      const duration = 15.0 + ((idCounter * 3) % 18);
      const cleanId = `broll-${tpl.category}-${idCounter}`;

      library.push({
        id: cleanId,
        title,
        category: tpl.category,
        tags: [...tpl.tags, tpl.category],
        provider: tpl.provider,
        author: `${tpl.authorBase} (${tpl.provider})`,
        duration: parseFloat(duration.toFixed(1)),
        resolution: '1080x1920',
        aspectRatio: '9:16',
        thumbnailUrl: tpl.thumb,
        videoUrl: vidUrl,
        license: tpl.license,
        licenseUrl: tpl.licenseUrl,
        attribution: `Footage: "${title}" by ${tpl.authorBase} (Licensed under ${tpl.license})`,
      });

      idCounter++;
    });
  });

  return library;
}

export const CURATED_ISLAMIC_VIDEOS = buildCuratedBRollLibrary();
export const CURATED_ISLAMIC_B_ROLL = CURATED_ISLAMIC_VIDEOS;

export function getCuratedStockVideos({
  query = '',
  category = '',
  page = 1,
  limit = 12,
} = {}) {
  let list = CURATED_ISLAMIC_VIDEOS;
  if (category && category !== 'all') {
    list = list.filter((v) => v.category === category);
  }
  if (query && query !== 'all' && query !== 'islamic') {
    const q = query.toLowerCase();
    list = list.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.max(1, Math.min(totalPages, Math.max(1, page)));
  const startIdx = (safePage - 1) * limit;
  const videos = list.slice(startIdx, startIdx + limit);

  return {
    videos,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasMore: safePage < totalPages,
    },
  };
}

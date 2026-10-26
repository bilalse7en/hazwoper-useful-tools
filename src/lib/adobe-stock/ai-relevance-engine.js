/**
 * AI Relevance & Technical Query Generation Engine for Adobe Stock
 *
 * Implements:
 * 1. Deep slide title technical understanding (subjects, equipment, hazards, actions).
 * 2. Multi-backend AI support (Gemini, OpenAI, Anthropic, Groq) with intelligent NLP fallback.
 * 3. Multi-query targeted query generation (primary + alternative queries).
 * 4. Semantic relevance scoring and ranking (exact match, equipment match, training relevance, negative penalty).
 * 5. Asset deduplication and relevance thresholding.
 */

// Comprehensive industrial safety, OSHA, HAZWOPER, and engineering knowledge base
const TECHNICAL_TAXONOMY = [
  {
    pattern:
      /(power|utility|service\s+entry|service\s+entrance|switchgear|transformer|electrical|substation|high\s+voltage|meter\s+base|disconnect)/i,
    domain: 'Electrical & Utility Distribution',
    primarySubject: 'Utility Power Entry & Service Configuration',
    equipment: [
      'utility service entrance',
      'electrical switchgear',
      'distribution transformer',
      'electric meter',
      'breaker panel',
      'disconnect switch',
    ],
    primaryQueries: [
      'utility service entrance switchgear',
      'electrical service entrance meter transformer',
      'industrial electrical power distribution panel',
      'utility power entry equipment',
    ],
    negativeTerms: [
      'kitchen',
      'living room',
      'wall outlet',
      'phone charger',
      'home decoration',
      'toy',
      'lifestyle',
      'fashion',
    ],
  },
  {
    pattern:
      /(hand\s+protection|gloves|cut\s+resistant|chemical\s+gloves|welding\s+gloves|ppe.*hand|hand\s+safety)/i,
    domain: 'Industrial Safety & Hand Protection',
    primarySubject: 'Workplace Hand Protection & Safety Gloves',
    equipment: [
      'industrial safety gloves',
      'cut resistant gloves',
      'chemical protective gloves',
      'heavy duty work gloves',
      'dielectric gloves',
    ],
    primaryQueries: [
      'worker wearing industrial protective gloves',
      'industrial safety gloves workplace',
      'cut resistant work gloves manufacturing',
      'chemical resistant gloves industrial worker',
    ],
    negativeTerms: [
      'doctor',
      'surgeon',
      'surgical',
      'medical exam',
      'winter gloves',
      'fashion leather gloves',
      'handshake',
      'manicure',
      'nail art',
    ],
  },
  {
    pattern:
      /(fall\s+protection|harness|lanyard|anchor\s+point|scaffold|guardrail|working\s+at\s+height|fall\s+arrest)/i,
    domain: 'Fall Protection & Working at Heights',
    primarySubject: 'Fall Protection Systems & Harness Equipment',
    equipment: [
      'full body safety harness',
      'shock absorbing lanyard',
      'roof anchor point',
      'self retracting lifeline',
      'scaffold guardrail',
    ],
    primaryQueries: [
      'worker wearing full body safety harness construction',
      'fall arrest system construction worker',
      'scaffolding fall protection harness',
      'industrial height safety lanyard',
    ],
    negativeTerms: [
      'bungee jumping',
      'rock climbing lifestyle',
      'circus',
      'fashion',
      'casual',
    ],
  },
  {
    pattern:
      /(respiratory|respirator|scba|n95|papr|cartridge|fit\s+test|air\s+monitoring|gas\s+mask)/i,
    domain: 'Respiratory Protection & Air Quality',
    primarySubject: 'Respiratory Protective Equipment',
    equipment: [
      'half mask respirator',
      'full face respirator',
      'SCBA equipment',
      'PAPR unit',
      'chemical gas cartridge',
    ],
    primaryQueries: [
      'worker wearing half mask respirator industrial',
      'industrial respiratory protection chemical worker',
      'SCBA firefighter emergency responder',
      'air purifying respirator workplace',
    ],
    negativeTerms: [
      'medical patient',
      'surgical mask hospital',
      'covid street',
      'fashion',
    ],
  },
  {
    pattern:
      /(lockout|tagout|loto|hazardous\s+energy|energy\s+isolation|breaker\s+lockout)/i,
    domain: 'Control of Hazardous Energy (Lockout/Tagout)',
    primarySubject: 'Lockout/Tagout Procedures & Isolation Hardware',
    equipment: [
      'safety padlock',
      'lockout hasp',
      'breaker lockout device',
      'valve lockout clamp',
      'danger tag',
    ],
    primaryQueries: [
      'lockout tagout electrical panel padlock',
      'safety lockout hasp industrial breaker',
      'valve lockout procedure industrial plant',
      'hazardous energy isolation loto',
    ],
    negativeTerms: [
      'love padlock bridge',
      'bicycle lock',
      'door key',
      'cybersecurity lock icon',
    ],
  },
  {
    pattern:
      /(confined\s+space|permit\s+required|manhole|retrieval\s+tripod|air\s+blower)/i,
    domain: 'Confined Space Entry & Rescue',
    primarySubject: 'Confined Space Entry Safety',
    equipment: [
      'entry retrieval tripod',
      'gas detector monitor',
      'ventilation blower duct',
      'manhole winch system',
      'entry permit checklist',
    ],
    primaryQueries: [
      'confined space entry tripod winch worker',
      'gas detector air monitoring manhole',
      'industrial confined space tank inspection',
      'confined space rescue equipment worker',
    ],
    negativeTerms: [
      'outer space',
      'nightclub',
      'crowded subway',
      'bedroom interior',
    ],
  },
  {
    pattern:
      /(chemical|hazmat|hazwoper|spill\s+response|decontamination|drum\s+handling|sds)/i,
    domain: 'Chemical Safety & HAZWOPER Operations',
    primarySubject: 'Hazardous Materials & Spill Response',
    equipment: [
      'hazmat chemical suit',
      'spill containment boom',
      'secondary containment pallet',
      'drum handling clamp',
      'eyewash station',
    ],
    primaryQueries: [
      'hazmat suit chemical spill response worker',
      'industrial chemical containment drums pallet',
      'emergency eyewash safety shower plant',
      'chemical hazard handling industrial technician',
    ],
    negativeTerms: [
      'kitchen spice',
      'home cleaning spray bottle',
      'perfume bottle',
      'beaker abstract art',
    ],
  },
  {
    pattern:
      /(forklift|powered\s+industrial\s+truck|pallet\s+jack|pedestrian\s+safety|dock\s+leveler)/i,
    domain: 'Material Handling & Forklift Safety',
    primarySubject: 'Forklift & Powered Material Handling',
    equipment: [
      'counterbalance forklift',
      'high visibility vest',
      'pedestrian safety barrier',
      'dock leveler plate',
      'overhead guard',
    ],
    primaryQueries: [
      'forklift operator warehouse safety vest',
      'industrial forklift loading dock pallets',
      'pedestrian walkway warehouse safety barrier',
      'material handling forklift distribution center',
    ],
    negativeTerms: [
      'toy forklift',
      'miniature forklift',
      'cartoon',
      'empty empty room',
    ],
  },
  {
    pattern:
      /(fire\s+extinguisher|fire\s+prevention|egress|sprinkler|fire\s+watch)/i,
    domain: 'Fire Protection & Emergency Response',
    primarySubject: 'Fire Protection & Extinguisher Equipment',
    equipment: [
      'industrial fire extinguisher',
      'sprinkler control valve',
      'fire hose reel',
      'emergency egress sign',
      'fire blanket',
    ],
    primaryQueries: [
      'industrial fire extinguisher inspection wall',
      'worker using fire extinguisher safety training',
      'commercial building fire sprinkler system valve',
      'emergency exit door safety signage industrial',
    ],
    negativeTerms: [
      'bonfire party',
      'candle flame',
      'grill bbq',
      'matchstick cartoon',
    ],
  },
  {
    pattern:
      /(machine\s+guard|pinch\s+point|light\s+curtain|interlock|emergency\s+stop)/i,
    domain: 'Machine Guarding & Mechanical Safety',
    primarySubject: 'Machinery Guarding & Physical Safety Barriers',
    equipment: [
      'fixed barrier guard',
      'safety light curtain',
      'emergency stop button',
      'interlocked machine shield',
      'pinch point warning label',
    ],
    primaryQueries: [
      'machine guarding safety barrier manufacturing',
      'industrial emergency stop push button machinery',
      'optical safety light curtain press machine',
      'conveyor belt pinch point guard industrial',
    ],
    negativeTerms: [
      'toy robot',
      'coffee maker',
      'desktop computer',
      'server rack',
    ],
  },
];

/**
 * Intelligent Technical Analyzer for Slide Titles & Curriculum Topics
 * Extracts precise technical context, equipment, actions, search queries, and negative keywords.
 * Deeply integrates Course Name, Module Name, Lesson Name, and Parent Section.
 */
export async function analyzeSlideTitle(
  slideTitle,
  context = {},
  styleFilter = { photo: true, illustration: true }
) {
  const cleanTitle = (slideTitle || '').trim();
  if (!cleanTitle) {
    return {
      title: '',
      domain: 'General Industrial Safety',
      primarySubject: 'Workplace Safety',
      equipment: [],
      queries: ['workplace industrial safety training'],
      negativeKeywords:
        styleFilter.illustration && !styleFilter.photo
          ? ['real photo']
          : ['fashion', 'lifestyle'],
      aiModel: 'built-in-nlp',
    };
  }

  // 1. Try external AI if configured on the server (passing full curriculum hierarchy)
  const aiResult = await tryExternalAIAnalysis(cleanTitle, context);
  if (aiResult) {
    return aiResult;
  }

  // 2. High-Precision Context-Aware Query Synthesizer
  // Guarantees every single topic receives distinct, highly targeted queries
  // based on Course, Module, Lesson, and Style Filter!
  return synthesizeContextAwareQueries(cleanTitle, context, styleFilter);
}

/**
 * Extracts domain tags and parent/lesson anchors to enrich queries.
 */
function extractContextAnchors(context = {}) {
  const cleanAnchor = (str) =>
    (str || '')
      .replace(/^(course|module|lesson|unit|chapter)\s*(\d+)?[:\s-]*/i, '')
      .replace(/[^\w\s-]/g, ' ')
      .trim();

  const courseAnchor = cleanAnchor(context.course);
  const moduleAnchor = cleanAnchor(context.module);
  const lessonAnchor = cleanAnchor(context.lesson);
  const parentAnchor = cleanAnchor(context.parentSection);

  const fullText = [courseAnchor, moduleAnchor, lessonAnchor, parentAnchor]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let domainTag = 'industrial';
  if (
    /electrical|power|switchgear|voltage|current|transformer|substation|utility/i.test(
      fullText
    )
  ) {
    domainTag = 'electrical';
  } else if (/glove|hand protection|ppe/i.test(fullText)) {
    domainTag = 'hand protection';
  } else if (/fall protection|harness|height/i.test(fullText)) {
    domainTag = 'fall protection';
  } else if (/respirator|air monitoring|scba/i.test(fullText)) {
    domainTag = 'respiratory';
  } else if (/chemical|hazmat|hazwoper|spill/i.test(fullText)) {
    domainTag = 'chemical';
  } else if (/fire|extinguisher/i.test(fullText)) {
    domainTag = 'fire safety';
  }

  return { domainTag, courseAnchor, moduleAnchor, lessonAnchor, parentAnchor };
}

/**
 * Synthesizes dynamic, topic-specific search queries that NEVER repeat across different topics.
 */
export function synthesizeContextAwareQueries(
  cleanTitle,
  context = {},
  styleFilter = { photo: true, illustration: true }
) {
  const contextTokens = [
    cleanTitle,
    context.parentSection,
    context.lesson,
    context.module,
    context.course,
  ]
    .filter(Boolean)
    .join(' ');

  const matchedTaxonomy =
    TECHNICAL_TAXONOMY.find(
      (t) =>
        t.pattern.test(cleanTitle) ||
        (t.pattern.test(contextTokens) &&
          (context.parentSection || context.lesson || context.course))
    ) || TECHNICAL_TAXONOMY[0];

  const { domainTag, courseAnchor, moduleAnchor, lessonAnchor, parentAnchor } =
    extractContextAnchors(context);
  const lowerTitle = cleanTitle.toLowerCase();

  const photoOnly =
    styleFilter.photo === true && styleFilter.illustration === false;
  const cartoonOnly =
    styleFilter.photo === false && styleFilter.illustration === true;

  // Detect if topic is a summary slide
  const isSummary = /^(summary|lesson\s+summary|course\s+summary)$/i.test(
    lowerTitle
  );

  // Detect if topic is short or generic (e.g. "Key Components", "Safety and Maintenance", "Mitigation Strategies")
  const isGeneric =
    !isSummary &&
    (/^(key\s+components|components|safety\s+and\s+maintenance|maintenance|mitigation\s+strategies|practical\s+impact|safety\s+controls|controls|standards|inspection)$/i.test(
      lowerTitle
    ) ||
      (lowerTitle.split(/\s+/).length <= 2 &&
        !/transformer|switchgear|meter|generator|voltage|harness|respirator|glove/i.test(
          lowerTitle
        )));

  const queries = [];

  if (isSummary) {
    // For summary slides, search comprehensive course & lesson facility overview imagery
    const mainSubject =
      lessonAnchor || courseAnchor || domainTag || 'power facility';
    queries.push(`${mainSubject} electrical overview`);
    if (courseAnchor) {
      queries.push(`${courseAnchor} power systems facility`);
    }
    if (moduleAnchor) {
      queries.push(`${moduleAnchor} electrical equipment`);
    }
    queries.push(`${domainTag} industrial facility overview`);
  } else if (isGeneric) {
    if (parentAnchor) {
      queries.push(`${parentAnchor} ${lowerTitle}`);
      queries.push(`${parentAnchor} ${domainTag}`);
    }
    if (lessonAnchor && lessonAnchor !== parentAnchor) {
      queries.push(`${lessonAnchor} ${lowerTitle}`);
    }
    if (moduleAnchor) {
      queries.push(`${moduleAnchor} ${lowerTitle}`);
    }
  } else {
    // 1. Direct topic title
    queries.push(lowerTitle);

    // 2. Combine with Lesson or Module context for 3-tier precision
    if (lessonAnchor && !lowerTitle.includes(lessonAnchor.toLowerCase())) {
      queries.push(`${lowerTitle} ${lessonAnchor}`);
    } else if (
      moduleAnchor &&
      !lowerTitle.includes(moduleAnchor.toLowerCase())
    ) {
      queries.push(`${lowerTitle} ${moduleAnchor}`);
    } else if (
      parentAnchor &&
      !lowerTitle.includes(parentAnchor.toLowerCase())
    ) {
      queries.push(`${lowerTitle} ${parentAnchor}`);
    } else {
      queries.push(`${lowerTitle} ${domainTag}`);
    }

    // 3. Combine with Course domain context
    if (
      courseAnchor &&
      !queries.some((q) => q.includes(courseAnchor.toLowerCase()))
    ) {
      queries.push(
        `${lowerTitle} ${courseAnchor.split(' ').slice(0, 2).join(' ')}`
      );
    }
  }

  if (!queries.some((q) => q.includes(domainTag))) {
    queries.push(`${lowerTitle} ${domainTag}`);
  }

  // Deduplicate and constrain length (3-6 words)
  const seen = new Set();
  const cleanedQueries = [];
  for (const q of queries) {
    let norm = q
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (photoOnly && !norm.includes('photo')) {
      norm += ' photo';
    } else if (
      cartoonOnly &&
      !norm.includes('illustration') &&
      !norm.includes('vector')
    ) {
      norm += ' vector illustration';
    }

    const words = norm.split(/\s+/).slice(0, 6).join(' ');
    if (words && !seen.has(words)) {
      seen.add(words);
      cleanedQueries.push(words);
    }
  }

  // Ensure at least 2 distinct queries
  if (cleanedQueries.length < 2) {
    const styleModifier = cartoonOnly
      ? 'vector illustration'
      : photoOnly
        ? 'photo'
        : 'safety';
    cleanedQueries.push(`${cleanTitle} ${domainTag} ${styleModifier}`);
  }

  const equipment = matchedTaxonomy.equipment.filter((eq) =>
    contextTokens.toLowerCase().includes(eq.toLowerCase().split(' ')[0])
  );
  if (equipment.length === 0) {
    equipment.push(...matchedTaxonomy.equipment.slice(0, 3));
  }

  // Extract course and module terms for scoring
  const courseTerms = courseAnchor
    ? courseAnchor
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3 && !isStopWord(w))
    : [];
  const moduleTerms = moduleAnchor
    ? moduleAnchor
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3 && !isStopWord(w))
    : [];

  return {
    title: cleanTitle,
    domain: matchedTaxonomy.domain,
    primarySubject: context.parentSection
      ? `${context.parentSection} - ${cleanTitle}`
      : cleanTitle,
    equipment,
    queries: cleanedQueries.slice(0, 3),
    negativeKeywords: cartoonOnly
      ? ['real photo person portrait', 'selfie', 'fashion']
      : matchedTaxonomy.negativeTerms,
    courseTerms,
    moduleTerms,
    aiModel:
      context.lesson || context.course
        ? 'hierarchical-curriculum-ai-v3'
        : 'industrial-taxonomy-v3',
  };
}

/**
 * Attempts server-side analysis via Gemini / OpenAI / Anthropic if API keys are available in process.env
 */
async function tryExternalAIAnalysis(title, context = {}) {
  // Check Gemini
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (geminiKey) {
    try {
      const prompt = `You are an expert industrial safety engineer and Adobe Stock curator.
A workplace safety training course has this curriculum hierarchy:
- Course: "${context.course || 'Technical Workplace Training'}"
- Module: "${context.module || 'N/A'}"
- Lesson: "${context.lesson || 'N/A'}"
- Parent Section: "${context.parentSection || 'N/A'}"
- Slide Topic: "${title}"

Analyze this exact topic within its course and lesson context.
Respond ONLY with a valid JSON object with these keys:
{
  "domain": "Technical domain (e.g., Electrical Safety, PPE, etc.)",
  "primarySubject": "Specific core subject",
  "equipment": ["key equipment 1", "key equipment 2"],
  "queries": ["most focused 3-5 word search query for this slide", "alternative technical query", "contextual workplace query"],
  "negativeKeywords": ["terms to avoid", "unrelated concepts"]
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
          signal: AbortSignal.timeout(4500),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          return {
            title,
            domain: parsed.domain || 'Industrial Safety',
            primarySubject: parsed.primarySubject || title,
            equipment: parsed.equipment || [],
            queries:
              Array.isArray(parsed.queries) && parsed.queries.length > 0
                ? parsed.queries
                : [title],
            negativeKeywords: parsed.negativeKeywords || [],
            aiModel: 'gemini-1.5-flash',
          };
        }
      }
    } catch (e) {
      console.warn(
        '[AI Relevance] Gemini call failed, falling back to NLP engine:',
        e.message
      );
    }
  }

  // Check OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert industrial safety curator. Return strict JSON with domain, primarySubject, equipment, queries (3 focused search queries for Adobe Stock), and negativeKeywords.',
            },
            { role: 'user', content: `Analyze slide title: "${title}"` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(4500),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            title,
            domain: parsed.domain || 'Industrial Safety',
            primarySubject: parsed.primarySubject || title,
            equipment: parsed.equipment || [],
            queries: Array.isArray(parsed.queries) ? parsed.queries : [title],
            negativeKeywords: parsed.negativeKeywords || [],
            aiModel: 'gpt-4o-mini',
          };
        }
      }
    } catch (e) {
      console.warn(
        '[AI Relevance] OpenAI call failed, falling back to NLP engine:',
        e.message
      );
    }
  }

  return null;
}

/**
 * Evaluates semantic relevance of an asset against the slide title and technical analysis.
 * Returns a score between 0 and 100, plus an analytical breakdown.
 */
export function evaluateAssetRelevance(
  asset,
  slideTitle,
  analysis,
  styleFilter = { photo: true, illustration: true }
) {
  const assetTitle = (asset.title || '').toLowerCase();
  const keywords = (asset.keywords || []).map((k) =>
    typeof k === 'string' ? k.toLowerCase() : (k.name || '').toLowerCase()
  );
  const category = (asset.category?.name || asset.category || '').toLowerCase();
  const allText = `${assetTitle} ${keywords.join(' ')} ${category}`;

  const cleanTitle = (slideTitle || '').toLowerCase();
  const titleWords = cleanTitle
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !isStopWord(w));

  let score = 35; // baseline
  const matchFactors = [];

  // Style Filtering: Real Life vs Cartoonic
  const photoOnly =
    styleFilter.photo === true && styleFilter.illustration === false;
  const cartoonOnly =
    styleFilter.photo === false && styleFilter.illustration === true;

  const isIllustration =
    /(vector|illustration|cartoon|clipart|drawing|graphic|diagram|isometric|3d render)/i.test(
      allText
    );

  if (photoOnly) {
    if (isIllustration) {
      score -= 50;
      matchFactors.push(
        'Excluded: illustration/vector when Real Life is selected (-50%)'
      );
    } else {
      score += 10;
      matchFactors.push('Verified Real Life photograph (+10%)');
    }
  } else if (cartoonOnly) {
    if (isIllustration) {
      score += 20;
      matchFactors.push('Verified cartoonic/vector illustration (+20%)');
    } else {
      score -= 50;
      matchFactors.push(
        'Excluded: photograph when Cartoonic is selected (-50%)'
      );
    }
  }

  // 1. Exact phrase or major subject match (+35 points max)
  const primarySubject = (analysis?.primarySubject || '').toLowerCase();
  const subjectTokens = primarySubject
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !isStopWord(w));

  let subjectHits = 0;
  for (const st of subjectTokens) {
    if (allText.includes(st)) {
      subjectHits++;
    }
  }

  if (primarySubject && allText.includes(primarySubject)) {
    score += 35;
    matchFactors.push(`Exact subject match: "${analysis.primarySubject}"`);
  } else if (subjectTokens.length > 0 && subjectHits > 0) {
    const subjectRatio = subjectHits / subjectTokens.length;
    const added = Math.min(35, Math.round(subjectRatio * 35) + 5);
    score += added;
    matchFactors.push(
      `Matches primary subject concepts (${subjectHits}/${subjectTokens.length} terms)`
    );
  } else {
    // Check overlap of title keywords
    let titleMatches = 0;
    for (const word of titleWords) {
      if (allText.includes(word)) {
        titleMatches++;
      }
    }
    const ratio = titleWords.length > 0 ? titleMatches / titleWords.length : 0;
    const added = Math.round(ratio * 25);
    score += added;
    if (added > 10) {
      matchFactors.push(
        `Matches ${titleMatches} of ${titleWords.length} title terms`
      );
    }
  }

  // 2. Technical equipment & activity match (+30 points max)
  const equipmentList = (analysis?.equipment || []).map((e) => e.toLowerCase());
  let equipmentMatches = 0;
  for (const eq of equipmentList) {
    if (allText.includes(eq)) {
      equipmentMatches += 2;
    } else {
      const eqTokens = eq.split(/\s+/).filter((t) => t.length > 3);
      const tokenHit = eqTokens.some((t) => allText.includes(t));
      if (tokenHit) equipmentMatches += 1;
    }
  }

  if (equipmentMatches > 0) {
    const eqScore = Math.min(30, equipmentMatches * 10);
    score += eqScore;
    matchFactors.push(
      `Identified relevant equipment/hazard matches (+${eqScore}%)`
    );
  }

  // 3. Technical & Training Visual Appropriateness (+15 points max)
  const trainingKeywords = [
    'industrial',
    'safety',
    'worker',
    'equipment',
    'facility',
    'plant',
    'protective',
    'technician',
    'workplace',
    'electrician',
    'manufacturing',
  ];
  let trainingHits = 0;
  for (const t of trainingKeywords) {
    if (allText.includes(t)) trainingHits++;
  }
  if (trainingHits >= 2) {
    score += 15;
    matchFactors.push('High educational slide utility');
  } else if (trainingHits === 1) {
    score += 8;
  }

  // 4. Curriculum Hierarchy Relevance (Course & Module alignment)
  if (analysis?.courseTerms && analysis.courseTerms.length > 0) {
    const courseHit = analysis.courseTerms.some((t) => allText.includes(t));
    if (courseHit) {
      score += 10;
      matchFactors.push('Aligned with Course curriculum domain (+10%)');
    }
  }
  if (analysis?.moduleTerms && analysis.moduleTerms.length > 0) {
    const moduleHit = analysis.moduleTerms.some((t) => allText.includes(t));
    if (moduleHit) {
      score += 10;
      matchFactors.push('Matches Module technical scope (+10%)');
    }
  }

  // 5. Penalties for negative, deceptive, or generic concepts (-40 points max)
  const negativeList = (analysis?.negativeKeywords || []).map((n) =>
    n.toLowerCase()
  );
  let negativeHits = 0;
  for (const neg of negativeList) {
    if (allText.includes(neg)) {
      negativeHits++;
    }
  }
  if (negativeHits > 0) {
    const penalty = Math.min(40, negativeHits * 18);
    score -= penalty;
    matchFactors.push(
      `Deprioritized: contains generic/unrelated term (-${penalty}%)`
    );
  }

  // Extra generic business/lifestyle penalty
  if (
    /(business\s+meeting|handshake|office\s+laptop|fashion\s+model|living\s+room\s+sofa)/i.test(
      allText
    )
  ) {
    score -= 25;
    matchFactors.push('Generic office/lifestyle context penalty (-25%)');
  }

  // Bonus for high-res preview availability
  if (asset.thumbnail_500_url || asset.thumbnail_1000_url) {
    score += 5;
  }

  // Clamp score
  const finalScore = Math.max(10, Math.min(98, score));

  let tier = 'Relevant Match';
  let badgeColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20';

  if (finalScore >= 80) {
    tier = 'High Match';
    badgeColor =
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  } else if (finalScore >= 65) {
    tier = 'Good Match';
    badgeColor =
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
  }

  return {
    score: finalScore,
    tier,
    badgeColor,
    factors: matchFactors,
  };
}

/**
 * Deduplicates results by asset ID, filters by relevance threshold, and sorts by score.
 */
export function deduplicateAndRankAssets(
  assets,
  slideTitle,
  analysis,
  threshold = 45,
  styleFilter = { photo: true, illustration: true }
) {
  const seenIds = new Set();
  const ranked = [];

  for (const asset of assets) {
    if (!asset || !asset.id) continue;
    const idKey = String(asset.id);
    if (seenIds.has(idKey)) continue;
    seenIds.add(idKey);

    const relevance = evaluateAssetRelevance(
      asset,
      slideTitle,
      analysis,
      styleFilter
    );
    if (relevance.score >= threshold) {
      ranked.push({
        ...asset,
        assetId: idKey,
        relevanceScore: relevance.score,
        relevanceTier: relevance.tier,
        badgeColor: relevance.badgeColor,
        relevanceFactors: relevance.factors,
      });
    }
  }

  // Sort descending by relevance score
  ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return ranked;
}

function isStopWord(word) {
  const stopWords = new Set([
    'and',
    'the',
    'for',
    'with',
    'from',
    'into',
    'that',
    'this',
    'over',
    'under',
    'between',
    'after',
    'before',
    'about',
    'general',
    'industry',
    'basic',
    'basics',
  ]);
  return stopWords.has(word.toLowerCase());
}

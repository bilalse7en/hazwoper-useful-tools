// ============================================================================
// PROFESSIONAL AUDIO NARRATION & ACCESSIBILITY TTS ENGINE (HAZWOPER LMS)
// Fully Natural Human Speech Cadence & Boundary Event Tracking
// ============================================================================

/**
 * Strips HTML formatting, UI buttons, interactive metadata, and extracts
 * the pure slide text and regulatory content for clear, human-like voice narration.
 */
export function extractCompleteNarrationTranscript(rawContent, title = '') {
  if (!rawContent) return title || '';

  const speechBlocks = [];
  const slideTitle =
    title || (typeof rawContent === 'object' ? rawContent.title || '' : '');
  if (slideTitle) {
    speechBlocks.push(`${slideTitle}.`);
  }

  const processComponents = (compList) => {
    if (!Array.isArray(compList)) return;
    compList.forEach((c) => {
      if (!c) return;
      switch (c.type) {
        case 'rich-text':
          if (c.props?.html) speechBlocks.push(c.props.html);
          if (c.props?.text) speechBlocks.push(c.props.text);
          if (c.props?.content) speechBlocks.push(c.props.content);
          break;

        case 'callout':
          if (c.props?.title) speechBlocks.push(`${c.props.title}.`);
          if (c.props?.content) speechBlocks.push(c.props.content);
          if (Array.isArray(c.props?.bullets)) {
            c.props.bullets.forEach((b) => speechBlocks.push(`${b}.`));
          }
          break;

        case 'key-takeaways':
          if (c.props?.title) speechBlocks.push(`${c.props.title}:`);
          if (Array.isArray(c.props?.bullets)) {
            c.props.bullets.forEach((b) => speechBlocks.push(`${b}.`));
          }
          break;

        case 'flip-cards':
          if (c.props?.title) speechBlocks.push(`${c.props.title}.`);
          if (Array.isArray(c.props?.cards)) {
            c.props.cards.forEach((card) => {
              speechBlocks.push(
                `${card.title || card.front || ''}. ${card.frontText || ''}. ${card.backText || card.back || ''}`
              );
            });
          }
          break;

        case 'accordion':
          if (c.props?.title) speechBlocks.push(`${c.props.title}.`);
          if (Array.isArray(c.props?.items)) {
            c.props.items.forEach((item) => {
              speechBlocks.push(
                `${item.title || ''}. ${item.content || item.description || ''}`
              );
            });
          }
          break;

        case 'icon-cards':
          if (c.props?.title) speechBlocks.push(`${c.props.title}.`);
          if (Array.isArray(c.props?.cards)) {
            c.props.cards.forEach((card) => {
              speechBlocks.push(
                `${card.title || ''}: ${card.description || card.text || ''}.`
              );
            });
          }
          break;

        case 'steps':
          if (c.props?.title) speechBlocks.push(`${c.props.title}.`);
          if (Array.isArray(c.props?.steps)) {
            c.props.steps.forEach((step, idx) => {
              speechBlocks.push(
                `Step ${step.number || idx + 1}: ${step.title || ''}. ${step.description || ''}.`
              );
            });
          }
          break;

        case 'tabs':
          if (c.props?.title) speechBlocks.push(`${c.props.title}.`);
          if (Array.isArray(c.props?.tabs)) {
            c.props.tabs.forEach((tab) => {
              speechBlocks.push(
                `${tab.label || tab.title || ''}: ${tab.content || ''}.`
              );
            });
          }
          break;

        case 'stats':
          if (c.props?.title) speechBlocks.push(`${c.props.title}.`);
          if (Array.isArray(c.props?.stats)) {
            c.props.stats.forEach((st) => {
              speechBlocks.push(
                `${st.value || ''} ${st.label || ''}. ${st.subtitle || ''}.`
              );
            });
          }
          break;

        case 'comparison':
          if (c.props?.title) speechBlocks.push(`${c.props.title}.`);
          if (Array.isArray(c.props?.rows)) {
            c.props.rows.forEach((r) => {
              speechBlocks.push(
                `Regarding ${r.criteria || 'requirement'}: compliant practice is ${r.compliant || ''}. Critical violation is ${r.violation || ''}.`
              );
            });
          }
          break;

        case 'puzzle-game':
          if (c.props?.title) speechBlocks.push(`${c.props.title}.`);
          if (c.props?.subtitle) speechBlocks.push(`${c.props.subtitle}.`);
          if (Array.isArray(c.props?.items)) {
            c.props.items.forEach((item, idx) => {
              speechBlocks.push(
                `Sequence step ${idx + 1}: ${item.text || ''}.`
              );
            });
          }
          break;

        case 'quote':
          if (c.props?.quote) {
            speechBlocks.push(
              `Regulatory standard: "${c.props.quote}". Citation: ${c.props.citation || ''}.`
            );
          }
          break;

        case 'image-card':
          if (c.props?.title) speechBlocks.push(`${c.props.title}.`);
          if (c.props?.caption) speechBlocks.push(`${c.props.caption}.`);
          if (c.props?.content) speechBlocks.push(c.props.content);
          break;

        default:
          if (c.props?.text) speechBlocks.push(c.props.text);
          if (c.props?.html) speechBlocks.push(c.props.html);
          if (c.props?.content) speechBlocks.push(c.props.content);
          if (c.text) speechBlocks.push(c.text);
          if (c.html) speechBlocks.push(c.html);
          if (c.content) speechBlocks.push(c.content);
          break;
      }
    });
  };

  if (typeof rawContent === 'object' && rawContent !== null) {
    // 1. Process root or nested components array
    if (Array.isArray(rawContent.components)) {
      processComponents(rawContent.components);
    }
    if (
      rawContent.content &&
      typeof rawContent.content === 'object' &&
      Array.isArray(rawContent.content.components)
    ) {
      processComponents(rawContent.content.components);
    }

    // 2. Process HTML / string content
    if (typeof rawContent.content === 'string' && rawContent.content.trim()) {
      speechBlocks.push(rawContent.content);
    }
    if (
      rawContent.text &&
      typeof rawContent.text === 'string' &&
      rawContent.text.trim()
    ) {
      speechBlocks.push(rawContent.text);
    }
    if (
      rawContent.description &&
      typeof rawContent.description === 'string' &&
      rawContent.description.trim()
    ) {
      speechBlocks.push(rawContent.description);
    }

    // 3. Process array fields (cards, bullets, sections)
    if (Array.isArray(rawContent.cards)) {
      rawContent.cards.forEach((c) => {
        const front = c.title || c.front || c.frontText || '';
        const back = c.backText || c.back || c.description || c.text || '';
        if (front || back) speechBlocks.push(`${front}. ${back}`);
      });
    }
    if (Array.isArray(rawContent.bullets)) {
      rawContent.bullets.forEach((b) => {
        if (typeof b === 'string') speechBlocks.push(`${b}.`);
        else if (b?.text) speechBlocks.push(`${b.text}.`);
      });
    }
    if (Array.isArray(rawContent.sections)) {
      rawContent.sections.forEach((sec) => {
        if (sec?.title) speechBlocks.push(`${sec.title}.`);
        if (sec?.content) speechBlocks.push(sec.content);
        if (sec?.text) speechBlocks.push(sec.text);
      });
    }

    // 4. Process quiz slides
    if (rawContent.quizData && Array.isArray(rawContent.quizData.questions)) {
      rawContent.quizData.questions.forEach((q, idx) => {
        speechBlocks.push(`Question ${idx + 1}: ${q.question || ''}.`);
        if (q.scenario) speechBlocks.push(`Scenario: ${q.scenario}.`);
        if (Array.isArray(q.options)) {
          speechBlocks.push(`Options are: ${q.options.join(', ')}.`);
        }
        if (q.explanation) speechBlocks.push(`Safety rule: ${q.explanation}.`);
      });
    }
  } else if (typeof rawContent === 'string' && rawContent.trim()) {
    speechBlocks.push(rawContent);
  }

  // Clean HTML tags and formatting
  let fullText = speechBlocks.join('\n\n');

  let cleaned = fullText
    .replace(
      /([.!?])?\s*<\/(h[1-6]|p|blockquote|section|article|li)>/gi,
      (match, p1) => (p1 ? `${p1}\n\n` : '.\n\n')
    )
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/(div|tr)>/gi, '\n');

  if (typeof document !== 'undefined') {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleaned;
    cleaned = tempDiv.textContent || tempDiv.innerText || cleaned;
  } else {
    cleaned = cleaned.replace(/<[^>]*>?/gm, ' ');
  }

  // Deduplicate whitespace and clean punctuation spacing cleanly
  cleaned = cleaned
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\.\s*\./g, '.')
    .replace(/\s*([.,;?!])\s*/g, '$1 ')
    .replace(/\s+\./g, '.')
    .trim();

  // Strip robotic AI clichés & enforce veteran conversational cadence
  cleaned = sanitizeAntiAiVoice(cleaned);

  // Apply Master Phonetic Pronunciation Rules & Dictionary
  cleaned = applyPhoneticNarratorRules(
    cleaned,
    typeof rawContent === 'object' ? rawContent?.pronunciationDictionary : null
  );

  return cleaned;
}

/**
 * Strips robotic AI clichés and enforces a natural, authoritative field instructor voice.
 */
export function sanitizeAntiAiVoice(text = '') {
  if (!text || typeof text !== 'string') return text;

  return text
    .replace(/\bIn conclusion,?\s*/gi, 'Key takeaway: ')
    .replace(/\bTo conclude,?\s*/gi, 'In summary: ')
    .replace(
      /\bIt is (crucial|important|essential|imperative|vital) to (remember|note|understand|highlight) that\s+/gi,
      'Always remember: '
    )
    .replace(/\bIt is important to remember\b/gi, 'Remember')
    .replace(/\bDelving into\s+/gi, 'Analyzing ')
    .replace(/\bDelve into\s+/gi, 'Examine ')
    .replace(/\bFurthermore,?\s*/gi, 'Additionally, ')
    .replace(/\bMoreover,?\s*/gi, 'Next, ')
    .replace(/\bNeedless to say,?\s*/gi, '')
    .replace(
      /\bIn today's fast-paced (world|environment|industrial world),?\s*/gi,
      'In field operations, '
    )
    .replace(/\bUnlock the (power|potential) of\s+/gi, 'Implement ')
    .replace(/\bA testament to\b/gi, 'Evidence of')
    .replace(/\bNestled\b/gi, 'Located')
    .replace(/\bTapestry of\b/gi, 'System of')
    .replace(/\bBeacon of\b/gi, 'Standard for')
    .replace(/\bFostering a culture of\b/gi, 'Enforcing ')
    .replace(
      /\bComprehensive overview of\b/gi,
      'Core inspection and requirements for '
    );
}

/**
 * Standard Built-in Phonetic Pronunciation Dictionary for Safety Acronyms (US Standards 29 CFR)
 */
export const DEFAULT_PHONETIC_DICTIONARY = {
  HAZWOPER: 'HAZ-WAH-PER',
  Hazwoper: 'HAZ-WAH-PER',
  hazwoper: 'HAZ-WAH-PER',
  HIPAA: 'HIP-AH',
  Hipaa: 'HIP-AH',
  hipaa: 'HIP-AH',
  NIOSH: 'NYE-OSH',
  Niosh: 'NYE-OSH',
  niosh: 'NYE-OSH',
  OSHA: 'O-SHAH',
  Osha: 'O-SHAH',
  osha: 'O-SHAH',
  EPA: 'E-P-A',
  PPE: 'P-P-E',
  PEL: 'P-E-L',
  TWA: 'T-W-A',
  STEL: 'STEL',
  SDS: 'S-D-S',
  MSDS: 'M-S-D-S',
  IDLH: 'I-D-L-H',
  SCBA: 'S-C-B-A',
  Scba: 'S-C-B-A',
  ANSI: 'AN-SEE',
  Ansi: 'AN-SEE',
  ACGIH: 'A-C-G-I-H',
  DOT: 'Department of Transportation',
  NFPA: 'N-F-P-A',
  GFCI: 'G-F-C-I',
  LOTO: 'LOW-TO',
  Loto: 'LOW-TO',
  LEL: 'L-E-L',
  UEL: 'U-E-L',
  VOC: 'V-O-C',
  HEPA: 'HEPA',
  Hepa: 'HEPA',
  N95: 'N 95',
  PAPR: 'P-A-P-R',
  CPR: 'C-P-R',
  AED: 'A-E-D',
  HAZMAT: 'HAZ-MAT',
  HazMat: 'HAZ-MAT',
};

/**
 * Applies context-aware phonetic pronunciation corrections to text before TTS narration.
 * Handles homographs like "Lead" (Ledd heavy metal vs Leed team leader) and regulatory acronyms.
 */
export function applyPhoneticNarratorRules(text, customOverrides = null) {
  if (!text || typeof text !== 'string') return text || '';

  let processed = text;

  // 1. Regulatory Citation Expansions
  processed = processed.replace(
    /\b29\s+CFR\b/gi,
    '29 Code of Federal Regulations'
  );
  processed = processed.replace(/\bCFR\b/g, 'Code of Federal Regulations');

  // 2. Context-Aware Homographs: "Lead" (Heavy Metal vs Team Leader)
  // Check if sentence/paragraph relates to chemical, heavy metal, poisoning, or OSHA 1910.1025 / 1926.62
  const leadMetalContext =
    /\b(poisoning|exposure|toxic|toxicity|metal|inorganic|dust|fume|fumes|paint|shield|battery|compound|abatement|1025|62|blood|level|standard|ingestion|inhalation)\b/i;
  const teamLeadContext =
    /\b(team|project|group|discussion|instructor|role|guide|leader|leadership)\b/i;

  // Split into sentences for fine-grained contextual homograph replacement
  const sentences = processed.split(/(?<=[.!?])\s+/);
  processed = sentences
    .map((sentence) => {
      let s = sentence;
      if (leadMetalContext.test(s)) {
        s = s.replace(/\bLead\b/g, 'Ledd').replace(/\blead\b/g, 'ledd');
      } else if (teamLeadContext.test(s)) {
        s = s.replace(/\bLead\b/g, 'Leed').replace(/\blead\b/g, 'leed');
      } else if (
        /\b(lead\s+exposure|lead\s+poisoning|lead\s+dust|lead\s+compound|lead\s+pigment|lead\s+oxide)\b/i.test(
          s
        )
      ) {
        s = s.replace(/\bLead\b/gi, 'Ledd').replace(/\blead\b/gi, 'ledd');
      }

      // Contextual Homograph: "Live" (Electrical circuit vs Reside)
      s = s.replace(
        /\b(live)\s+(wire|wires|circuit|circuits|voltage|electricity|stream|broadcast|feed|conductor|conductors)\b/gi,
        (m, p1, p2) => `Liyve ${p2}`
      );

      // Contextual Homograph: "Read" (Past vs Present)
      s = s.replace(
        /\b(have|has|had|was|were|already)\s+(read)\b/gi,
        '$1 Redd'
      );

      // Contextual Homograph: "Permit" (Work Permit noun vs verb)
      s = s.replace(
        /\b(work|entry|confined space|hot work|excavation)\s+(permit|permits)\b/gi,
        (m, p1, p2) => `${p1} PURR-mit`
      );

      return s;
    })
    .join(' ');

  // 3. Apply Custom Admin Dictionary Overrides first (if supplied)
  if (customOverrides && typeof customOverrides === 'object') {
    Object.keys(customOverrides).forEach((term) => {
      if (term && customOverrides[term]) {
        const regex = new RegExp(
          `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          'g'
        );
        processed = processed.replace(regex, customOverrides[term]);
      }
    });
  }

  // 4. Apply Built-in Standard Acronym Pronunciation Dictionary
  Object.keys(DEFAULT_PHONETIC_DICTIONARY).forEach((acronym) => {
    const replacement = DEFAULT_PHONETIC_DICTIONARY[acronym];
    const regex = new RegExp(`\\b${acronym}\\b`, 'g');
    processed = processed.replace(regex, replacement);
  });

  return processed;
}

/**
 * Calculates dynamic slide duration in seconds based on word count (~130 words/min + pauses).
 */
export function calculateSlideDuration(rawContent, title = '') {
  const transcript = extractCompleteNarrationTranscript(rawContent, title);
  if (!transcript || !transcript.trim()) return 30;

  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  const durationSec = Math.round(words / 2.15);
  return Math.max(15, durationSec + 4);
}

export class CourseNarrator {
  constructor({ onStart, onEnd, onSegmentChange, onBoundary, onError } = {}) {
    this.onStart = onStart || (() => {});
    this.onEnd = onEnd || (() => {});
    this.onSegmentChange = onSegmentChange || (() => {});
    this.onBoundary = onBoundary || (() => {});
    this.onError = onError || (() => {});

    this.isPlaying = false;
    this.isPaused = false;
    this.rate = 0.96;
    this.pitch = 1.0;
    this.selectedVoice = null;
    this.availableVoices = [];
    this.segments = [];
    this.currentIndex = 0;
    this.timeoutId = null;
    this.currentUtterance = null;
    this.watchdogInterval = null;
    this.segmentWatchdogTimer = null;
    this.wordTickerInterval = null;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    const voices = window.speechSynthesis.getVoices();
    this.availableVoices = voices;

    if (!this.selectedVoice && voices.length > 0) {
      const preferred = voices.find(
        (v) =>
          (v.name.includes('Natural') ||
            v.name.includes('Neural') ||
            v.name.includes('Google') ||
            v.name.includes('Jenny') ||
            v.name.includes('Guy') ||
            v.name.includes('Aria') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('Karen')) &&
          v.lang.startsWith('en')
      );
      this.selectedVoice =
        preferred ||
        voices.find((v) => v.lang === 'en-US') ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
    }
    return this.availableVoices;
  }

  getVoices() {
    if (!this.availableVoices || this.availableVoices.length === 0) {
      this.initVoices();
    }
    return this.availableVoices || [];
  }

  setVoice(voiceNameOrObject) {
    if (typeof voiceNameOrObject === 'string') {
      const v = this.availableVoices?.find(
        (voice) => voice.name === voiceNameOrObject
      );
      if (v) this.selectedVoice = v;
    } else if (voiceNameOrObject) {
      this.selectedVoice = voiceNameOrObject;
    }
  }

  setRate(rate) {
    this.rate = Math.max(0.6, Math.min(1.6, Number(rate) || 0.96));
  }

  parseContentToSegments(rawTextOrObject, title = '') {
    const fullText = extractCompleteNarrationTranscript(rawTextOrObject, title);
    if (!fullText) return [];

    const rawParagraphs = fullText.split(/\n\n+/);
    const segments = [];

    for (const para of rawParagraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;

      const sentenceMatches = trimmedPara.match(
        /[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g
      );
      if (sentenceMatches && sentenceMatches.length > 0) {
        sentenceMatches.forEach((s, sIdx) => {
          const cleanSentence = s.trim();
          if (cleanSentence) {
            const isLastInPara = sIdx === sentenceMatches.length - 1;
            segments.push({
              text: cleanSentence,
              pauseMs: isLastInPara ? 400 : 300,
            });
          }
        });
      } else {
        segments.push({
          text: trimmedPara,
          pauseMs: 400,
        });
      }
    }

    return segments.filter((s) => s.text && s.text.length > 0);
  }

  speak(rawTextOrObject, title = '') {
    this.stop();
    this.segments = this.parseContentToSegments(rawTextOrObject, title);
    this.currentIndex = 0;

    if (!this.segments.length) {
      this.isPlaying = false;
      this.isPaused = false;
      this.onEnd();
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.onStart();

    this._playNextSegment();
  }

  _playNextSegment() {
    if (!this.isPlaying || this.isPaused) return;

    if (this.currentIndex >= this.segments.length) {
      this.isPlaying = false;
      this.isPaused = false;
      if (this.watchdogInterval) clearInterval(this.watchdogInterval);
      this.onEnd();
      return;
    }

    const currentSegment = this.segments[this.currentIndex];
    if (!currentSegment || !currentSegment.text) {
      this.currentIndex++;
      this._playNextSegment();
      return;
    }

    this.onSegmentChange(
      this.currentIndex,
      this.segments.length,
      currentSegment.text
    );

    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Parse words and character offsets for real-time word boundary tracking
    const wordList = [];
    const wordRegex = /\S+/g;
    let match;
    while ((match = wordRegex.exec(currentSegment.text)) !== null) {
      wordList.push({
        word: match[0],
        charIndex: match.index,
        charLength: match[0].length,
      });
    }

    const utterance = new SpeechSynthesisUtterance(currentSegment.text);
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    if (!this.selectedVoice) {
      this.initVoices();
    }
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    let isHandled = false;

    const cleanupTimers = () => {
      if (this.segmentWatchdogTimer) clearTimeout(this.segmentWatchdogTimer);
      if (this.wordTickerInterval) clearInterval(this.wordTickerInterval);
      if (this.timeoutId) clearTimeout(this.timeoutId);
    };

    const handleAdvance = () => {
      if (isHandled) return;
      isHandled = true;
      cleanupTimers();
      if (!this.isPlaying || this.isPaused) return;

      this.currentIndex++;
      if (this.currentIndex >= this.segments.length) {
        this.isPlaying = false;
        this.isPaused = false;
        if (this.watchdogInterval) clearInterval(this.watchdogInterval);
        this.onEnd();
      } else {
        const pauseTime = currentSegment.pauseMs || 250;
        this.timeoutId = setTimeout(() => {
          if (this.isPlaying && !this.isPaused) {
            this._playNextSegment();
          }
        }, pauseTime);
      }
    };

    // Real-Time Word Boundary Event Hook (Web Speech API)
    utterance.onboundary = (event) => {
      if (!this.isPlaying || this.isPaused) return;
      const charIndex = event.charIndex !== undefined ? event.charIndex : 0;
      let wordIdx = wordList.findIndex(
        (w) =>
          charIndex >= w.charIndex && charIndex < w.charIndex + w.charLength + 1
      );
      if (wordIdx === -1 && wordList.length > 0) {
        wordIdx = wordList.findIndex((w) => w.charIndex >= charIndex);
        if (wordIdx === -1) wordIdx = wordList.length - 1;
      }
      const matched = wordList[wordIdx] || {
        word: '',
        charIndex,
        charLength: 0,
      };
      this.onBoundary({
        charIndex: matched.charIndex,
        charLength: matched.charLength,
        word: matched.word,
        wordIndex: Math.max(0, wordIdx),
        totalWords: wordList.length,
        sentenceIndex: this.currentIndex,
        sentenceText: currentSegment.text,
      });
    };

    // Emit initial word immediately
    if (wordList.length > 0) {
      this.onBoundary({
        charIndex: wordList[0].charIndex,
        charLength: wordList[0].charLength,
        word: wordList[0].word,
        wordIndex: 0,
        totalWords: wordList.length,
        sentenceIndex: this.currentIndex,
        sentenceText: currentSegment.text,
      });
    }

    // Fallback ticker if browser onboundary is sparse or unsupported
    let currentFallbackWordIdx = 0;
    const msPerWord = Math.max(160, Math.round(330 / this.rate));
    this.wordTickerInterval = setInterval(() => {
      if (!this.isPlaying || this.isPaused) return;
      currentFallbackWordIdx++;
      if (currentFallbackWordIdx < wordList.length) {
        const item = wordList[currentFallbackWordIdx];
        this.onBoundary({
          charIndex: item.charIndex,
          charLength: item.charLength,
          word: item.word,
          wordIndex: currentFallbackWordIdx,
          totalWords: wordList.length,
          sentenceIndex: this.currentIndex,
          sentenceText: currentSegment.text,
        });
      }
    }, msPerWord);

    utterance.onend = handleAdvance;

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      console.warn('TTS Segment playback notice:', e);
      if (this.isPlaying && !this.isPaused) {
        handleAdvance();
      }
    };

    // Safety Watchdog (prevents hanging indefinitely on browser speech glitches)
    const estimatedDurationMs = Math.max(
      6000,
      currentSegment.text.length * 150
    );
    this.segmentWatchdogTimer = setTimeout(() => {
      if (this.isPlaying && !this.isPaused && !isHandled) {
        console.warn('TTS Segment safety watchdog triggered advance');
        handleAdvance();
      }
    }, estimatedDurationMs);

    this.currentUtterance = utterance;
    if (typeof window !== 'undefined') {
      window.__hazwoperTtsUtterance = utterance;
      // Immediate cancellation before speaking prevents speech queuing overlaps
      window.speechSynthesis.cancel();
      setTimeout(() => {
        if (this.isPlaying && !this.isPaused) {
          window.speechSynthesis.speak(utterance);
        }
      }, 20);
    }
  }

  pause() {
    this.isPaused = true;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.segmentWatchdogTimer) clearTimeout(this.segmentWatchdogTimer);
    if (this.wordTickerInterval) clearInterval(this.wordTickerInterval);
    if (this.watchdogInterval) clearInterval(this.watchdogInterval);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.isPlaying = true;
      this._playNextSegment();
    }
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentIndex = 0;
    this.currentUtterance = null;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.segmentWatchdogTimer) clearTimeout(this.segmentWatchdogTimer);
    if (this.wordTickerInterval) clearInterval(this.wordTickerInterval);
    if (this.watchdogInterval) clearInterval(this.watchdogInterval);
    if (typeof window !== 'undefined') {
      window.__hazwoperTtsUtterance = null;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }

  regenerate(rawTextOrObject, title = '') {
    this.stop();
    this.speak(rawTextOrObject, title);
  }
}

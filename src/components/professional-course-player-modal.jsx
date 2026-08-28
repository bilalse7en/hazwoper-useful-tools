'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Settings,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  CheckCircle,
  BookOpen,
  ShoppingBag,
  ArrowLeft,
  Sun,
  Moon,
  Type,
  Video,
  Globe,
  Keyboard,
  Maximize,
  Minimize,
  Sparkles,
  Award,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Mic,
  AudioWaveform,
  Layers,
  Image as ImageIcon,
  RefreshCw,
  Radio,
  Palette,
  Check,
  XCircle,
  HelpCircle,
  Clock,
  Printer,
  Download,
  FolderOpen,
  Folder,
  FileText,
  Sliders,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  CheckSquare,
  Square,
  Flame,
  Eye,
  ClipboardCheck,
  ArrowRightLeft,
  Link2,
  CheckCircle2,
  Shuffle,
  Lock,
  Unlock,
  Loader2,
  AlertCircle,
  Search,
  ZoomIn,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CourseNarrator, calculateSlideDuration } from '@/lib/course-tts';
import PlayerComponentRenderer, {
  getThemeStyles,
} from '@/components/player/components/PlayerComponentRenderer';
import { serializeComponentsToHtml } from '@/lib/component-registry';
import { getRealisticTopicPhoto } from '@/lib/se7en-ai';
import { generateQuizQuestions, generateUUID } from '@/lib/course-generator';

/**
 * Auto-inject interactive quizzes into any course that is missing them.
 * Ensures every non-intro lesson has a 6-question practice quiz,
 * and every course has a compulsory final exam.
 * Returns a new course object (does not mutate the input).
 */
export function ensureCourseQuizzes(course) {
  if (!course || !course.modules) return course;

  const patched = JSON.parse(JSON.stringify(course));
  let lessonCounter = 0;

  patched.modules.forEach((mod) => {
    mod.lessons?.forEach((lesson) => {
      const isIntro = lesson.isIntroduction || lesson.order === 0;
      if (!isIntro) {
        lessonCounter++;
      }

      // Skip intro lessons — they don't get quizzes
      if (isIntro) return;

      // If this non-intro lesson is missing a quiz or has no questions, inject one
      if (
        !lesson.quiz ||
        !lesson.quiz.questions ||
        lesson.quiz.questions.length === 0
      ) {
        const lessonLabel = lesson.title || `Lesson ${lessonCounter}`;
        lesson.quiz = {
          id: generateUUID(),
          title: `${lessonLabel} Practice Quiz (6 Questions)`,
          passingScore: 70,
          isCompulsory: false,
          questions: generateQuizQuestions(lessonLabel, 6),
        };
      }
    });
  });

  // If the course is missing a final exam, inject one
  if (
    !patched.finalExam ||
    !patched.finalExam.questions ||
    patched.finalExam.questions.length === 0
  ) {
    const examCount = 25;
    patched.finalExam = {
      id: generateUUID(),
      title: 'Compulsory Final Examination',
      description: `Comprehensive final examination covering all modules in ${patched.title || 'this course'}. You must achieve a minimum passing score of 70% to unlock your verifiable Certificate of Completion.`,
      passingScore: 70,
      isCompulsory: true,
      timeLimit: 3600,
      questionCount: examCount,
      questions: generateQuizQuestions(
        `${patched.title || 'Course'} Final Exam`,
        examCount
      ),
    };
  }

  return patched;
}

/**
 * Clean numerical prefixes, verbose AI headers, and format sober, concise TOC titles (max 6 words).
 */
export function formatCleanTopicTitle(title) {
  if (!title || typeof title !== 'string') return 'Topic Overview';
  let clean = title.trim();
  clean = clean.replace(
    /^(Topic\s*\d+[\s:\-–—]+|\d+\.\d+[\s:\-–—]+|\d+[\s:\-–—]+|Module\s*\d+[\s:\-–—]+|Lesson\s*\d+[\s:\-–—]+)/i,
    ''
  );
  clean = clean.replace(
    /^(Comprehensive\s+Overview\s+of\s+|A\s+Complete\s+Guide\s+to\s+|Introduction\s+to\s+|Understanding\s+the\s+)/i,
    ''
  );

  const words = clean.split(/\s+/);
  if (words.length > 6) {
    clean = words.slice(0, 6).join(' ');
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Professional Demo Course Generator:
 * Formulates Module 1, Lesson 1 with exactly 9 Core Content Topics, 1 Lesson Summary,
 * 1 Interactive Practice Quiz (5 scenario questions), and 1 Unlock Full Course CTA.
 */
export function buildDemoCourseLesson1(course) {
  const courseTitle = course?.title || 'Professional Safety Training';
  const category = course?.category || 'safety';
  const firstModule = course?.modules?.[0] || {};
  const firstLesson = firstModule.lessons?.[0] || {};

  const rawLessonTitle = firstLesson.title || '';
  const cleanLessonTitle = rawLessonTitle
    .replace(/^(Introduction|Intro|Lesson\s*\d+[\s:\-–—]*)/i, '')
    .trim();
  const previewLessonHeading = cleanLessonTitle
    ? `Lesson 1: ${cleanLessonTitle}`
    : `Lesson 1: Scope, Standards & Operational Protocols`;

  // Harvest existing topics across the course
  const existingTopics = [];
  course?.modules?.forEach((m) => {
    m.lessons?.forEach((l) => {
      l.topics?.forEach((t) => {
        if (
          t &&
          t.title &&
          !t.title.toLowerCase().includes('summary') &&
          !t.title.toLowerCase().includes('exam')
        ) {
          existingTopics.push(t);
        }
      });
    });
  });

  // Standard 9 Accredited Topic Blueprints
  const default9Blueprints = [
    {
      title: 'Regulatory Scope, Mandates & Industry Directives',
      description: `Governing statutory standards, regulatory thresholds, and mandatory employer compliance obligations applicable to ${courseTitle}.`,
      badge: 'OSHA Standard',
      cards: [
        {
          title: 'Statutory Authority',
          text: 'Mandatory compliance with OSHA 29 CFR federal workplace safety mandates and ANSI benchmarks.',
        },
        {
          title: 'Employer Duty',
          text: 'Employers must provide accredited training, certified gear, and hazard pre-planning.',
        },
        {
          title: 'Worker Rights',
          text: 'Unconditional Stop Work Authority when imminent hazards or equipment defects are identified.',
        },
      ],
    },
    {
      title: 'Hazard Identification, Assessment & Risk Vectors',
      description: `Systematic hazard analysis methodologies, physical impact vectors, environmental vectors, and risk prioritization matrix.`,
      badge: 'Hazard Analysis',
      cards: [
        {
          title: 'Physical Hazards',
          text: 'Mechanical impact, kinetic energy, high elevation, and structural integrity risks.',
        },
        {
          title: 'Environmental Factors',
          text: 'Weather extremes, toxic releases, electrical hazards, and noise exposure.',
        },
        {
          title: 'Job Safety Analysis (JSA)',
          text: 'Pre-operational task breakdown to isolate and eliminate task-specific risks.',
        },
      ],
    },
    {
      title: 'Hierarchy of Hazard Controls & Prevention Planning',
      description: `Structured elimination, substitution, engineering, and administrative controls implemented prior to PPE reliance.`,
      badge: 'Control Hierarchy',
      cards: [
        {
          title: 'Engineering Controls',
          text: 'Physical guardrails, isolation barriers, safety interlocks, and ventilation.',
        },
        {
          title: 'Administrative Protocols',
          text: 'Standard operating procedures, warning signs, and continuous permit controls.',
        },
        {
          title: 'PPE Defense Layer',
          text: 'Certified personal protective systems deployed as the final defense layer.',
        },
      ],
    },
    {
      title: 'Equipment Specifications & Pre-Shift Tactile Inspection',
      description: `Rigorous pre-operational inspection protocols, hardware integrity verification, and mandatory red-tag retirement criteria.`,
      badge: 'Gear Inspection',
      cards: [
        {
          title: 'Tactile Webbing Check',
          text: 'Examine straps, stitching, and seams for cuts, abrasions, burns, or chemical damage.',
        },
        {
          title: 'Hardware Integrity',
          text: 'Verify D-rings, buckles, carabiners, and snap hooks for distortion or corrosion.',
        },
        {
          title: 'Immediate Tag-Out',
          text: 'Any defective or impact-loaded equipment must be retired and removed from service.',
        },
      ],
    },
    {
      title: 'Step-by-Step Standard Operating Procedures (SOP)',
      description: `Sequential procedural execution for daily field operations, equipment donning sequence, and operational fit testing.`,
      badge: 'SOP Execution',
      cards: [
        {
          title: 'Step 1: Pre-Donning Inspection',
          text: 'Conduct visual and tactile check of all safety gear and connection points.',
        },
        {
          title: 'Step 2: Secure Fitting',
          text: 'Adjust leg, chest, and shoulder straps to achieve a snug, two-finger clearance fit.',
        },
        {
          title: 'Step 3: Dual Verification',
          text: 'Perform peer-check verification before entering hazardous operational zones.',
        },
      ],
    },
    {
      title: 'Critical Safety Thresholds & Action Limits',
      description: `Permissible exposure limits, maximum arrest force ratings, and mandatory engineering boundary limits.`,
      badge: 'Action Limits',
      cards: [
        {
          title: 'Maximum Arrest Force',
          text: 'Fall arrest forces must never exceed 1,800 lbs with full body harness systems.',
        },
        {
          title: 'Free Fall Distance',
          text: 'Rigging must strictly limit total free fall distance to 6 feet or less.',
        },
        {
          title: 'Anchor Strength',
          text: 'Anchorages must support at least 5,000 lbs per attached employee.',
        },
      ],
    },
    {
      title: 'Emergency Response, Self-Rescue & Medical Protocols',
      description: `Immediate emergency extraction procedures, suspension trauma prevention, and prompt medical stabilization.`,
      badge: 'Emergency Rescue',
      cards: [
        {
          title: 'Suspension Relief',
          text: 'Deploy trauma relief straps immediately to restore femoral blood circulation.',
        },
        {
          title: 'Prompt Extraction',
          text: 'Rescue teams must execute retrieval within 4 to 6 minutes of an event.',
        },
        {
          title: 'Post-Rescue Care',
          text: 'Position rescued workers in semi-recumbent posture to prevent cardiac arrest.',
        },
      ],
    },
    {
      title: 'Incident Documentation, Logging & Refresher Intervals',
      description: `Accredited recordkeeping mandates, OSHA compliance logging, and required 3-year retraining cycles.`,
      badge: 'Compliance Records',
      cards: [
        {
          title: 'Inspection Logs',
          text: 'Maintain written and digital pre-shift equipment inspection records on site.',
        },
        {
          title: 'Retraining Mandates',
          text: 'Mandatory retraining following equipment changes, near-misses, or every 3 years.',
        },
        {
          title: 'Audit Readiness',
          text: 'Ensure certificates and training rosters are immediately accessible for inspection.',
        },
      ],
    },
    {
      title: 'Real-World Case Studies & Field Lessons Learned',
      description: `Analysis of historical industrial incidents, root-cause failures, and field preventive corrective actions.`,
      badge: 'Case Studies',
      cards: [
        {
          title: 'Incident Root Cause',
          text: 'Failure to inspect connection hardware led to unanchored operational failure.',
        },
        {
          title: 'Corrective Action',
          text: 'Implemented mandatory peer double-check and automated barcode tracking.',
        },
        {
          title: 'Field Best Practice',
          text: 'Never bypass engineered anchor points or use unauthorized connection links.',
        },
      ],
    },
  ];

  // Exactly 9 content topics
  const topics = [];
  for (let i = 0; i < 9; i++) {
    const existing = existingTopics[i];
    const bp = default9Blueprints[i];

    const tTitle = existing?.title || bp.title;
    const tContent =
      existing?.content ||
      `
      <div class="topic-content space-y-4">
        <p class="leading-relaxed text-sm">${existing?.description || bp.description}</p>
        <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
          <strong>Mandatory Field Directive:</strong> All authorized personnel must adhere strictly to verified ${courseTitle} operating protocols.
        </div>
      </div>
    `;

    topics.push({
      id: existing?.id || `demo_t_${i + 1}`,
      title: tTitle,
      order: i + 1,
      badge: bp.badge || `Topic ${i + 1}`,
      frameType: existing?.frameType || 2,
      content: tContent,
      imageUrl:
        existing?.imageUrl ||
        getRealisticTopicPhoto(`${courseTitle} ${tTitle}`, category),
      cards:
        existing?.cards && existing.cards.length > 0
          ? existing.cards
          : bp.cards,
    });
  }

  // 10. Lesson 1 Summary & Key Takeaways Slide
  const summaryTopic = {
    id: 'demo_t_10_lesson_1_summary',
    title: 'Lesson 1 Summary & Key Takeaways',
    order: 10,
    badge: 'Lesson Summary',
    frameType: 2,
    imageUrl:
      course?.thumbnail ||
      getRealisticTopicPhoto(`${courseTitle} Summary Checklist`, category),
    content: `
      <div class="topic-content space-y-4">
        <p class="text-sm font-semibold leading-relaxed">
          You have completed all 9 core instructional topics in <strong>${previewLessonHeading}</strong> for <strong>${courseTitle}</strong>.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
            <span class="font-bold text-emerald-400">✓ Regulatory Benchmark Met</span>
            <p class="text-slate-300">Governing statutory mandates, action thresholds, and employer pre-planning completed.</p>
          </div>
          <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
            <span class="font-bold text-amber-400">✓ Equipment & Inspection Ready</span>
            <p class="text-slate-300">Tactile inspection criteria, PPE donning guidelines, and tag-out procedures mastered.</p>
          </div>
        </div>
      </div>
    `,
    cards: [
      {
        title: 'Core Takeaway 1',
        text: 'Pre-shift inspection of all safety equipment is strictly non-negotiable.',
      },
      {
        title: 'Core Takeaway 2',
        text: 'Stop Work Authority must be immediately exercised when hazards appear.',
      },
      {
        title: 'Core Takeaway 3',
        text: 'Emergency response plans must be established prior to commencing work.',
      },
      {
        title: 'Core Takeaway 4',
        text: 'Full certification requires completing all subsequent advanced modules.',
      },
    ],
  };

  // 11. Practice Quiz
  const quiz =
    firstLesson.quiz?.questions?.length > 0
      ? firstLesson.quiz
      : {
          title: `${previewLessonHeading} - Interactive Practice Quiz`,
          passingScore: 70,
          questions: [
            {
              id: 'demo_q1',
              question: `What is the primary governing safety standard and statutory obligation for ${courseTitle}?`,
              options: [
                'Mandatory OSHA 29 CFR Federal Safety Standards & Applicable Directives',
                'Optional Jobsite Suggestions',
                'Voluntary Manufacturer Bulletins',
                'Unregulated Internal Company Best Practices',
              ],
              correctAnswer: 0,
              explanation:
                'All certified operations are governed strictly under OSHA 29 CFR federal safety standards and statutory requirements.',
            },
            {
              id: 'demo_q2',
              question:
                'When must a comprehensive visual and tactile inspection of all safety equipment and hardware be conducted?',
              options: [
                'Once per calendar month',
                'Prior to every single work shift before donning equipment',
                'Only after an incident or near-miss occurs',
                'Whenever requested by coworkers',
              ],
              correctAnswer: 1,
              explanation:
                'Pre-shift tactile inspection is mandatory prior to every work shift before donning or connecting equipment.',
            },
            {
              id: 'demo_q3',
              question:
                'According to the Hierarchy of Controls, what control measure takes precedence over personal protective equipment (PPE)?',
              options: [
                'Elimination, substitution, and engineered barriers',
                'Relying solely on employee vigilance',
                'Using PPE first and considering barriers later',
                'Verbal warnings without physical guards',
              ],
              correctAnswer: 0,
              explanation:
                'Engineering controls, elimination, and substitution take strict precedence over PPE in the Hierarchy of Controls.',
            },
            {
              id: 'demo_q4',
              question:
                'What authority does every worker possess when an imminent danger or unmitigated safety hazard is observed on site?',
              options: [
                'Unconditional Stop Work Authority to immediately halt operations',
                'Must wait for written supervisor permission',
                'Must continue working and log the hazard at the end of the week',
                'Can only report anonymously after work hours',
              ],
              correctAnswer: 0,
              explanation:
                'Every worker possesses unconditional Stop Work Authority to immediately halt unsafe operations without fear of reprisal.',
            },
            {
              id: 'demo_q5',
              question:
                'What is the mandatory action required when a piece of safety equipment shows cuts, heat damage, or deployed load indicators?',
              options: [
                'Continue using it until the end of the shift',
                'Immediately tag out of service, destroy/retire, and remove from the jobsite',
                'Apply duct tape or adhesive over the damaged area',
                'Downgrade to light-duty use without notification',
              ],
              correctAnswer: 1,
              explanation:
                'Any damaged or impact-loaded safety equipment must be immediately tagged out and retired from operational use.',
            },
          ],
        };

  return {
    moduleTitle: firstModule.title || courseTitle,
    moduleId: firstModule.id || 'm1_demo',
    lessonTitle: previewLessonHeading,
    lessonId: firstLesson.id || 'l1_demo',
    topics,
    summaryTopic,
    quiz,
  };
}

// Helper to evaluate correctness across all 15 Interactive Quiz Types
export function checkQuestionCorrect(q, userChoice) {
  if (userChoice === undefined || userChoice === null) return false;

  // 1. Drag & Drop Matching (Pairs)
  if (q.pairs && q.pairs.length > 0) {
    if (!userChoice || typeof userChoice !== 'object') return false;
    return q.pairs.every((_, pIdx) => userChoice[pIdx] === pIdx);
  }

  // 2. Drag & Drop Ordering (Sequence)
  if (q.sequenceItems && q.sequenceItems.length > 0) {
    if (!Array.isArray(userChoice)) return false;
    const target = q.correctOrder || q.sequenceItems.map((_, i) => i);
    return (
      userChoice.length === target.length &&
      userChoice.every((v, i) => v === target[i])
    );
  }

  // 3. Spot the Hazard (Multi-select)
  if (q.hazardList && q.hazardList.length > 0) {
    if (!Array.isArray(userChoice)) return false;
    const correctIndices = q.hazardList
      .map((h, i) => (h.isHazard ? i : null))
      .filter((i) => i !== null);
    return (
      correctIndices.length === userChoice.length &&
      correctIndices.every((i) => userChoice.includes(i))
    );
  }

  // 4. Inspection Challenge (Checklist)
  if (q.checklist && q.checklist.length > 0) {
    if (!userChoice || typeof userChoice !== 'object') return false;
    return q.checklist.every((c, i) => userChoice[i] === c.status);
  }

  // 5. Single Choice / Scenario / Safety Decision / True-False / Safe-Unsafe / Emergency
  return userChoice === q.correctAnswer;
}

// ============================================================================
// INTERACTIVE QUIZ ITEM COMPONENT (15 QUIZ TYPES WITH FULL THEME SUPPORT)
// ============================================================================
function InteractiveQuizItem({
  q,
  qIdx,
  userChoice,
  onAnswer,
  isSubmitted,
  isCompulsoryExam = false,
  theme = 'dark',
  isAdminMode = false,
}) {
  const qType =
    q.type || (q.options?.length === 2 ? 'true-false' : 'multiple-choice');
  const isCorrect = checkQuestionCorrect(q, userChoice);
  const isLight = theme === 'light';
  const isNebula = theme === 'nebula';

  const typeIcons = {
    'multiple-choice': '🎯',
    'true-false': '⚖️',
    scenario: '📋',
    'hazard-id': '⚠️',
    'match-hazard': '🔗',
    matching: '🔗',
    ordering: '🔢',
    sequence: '🔢',
    'safety-decision': '🚦',
    'safe-unsafe': '🛡️',
    'what-would-you-do': '❓',
    'spot-hazard': '🔍',
    'match-ppe': '🦺',
    'inspection-challenge': '📝',
    'knowledge-checkpoint': '⏱️',
    'emergency-response': '🚨',
    'final-safety-challenge': '🏆',
  };

  const typeIcon = typeIcons[qType] || '🎯';
  const typeBadgeLabel =
    q.typeLabel ||
    (qType === 'safe-unsafe'
      ? 'Safe or Unsafe?'
      : qType === 'true-false'
        ? 'True or False Safety Check'
        : qType === 'match-hazard'
          ? 'Match the Hazard'
          : qType === 'match-ppe'
            ? 'Match the PPE'
            : qType === 'ordering'
              ? 'Put in Correct Order'
              : qType === 'spot-hazard'
                ? 'Spot the Hazard'
                : qType === 'inspection-challenge'
                  ? 'Inspection Challenge'
                  : qType === 'scenario'
                    ? 'Scenario Challenge'
                    : qType === 'safety-decision'
                      ? 'Safety Decision'
                      : qType === 'what-would-you-do'
                        ? 'What Would You Do?'
                        : qType === 'hazard-id'
                          ? 'Hazard Identification'
                          : qType === 'emergency-response'
                            ? 'Emergency Response'
                            : qType === 'knowledge-checkpoint'
                              ? 'Knowledge Checkpoint'
                              : qType === 'final-safety-challenge'
                                ? 'Final Safety Challenge'
                                : 'Multiple Choice Challenge');

  // State for Matching
  const [selectedLeftIdx, setSelectedLeftIdx] = useState(null);
  const pairMatches =
    (typeof userChoice === 'object' &&
      !Array.isArray(userChoice) &&
      userChoice) ||
    {};

  // State for Ordering
  const currentSequence = useMemo(() => {
    if (q.sequenceItems && q.sequenceItems.length > 0) {
      if (
        Array.isArray(userChoice) &&
        userChoice.length === q.sequenceItems.length
      ) {
        return userChoice;
      }
      return q.sequenceItems.map((_, i) => i);
    }
    return [];
  }, [q.sequenceItems, userChoice]);

  const handleMoveSequence = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= currentSequence.length || isSubmitted) return;
    const updated = [...currentSequence];
    const temp = updated[fromIdx];
    updated[fromIdx] = updated[toIdx];
    updated[toIdx] = temp;
    onAnswer(updated);
  };

  const handleToggleHazard = (idx) => {
    if (isSubmitted) return;
    const currentList = Array.isArray(userChoice) ? userChoice : [];
    if (currentList.includes(idx)) {
      onAnswer(currentList.filter((i) => i !== idx));
    } else {
      onAnswer([...currentList, idx]);
    }
  };

  const handleToggleInspection = (itemIdx, statusVal) => {
    if (isSubmitted) return;
    const currentChecklist =
      (typeof userChoice === 'object' &&
        !Array.isArray(userChoice) &&
        userChoice) ||
      {};
    onAnswer({
      ...currentChecklist,
      [itemIdx]: statusVal,
    });
  };

  const containerClass = isLight
    ? 'p-5 md:p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm text-slate-900 transition-all'
    : isNebula
      ? 'p-5 md:p-6 rounded-2xl border border-purple-800/40 bg-[#150e2d]/90 space-y-4 shadow-xl text-purple-100 transition-all'
      : 'p-5 md:p-6 rounded-2xl border border-slate-800 bg-slate-950/90 space-y-4 shadow-lg text-slate-100 transition-all';

  const headerBorder = isLight
    ? 'border-slate-200'
    : isNebula
      ? 'border-purple-900/50'
      : 'border-slate-800/80';
  const typeBadgeClass = isLight
    ? 'bg-slate-100 border-slate-200 text-slate-700'
    : isNebula
      ? 'bg-purple-950/60 border-purple-800 text-purple-200'
      : 'bg-slate-900 border-slate-800 text-slate-300';
  const titleColor = isLight
    ? 'text-slate-900 font-bold'
    : isNebula
      ? 'text-purple-100 font-bold'
      : 'text-white font-bold';

  return (
    <div className={containerClass}>
      {/* Question Header */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 pb-2 border-b',
          headerBorder
        )}
      >
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-[11px] font-black">
            #{qIdx + 1}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-bold',
              typeBadgeClass
            )}
          >
            <span>{typeIcon}</span>
            <span>{typeBadgeLabel}</span>
          </span>
        </div>

        {isSubmitted && (
          <span className="shrink-0">
            {isCorrect ? (
              <span className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30 shadow-2xs">
                <Check className="w-3.5 h-3.5" /> Correct (+10 pts)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/30 shadow-2xs">
                <XCircle className="w-3.5 h-3.5" /> Incorrect
              </span>
            )}
          </span>
        )}
      </div>

      {/* Scenario Callout */}
      {q.scenario && (
        <div
          className={cn(
            'p-3.5 rounded-xl border text-xs leading-relaxed space-y-1',
            isLight
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-100'
          )}
        >
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-black uppercase text-[10px] tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Workplace Incident Briefing</span>
          </div>
          <p
            className={
              isLight
                ? 'font-medium text-slate-800'
                : 'font-medium text-slate-200'
            }
          >
            {q.scenario}
          </p>
        </div>
      )}

      {/* Question Title */}
      <h4 className={cn('text-sm md:text-base leading-snug', titleColor)}>
        {q.question}
      </h4>

      {/* 1. Safe or Unsafe / True or False */}
      {(qType === 'safe-unsafe' || qType === 'true-false') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {['SAFE / TRUE', 'UNSAFE / FALSE'].map((label, optIdx) => {
            const isSelected = userChoice === optIdx;
            const isSafeBtn = optIdx === 0;

            let borderClass = isLight
              ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
              : isNebula
                ? 'border-purple-900/60 bg-[#120a28] hover:border-purple-700 text-purple-200'
                : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 text-slate-200';

            if (isSelected) {
              borderClass = isSafeBtn
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/40'
                : 'border-rose-500 bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold ring-2 ring-rose-500/40';
            }

            if (isSubmitted) {
              if (optIdx === q.correctAnswer) {
                borderClass =
                  'border-emerald-500 bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 font-bold';
              } else if (isSelected && !isCorrect) {
                borderClass =
                  'border-rose-500 bg-rose-500/25 text-rose-600 dark:text-rose-300 font-bold';
              }
            }

            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => !isSubmitted && onAnswer(optIdx)}
                disabled={isSubmitted}
                className={cn(
                  'p-4 rounded-xl border text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-98',
                  borderClass
                )}
              >
                {isSafeBtn ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                )}
                <span>
                  {q.options && q.options[optIdx] ? q.options[optIdx] : label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Drag & Drop Matching Pairs */}
      {(qType === 'match-hazard' ||
        qType === 'match-ppe' ||
        (q.pairs && q.pairs.length > 0)) && (
        <div className="space-y-3 pt-2">
          <p
            className={cn(
              'text-[11px] italic',
              isLight ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            Click an item on the left, then click its corresponding match on the
            right:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block px-1">
                Hazard / Task
              </span>
              {q.pairs?.map((p, pIdx) => {
                const isSelected = selectedLeftIdx === pIdx;
                const matchedRightIdx = pairMatches[pIdx];
                const hasMatch = matchedRightIdx !== undefined;

                return (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => !isSubmitted && setSelectedLeftIdx(pIdx)}
                    disabled={isSubmitted}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between gap-2',
                      isSelected
                        ? 'border-amber-500 bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold ring-2 ring-amber-500/40'
                        : hasMatch
                          ? isLight
                            ? 'border-slate-300 bg-slate-100 text-slate-900 font-semibold'
                            : 'border-slate-700 bg-slate-900/90 text-white'
                          : isLight
                            ? 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700'
                            : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-300'
                    )}
                  >
                    <span className="font-semibold">
                      {p.left ||
                        p.term ||
                        p.hazard ||
                        p.item ||
                        p.key ||
                        p.question ||
                        p.title ||
                        (typeof p === 'string' ? p : '')}
                    </span>
                    {hasMatch && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold shrink-0">
                        Linked #{matchedRightIdx + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 block px-1">
                Required Safety Control
              </span>
              {q.pairs?.map((p, rIdx) => {
                const linkedLeftIdx = Object.keys(pairMatches).find(
                  (lKey) => pairMatches[lKey] === rIdx
                );
                const isLinked = linkedLeftIdx !== undefined;

                return (
                  <button
                    key={rIdx}
                    type="button"
                    onClick={() => {
                      if (isSubmitted || selectedLeftIdx === null) return;
                      onAnswer({ ...pairMatches, [selectedLeftIdx]: rIdx });
                      setSelectedLeftIdx(null);
                    }}
                    disabled={isSubmitted}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between gap-2',
                      selectedLeftIdx !== null
                        ? 'border-amber-500/40 hover:border-amber-500 bg-amber-500/10 cursor-pointer'
                        : isLinked
                          ? isLight
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold'
                            : 'border-slate-700 bg-slate-900/90 text-emerald-300 font-semibold'
                          : isLight
                            ? 'border-slate-200 bg-slate-50 text-slate-700'
                            : 'border-slate-800 bg-slate-900/50 text-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] opacity-75 font-bold">
                        #{rIdx + 1}
                      </span>
                      <span>
                        {p.right ||
                          p.definition ||
                          p.control ||
                          p.match ||
                          p.answer ||
                          p.value ||
                          p.description ||
                          (typeof p === 'string' ? p : '')}
                      </span>
                    </div>
                    {isLinked && (
                      <Link2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Ordering Sequence */}
      {(qType === 'ordering' ||
        (q.sequenceItems && q.sequenceItems.length > 0)) && (
        <div className="space-y-2 pt-2">
          <p
            className={cn(
              'text-[11px] italic',
              isLight ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            Use arrows to arrange the steps in the correct safety order:
          </p>
          <div className="space-y-2">
            {currentSequence.map((itemIdx, posIdx) => {
              const stepText = q.sequenceItems[itemIdx];
              const isTargetPosCorrect =
                isSubmitted &&
                (q.correctOrder
                  ? q.correctOrder[posIdx] === itemIdx
                  : posIdx === itemIdx);

              return (
                <div
                  key={itemIdx}
                  className={cn(
                    'p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all',
                    isSubmitted
                      ? isTargetPosCorrect
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                        : 'border-rose-500/60 bg-rose-500/10 text-rose-800 dark:text-rose-200'
                      : isLight
                        ? 'border-slate-200 bg-slate-50 text-slate-800'
                        : 'border-slate-800 bg-slate-900/90 text-slate-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">
                      {posIdx + 1}
                    </span>
                    <span className="font-semibold">{stepText}</span>
                  </div>

                  {!isSubmitted && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveSequence(posIdx, posIdx - 1)}
                        disabled={posIdx === 0}
                        className={cn(
                          'p-1.5 rounded-lg disabled:opacity-30',
                          isLight
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        )}
                        title="Move Step Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSequence(posIdx, posIdx + 1)}
                        disabled={posIdx === currentSequence.length - 1}
                        className={cn(
                          'p-1.5 rounded-lg disabled:opacity-30',
                          isLight
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        )}
                        title="Move Step Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Spot the Hazard (Multi-Select) */}
      {(qType === 'spot-hazard' ||
        qType === 'hazard-spotting' ||
        (q.hazardList && q.hazardList.length > 0)) && (
        <div className="space-y-2 pt-2">
          <p
            className={cn(
              'text-[11px] italic',
              isLight ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            Check all items that represent an active hazard or regulatory
            violation:
          </p>
          <div className="space-y-2">
            {q.hazardList?.map((h, hIdx) => {
              const isChecked =
                Array.isArray(userChoice) && userChoice.includes(hIdx);
              const itemText =
                h.text || h.label || h.item || `Hazard Item #${hIdx + 1}`;
              let itemBorder = isLight
                ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 text-slate-200';

              if (isChecked) {
                itemBorder = isLight
                  ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                  : 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold';
              }

              return (
                <button
                  key={hIdx}
                  type="button"
                  onClick={() => handleToggleHazard(hIdx)}
                  disabled={isSubmitted}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border text-xs flex items-center gap-3 transition-all',
                    itemBorder
                  )}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="flex-1">{itemText}</span>
                  {isSubmitted && (h.isHazard ?? true) && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold uppercase shrink-0">
                      Hazard
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Inspection Challenge / Checklist */}
      {(qType === 'inspection-challenge' ||
        qType === 'checklist' ||
        (q.checklist && q.checklist.length > 0)) && (
        <div className="space-y-2 pt-2">
          <p
            className={cn(
              'text-[11px] italic',
              isLight ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            Inspect each equipment component and mark PASS or DEFECT:
          </p>
          <div className="space-y-2.5">
            {q.checklist?.map((c, cIdx) => {
              const currentStatus =
                (typeof userChoice === 'object' &&
                  userChoice &&
                  userChoice[cIdx]) ||
                null;
              const isPass =
                currentStatus === 'PASS' ||
                (currentStatus === null && c.status === 'PASS');
              const isDefect = currentStatus === 'DEFECT';
              const itemText =
                c.item ||
                c.label ||
                c.text ||
                `Checklist Component #${cIdx + 1}`;

              return (
                <div
                  key={cIdx}
                  className={cn(
                    'p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs',
                    isLight
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-slate-800 bg-slate-900/80'
                  )}
                >
                  <span
                    className={cn(
                      'font-medium flex-1',
                      isLight ? 'text-slate-800' : 'text-slate-200'
                    )}
                  >
                    {itemText}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleInspection(cIdx, 'PASS')}
                      disabled={isSubmitted}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border font-black text-[11px] transition-all flex items-center gap-1',
                        isPass
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : isLight
                            ? 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      )}
                    >
                      <Check className="w-3 h-3" /> PASS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleInspection(cIdx, 'DEFECT')}
                      disabled={isSubmitted}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border font-black text-[11px] transition-all flex items-center gap-1',
                        isDefect
                          ? 'border-rose-500 bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          : isLight
                            ? 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      )}
                    >
                      <XCircle className="w-3 h-3" /> DEFECT
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Standard Multiple Choice / Scenario */}
      {![
        'safe-unsafe',
        'true-false',
        'match-hazard',
        'match-ppe',
        'matching',
        'ordering',
        'sequence',
        'spot-hazard',
        'hazard-spotting',
        'inspection-challenge',
        'checklist',
      ].includes(qType) &&
        !q.pairs &&
        !q.sequenceItems &&
        !q.hazardList &&
        !q.checklist && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {q.options?.map((opt, optIdx) => {
              const isSelected = userChoice === optIdx;
              let borderClass = isLight
                ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                : isNebula
                  ? 'border-purple-900/60 bg-[#120a28] hover:border-purple-700 text-purple-200'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-200';

              if (isSelected) {
                borderClass = isLight
                  ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/30'
                  : 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold ring-2 ring-amber-500/30';
              }
              if (isSubmitted) {
                if (optIdx === q.correctAnswer) {
                  borderClass =
                    'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold';
                } else if (isSelected && !isCorrect) {
                  borderClass =
                    'border-rose-500 bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold';
                }
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => !isSubmitted && onAnswer(optIdx)}
                  disabled={isSubmitted}
                  className={cn(
                    'text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center gap-2.5 shadow-2xs active:scale-98',
                    borderClass
                  )}
                >
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {isAdminMode &&
                    !isSubmitted &&
                    optIdx === q.correctAnswer && (
                      <span className="ml-auto px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-black uppercase border border-emerald-500/30">
                        PRO Answer Key
                      </span>
                    )}
                </button>
              );
            })}
          </div>
        )}

      {/* Explanation Banner */}
      {isSubmitted && q.explanation && (
        <div
          className={cn(
            'p-3.5 rounded-xl border text-xs leading-relaxed animate-in fade-in space-y-1',
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-slate-900 border-amber-500/30 text-amber-200'
          )}
        >
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Safety Rule & Regulatory Rationale:</span>
          </div>
          <p className={isLight ? 'text-slate-600' : 'text-slate-300'}>
            {q.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3 ACCREDITED LMS PLAYER THEMES
// ============================================================================
export const PLAYER_THEMES = {
  light: {
    id: 'light',
    name: 'Studio Light',
    icon: '☀️',
    bgClass: 'bg-[#f4f6f9] text-slate-900',
    headerBg: 'bg-white border-slate-200 text-slate-900 shadow-sm',
    sidebarBg: 'bg-white border-slate-200 text-slate-900',
    sidebarItemBg:
      'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700',
    sidebarActiveBg:
      'bg-amber-500/15 border-2 border-amber-500 text-amber-950 font-black shadow-xs ring-1 ring-amber-400/30',
    cardBg: 'bg-white border-slate-200 text-slate-900 shadow-sm',
    panelBg: 'bg-white border-slate-200 text-slate-900 shadow-xl',
    accentColor: '#f59e0b',
    borderClass: 'border-slate-200',
    buttonClass:
      'bg-white text-slate-800 hover:bg-slate-100 border-slate-300 shadow-2xs',
    primaryButtonClass:
      'bg-[#ffc800] hover:bg-[#ffe033] text-slate-950 font-black shadow-md',
    isDark: false,
  },
  dark: {
    id: 'dark',
    name: 'Dark Obsidian',
    icon: '🌙',
    bgClass: 'bg-[#090d16] text-slate-100',
    headerBg: 'bg-[#0f172a] border-slate-800 text-slate-100 shadow-md',
    sidebarBg: 'bg-[#0f172a] border-slate-800 text-slate-100',
    sidebarItemBg:
      'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 text-slate-300',
    sidebarActiveBg:
      'bg-blue-950/70 border-2 border-blue-500 text-sky-200 font-bold shadow-lg ring-1 ring-blue-500/40',
    cardBg: 'bg-[#0f172a] border-slate-800 text-slate-100 shadow-xl',
    panelBg: 'bg-[#0f172a] border-slate-800 text-slate-100 shadow-2xl',
    accentColor: '#f59e0b',
    borderClass: 'border-slate-800',
    buttonClass:
      'bg-slate-900 text-slate-100 hover:bg-slate-800 border-slate-700 shadow-2xs',
    primaryButtonClass:
      'bg-[#ffc800] hover:bg-[#ffe033] text-slate-950 font-black shadow-md',
    isDark: true,
  },
  nebula: {
    id: 'nebula',
    name: 'Cosmic Nebula',
    icon: '🌌',
    bgClass: 'bg-[#080816] text-[#f1f5f9]',
    headerBg:
      'bg-[#0e0f29]/95 border-indigo-900/40 text-white backdrop-blur-md',
    sidebarBg:
      'bg-[#0f1026]/90 border-indigo-900/40 text-white backdrop-blur-md',
    sidebarItemBg:
      'bg-indigo-950/40 border-indigo-900/40 hover:bg-indigo-900/50',
    sidebarActiveBg:
      'bg-purple-600/30 border-2 border-purple-500 text-purple-200 shadow-purple-500/10 ring-1 ring-purple-400/40',
    cardBg:
      'bg-[#131432]/85 border-indigo-500/30 text-white shadow-xl backdrop-blur-md',
    panelBg: 'bg-[#10132e]/95 border-indigo-900/60 text-white shadow-2xl',
    accentColor: '#a855f7',
    borderClass: 'border-indigo-900/50',
    buttonClass:
      'bg-slate-950/80 text-indigo-200 hover:text-white hover:bg-indigo-950/80 border-indigo-500/40',
    primaryButtonClass:
      'bg-[#ffc800] hover:bg-[#ffe033] text-slate-950 font-black shadow-md',
    gradientOverlay:
      'radial-gradient(circle at 15% 15%, rgba(168, 85, 247, 0.15), transparent 45%), radial-gradient(circle at 85% 85%, rgba(6, 182, 212, 0.12), transparent 45%)',
    isDark: true,
  },
  coastal: {
    id: 'coastal',
    name: 'Coastal Blue',
    icon: '🌊',
    bgClass: 'bg-[#03111f] text-[#e2f0fb]',
    headerBg: 'bg-[#051c33]/95 border-cyan-900/40 text-white backdrop-blur-sm',
    sidebarBg: 'bg-[#041624]/90 border-cyan-900/40 text-white',
    sidebarItemBg: 'bg-cyan-950/40 border-cyan-900/40 hover:bg-cyan-900/40',
    sidebarActiveBg:
      'bg-cyan-600/25 border-2 border-cyan-400 text-cyan-100 font-bold ring-1 ring-cyan-400/30',
    cardBg: 'bg-[#05182e]/80 border-cyan-800/30 text-white shadow-xl',
    panelBg: 'bg-[#041421]/95 border-cyan-900/50 text-white shadow-2xl',
    accentColor: '#06b6d4',
    borderClass: 'border-cyan-900/50',
    buttonClass:
      'bg-cyan-950/60 text-cyan-200 hover:text-white hover:bg-cyan-900/60 border-cyan-800/60',
    primaryButtonClass:
      'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-md',
    gradientOverlay:
      'radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.12), transparent 50%), radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.10), transparent 50%)',
    isDark: true,
  },
  forest: {
    id: 'forest',
    name: 'Forest Safety',
    icon: '🌿',
    bgClass: 'bg-[#03130a] text-[#e2f7ec]',
    headerBg:
      'bg-[#051a0e]/95 border-emerald-900/40 text-white backdrop-blur-sm',
    sidebarBg: 'bg-[#061408]/90 border-emerald-900/50 text-white',
    sidebarItemBg:
      'bg-emerald-950/40 border-emerald-900/40 hover:bg-emerald-900/40',
    sidebarActiveBg:
      'bg-emerald-600/25 border-2 border-emerald-400 text-emerald-100 font-bold ring-1 ring-emerald-400/30',
    cardBg: 'bg-[#061209]/80 border-emerald-800/30 text-white shadow-xl',
    panelBg: 'bg-[#050f07]/95 border-emerald-900/50 text-white shadow-2xl',
    accentColor: '#10b981',
    borderClass: 'border-emerald-900/50',
    buttonClass:
      'bg-emerald-950/60 text-emerald-200 hover:text-white hover:bg-emerald-900/60 border-emerald-800/60',
    primaryButtonClass:
      'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md',
    gradientOverlay:
      'radial-gradient(circle at 25% 75%, rgba(16, 185, 129, 0.10), transparent 50%), radial-gradient(circle at 75% 25%, rgba(5, 150, 105, 0.08), transparent 50%)',
    isDark: true,
  },
  crimson: {
    id: 'crimson',
    name: 'Hazard Alert',
    icon: '🚨',
    bgClass: 'bg-[#160306] text-[#fef2f2]',
    headerBg: 'bg-[#1f0308]/95 border-rose-900/40 text-white backdrop-blur-sm',
    sidebarBg: 'bg-[#190205]/90 border-rose-900/50 text-white',
    sidebarItemBg: 'bg-rose-950/40 border-rose-900/40 hover:bg-rose-900/40',
    sidebarActiveBg:
      'bg-rose-700/30 border-2 border-rose-400 text-rose-100 font-bold ring-1 ring-rose-400/30',
    cardBg: 'bg-[#1a0205]/80 border-rose-800/30 text-white shadow-xl',
    panelBg: 'bg-[#160104]/95 border-rose-900/50 text-white shadow-2xl',
    accentColor: '#f43f5e',
    borderClass: 'border-rose-900/50',
    buttonClass:
      'bg-rose-950/60 text-rose-200 hover:text-white hover:bg-rose-900/60 border-rose-800/60',
    primaryButtonClass:
      'bg-rose-500 hover:bg-rose-400 text-white font-black shadow-md',
    gradientOverlay:
      'radial-gradient(circle at 20% 80%, rgba(244, 63, 94, 0.12), transparent 50%), radial-gradient(circle at 80% 20%, rgba(159, 18, 57, 0.08), transparent 50%)',
    isDark: true,
  },
};

export function ProfessionalCoursePlayerModal({
  isOpen,
  onClose,
  initialCourseData = null,
  isAdminMode: propIsAdminMode = undefined,
}) {
  // ── State Management ──
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('hazwoper_player_theme');
      if (savedTheme && PLAYER_THEMES[savedTheme]) return savedTheme;
    }
    return 'dark';
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // TOC Display Mode: 'auto' (5s auto-peek), 'pinned' (always open), 'closed' (always closed)
  const [tocMode, setTocMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hazwoper_player_toc_mode') || 'auto';
    }
    return 'auto';
  });
  const tocTimerRef = useRef(null);

  // Slide Progression & Locking (1-by-1 for Student, Free Nav for Admin)
  const [unlockedSlideIndex, setUnlockedSlideIndex] = useState(() => {
    if (typeof window !== 'undefined' && initialCourseData?.id) {
      const saved = localStorage.getItem(
        `hazwoper_unlocked_${initialCourseData.id}`
      );
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [isAdminMode, setIsAdminMode] = useState(() => {
    if (typeof propIsAdminMode === 'boolean') return propIsAdminMode;
    if (
      typeof window !== 'undefined' &&
      window.location.pathname.includes('/admin')
    ) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (typeof propIsAdminMode === 'boolean') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAdminMode(propIsAdminMode);
    } else if (
      typeof window !== 'undefined' &&
      window.location.pathname.includes('/admin')
    ) {
      setIsAdminMode(true);
    }
  }, [propIsAdminMode]);

  const [paywallModalOpen, setPaywallModalOpen] = useState(false);

  // Content Loader State on Slide Transition
  const [isSlideLoading, setIsSlideLoading] = useState(false);

  // Audio Narration & Closed Captions Sync State
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [continuousAudio, setContinuousAudio] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [currentCaptionText, setCurrentCaptionText] = useState('');
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [magnifierEnabled, setMagnifierEnabled] = useState(true);

  // 5-Second Auto-Hide Controls Bar on Mouse Idle
  const [showControls, setShowControls] = useState(true);
  const mouseIdleTimerRef = useRef(null);

  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    if (mouseIdleTimerRef.current) clearTimeout(mouseIdleTimerRef.current);
    mouseIdleTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 5000);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleUserActivity();
    return () => {
      if (mouseIdleTimerRef.current) clearTimeout(mouseIdleTimerRef.current);
    };
  }, [isOpen, handleUserActivity]);

  // Auto-scroll text container smoothly row-by-row during voice narration
  useEffect(() => {
    if (isSpeaking && containerRef.current && currentSegmentIndex > 0) {
      const scrollStep = currentSegmentIndex * 35;
      containerRef.current.scrollTo({
        top: scrollStep,
        behavior: 'smooth',
      });
    }
  }, [currentSegmentIndex, isSpeaking]);

  // ZoomText Magnifier / Reader 2026 with SMA State
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [zoomTextMode, setZoomTextMode] = useState('focus_box');
  const [lensShape, setLensShape] = useState('circle'); // 'circle' | 'focus_box' | 'line_reader'
  const [autoFollowTTS, setAutoFollowTTS] = useState(true);
  const [showFocusRuler, setShowFocusRuler] = useState(true);
  const [zoomHighContrast, setZoomHighContrast] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 250, y: 180 });

  // Accessibility State
  const [textSize, setTextSize] = useState('M');

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [finalExamPassed, setFinalExamPassed] = useState(false);

  // Lightbox Image Preview State
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  // Navigation & Tree Expansion State (Single-accordion: only current slide's module & lesson open)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [expandedModules, setExpandedModules] = useState({});
  const [expandedLessons, setExpandedLessons] = useState({});

  const tocContainerRef = useRef(null);

  // Auto-scroll TOC sidebar to keep active running topic at top
  useEffect(() => {
    if (!isOpen) return;
    const activeEl = tocContainerRef.current?.querySelector(
      '[data-toc-active="true"]'
    );
    if (activeEl && tocContainerRef.current) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentSlideIndex, isOpen]);

  const containerRef = useRef(null);
  const narratorRef = useRef(null);
  const continuousAudioRef = useRef(continuousAudio);
  const currentSlideIndexRef = useRef(currentSlideIndex);
  const flatSlidesRef = useRef([]);
  const transitionTimeoutRef = useRef(null);

  useEffect(() => {
    continuousAudioRef.current = continuousAudio;
  }, [continuousAudio]);

  useEffect(() => {
    currentSlideIndexRef.current = currentSlideIndex;
  }, [currentSlideIndex]);

  const handleSetTheme = (themeId) => {
    setCurrentThemeId(themeId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hazwoper_player_theme', themeId);
    }
  };

  const handleSetTocMode = (mode) => {
    setTocMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hazwoper_player_toc_mode', mode);
    }
    if (tocTimerRef.current) clearTimeout(tocTimerRef.current);
    if (mode === 'auto') {
      setSidebarOpen(true);
      tocTimerRef.current = setTimeout(() => setSidebarOpen(false), 5000);
    } else if (mode === 'pinned') {
      setSidebarOpen(true);
    } else if (mode === 'closed') {
      setSidebarOpen(false);
    }
  };

  const currentTheme = PLAYER_THEMES[currentThemeId] || PLAYER_THEMES.dark;

  // Mandatory Seat Time Tracking State (OSHA Compliance)
  const initialCourse = initialCourseData || {};
  const requiredSeatTimeSeconds = useMemo(() => {
    if (
      typeof initialCourse.duration === 'number' &&
      initialCourse.duration >= 60
    ) {
      return initialCourse.duration;
    }
    const dVal =
      parseFloat(initialCourse.durationHours) ||
      (parseFloat(initialCourse.duration)
        ? parseFloat(initialCourse.duration)
        : 2);
    return Math.round(dVal * 3600);
  }, [initialCourse.duration, initialCourse.durationHours]);

  const [courseElapsedSeconds, setCourseElapsedSeconds] = useState(() => {
    if (typeof window !== 'undefined' && initialCourse?.id) {
      try {
        const saved = localStorage.getItem(
          `hazwoper_seat_time_${initialCourse.id}`
        );
        if (saved) return parseInt(saved, 10) || 0;
      } catch {}
    }
    return 0;
  });

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCourseElapsedSeconds((prev) => {
        const next = prev + 1;
        if (
          typeof window !== 'undefined' &&
          initialCourse?.id &&
          next % 5 === 0
        ) {
          try {
            localStorage.setItem(
              `hazwoper_seat_time_${initialCourse.id}`,
              String(next)
            );
          } catch {}
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, initialCourse?.id]);

  const isSeatTimeSatisfied = courseElapsedSeconds >= requiredSeatTimeSeconds;
  const seatTimeRemainingSeconds = Math.max(
    0,
    requiredSeatTimeSeconds - courseElapsedSeconds
  );

  // Normalize course structure and ensure all lessons have interactive quizzes
  const course = useMemo(() => {
    let base;
    if (
      initialCourseData &&
      initialCourseData.modules &&
      initialCourseData.modules.length > 0
    ) {
      base = initialCourseData;
    } else {
      base = {
        id: 'default_course',
        title: 'OSHA Safety & HAZWOPER Training Program',
        modules: [
          {
            id: 'm1',
            title: 'Module 1: Safety Fundamentals',
            lessons: [
              {
                id: 'l1',
                title: 'Lesson 1: Regulatory Scope',
                topics: [
                  {
                    id: 't1',
                    title: 'Scope & Standards',
                    content:
                      '<p>Comprehensive regulatory standards for safety and compliance.</p>',
                  },
                  {
                    id: 't2',
                    title: 'Hazard Recognition',
                    content:
                      '<p>Identifying and mitigating workplace physical and chemical hazards.</p>',
                  },
                ],
              },
            ],
          },
        ],
      };
    }
    // Auto-inject quizzes for any lessons missing them and final exam if absent
    return ensureCourseQuizzes(base);
  }, [initialCourseData]);

  // Flatten course into slides
  const flatSlides = useMemo(() => {
    const slides = [];
    let globalIndex = 1;

    // In student preview / demo mode (!isAdminMode), show Module 1 -> Lesson 1 (9 Topics + 1 Summary + 1 Quiz + Unlock CTA)
    if (!isAdminMode) {
      const demo = buildDemoCourseLesson1(course);

      // 1. The 9 Core Instructional Content Topics
      demo.topics.forEach((top, tIdx) => {
        slides.push({
          id: `slide_${top.id || `demo_${tIdx + 1}`}`,
          globalIndex: globalIndex++,
          type: 'content',
          moduleId: demo.moduleId,
          moduleTitle: demo.moduleTitle,
          lessonId: demo.lessonId,
          lessonTitle: demo.lessonTitle,
          topicId: top.id,
          title: top.title || `Topic ${tIdx + 1}`,
          content: top.content,
          imageUrl: top.imageUrl || null,
          frameType: top.frameType || 2,
          badge: top.badge || `Topic ${tIdx + 1}`,
          cards: top.cards || [],
        });
      });

      // 2. The 1 Dedicated Lesson Summary & Key Takeaways Slide
      slides.push({
        id: `slide_${demo.summaryTopic.id}`,
        globalIndex: globalIndex++,
        type: 'content',
        moduleId: demo.moduleId,
        moduleTitle: demo.moduleTitle,
        lessonId: demo.lessonId,
        lessonTitle: demo.lessonTitle,
        topicId: demo.summaryTopic.id,
        title: demo.summaryTopic.title,
        content: demo.summaryTopic.content,
        imageUrl: demo.summaryTopic.imageUrl || null,
        frameType: demo.summaryTopic.frameType || 2,
        badge: demo.summaryTopic.badge,
        cards: demo.summaryTopic.cards || [],
      });

      // 3. The 1 Interactive Practice Quiz Slide
      slides.push({
        id: `quiz_demo_lesson_1`,
        globalIndex: globalIndex++,
        type: 'quiz',
        moduleId: demo.moduleId,
        moduleTitle: demo.moduleTitle,
        lessonId: demo.lessonId,
        lessonTitle: demo.lessonTitle,
        title:
          demo.quiz.title || `${demo.lessonTitle} - Interactive Practice Quiz`,
        quizData: demo.quiz,
        badge: 'Interactive Practice Quiz',
      });

      // 4. The Unlock Full Course Milestone CTA Slide
      slides.push({
        id: 'enrollment_milestone_cta',
        globalIndex: globalIndex++,
        type: 'enrollment-cta',
        moduleId: demo.moduleId,
        moduleTitle: demo.moduleTitle,
        lessonId: demo.lessonId,
        lessonTitle: demo.lessonTitle,
        title: `Enroll in ${course.title || 'Course'} to Unlock Full Training`,
        badge: 'Course Enrollment',
        imageUrl: course.thumbnail || null,
      });

      return slides;
    }

    // Full Course (Admin Mode / Enrolled Mode)
    course.modules?.forEach((mod, mIdx) => {
      mod.lessons?.forEach((lesson, lIdx) => {
        const isLessonIntro =
          lesson.isIntroduction || (mIdx === 0 && lIdx === 0);

        lesson.topics?.forEach((top, tIdx) => {
          slides.push({
            id: `slide_${top.id || `${mIdx}_${lIdx}_${tIdx}`}`,
            globalIndex: globalIndex++,
            type: 'content',
            moduleId: mod.id,
            moduleTitle: mod.title,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            topicId: top.id,
            title: top.title || `Topic ${tIdx + 1}`,
            content: top.content,
            imageUrl: top.imageUrl || null,
            frameType: top.frameType || 2,
            badge: top.badge || `Topic ${tIdx + 1}`,
            cards: top.cards || [],
          });
        });

        // 6-Question Practice Quiz for non-intro lessons
        if (
          lesson.quiz &&
          !isLessonIntro &&
          lesson.quiz.questions?.length > 0
        ) {
          slides.push({
            id: `quiz_${lesson.id}`,
            globalIndex: globalIndex++,
            type: 'quiz',
            moduleId: mod.id,
            moduleTitle: mod.title,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            title: lesson.quiz.title || `${lesson.title} Practice Quiz`,
            quizData: lesson.quiz,
            badge: 'Formative Assessment',
          });
        }
      });
    });

    // Compulsory Final Exam
    if (course.finalExam && course.finalExam.questions?.length > 0) {
      slides.push({
        id: 'compulsory_final_exam',
        globalIndex: globalIndex++,
        type: 'final-exam',
        title: course.finalExam.title || 'Compulsory Final Examination',
        quizData: course.finalExam,
        badge: 'Accreditation Exam',
      });
    }

    return slides;
  }, [course, isAdminMode]);

  useEffect(() => {
    flatSlidesRef.current = flatSlides;
  }, [flatSlides]);

  const currentSlide = flatSlides[currentSlideIndex] || flatSlides[0] || {};

  // Check if a slide is unlocked for student preview
  const isSlideUnlocked = useCallback(
    (idx) => {
      if (isAdminMode) return true;
      const slide = flatSlides[idx];
      if (!slide) return false;
      return true;
    },
    [isAdminMode, flatSlides]
  );

  // Auto-expand TOC tree for ONLY the current active slide (automatically closes all other accordions)
  useEffect(() => {
    if (currentSlide) {
      const activeMod = currentSlide.moduleId;
      const activeLes = currentSlide.lessonId;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedModules(activeMod ? { [activeMod]: true } : {});
      setExpandedLessons(activeLes ? { [activeLes]: true } : {});
    }
  }, [currentSlideIndex, currentSlide]);

  // Navigation handlers
  const handlePrevSlide = () => {
    if (transitionTimeoutRef.current)
      clearTimeout(transitionTimeoutRef.current);
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleNextSlide = () => {
    if (transitionTimeoutRef.current)
      clearTimeout(transitionTimeoutRef.current);
    if (currentSlideIndex < flatSlides.length - 1) {
      const nextIdx = currentSlideIndex + 1;
      if (!isSlideUnlocked(nextIdx)) {
        setPaywallModalOpen(true);
        if (narrationEnabled && narratorRef.current) {
          narratorRef.current.stop();
          setIsSpeaking(false);
        }
        return;
      }
      setCurrentSlideIndex(nextIdx);
      setUnlockedSlideIndex((prev) => {
        const nextUnlocked = Math.max(prev, nextIdx);
        if (typeof window !== 'undefined' && initialCourseData?.id) {
          localStorage.setItem(
            `hazwoper_unlocked_${initialCourseData.id}`,
            String(nextUnlocked)
          );
        }
        return nextUnlocked;
      });
    }
  };

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleContinuousSlideEnd = useCallback(() => {
    const current = flatSlidesRef.current[currentSlideIndexRef.current];
    // DO NOT autoplay / auto-advance on quiz or final exam slides
    if (current?.type === 'quiz' || current?.type === 'final-exam') {
      return;
    }

    if (continuousAudioRef.current) {
      if (currentSlideIndexRef.current < flatSlidesRef.current.length - 1) {
        const nextIdx = currentSlideIndexRef.current + 1;
        if (!isSlideUnlocked(nextIdx)) {
          setPaywallModalOpen(true);
          return;
        }
        transitionTimeoutRef.current = setTimeout(() => {
          setCurrentSlideIndex(nextIdx);
          setUnlockedSlideIndex((prev) => {
            const nextUnlocked = Math.max(prev, nextIdx);
            if (typeof window !== 'undefined' && initialCourseData?.id) {
              localStorage.setItem(
                `hazwoper_unlocked_${initialCourseData.id}`,
                String(nextUnlocked)
              );
            }
            return nextUnlocked;
          });
        }, 1200);
      }
    }
  }, [initialCourseData?.id, isSlideUnlocked]);

  // Initialize TTS Engine
  useEffect(() => {
    if (!isOpen) return;

    narratorRef.current = new CourseNarrator({
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        setCurrentCaptionText('');
        setCurrentSegmentIndex(0);
        handleContinuousSlideEnd();
      },
      onSegmentChange: (idx, total, text) => {
        setCurrentSegmentIndex(idx);
        setCurrentCaptionText(text);
      },
      onError: () => {
        setIsSpeaking(false);
        setCurrentCaptionText('');
        setCurrentSegmentIndex(0);
      },
    });

    if (narratorRef.current) {
      const v = narratorRef.current.getVoices();
      setAvailableVoices(v);
      if (v.length > 0 && !selectedVoice) {
        setSelectedVoice(narratorRef.current.selectedVoice || v[0]);
      }
    }

    return () => {
      if (transitionTimeoutRef.current)
        clearTimeout(transitionTimeoutRef.current);
      narratorRef.current?.stop();
    };
  }, [isOpen, handleContinuousSlideEnd]);

  // Ensure all audio is cleanly terminated when modal closes
  useEffect(() => {
    if (!isOpen) {
      narratorRef.current?.stop();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPlaying(false);
      setIsSpeaking(false);
      setCurrentCaptionText('');
    }
  }, [isOpen]);

  // Dynamic voice & rate synchronization
  useEffect(() => {
    if (narratorRef.current && selectedVoice) {
      narratorRef.current.setVoice(selectedVoice);
    }
  }, [selectedVoice]);

  useEffect(() => {
    if (narratorRef.current && playbackSpeed) {
      narratorRef.current.setRate(playbackSpeed);
    }
  }, [playbackSpeed]);

  // Slide Switch Effect: Dynamic duration calculation + Auto-Peek TOC + TTS Trigger
  useEffect(() => {
    if (!isOpen) return;

    // Reset caption & segment state on slide change
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentCaptionText('');
    setCurrentSegmentIndex(0);

    // Smooth content transition loader
    setIsSlideLoading(true);
    const loadTimer = setTimeout(() => setIsSlideLoading(false), 200);

    // Auto-Peek TOC or apply mode
    if (tocTimerRef.current) clearTimeout(tocTimerRef.current);
    if (tocMode === 'auto') {
      setSidebarOpen(true);
      tocTimerRef.current = setTimeout(() => {
        setSidebarOpen(false);
      }, 5000);
    } else if (tocMode === 'pinned') {
      setSidebarOpen(true);
    } else if (tocMode === 'closed') {
      setSidebarOpen(false);
    }

    setCurrentTime(0);
    // Real dynamic duration matching the slide's exact spoken word count
    const dynamicSeconds = calculateSlideDuration(
      currentSlide,
      currentSlide.title
    );
    setDuration(dynamicSeconds);
    setIsPlaying(true);
    setQuizSubmitted(false);

    if (narrationEnabled && narratorRef.current && currentSlide) {
      const slideToSpeak =
        typeof currentSlide === 'object' && currentSlide !== null
          ? {
              ...currentSlide,
              pronunciationDictionary:
                initialCourseData?.pronunciationDictionary ||
                currentSlide.pronunciationDictionary,
            }
          : currentSlide;
      narratorRef.current.speak(slideToSpeak, currentSlide.title);
      setIsSpeaking(true);
    } else {
      narratorRef.current?.stop();
      setIsSpeaking(false);
      setCurrentCaptionText('');
    }

    return () => {
      clearTimeout(loadTimer);
      if (tocTimerRef.current) clearTimeout(tocTimerRef.current);
    };
  }, [currentSlideIndex, currentSlide, narrationEnabled, isOpen, tocMode]);

  // Synchronized Play/Pause Handler for Voice Narration & Progress Timer
  const handleTogglePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setIsSpeaking(false);
      narratorRef.current?.pause();
    } else {
      setIsPlaying(true);
      if (currentTime >= duration) {
        setCurrentTime(0);
      }
      if (narrationEnabled && currentSlide) {
        setIsSpeaking(true);
        if (narratorRef.current?.isPaused) {
          narratorRef.current?.resume();
        } else {
          const slideToSpeak =
            typeof currentSlide === 'object' && currentSlide !== null
              ? {
                  ...currentSlide,
                  pronunciationDictionary:
                    initialCourseData?.pronunciationDictionary ||
                    currentSlide.pronunciationDictionary,
                }
              : currentSlide;
          narratorRef.current?.speak(slideToSpeak, currentSlide.title);
        }
      }
    }
  };

  // Timer simulation with strict pause/stop synchronization
  useEffect(() => {
    let interval = null;
    if (isPlaying && isOpen) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            setIsSpeaking(false);
            narratorRef.current?.stop();
            return duration;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isOpen, duration, playbackSpeed]);

  // Global Keyboard Shortcuts (WCAG 2.1 AA / Screen Reader & Keyboard Navigation)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Ignore if user is inside a form control
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        setSettingsOpen((prev) => !prev);
      } else if (e.code === 'Escape') {
        if (activeLightboxImage) {
          setActiveLightboxImage(null);
        } else if (settingsOpen) {
          setSettingsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    activeLightboxImage,
    settingsOpen,
    currentSlideIndex,
    flatSlides.length,
    narrationEnabled,
    currentSlide,
    isPlaying,
    duration,
    currentTime,
    playbackSpeed,
  ]);

  if (!isOpen) return null;

  const handleToggleNarration = () => {
    if (narrationEnabled) {
      narratorRef.current?.stop();
      setNarrationEnabled(false);
      setIsSpeaking(false);
      setCurrentCaptionText('');
    } else {
      setNarrationEnabled(true);
      if (currentSlide && isPlaying) {
        const slideToSpeak =
          typeof currentSlide === 'object' && currentSlide !== null
            ? {
                ...currentSlide,
                pronunciationDictionary:
                  initialCourseData?.pronunciationDictionary ||
                  currentSlide.pronunciationDictionary,
              }
            : currentSlide;
        narratorRef.current?.speak(slideToSpeak, currentSlide.title);
        setIsSpeaking(true);
      }
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatSeatTime = (totalSecs) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = Math.floor(totalSecs % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuizQuestions = currentSlide.quizData?.questions || [];
  const correctCount = currentQuizQuestions.reduce((acc, q, idx) => {
    return checkQuestionCorrect(q, quizAnswers[idx]) ? acc + 1 : acc;
  }, 0);
  const quizScore =
    currentQuizQuestions.length > 0
      ? Math.round((correctCount / currentQuizQuestions.length) * 100)
      : 100;
  const isPassed = quizScore >= (currentSlide.quizData?.passingScore || 70);

  return (
    <AnimatePresence>
      <div
        onMouseMove={handleUserActivity}
        onClick={handleUserActivity}
        className={cn(
          'fixed inset-0 z-[99999] flex flex-col font-sans overflow-hidden animate-in fade-in duration-200 transition-colors',
          currentTheme.bgClass
        )}
        style={
          currentTheme.gradientOverlay
            ? { backgroundImage: currentTheme.gradientOverlay }
            : {}
        }
      >
        {/* ============================================================================ */}
        {/* TOP ACCREDITED PLAYER HEADER BAR                                             */}
        {/* ============================================================================ */}
        <header
          className={cn(
            'h-16 px-4 md:px-6 border-b flex items-center justify-between shrink-0 z-30 shadow-md transition-all duration-300 opacity-100 pointer-events-auto',
            currentTheme.headerBg
          )}
        >
          {/* Left Side: Menu icon ☰, Title & Subtitle */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                'p-2 rounded-xl border transition-all shadow-2xs active:scale-95',
                currentTheme.buttonClass
              )}
              title="Toggle Curriculum Outline"
            >
              <Menu className="w-5 h-5 text-amber-500" />
            </button>

            <div className="flex flex-col min-w-0 pl-1">
              <h1 className="text-sm md:text-base font-extrabold tracking-tight truncate max-w-xs md:max-w-md">
                {course.title}
              </h1>
              <div className="flex items-center gap-2 text-[10px] md:text-[11px] opacity-85 truncate font-medium text-slate-500 dark:text-slate-400">
                {!isAdminMode && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-500 border border-amber-500/30 uppercase shrink-0">
                    Demo Course
                  </span>
                )}
                <span className="truncate">
                  {currentSlide.lessonTitle || 'Lesson 1'}
                </span>
                <span>•</span>
                <span className="truncate">
                  {formatCleanTopicTitle(currentSlide.title)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Seat Time, Fullscreen, Settings Gear, Exit */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector */}
            <div
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold"
              style={{
                borderColor: `${currentTheme.accentColor}30`,
                backgroundColor: `${currentTheme.accentColor}08`,
                color: currentTheme.isDark ? '#e2e8f0' : '#1e293b',
              }}
            >
              <Globe
                className="w-3.5 h-3.5"
                style={{ color: currentTheme.accentColor }}
              />
              <span>🇺🇸 English</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </div>

            {/* Mandatory Seat Time Badge */}
            <div
              className={cn(
                'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold shadow-2xs',
                isSeatTimeSatisfied
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              )}
              title={`Seat Time: ${formatSeatTime(courseElapsedSeconds)} / ${formatSeatTime(requiredSeatTimeSeconds)}`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">
                {formatSeatTime(courseElapsedSeconds)}
              </span>
            </div>

            {/* Native Fullscreen Toggle */}
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen?.();
                } else {
                  document.exitFullscreen?.();
                }
              }}
              className={cn(
                'p-2 rounded-xl border transition-all shadow-2xs active:scale-95',
                currentTheme.buttonClass
              )}
              title="Toggle Fullscreen (F11)"
            >
              <Maximize className="w-4 h-4" />
            </button>

            {/* Settings Gear Button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className={cn(
                'p-2 rounded-xl border transition-all shadow-2xs active:scale-95',
                currentTheme.buttonClass
              )}
              title="Player Preferences & Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Exit Player Button */}
            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded-xl border transition-all shadow-2xs hover:text-rose-500 hover:border-rose-500/40',
                currentTheme.buttonClass
              )}
              title="Exit Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ============================================================================ */}
        {/* MAIN BODY: HIERARCHICAL TOC TREE + CONTENT CANVAS / QUIZ / EXAM              */}
        {/* ============================================================================ */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* ── LEFT SIDEBAR / TOC (HIERARCHICAL TREE) ── */}
          <aside
            className={cn(
              'w-84 md:w-96 border-r flex flex-col shrink-0 transition-all duration-300 z-20 shadow-2xl',
              currentTheme.sidebarBg,
              sidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full absolute inset-y-0 left-0'
            )}
          >
            {/* Sidebar Header: Brand Logo & Back Button */}
            <div
              className={cn(
                'p-3.5 border-b flex items-center justify-between shrink-0 gap-2',
                currentTheme.borderClass
              )}
            >
              <div className="px-3 py-1.5 rounded-xl bg-[#ffc800] text-slate-950 font-black text-xs tracking-tight shadow-md flex items-center gap-1 shrink-0 border border-amber-400">
                <span className="font-extrabold">HAZWOPER</span>
                <span className="opacity-40 font-normal">/</span>
                <span className="font-bold">OSHA</span>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all shadow-2xs text-slate-700 dark:text-slate-200',
                  currentTheme.buttonClass
                )}
                title="Collapse Outline"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>

            {/* Sidebar Title Badge */}
            <div
              className={cn(
                'px-4 py-2 border-b flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50',
                currentTheme.borderClass
              )}
            >
              <span className="font-black text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                COURSE CONTENT
              </span>
              <span className="text-[11px] font-mono font-bold opacity-75">
                {currentSlideIndex + 1} / {flatSlides.length}
              </span>
            </div>

            {/* HIERARCHICAL TREE: MODULE -> LESSON -> TOPICS & QUIZZES */}
            <div
              ref={tocContainerRef}
              className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3"
            >
              {(() => {
                // ============================================================
                // DEMO COURSE TOC VIEW (!isAdminMode)
                // Module 1 -> Lesson 1 -> 9 Topics + 1 Summary + 1 Quiz + Unlock
                // ============================================================
                if (!isAdminMode) {
                  const demo = buildDemoCourseLesson1(course);
                  const isModExpanded =
                    expandedModules[demo.moduleId] !== false; // default expanded
                  const isLessonExpanded =
                    expandedLessons[demo.lessonId] !== false; // default expanded

                  return (
                    <div
                      key={demo.moduleId}
                      className={cn(
                        'rounded-2xl border transition-all overflow-hidden',
                        currentTheme.isDark
                          ? 'border-slate-800/80 bg-black/20'
                          : 'border-slate-200 bg-white shadow-2xs'
                      )}
                    >
                      {/* Module Header */}
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedModules((prev) => ({
                            ...prev,
                            [demo.moduleId]: !isModExpanded,
                          }));
                        }}
                        className={cn(
                          'w-full p-3 text-left flex items-center justify-between transition-colors border-b',
                          currentTheme.borderClass,
                          'bg-amber-500/10 text-amber-500 font-bold'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-xs font-black truncate">
                            {demo.moduleTitle}
                          </span>
                        </div>
                        <ChevronDown
                          className={cn(
                            'w-3.5 h-3.5 transition-transform duration-200 shrink-0 opacity-70',
                            isModExpanded ? 'rotate-0' : '-rotate-90'
                          )}
                        />
                      </button>

                      {/* Lesson 1 Accordion */}
                      {isModExpanded && (
                        <div className="p-2 space-y-2">
                          <div
                            className={cn(
                              'rounded-xl border transition-all overflow-hidden',
                              currentTheme.isDark
                                ? 'border-slate-800/60 bg-black/30'
                                : 'border-slate-200/80 bg-slate-50/50'
                            )}
                          >
                            {/* Lesson 1 Header */}
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedLessons((prev) => ({
                                  ...prev,
                                  [demo.lessonId]: !isLessonExpanded,
                                }));
                              }}
                              className="w-full p-2.5 text-left flex items-center justify-between text-[11px] font-bold text-amber-500 transition-colors"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <FolderOpen className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                                <span className="truncate">
                                  {demo.lessonTitle}
                                </span>
                              </div>
                              <ChevronRight
                                className={cn(
                                  'w-3 h-3 transition-transform duration-200 opacity-60',
                                  isLessonExpanded ? 'rotate-90' : 'rotate-0'
                                )}
                              />
                            </button>

                            {/* Topics (9 topics) + 1 Summary + 1 Practice Quiz + 1 Unlock Course */}
                            {isLessonExpanded && (
                              <div className="p-1 space-y-1">
                                {/* The 9 Core Instructional Content Topics */}
                                {demo.topics.map((topic, tIdx) => {
                                  const flatIdx = flatSlides.findIndex(
                                    (s) =>
                                      s.type === 'content' &&
                                      s.topicId === topic.id
                                  );
                                  const isActive =
                                    currentSlideIndex === flatIdx;
                                  const isCompleted =
                                    flatIdx < currentSlideIndex;

                                  return (
                                    <button
                                      key={topic.id || tIdx}
                                      type="button"
                                      onClick={() => {
                                        if (flatIdx !== -1) {
                                          if (transitionTimeoutRef.current)
                                            clearTimeout(
                                              transitionTimeoutRef.current
                                            );
                                          setCurrentSlideIndex(flatIdx);
                                        }
                                      }}
                                      title={topic.title}
                                      data-toc-active={
                                        isActive ? 'true' : 'false'
                                      }
                                      className={cn(
                                        'w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all border',
                                        isActive
                                          ? currentTheme.sidebarActiveBg
                                          : currentTheme.sidebarItemBg
                                      )}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {isCompleted ? (
                                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        ) : (
                                          <div
                                            className={cn(
                                              'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                              isActive
                                                ? 'border-amber-500 bg-amber-500 text-slate-950'
                                                : 'border-slate-400/60 bg-transparent'
                                            )}
                                          >
                                            {isActive ? (
                                              <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                                            ) : (
                                              <div className="w-1 h-1 rounded-full bg-slate-400/60" />
                                            )}
                                          </div>
                                        )}

                                        <span className="truncate font-bold leading-snug">
                                          {formatCleanTopicTitle(topic.title)}
                                        </span>
                                      </div>

                                      <span className="text-[10px] font-mono opacity-75 font-bold shrink-0 ml-2">
                                        #{tIdx + 1}
                                      </span>
                                    </button>
                                  );
                                })}

                                {/* 1 Dedicated Lesson Summary & Key Takeaways Button */}
                                {(() => {
                                  const summaryFlatIdx = flatSlides.findIndex(
                                    (s) =>
                                      s.type === 'content' &&
                                      s.topicId === demo.summaryTopic.id
                                  );
                                  const isSummaryActive =
                                    currentSlideIndex === summaryFlatIdx;
                                  const isSummaryCompleted =
                                    summaryFlatIdx < currentSlideIndex;

                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (summaryFlatIdx !== -1) {
                                          if (transitionTimeoutRef.current)
                                            clearTimeout(
                                              transitionTimeoutRef.current
                                            );
                                          setCurrentSlideIndex(summaryFlatIdx);
                                        }
                                      }}
                                      title={demo.summaryTopic.title}
                                      data-toc-active={
                                        isSummaryActive ? 'true' : 'false'
                                      }
                                      className={cn(
                                        'w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-black transition-all border',
                                        isSummaryActive
                                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/20'
                                      )}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        {isSummaryCompleted ? (
                                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        ) : (
                                          <FileText className="w-3.5 h-3.5 shrink-0" />
                                        )}
                                        <span className="truncate">
                                          Lesson 1 Summary
                                        </span>
                                      </div>
                                      <span className="text-[9px] bg-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                                        RECAP
                                      </span>
                                    </button>
                                  );
                                })()}

                                {/* 1 Interactive Practice Quiz Button */}
                                {(() => {
                                  const quizFlatIdx = flatSlides.findIndex(
                                    (s) => s.type === 'quiz'
                                  );
                                  const isQuizActive =
                                    currentSlide.type === 'quiz';

                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (quizFlatIdx !== -1) {
                                          if (transitionTimeoutRef.current)
                                            clearTimeout(
                                              transitionTimeoutRef.current
                                            );
                                          setCurrentSlideIndex(quizFlatIdx);
                                        }
                                      }}
                                      title="Interactive Practice Quiz"
                                      className={cn(
                                        'w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-black transition-all border',
                                        isQuizActive
                                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                                          : 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                                      )}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">
                                          Interactive Practice Quiz
                                        </span>
                                      </div>
                                      <span className="text-[9px] bg-amber-500/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                        QUIZ
                                      </span>
                                    </button>
                                  );
                                })()}

                                {/* Unlock Full Course Milestone Link */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const enrollIdx = flatSlides.findIndex(
                                      (s) => s.type === 'enrollment-cta'
                                    );
                                    if (enrollIdx !== -1) {
                                      if (transitionTimeoutRef.current)
                                        clearTimeout(
                                          transitionTimeoutRef.current
                                        );
                                      setCurrentSlideIndex(enrollIdx);
                                    } else {
                                      setPaywallModalOpen(true);
                                    }
                                  }}
                                  className={cn(
                                    'w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-black transition-all border border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 shadow-md'
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>🏆 Unlock Full Course</span>
                                  </div>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950">
                                    Enroll
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // ============================================================
                // ADMIN / ENROLLED FULL COURSE TOC VIEW
                // ============================================================
                let cumulativeLessonNum = 0;
                return course.modules?.map((mod, mIdx) => {
                  const isModExpanded = !!expandedModules[mod.id];
                  const isModActive = currentSlide.moduleId === mod.id;
                  const isModIntro =
                    mod.isIntroduction ||
                    (mIdx === 0 &&
                      (mod.title?.toLowerCase().includes('introduction') ||
                        !mod.title?.toLowerCase().startsWith('module') ||
                        mod.title === course.title));
                  const modDisplayTitle = isModIntro
                    ? course.title || mod.title
                    : mod.title?.startsWith('Module')
                      ? mod.title
                      : `Module ${mIdx}: ${mod.title}`;

                  const lessonsToRender = mod.lessons || [];

                  return (
                    <div
                      key={mod.id || mIdx}
                      className={cn(
                        'rounded-2xl border transition-all overflow-hidden',
                        currentTheme.isDark
                          ? 'border-slate-800/80 bg-black/20'
                          : 'border-slate-200 bg-white shadow-2xs'
                      )}
                    >
                      {/* Module Header Bar */}
                      <button
                        type="button"
                        onClick={() => {
                          const isExpanded = !!expandedModules[mod.id];
                          setExpandedModules(
                            isExpanded ? {} : { [mod.id]: true }
                          );
                        }}
                        className={cn(
                          'w-full p-3 text-left flex items-center justify-between transition-colors border-b',
                          currentTheme.borderClass,
                          isModActive
                            ? 'bg-amber-500/10 text-amber-500 font-bold'
                            : currentTheme.isDark
                              ? 'hover:bg-slate-900/50'
                              : 'hover:bg-slate-50'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isModIntro ? (
                            <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                          <span className="text-xs font-black truncate">
                            {modDisplayTitle}
                          </span>
                        </div>
                        <ChevronDown
                          className={cn(
                            'w-3.5 h-3.5 transition-transform duration-200 shrink-0 opacity-70',
                            isModExpanded ? 'rotate-0' : '-rotate-90'
                          )}
                        />
                      </button>

                      {/* Module Lessons */}
                      {isModExpanded && (
                        <div className="p-2 space-y-2">
                          {lessonsToRender.map((lesson, lIdx) => {
                            const isLessonIntro =
                              lesson.isIntroduction ||
                              (mIdx === 0 && lIdx === 0);
                            if (!isLessonIntro) cumulativeLessonNum++;
                            const rawTitle = lesson.title || '';
                            const cleanSubTitle = rawTitle
                              .replace(
                                /^(Introduction|Intro|Lesson\s*\d+[\s:\-–—]*)/i,
                                ''
                              )
                              .trim();

                            const lessonDisplayTitle = isLessonIntro
                              ? 'Introduction'
                              : lesson.title?.startsWith('Lesson')
                                ? lesson.title
                                : `Lesson ${cumulativeLessonNum}: ${lesson.title}`;

                            const isLessonExpanded =
                              !!expandedLessons[lesson.id];
                            const isLessonActive =
                              currentSlide.lessonId === lesson.id;

                            return (
                              <div
                                key={lesson.id || lIdx}
                                className={cn(
                                  'rounded-xl border transition-all overflow-hidden',
                                  currentTheme.isDark
                                    ? 'border-slate-800/60 bg-black/30'
                                    : 'border-slate-200/80 bg-slate-50/50'
                                )}
                              >
                                {/* Lesson Header */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isExpanded =
                                      !!expandedLessons[lesson.id];
                                    setExpandedLessons(
                                      isExpanded ? {} : { [lesson.id]: true }
                                    );
                                  }}
                                  className={cn(
                                    'w-full p-2.5 text-left flex items-center justify-between text-[11px] font-bold transition-colors',
                                    isLessonActive
                                      ? 'text-amber-500'
                                      : currentTheme.isDark
                                        ? 'text-slate-300 hover:text-white'
                                        : 'text-slate-700 hover:text-slate-900'
                                  )}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <FolderOpen className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                                    <span className="truncate">
                                      {lessonDisplayTitle}
                                    </span>
                                  </div>
                                  <ChevronRight
                                    className={cn(
                                      'w-3 h-3 transition-transform duration-200 opacity-60',
                                      isLessonExpanded
                                        ? 'rotate-90'
                                        : 'rotate-0'
                                    )}
                                  />
                                </button>

                                {/* Topics List */}
                                {isLessonExpanded && (
                                  <div className="p-1 space-y-1">
                                    {lesson.topics?.map((topic, tIdx) => {
                                      const flatIdx = flatSlides.findIndex(
                                        (s) =>
                                          s.type === 'content' &&
                                          s.topicId === topic.id
                                      );
                                      const isActive =
                                        currentSlideIndex === flatIdx;
                                      const isLocked =
                                        !isSlideUnlocked(flatIdx);
                                      const isCompleted =
                                        flatIdx < currentSlideIndex;

                                      return (
                                        <button
                                          key={topic.id || tIdx}
                                          type="button"
                                          onClick={() => {
                                            if (isLocked) {
                                              setPaywallModalOpen(true);
                                              return;
                                            }
                                            if (flatIdx !== -1) {
                                              if (transitionTimeoutRef.current)
                                                clearTimeout(
                                                  transitionTimeoutRef.current
                                                );
                                              setCurrentSlideIndex(flatIdx);
                                            }
                                          }}
                                          title={topic.title}
                                          data-toc-active={
                                            isActive ? 'true' : 'false'
                                          }
                                          className={cn(
                                            'w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all border',
                                            isLocked
                                              ? 'opacity-50 cursor-pointer border-dashed border-amber-500/30 bg-amber-500/5 text-amber-200/70 hover:border-amber-400 hover:text-amber-300'
                                              : isActive
                                                ? currentTheme.sidebarActiveBg
                                                : currentTheme.sidebarItemBg
                                          )}
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            {isLocked ? (
                                              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                            ) : isCompleted ? (
                                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            ) : (
                                              <div
                                                className={cn(
                                                  'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                                  isActive
                                                    ? 'border-amber-500 bg-amber-500 text-slate-950'
                                                    : 'border-slate-400/60 bg-transparent'
                                                )}
                                              >
                                                {isActive ? (
                                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                                                ) : (
                                                  <div className="w-1 h-1 rounded-full bg-slate-400/60" />
                                                )}
                                              </div>
                                            )}

                                            <span className="truncate font-bold leading-snug">
                                              {formatCleanTopicTitle(
                                                topic.title
                                              )}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1 shrink-0 ml-2">
                                            <span className="text-[10px] font-mono opacity-75 font-bold">
                                              #{tIdx + 1}
                                            </span>
                                          </div>
                                        </button>
                                      );
                                    })}

                                    {/* Practice Quiz */}
                                    {lesson.quiz &&
                                      !isLessonIntro &&
                                      (() => {
                                        const quizFlatIdx =
                                          flatSlides.findIndex(
                                            (s) =>
                                              s.type === 'quiz' &&
                                              s.lessonId === lesson.id
                                          );
                                        if (quizFlatIdx === -1) return null;
                                        const isQuizActive =
                                          currentSlide.type === 'quiz' &&
                                          currentSlide.lessonId === lesson.id;
                                        const isQuizLocked =
                                          !isSlideUnlocked(quizFlatIdx);

                                        return (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (isQuizLocked) {
                                                setPaywallModalOpen(true);
                                                return;
                                              }
                                              if (quizFlatIdx !== -1) {
                                                if (
                                                  transitionTimeoutRef.current
                                                )
                                                  clearTimeout(
                                                    transitionTimeoutRef.current
                                                  );
                                                setCurrentSlideIndex(
                                                  quizFlatIdx
                                                );
                                              }
                                            }}
                                            title="1 Practice Quiz Check"
                                            className={cn(
                                              'w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-black transition-all border',
                                              isQuizLocked
                                                ? 'opacity-50 cursor-pointer border-dashed border-amber-500/30 bg-amber-500/5 text-amber-200/70 hover:border-amber-400'
                                                : isQuizActive
                                                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                                                  : 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                                            )}
                                          >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                                              <span className="truncate">
                                                Practice Quiz
                                              </span>
                                            </div>
                                            <span className="text-[9px] bg-amber-500/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                              QUIZ
                                            </span>
                                          </button>
                                        );
                                      })()}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Sidebar Bottom Action CTA */}
            <div
              className={cn(
                'p-3.5 border-t shrink-0',
                currentTheme.borderClass
              )}
            >
              <button
                type="button"
                onClick={() => alert('Course Enrollment Verification Active!')}
                className="w-full py-3 px-4 rounded-xl bg-[#ffc800] hover:bg-[#ffe033] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-95 transition-all"
              >
                <ShoppingCart className="w-4 h-4 fill-current" />
                <span>Enroll Now</span>
              </button>
            </div>
          </aside>

          {/* ── CENTRAL VIEWPORT: CONTENT / 6-QUESTION QUIZ / COMPULSORY EXAM ── */}
          <main
            ref={containerRef}
            className={cn(
              'relative flex-1 overflow-y-auto flex flex-col items-center p-4 md:p-8 transition-colors duration-200',
              currentTheme.bgClass
            )}
          >
            {isSlideLoading ? (
              <div
                className={cn(
                  'w-full max-w-5xl my-auto min-h-[460px] flex flex-col items-center justify-center p-8 rounded-3xl border space-y-4 animate-in fade-in shadow-md',
                  currentTheme.cardBg
                )}
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-lg">
                  <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="text-sm font-bold tracking-wide">
                    {formatCleanTopicTitle(currentSlide.title)}
                  </h3>
                  <p className="text-xs opacity-70 font-mono">
                    Loading compliance standards & visual aids...
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-5xl space-y-6 my-auto">
                {/* Header Badge & Clean Short Title */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Slide {currentSlide.globalIndex} of {flatSlides.length} •{' '}
                      {currentSlide.badge}
                    </span>

                    {isSpeaking && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <Mic className="w-3 h-3 animate-pulse" />
                        Voice Narrator Articulating Slide Content...
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug">
                    {formatCleanTopicTitle(currentSlide.title)}
                  </h2>
                </div>

                {/* 1. Practice Quiz */}
                {currentSlide.type === 'quiz' && (
                  <div
                    className={cn(
                      'p-6 md:p-8 rounded-3xl border shadow-2xl space-y-6',
                      currentTheme.cardBg
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-between pb-4 border-b',
                        currentTheme.borderClass
                      )}
                    >
                      <div>
                        <h3 className="text-xl font-black text-amber-500 flex items-center gap-2">
                          <HelpCircle className="w-6 h-6" />{' '}
                          {currentSlide.quizData.title}
                        </h3>
                        <p className="text-xs opacity-75 mt-1">
                          Formative Practice Quiz • Answer all 6 questions to
                          reinforce OSHA safety principles
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-amber-500">
                          {Object.keys(quizAnswers).length} /{' '}
                          {currentQuizQuestions.length} Answered
                        </span>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {currentQuizQuestions.map((q, qIdx) => (
                        <InteractiveQuizItem
                          key={q.id || qIdx}
                          q={q}
                          qIdx={qIdx}
                          userChoice={quizAnswers[qIdx]}
                          onAnswer={(val) => {
                            setQuizAnswers((prev) => ({
                              ...prev,
                              [qIdx]: val,
                            }));
                          }}
                          isSubmitted={quizSubmitted}
                          theme={currentThemeId}
                          isAdminMode={isAdminMode}
                        />
                      ))}
                    </div>

                    <div
                      className={cn(
                        'pt-4 border-t flex items-center justify-between gap-4',
                        currentTheme.borderClass
                      )}
                    >
                      <Button
                        onClick={() => {
                          setQuizSubmitted(true);
                          if (isPassed) {
                            try {
                              confetti({
                                particleCount: 100,
                                spread: 70,
                                origin: { y: 0.6 },
                              });
                            } catch (e) {}
                          }
                        }}
                        className={cn(
                          'h-11 px-6 font-bold text-xs rounded-xl shadow-lg',
                          currentTheme.primaryButtonClass
                        )}
                      >
                        Submit Practice Quiz
                      </Button>

                      {quizSubmitted && (
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'text-xs font-bold px-3 py-1.5 rounded-lg border',
                              isPassed
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                            )}
                          >
                            Score: {quizScore}%{' '}
                            {isPassed ? '(Passed)' : '(Review Material)'}
                          </span>
                          <Button
                            onClick={() => {
                              setQuizAnswers({});
                              setQuizSubmitted(false);
                            }}
                            className={cn(
                              'h-9 px-3 text-xs rounded-lg border',
                              currentTheme.buttonClass
                            )}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" /> Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Final Examination */}
                {currentSlide.type === 'final-exam' && (
                  <div
                    className={cn(
                      'p-6 md:p-8 rounded-3xl border shadow-2xl space-y-6',
                      currentTheme.cardBg
                    )}
                  >
                    <div className="flex items-center justify-between pb-4 border-b border-amber-500/30">
                      <div>
                        <h3 className="text-xl font-black text-amber-500 flex items-center gap-2">
                          <Award className="w-6 h-6 text-amber-500" />{' '}
                          {currentSlide.quizData.title}
                        </h3>
                        <p className="text-xs opacity-75 mt-1">
                          Compulsory Course Examination • Passing score of 70%
                          required to unlock Certificate
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {currentQuizQuestions.map((q, qIdx) => (
                        <InteractiveQuizItem
                          key={q.id || qIdx}
                          q={q}
                          qIdx={qIdx}
                          userChoice={quizAnswers[qIdx]}
                          onAnswer={(val) => {
                            setQuizAnswers((prev) => ({
                              ...prev,
                              [qIdx]: val,
                            }));
                          }}
                          isSubmitted={quizSubmitted}
                          isCompulsoryExam={true}
                          theme={currentThemeId}
                          isAdminMode={isAdminMode}
                        />
                      ))}
                    </div>

                    <div
                      className={cn(
                        'pt-4 border-t flex items-center justify-between gap-4',
                        currentTheme.borderClass
                      )}
                    >
                      <Button
                        onClick={() => {
                          setQuizSubmitted(true);
                          if (isPassed) {
                            setFinalExamPassed(true);
                            try {
                              confetti({
                                particleCount: 150,
                                spread: 90,
                                origin: { y: 0.5 },
                              });
                            } catch (e) {}
                          }
                        }}
                        className={cn(
                          'h-12 px-8 font-black text-sm rounded-2xl shadow-xl',
                          currentTheme.primaryButtonClass
                        )}
                      >
                        Submit Compulsory Final Exam
                      </Button>
                    </div>

                    {quizSubmitted && isPassed && (
                      <div className="p-6 rounded-3xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-base flex items-center gap-2 text-slate-900 dark:text-white">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />{' '}
                            Congratulations! You Passed with {quizScore}%!
                          </h4>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs">
                            Exam Passed
                          </span>
                        </div>

                        {isSeatTimeSatisfied ? (
                          <div className="space-y-3">
                            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                              You have satisfied both the 70% passing threshold
                              and the mandatory{' '}
                              {formatSeatTime(requiredSeatTimeSeconds)}{' '}
                              instructional seat time. Your accredited
                              certificate of completion for{' '}
                              <strong>{course.title}</strong> is now verified
                              and available for download.
                            </p>
                            <Button
                              onClick={() =>
                                alert(
                                  'Official Accredited Certificate Generated!'
                                )
                              }
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg h-10 px-6"
                            >
                              <Download className="w-4 h-4 mr-1.5" /> Download
                              Official Certificate
                            </Button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-xs text-amber-600 dark:text-amber-400">
                              <AlertCircle className="w-4 h-4" />
                              <span>
                                OSHA Mandatory Seat-Time Requirement (
                                {formatSeatTime(requiredSeatTimeSeconds)})
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                              Accredited certification rules mandate that
                              students complete the full required instructional
                              engagement time before the certificate is
                              unlocked.
                            </p>
                            <div className="flex flex-wrap items-center justify-between text-xs font-mono font-bold pt-1 border-t border-amber-500/20 gap-2">
                              <span>
                                Active Engagement:{' '}
                                {formatSeatTime(courseElapsedSeconds)}
                              </span>
                              <span className="text-amber-600 dark:text-amber-400">
                                ⏳ {formatSeatTime(seatTimeRemainingSeconds)}{' '}
                                Remaining to Unlock Certificate
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2.5 Enrollment Call-to-Action Milestone Slide (Demo Course End) */}
                {currentSlide.type === 'enrollment-cta' && (
                  <div
                    className={cn(
                      'p-6 md:p-10 rounded-3xl border shadow-2xl space-y-8 animate-in fade-in',
                      currentTheme.cardBg
                    )}
                  >
                    <div className="text-center max-w-2xl mx-auto space-y-3">
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" /> Demo Course
                        Complete
                      </span>
                      <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                        Unlock the Full Accredited Training Course
                      </h2>
                      <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                        You have completed the Demo Course for{' '}
                        <strong>{course.title}</strong>. Enroll now to gain
                        immediate, lifetime access to all core modules,
                        interactive safety puzzles, practice quizzes, and your
                        official OSHA-compliant certificate of completion.
                      </p>
                    </div>

                    {/* Value Highlights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-center space-y-1.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
                          <Layers className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-white">
                          All Modules & Lessons
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Comprehensive training with realistic 8K imagery &
                          audio narration
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-center space-y-1.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-white">
                          Interactive Puzzles
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Hands-on safety sequence games & 3D flashcards
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-center space-y-1.5">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 mx-auto flex items-center justify-center border border-sky-500/30">
                          <Award className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-white">
                          Official Certificate
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Verifiable credential with{' '}
                          {course.ceuCredits || '0.2 CEU'} credits
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="text-center pt-2 max-w-md mx-auto space-y-2">
                      <Button
                        size="lg"
                        onClick={() => setPaywallModalOpen(true)}
                        className="w-full h-14 rounded-2xl font-black text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 gap-2 hover:scale-105 transition-all"
                      >
                        <Award className="w-5 h-5" /> Enroll in Full Course Now
                      </Button>
                      <p className="text-[10px] text-muted-foreground">
                        Instant Access • OSHA 29 CFR Aligned • Verifiable
                        Digital Certificate
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Content Slide */}
                {currentSlide.type === 'content' && (
                  <div>
                    {/* Frame 3: Top Media Banner */}
                    {currentSlide.frameType === 3 &&
                      currentSlide.imageUrl &&
                      currentSlide.imageUrl.trim() !== '' && (
                        <div className="space-y-6">
                          <div
                            className={cn(
                              'p-4 rounded-3xl border shadow-xl space-y-3 group',
                              currentTheme.cardBg
                            )}
                          >
                            <div
                              className={cn(
                                'relative rounded-2xl overflow-hidden aspect-21/9 cursor-pointer',
                                currentTheme.isDark
                                  ? 'bg-slate-950'
                                  : 'bg-slate-100'
                              )}
                              onClick={() =>
                                setActiveLightboxImage(currentSlide.imageUrl)
                              }
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={currentSlide.imageUrl}
                                alt={currentSlide.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = getRealisticTopicPhoto(
                                    currentSlide.title,
                                    initialCourseData?.category || 'safety'
                                  );
                                }}
                              />
                              <div className="absolute top-3 left-3 px-3 py-1 rounded-md bg-black/80 backdrop-blur-md border border-amber-500/40 text-[9px] font-black tracking-wider text-amber-400 uppercase">
                                HAZWOPER Visual Aid
                              </div>
                              <button
                                onClick={() =>
                                  setActiveLightboxImage(currentSlide.imageUrl)
                                }
                                className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/80 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Maximize className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <PlayerComponentRenderer
                            content={currentSlide.content}
                            title={currentSlide.title}
                            textSize={textSize}
                            isSpeaking={isSpeaking}
                            activeSentence={currentCaptionText}
                            onImageClick={(url) => setActiveLightboxImage(url)}
                            theme={currentThemeId}
                          />
                        </div>
                      )}

                    {/* Frame 1: Full-Width Content Frame */}
                    {currentSlide.frameType === 1 && (
                      <div className="space-y-6">
                        {currentSlide.imageUrl &&
                          currentSlide.imageUrl.trim() !== '' && (
                            <div
                              className={cn(
                                'p-4 rounded-3xl border shadow-xl group',
                                currentTheme.cardBg
                              )}
                            >
                              <div
                                className={cn(
                                  'relative rounded-2xl overflow-hidden aspect-16/9 md:aspect-21/9 cursor-pointer',
                                  currentTheme.isDark
                                    ? 'bg-slate-950'
                                    : 'bg-slate-100'
                                )}
                                onClick={() =>
                                  setActiveLightboxImage(currentSlide.imageUrl)
                                }
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={currentSlide.imageUrl}
                                  alt={currentSlide.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src =
                                      getRealisticTopicPhoto(
                                        currentSlide.title,
                                        initialCourseData?.category || 'safety'
                                      );
                                  }}
                                />
                                <button
                                  onClick={() =>
                                    setActiveLightboxImage(
                                      currentSlide.imageUrl
                                    )
                                  }
                                  className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Maximize className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

                        <PlayerComponentRenderer
                          content={currentSlide.content}
                          title={currentSlide.title}
                          textSize={textSize}
                          isSpeaking={isSpeaking}
                          activeSentence={currentCaptionText}
                          onImageClick={(url) => setActiveLightboxImage(url)}
                          theme={currentThemeId}
                        />
                      </div>
                    )}

                    {/* Frame 2 (Default): Split 2-Column */}
                    {(!currentSlide.frameType ||
                      currentSlide.frameType === 2) && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-7 space-y-6">
                          <PlayerComponentRenderer
                            content={currentSlide.content}
                            title={currentSlide.title}
                            textSize={textSize}
                            isSpeaking={isSpeaking}
                            activeSentence={currentCaptionText}
                            onImageClick={(url) => setActiveLightboxImage(url)}
                            theme={currentThemeId}
                          />
                        </div>

                        <div className="lg:col-span-5 space-y-4">
                          <div
                            className={cn(
                              'p-4 rounded-3xl border shadow-xl space-y-3 group relative overflow-hidden',
                              currentTheme.cardBg
                            )}
                          >
                            <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#ffc800] rotate-45 pointer-events-none opacity-80" />
                            <div
                              className={cn(
                                'absolute -bottom-6 -left-6 w-16 h-16 rotate-45 pointer-events-none',
                                currentTheme.isDark
                                  ? 'bg-slate-700/60'
                                  : 'bg-slate-200/60'
                              )}
                            />

                            <div
                              className={cn(
                                'relative rounded-2xl overflow-hidden aspect-4/3 flex items-center justify-center border',
                                currentTheme.isDark
                                  ? 'bg-slate-950 border-slate-800/80'
                                  : 'bg-slate-100 border-slate-200'
                              )}
                            >
                              {currentSlide.imageUrl &&
                              currentSlide.imageUrl.trim() !== '' ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={currentSlide.imageUrl}
                                  alt={currentSlide.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                                  onClick={() =>
                                    setActiveLightboxImage(
                                      currentSlide.imageUrl
                                    )
                                  }
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src =
                                      getRealisticTopicPhoto(
                                        currentSlide.title,
                                        initialCourseData?.category || 'safety'
                                      );
                                  }}
                                />
                              ) : (
                                <div
                                  className={cn(
                                    'w-full h-full flex flex-col items-center justify-center p-6 text-center',
                                    currentTheme.isDark
                                      ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900'
                                      : 'bg-slate-50'
                                  )}
                                >
                                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
                                    <ImageIcon className="w-6 h-6 text-amber-500" />
                                  </div>
                                  <span className="text-xs font-bold line-clamp-2">
                                    {formatCleanTopicTitle(currentSlide.title)}
                                  </span>
                                  <span className="text-[10px] opacity-60 mt-1">
                                    Accredited Visual Training Aid
                                  </span>
                                </div>
                              )}

                              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-amber-500/40 text-[9px] font-black tracking-wider text-amber-400 uppercase">
                                HAZWOPER LMS
                              </div>

                              {currentSlide.imageUrl && (
                                <button
                                  onClick={() =>
                                    setActiveLightboxImage(
                                      currentSlide.imageUrl
                                    )
                                  }
                                  className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-black/80 backdrop-blur-md text-slate-200 hover:text-white border border-slate-700 transition-all opacity-0 group-hover:opacity-100"
                                  title="Expand High-Resolution Image"
                                >
                                  <Maximize className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div
                              className={cn(
                                'font-black text-xs text-center py-2.5 px-4 rounded-xl shadow-md border tracking-tight',
                                currentTheme.isDark
                                  ? 'bg-[#282a36] text-slate-100 border-slate-700/60'
                                  : 'bg-slate-100 text-slate-800 border-slate-200'
                              )}
                            >
                              {formatCleanTopicTitle(currentSlide.title)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* ============================================================================ */}
        {/* BOTTOM ACCREDITED NAVIGATION BAR                                             */}
        {/* ============================================================================ */}
        {/* ============================================================================ */}
        {/* BOTTOM ACCREDITED NAVIGATION BAR (SLATE-900 SLEEK PLAYER CONTROLLER)        */}
        {/* ============================================================================ */}
        <footer
          className={cn(
            'h-16 px-4 md:px-8 border-t flex items-center justify-between shrink-0 z-30 shadow-2xl transition-all duration-300 bg-[#0f172a] text-slate-100 border-slate-800',
            showControls
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          )}
        >
          {/* Left Side: Circular Yellow Play/Pause & Monospace Scrubber Counter */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleTogglePlayPause}
              className="w-10 h-10 rounded-full bg-[#ffc800] hover:bg-[#ffe033] text-slate-950 font-black shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0"
              title={isPlaying ? 'Pause Slide & Voice' : 'Play Slide & Voice'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <div className="font-mono text-xs text-slate-300 font-semibold tracking-wider shrink-0 hidden sm:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Center: Progress Bar & Scrubber */}
          <div className="flex-1 max-w-xl mx-4 relative flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 60}
              value={currentTime}
              onChange={(e) => {
                const newTime = Number(e.target.value);
                setCurrentTime(newTime);
                if (
                  narratorRef.current &&
                  narratorRef.current.segments.length > 0 &&
                  duration > 0
                ) {
                  const segRatio = Math.max(0, Math.min(1, newTime / duration));
                  const targetSegIdx = Math.min(
                    narratorRef.current.segments.length - 1,
                    Math.floor(segRatio * narratorRef.current.segments.length)
                  );
                  narratorRef.current.currentIndex = targetSegIdx;
                  if (isPlaying && narrationEnabled) {
                    narratorRef.current.isPaused = false;
                    narratorRef.current._playNextSegment();
                  }
                }
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#ffc800]"
            />
          </div>

          {/* Right Side: Options & Next Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Closed Captions CC */}
            <button
              onClick={() => setCaptionsEnabled((prev) => !prev)}
              className={cn(
                'p-2 rounded-xl border text-xs transition-all',
                captionsEnabled
                  ? 'bg-[#ffc800]/20 border-[#ffc800] text-[#ffc800] font-black'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              )}
              title="Closed Captions"
            >
              <span className="font-mono text-[11px] font-black">CC</span>
            </button>

            {/* Speed Selector Dropdown */}
            <button
              onClick={() => {
                const speeds = [1, 1.25, 1.5, 2];
                const nextSpeed =
                  speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                setPlaybackSpeed(nextSpeed);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 text-xs font-mono font-bold hover:text-white transition-all flex items-center gap-1"
              title="Playback Speed"
            >
              <span>{playbackSpeed}x</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Mute/Narration Button */}
            <button
              onClick={handleToggleNarration}
              className={cn(
                'p-2 rounded-xl border text-xs transition-all',
                narrationEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              )}
              title={
                narrationEnabled
                  ? 'Mute Voice Narration'
                  : 'Enable Voice Narration'
              }
            >
              {narrationEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Replay Slide */}
            <button
              onClick={() => {
                setCurrentTime(0);
                if (narrationEnabled && currentSlide) {
                  narratorRef.current?.regenerate(
                    currentSlide,
                    currentSlide.title
                  );
                }
              }}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-all"
              title="Restart Slide"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Next Pill Button */}
            <button
              onClick={handleNextSlide}
              disabled={currentSlideIndex === flatSlides.length - 1}
              className="px-5 py-2 rounded-full bg-[#ffc800] hover:bg-[#ffe033] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>
                {currentSlideIndex === flatSlides.length - 1
                  ? 'Finish'
                  : 'Next'}
              </span>
              <ChevronRight className="w-4 h-4 fill-current" />
            </button>
          </div>
        </footer>

        {/* ============================================================================ */}
        {/* LIGHTBOX MODAL                                                               */}
        {/* ============================================================================ */}
        {activeLightboxImage &&
          typeof activeLightboxImage === 'string' &&
          activeLightboxImage.trim() !== '' && (
            <div
              className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setActiveLightboxImage(null)}
            >
              <div
                className={cn(
                  'relative max-w-5xl w-full max-h-[90vh] border rounded-3xl overflow-hidden shadow-2xl flex flex-col',
                  currentTheme.panelBg
                )}
              >
                <div
                  className={cn(
                    'p-4 border-b flex items-center justify-between',
                    currentTheme.borderClass
                  )}
                >
                  <span className="text-xs font-bold truncate max-w-md">
                    {formatCleanTopicTitle(currentSlide.title)}
                  </span>
                  <button
                    onClick={() => setActiveLightboxImage(null)}
                    className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeLightboxImage}
                    alt={currentSlide.title}
                    className="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getRealisticTopicPhoto(
                        currentSlide.title,
                        initialCourseData?.category || 'safety'
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          )}

        {/* ============================================================================ */}
        {/* COMPREHENSIVE SETTINGS & PREFERENCES MODAL                                   */}
        {/* ============================================================================ */}
        {settingsOpen && (
          <div
            className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSettingsOpen(false)}
          >
            <div
              className={cn(
                'relative max-w-lg w-full rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]',
                currentTheme.panelBg
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Settings Header */}
              <div
                className={cn(
                  'p-4 px-6 border-b flex items-center justify-between',
                  currentTheme.borderClass
                )}
              >
                <div className="flex items-center gap-2 font-black text-sm">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span>Player Preferences & Settings</span>
                </div>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="p-1.5 hover:bg-slate-500/20 rounded-lg transition-colors opacity-70 hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Settings Content */}
              <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs">
                {/* 1. Visual Theme Selector */}
                <div className="space-y-2">
                  <label className="font-bold uppercase tracking-wider text-amber-500 block text-[11px]">
                    Visual Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(PLAYER_THEMES).map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => handleSetTheme(th.id)}
                        className={cn(
                          'p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all',
                          currentThemeId === th.id
                            ? 'border-amber-500 bg-amber-500/15 font-black ring-2 ring-amber-500/30'
                            : currentTheme.buttonClass
                        )}
                      >
                        <span className="text-xl">{th.icon}</span>
                        <span className="font-bold text-[11px] leading-tight">
                          {th.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Table of Contents (TOC) Behavior */}
                <div className="space-y-2">
                  <label className="font-bold uppercase tracking-wider text-amber-500 block text-[11px]">
                    Curriculum Outline (TOC) Behavior
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: 'auto',
                        label: 'Auto (5s)',
                        icon: '⏱️',
                        desc: 'Auto peek on slide jump',
                      },
                      {
                        id: 'pinned',
                        label: 'Always Open',
                        icon: '📌',
                        desc: 'Permanently expanded',
                      },
                      {
                        id: 'closed',
                        label: 'Closed',
                        icon: '✕',
                        desc: 'Hidden until clicked',
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSetTocMode(opt.id)}
                        className={cn(
                          'p-3 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all',
                          tocMode === opt.id
                            ? 'border-amber-500 bg-amber-500/15 font-black ring-2 ring-amber-500/30'
                            : currentTheme.buttonClass
                        )}
                      >
                        <span className="text-base">{opt.icon}</span>
                        <span className="font-bold text-[11px]">
                          {opt.label}
                        </span>
                        <span className="text-[9px] opacity-60 line-clamp-1">
                          {opt.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Navigation & Access Mode */}
                <div className="space-y-2">
                  <label className="font-bold uppercase tracking-wider text-amber-500 block text-[11px]">
                    Navigation Access Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAdminMode(true)}
                      className={cn(
                        'p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold transition-all',
                        isAdminMode
                          ? 'border-purple-500 bg-purple-500/20 text-purple-600 dark:text-purple-300 ring-2 ring-purple-500/40'
                          : currentTheme.buttonClass
                      )}
                    >
                      <Unlock className="w-4 h-4 text-purple-500" />
                      <span>Admin Free-Nav</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdminMode(false)}
                      className={cn(
                        'p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold transition-all',
                        !isAdminMode
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/40'
                          : currentTheme.buttonClass
                      )}
                    >
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span>Student (Locked)</span>
                    </button>
                  </div>
                </div>

                {/* 4. Human Narrator Voice Selection */}
                <div className="space-y-2">
                  <label className="font-bold uppercase tracking-wider text-amber-500 block text-[11px]">
                    Voice Narrator (English Neural)
                  </label>
                  <select
                    className={cn(
                      'w-full h-11 px-3.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer',
                      currentTheme.buttonClass
                    )}
                    value={selectedVoice?.name || ''}
                    onChange={(e) => {
                      const v = availableVoices.find(
                        (voice) => voice.name === e.target.value
                      );
                      if (v) {
                        setSelectedVoice(v);
                        if (narratorRef.current)
                          narratorRef.current.setVoice(v);
                      }
                    }}
                  >
                    {availableVoices.map((v) => (
                      <option
                        key={v.name}
                        value={v.name}
                        className={
                          currentTheme.isDark
                            ? 'bg-slate-950 text-slate-100'
                            : 'bg-white text-slate-900'
                        }
                      >
                        {v.name} ({v.lang}) {v.default ? '★ Default' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Speech Pace / Speed */}
                <div className="space-y-2">
                  <label className="font-bold uppercase tracking-wider text-amber-500 block text-[11px]">
                    Narration Speech Speed
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => {
                          setPlaybackSpeed(speed);
                          if (narratorRef.current)
                            narratorRef.current.setRate(speed);
                        }}
                        className={cn(
                          'py-2 rounded-xl text-xs font-black border transition-all',
                          playbackSpeed === speed
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                            : currentTheme.buttonClass
                        )}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Typography Font Size */}
                <div className="space-y-2">
                  <label className="font-bold uppercase tracking-wider text-amber-500 block text-[11px]">
                    Typography Font Sizing
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'S', label: 'Small' },
                      { id: 'M', label: 'Medium' },
                      { id: 'L', label: 'Large' },
                      { id: 'XL', label: 'Extra' },
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setTextSize(sz.id)}
                        className={cn(
                          'py-2 rounded-xl text-xs font-black border transition-all',
                          textSize === sz.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                            : currentTheme.buttonClass
                        )}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. Continuous Audio Autoplay Toggle */}
                <div
                  className={cn(
                    'pt-2 border-t flex items-center justify-between',
                    currentTheme.borderClass
                  )}
                >
                  <div>
                    <span className="font-bold text-xs block">
                      Continuous Narration Autoplay
                    </span>
                    <p className="text-[11px] opacity-70">
                      Auto-advance to next slide when audio completes
                    </p>
                  </div>
                  <button
                    onClick={() => setContinuousAudio(!continuousAudio)}
                    className={cn(
                      'w-12 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out',
                      continuousAudio
                        ? 'bg-amber-500'
                        : 'bg-slate-400/40 border border-slate-400'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out',
                        continuousAudio
                          ? 'translate-x-5.5 bg-slate-950'
                          : 'translate-x-0 bg-white'
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Settings Footer */}
              <div
                className={cn(
                  'p-4 border-t flex justify-end',
                  currentTheme.borderClass
                )}
              >
                <Button
                  onClick={() => setSettingsOpen(false)}
                  className={cn(
                    'font-black text-xs rounded-xl px-6 h-10 shadow-lg',
                    currentTheme.primaryButtonClass
                  )}
                >
                  Save & Apply
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Synchronized Closed Captions Bar */}
        {captionsEnabled && (currentCaptionText || isSpeaking) && (
          <div
            className={cn(
              'fixed left-1/2 -translate-x-1/2 z-50 max-w-3xl w-[92%] bg-slate-950/95 backdrop-blur-2xl border-2 border-amber-500/70 text-white px-5 py-3.5 rounded-2xl shadow-2xl transition-all duration-300 flex items-center gap-3.5 opacity-100 pointer-events-auto',
              showControls ? 'bottom-22 md:bottom-20' : 'bottom-4'
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg">
              <Volume2 className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">
                <span className="flex items-center gap-1.5 font-black">
                  <span className="px-1 py-0.2 bg-amber-500 text-slate-950 rounded text-[9px] font-mono">
                    CC
                  </span>
                  Live Closed Captions
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[9px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />{' '}
                  Real-time Speech Sync
                </span>
              </div>
              <p className="text-xs md:text-sm font-bold text-amber-100 leading-snug">
                {currentCaptionText ||
                  formatCleanTopicTitle(currentSlide.title)}
              </p>
            </div>
            <button
              onClick={() => setCaptionsEnabled(false)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white shrink-0 transition-colors"
              title="Hide Captions"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Paywall & Course Generator Upsell Modal (Student Preview Restriction) */}
        {paywallModalOpen && (
          <div className="fixed inset-0 z-[100001] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-white">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-amber-400">
                      Demo Course Limited to Lesson 1
                    </h3>
                    <p className="text-xs text-slate-400">
                      Module 1, Lesson 1 is unlocked for this demo course
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPaywallModalOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-white block">
                      Unlock All Modules or Build Your Own Courses
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      Purchase the <strong>AI Course Generator for $20</strong>{' '}
                      to generate unlimited custom course names, modules,
                      lessons, and topics, or enroll in this course to unlock
                      all modules & get your official accreditation certificate.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    What You Get With $20 Course Generator:
                  </h4>
                  <ul className="text-xs space-y-2 text-slate-200 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      Full Custom Course Creation (Name your own modules &
                      lessons)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      Humanized Natural TTS Voice Narration Engine
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      Interactive Practice Quizzes & Accredited Final Exams
                    </li>
                  </ul>
                </div>

                <div className="space-y-2.5 pt-2">
                  <Button
                    onClick={() => {
                      setPaywallModalOpen(false);
                      onClose?.();
                      if (typeof window !== 'undefined')
                        window.location.href = '/admin/courses';
                    }}
                    className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Purchase AI Course Generator ($20)
                  </Button>

                  <Button
                    onClick={() => {
                      setPaywallModalOpen(false);
                      alert('Redirecting to Course Enrollment Checkout...');
                    }}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Enroll Full Course ($49)
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPaywallModalOpen(false)}
                    className="w-full text-xs text-slate-400 hover:text-white"
                  >
                    Continue Demo Course (Lesson 1)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}

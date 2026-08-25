/**
 * @file course-storage.js
 * Dual Storage Engine for LMS: Instant LocalStorage persistence with optional Supabase cloud sync.
 *
 * Storage Strategy (v2 — Quota-Safe):
 * - Course INDEX (IDs + metadata) stored in 'hazwoper_courses_index'
 * - Each course's FULL data stored individually in 'hazwoper_course_{id}'
 * - Automatic migration from legacy single-blob 'hazwoper_courses' key
 * - Graceful fallback to Supabase cloud when localStorage quota is exceeded
 */

import { supabase } from '@/lib/supabase';

export const STORAGE_KEYS = {
  COURSES: 'hazwoper_courses', // Legacy key (read-only for migration)
  COURSES_INDEX: 'hazwoper_courses_index', // New: lightweight index of course IDs + metadata
  COURSE_PREFIX: 'hazwoper_course_', // New: per-course full data
  PROGRESS_PREFIX: 'hazwoper_progress_',
  CERTIFICATES_PREFIX: 'hazwoper_cert_',
};

// In-Memory Course Cache for instantaneous synchronous lookups
const courseMemoryCache = new Map();

/**
 * Safely parse JSON or return default
 */
const safeParse = (str, defaultVal = null) => {
  if (!str) return defaultVal;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('Error parsing JSON from storage:', e);
    return defaultVal;
  }
};

// ============================================================
// NATIVE INDEXEDDB ENGINE (UNLIMITED STORAGE CAPACITY)
// ============================================================
const DB_NAME = 'hazwoper_lms_db';
const DB_VERSION = 1;
const STORE_NAME = 'courses';

function openCourseDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function persistToIndexedDB(course) {
  if (!course?.id) return false;
  try {
    const db = await openCourseDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(course);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

async function fetchFromIndexedDB(courseId) {
  if (!courseId) return null;
  try {
    const db = await openCourseDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(courseId);
      req.onsuccess = () => {
        const res = req.result || null;
        if (res) {
          courseMemoryCache.set(res.id, res);
          if (res.slug) courseMemoryCache.set(res.slug, res);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('hazwoper_courses_updated'));
          }
        }
        resolve(res);
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function deleteFromIndexedDB(courseId) {
  if (!courseId) return false;
  try {
    const db = await openCourseDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(courseId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

/**
 * Quota-safe localStorage.setItem wrapper.
 * Attempts to write; if QuotaExceededError, runs aggressive cleanup and retries once.
 * @returns {boolean} true if saved successfully
 */
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (
      e?.name === 'QuotaExceededError' ||
      e?.code === 22 ||
      e?.code === 1014
    ) {
      cleanupStorage();
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        return false;
      }
    }
    return false;
  }
}

/**
 * Aggressive cleanup: permanently purge legacy monolithic 5MB blob and orphaned keys.
 */
export function cleanupStorage() {
  if (typeof window === 'undefined') return;
  try {
    // 1. Unconditionally remove legacy monolithic blob (instantly frees 4MB-5MB)
    if (localStorage.getItem(STORAGE_KEYS.COURSES)) {
      localStorage.removeItem(STORAGE_KEYS.COURSES);
      console.info(
        '[CourseStorage] Purged legacy monolithic courses blob to free space.'
      );
    }

    // 2. Purge all full course JSON payloads (hazwoper_course_*) from localStorage
    // Full courses are safely stored in IndexedDB and Supabase Cloud DB
    const index = safeParse(
      localStorage.getItem(STORAGE_KEYS.COURSES_INDEX),
      []
    );
    const courseIds = new Set(index.map((c) => c.id));
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEYS.COURSE_PREFIX)) {
        keysToRemove.push(key);
      } else if (key?.startsWith(STORAGE_KEYS.PROGRESS_PREFIX)) {
        const progressCourseId = key.replace(STORAGE_KEYS.PROGRESS_PREFIX, '');
        if (!courseIds.has(progressCourseId)) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (e) {
    console.warn('[CourseStorage] Cleanup encountered error:', e);
  }
}

/**
 * Migrate from legacy single-blob storage to per-course storage.
 * Runs once automatically on first read.
 */
let migrationDone = false;
function migrateLegacyStorage() {
  if (migrationDone || typeof window === 'undefined') return;
  migrationDone = true;

  try {
    // Aggressively free space if legacy blob exists
    const legacyStr = localStorage.getItem(STORAGE_KEYS.COURSES);
    if (!legacyStr) return;

    const legacyCourses = safeParse(legacyStr, []);
    if (Array.isArray(legacyCourses) && legacyCourses.length > 0) {
      console.info(
        `[CourseStorage] Migrating ${legacyCourses.length} courses to per-course storage & IndexedDB...`
      );

      const index = legacyCourses.map((c) => ({
        id: c.id,
        numericId: c.numericId,
        title: c.title,
        slug: c.slug,
        category: c.category,
        status: c.status,
        thumbnail: c.thumbnail,
        durationLabel: c.durationLabel,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

      // Cache and store each course
      for (const course of legacyCourses) {
        courseMemoryCache.set(course.id, course);
        if (course.slug) courseMemoryCache.set(course.slug, course);
        persistToIndexedDB(course);
        safeSetItem(
          `${STORAGE_KEYS.COURSE_PREFIX}${course.id}`,
          JSON.stringify(course)
        );
      }

      safeSetItem(STORAGE_KEYS.COURSES_INDEX, JSON.stringify(index));
    }

    // Always remove monolithic blob after parsing
    localStorage.removeItem(STORAGE_KEYS.COURSES);
  } catch (e) {
    console.warn('[CourseStorage] Migration error (non-fatal):', e);
  }
}

export const DEFAULT_INITIAL_COURSES = [
  {
    id: '1',
    numericId: 1,
    title: 'OSHA Full Body Harness & Fall Protection Training',
    subtitle: 'OSHA 29 CFR 1926 Subpart M Fall Arrest Systems',
    slug: 'osha-full-body-harness-fall-protection-training',
    description:
      'Comprehensive occupational safety training covering personal fall arrest systems (PFAS), harness inspection, anchoring guidelines, and emergency suspension trauma prevention.',
    category: 'safety',
    duration: 7200,
    durationLabel: '2 Hours',
    ceuCredits: '0.2 CEU',
    targetAudience:
      'Construction Workers, Scaffolders, Riggers & Safety Inspectors',
    metaTitle:
      'OSHA Full Body Harness & Fall Protection Training | Free Online LMS',
    metaDescription:
      'Complete OSHA-compliant Full Body Harness and PFAS safety training course. Learn proper donning, harness inspection, load limits, and earn a verifiable certificate.',
    keywords:
      'osha full body harness, fall protection, pfas inspection, construction safety, 29 cfr 1926.502, fall arrest training',
    thumbnail:
      'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
    modules: [
      {
        id: 'm1_intro',
        title: 'OSHA Full Body Harness & Fall Protection Training',
        isIntroduction: true,
        order: 0,
        lessons: [
          {
            id: 'l1_intro',
            title: 'Introduction',
            isIntroduction: true,
            duration: '02:00',
            seconds: 120,
            order: 0,
            topics: [
              {
                id: 't1_intro_1',
                title: 'OSHA Full Body Harness & Fall Protection Training',
                order: 1,
                frameType: 2,
                duration: 180,
                content: `<div class="topic-content"><p>Welcome to <strong>OSHA Full Body Harness & Fall Protection Training</strong>. This certified training module covers personal fall arrest systems (PFAS), harness inspection, anchoring guidelines, and emergency rescue protocols compliant with OSHA 1926.502 regulations.</p><div class="callout callout-warning"><strong>Mandatory Safety Requirement:</strong> Employers must ensure every employee exposed to fall hazards of 6 feet or more in construction receives authorized PFAS donning and inspection training.</div><div class="key-points"><h3>Core Learning Milestones</h3><ul><li>Harness distributes impact arrest forces safely across pelvis, thighs, and torso</li><li>Maximum allowable arrest force is 1,800 lbs per OSHA standards</li><li>D-ring must remain centered between shoulder blades</li><li>Inspect webbing for cuts, burns, and broken stitches before every shift</li></ul></div></div>`,
                imagePrompt:
                  'Photorealistic full body shot of a professional safety worker wearing OSHA hard hat, safety goggles, and high-visibility reflective vest holding a large hardboard sign with "OSHA Full Body Harness & Fall Protection Training" clearly written on it in bold lettering, industrial safety background, ultra-sharp 8k',
                imageUrl:
                  'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80',
                narrationText:
                  'Welcome to OSHA Full Body Harness and Fall Protection Training. This course covers personal fall arrest systems, harness inspection, anchoring guidelines, and emergency rescue protocols compliant with OSHA 1926.502 regulations.',
              },
              {
                id: 't1_intro_2',
                title: 'Scope & Mandatory Compliance Standards',
                order: 2,
                frameType: 2,
                duration: 180,
                content: `<div class="topic-content"><p>This program fulfills theoretical OSHA 29 CFR 1926 Subpart M training obligations. Employers are required to supplement this digital instruction with site-specific equipment evaluations.</p></div>`,
                imagePrompt:
                  'Photorealistic safety inspection officer holding OSHA safety regulations clipboard on site, 8k',
                imageUrl:
                  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
                narrationText:
                  'This program fulfills theoretical OSHA 29 CFR 1926 Subpart M training obligations. Employers must conduct site specific equipment evaluations.',
              },
              {
                id: 't1_intro_3',
                title: 'Introduction Summary & Review',
                order: 3,
                frameType: 2,
                duration: 180,
                content: `<div class="topic-content"><p>This concludes the course introduction. Review all key compliance points and proceed to Module 1.</p></div>`,
                imagePrompt:
                  'Safety equipment review table with fall arrest gear and inspection logs, 8k',
                imageUrl:
                  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
                narrationText:
                  'This concludes the course introduction. Review all key compliance points and proceed to Module 1.',
              },
            ],
          },
        ],
      },
      {
        id: 'm1',
        title: 'Module 1: OSHA Fall Protection & PFAS Fundamentals',
        order: 1,
        lessons: [
          {
            id: 'l1',
            title:
              'Lesson 1: Harness Anatomy, PFAS Selection & Regulatory Scope',
            duration: '02:00',
            seconds: 120,
            order: 1,
            lessonNumber: 1,
            topics: [
              {
                id: 't1_1',
                title: 'Harness Anatomy, PFAS Selection & Regulatory Scope',
                order: 1,
                frameType: 2,
                duration: 180,
                content: `<div class="topic-content"><p>A full body harness is engineered from high-tensile polyester webbing, forged alloy steel D-rings, friction slides, and quick-connect mating buckles designed to arrest a falling worker without causing secondary internal injuries.</p><div class="callout callout-info"><strong>Hardware Inspection:</strong> Check all metal connectors, snap hooks, and carabiners for corrosion, deformation, sharp edges, and proper spring-loaded gate closure.</div><div class="key-points"><h3>Critical Component Checklist</h3><ul><li>Dorsal D-Ring: Primary fall arrest attachment point</li><li>Sternal D-Ring: Used for ladder climbing safety sleeves</li><li>Side D-Rings: Positioning and restraint only (never fall arrest)</li><li>Webbing Keepers: Prevent loose strap entanglement</li></ul></div></div>`,
                imagePrompt:
                  'Photorealistic safety worker wearing complete safety costume including hardhat, high-vis vest, safety glasses, and harness holding a hardboard sign with "Harness Anatomy, PFAS Selection & Regulatory Scope" written clearly on it in bold lettering, industrial workplace scene, 8k ultra-detailed',
                imageUrl:
                  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
                narrationText:
                  'A full body harness is engineered from high-tensile polyester webbing, forged alloy steel D-rings, friction slides, and quick-connect mating buckles.',
              },
              {
                id: 't1_2',
                title: 'Anatomy and Hardware Components',
                order: 2,
                frameType: 2,
                duration: 180,
                content: `<div class="topic-content"><p>Inspect all metal connectors, snap hooks, and carabiners for corrosion, deformation, sharp edges, and proper spring-loaded gate closure.</p></div>`,
                imagePrompt:
                  'Detailed close-up of forged safety harness dorsal D-ring and polyester webbing',
                imageUrl:
                  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
                narrationText:
                  'Inspect all metal connectors, snap hooks, and carabiners for corrosion, deformation, sharp edges, and proper spring-loaded gate closure.',
              },
              {
                id: 't1_3',
                title: 'Lesson 1 Summary & Review',
                order: 3,
                frameType: 2,
                duration: 180,
                content: `<div class="topic-content"><p>This concludes Lesson 1. Take the 6-question practice check below to test your understanding before advancing to the next lesson.</p></div>`,
                imagePrompt:
                  'Safety inspector checking worker safety harness fit on industrial platform, 8k',
                imageUrl:
                  'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80',
                narrationText:
                  'This concludes Lesson 1. Take the 6 question practice check below to test your understanding.',
              },
            ],
            quiz: {
              id: 'q1_l1',
              title: 'Lesson 1 Practice Quiz (6 Questions)',
              passingScore: 70,
              isCompulsory: false,
              questions: [
                {
                  id: 'ql1',
                  question: 'Where should the dorsal D-ring be positioned?',
                  options: [
                    'Lower back',
                    'Centered between shoulder blades',
                    'Front chest',
                    'Side hip',
                  ],
                  correctAnswer: 1,
                  explanation:
                    'Dorsal D-ring must remain centered between shoulder blades.',
                },
                {
                  id: 'ql2',
                  question:
                    'What is the maximum allowable fall arrest force on a worker under OSHA standards?',
                  options: ['900 lbs', '1,800 lbs', '2,500 lbs', '5,000 lbs'],
                  correctAnswer: 1,
                  explanation:
                    'OSHA 1926.502 limits arrest force to 1,800 lbs.',
                },
                {
                  id: 'ql3',
                  question: 'How often must PFAS equipment be inspected?',
                  options: [
                    'Weekly',
                    'Before each shift/use',
                    'Monthly',
                    'Yearly',
                  ],
                  correctAnswer: 1,
                  explanation: 'Inspection is mandatory before each shift/use.',
                },
                {
                  id: 'ql4',
                  question: 'Can side D-rings be used for fall arrest?',
                  options: [
                    'Yes',
                    'No, positioning/restraint only',
                    'Only on towers',
                    'With supervisor approval',
                  ],
                  correctAnswer: 1,
                  explanation: 'Side D-rings are positioning/restraint only.',
                },
                {
                  id: 'ql5',
                  question: 'What is the two-finger check for leg straps?',
                  options: [
                    'Tensile test',
                    'Ensures snug fit without cutting circulation',
                    'Buckle test',
                    'Lanyard check',
                  ],
                  correctAnswer: 1,
                  explanation: 'Two fingers flat ensures snug and safe fit.',
                },
                {
                  id: 'ql6',
                  question:
                    'What must happen to a harness after arresting a fall?',
                  options: [
                    'Wash and reuse',
                    'Retire immediately from service',
                    'Re-stitch straps',
                    'Tool tether only',
                  ],
                  correctAnswer: 1,
                  explanation: 'Must be retired and destroyed immediately.',
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: '2',
    numericId: 2,
    title: 'HAZWOPER 40-Hour Hazardous Materials Initial Training',
    subtitle: 'OSHA 29 CFR 1910.120 Hazardous Waste Operations',
    slug: 'hazwoper-40-hour-hazardous-materials-training',
    description:
      'Comprehensive initial training for uncontrolled hazardous waste site workers, clean-up operations, emergency response teams, and toxic release mitigation personnel.',
    category: 'safety',
    duration: 144000,
    durationLabel: '40 Hours',
    ceuCredits: '4.0 CEU',
    targetAudience:
      'Hazardous Waste Operators, Remediation Technicians, Chemical Safety Officers',
    metaTitle:
      'HAZWOPER 40-Hour Training Online Certification | OSHA 29 CFR 1910.120',
    metaDescription:
      'Complete OSHA HAZWOPER 40-Hour initial certification course. Learn chemical hazard classification, Level A-D PPE, decontamination, air monitoring, and emergency response.',
    keywords:
      'hazwoper 40 hour, hazardous waste operations, osha 1910.120, chemical safety, level a ppe, decontamination lines',
    thumbnail:
      'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    createdAt: '2026-01-11T10:00:00.000Z',
    updatedAt: '2026-01-11T10:00:00.000Z',
    modules: [
      {
        id: 'm2_intro',
        title: 'HAZWOPER 40-Hour Hazardous Materials Initial Training',
        isIntroduction: true,
        order: 0,
        lessons: [
          {
            id: 'l2_intro',
            title: 'Introduction',
            isIntroduction: true,
            duration: '02:00',
            seconds: 120,
            order: 0,
            topics: [
              {
                id: 't2_intro_1',
                title: 'HAZWOPER 40-Hour Hazardous Materials Initial Training',
                order: 1,
                frameType: 2,
                duration: 180,
                content: `<div class="topic-content"><p>Welcome to <strong>HAZWOPER 40-Hour Hazardous Materials Initial Training</strong>. This certified training program covers uncontrolled hazardous waste site clean-up operations, emergency response protocols, personal protective equipment (PPE Level A-D), and site characterization in accordance with OSHA 29 CFR 1910.120.</p><div class="callout callout-warning"><strong>Mandatory Certification Requirement:</strong> Employees working at uncontrolled hazardous waste sites must receive 40 hours of initial off-site training and 3 days of supervised field experience.</div></div>`,
                imagePrompt:
                  'Photorealistic full body shot of a professional safety worker wearing OSHA chemical protective suit and hard hat holding a large hardboard sign with "HAZWOPER 40-Hour Hazardous Materials Initial Training" clearly written on it in bold lettering, industrial environmental scene, 8k',
                imageUrl:
                  'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80',
                narrationText:
                  'Welcome to HAZWOPER 40-Hour Hazardous Materials Initial Training. This certified training program covers uncontrolled hazardous waste operations.',
              },
              {
                id: 't2_intro_2',
                title: 'Regulatory Scope & Site Characterization Standards',
                order: 2,
                frameType: 2,
                duration: 180,
                content: `<div class="topic-content"><p>OSHA 29 CFR 1910.120 establishes standard operating procedures for hazardous waste clean-up, corrective actions under RCRA, and voluntary clean-up operations.</p></div>`,
                imagePrompt:
                  'Photorealistic environmental officer conducting baseline field survey with instrumentation, 8k',
                imageUrl:
                  'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=800&auto=format&fit=crop&q=80',
                narrationText:
                  'OSHA standard establishes operating procedures for hazardous waste clean up and site safety.',
              },
              {
                id: 't2_intro_3',
                title: 'Introduction Summary & Review',
                order: 3,
                frameType: 2,
                duration: 180,
                content: `<div class="topic-content"><p>This concludes the HAZWOPER introductory section. Proceed directly to Module 1.</p></div>`,
                imagePrompt:
                  'Environmental safety checklist and monitoring gear on field table, 8k',
                imageUrl:
                  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
                narrationText:
                  'This concludes the introductory section. Proceed to Module 1.',
              },
            ],
          },
        ],
      },
      {
        id: 'm2_1',
        title: 'Module 1: HAZWOPER Scope and Regulatory Framework',
        order: 1,
        lessons: [
          {
            id: 'l2_1',
            title: 'Lesson 1: Scope of 29 CFR 1910.120 & Site Characterization',
            duration: '03:00',
            seconds: 180,
            order: 1,
            lessonNumber: 1,
            topics: [
              {
                id: 't2_1',
                title: 'Scope of 29 CFR 1910.120 & Site Characterization',
                order: 1,
                frameType: 2,
                duration: 180,
                content: `<div class="topic-content"><p>HAZWOPER standard 29 CFR 1910.120 mandates strict control zones around hazardous chemical releases: the Exclusion Zone (Hot Zone), Contamination Reduction Zone (Warm Zone), and Support Zone (Cold Zone).</p><div class="callout callout-danger"><strong>IDLH Warning:</strong> Never enter an uncharacterized site or hot zone without calibrated direct-reading air monitors and appropriate Level A or Level B PPE.</div></div>`,
                imagePrompt:
                  'Photorealistic safety worker wearing complete safety costume including chemical suit, respirator, and hardhat holding a hardboard sign with "Scope of 29 CFR 1910.120 & Site Characterization" written clearly on it in bold lettering, 8k',
                imageUrl:
                  'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=800&auto=format&fit=crop&q=80',
                narrationText:
                  'HAZWOPER standard 29 CFR 1910.120 mandates strict control zones around hazardous chemical releases.',
              },
              {
                id: 't2_2',
                title: 'Site Characterization & Control Zones',
                order: 2,
                frameType: 2,
                duration: 180,
                content: `<div class="topic-content"><p>Site characterization provides the necessary information to identify specific hazards and select appropriate PPE and control measures.</p></div>`,
                imagePrompt:
                  'Hazmat technician in protective suit conducting environmental site air sampling, 8k',
                imageUrl:
                  'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80',
                narrationText:
                  'Site characterization provides the necessary information to identify specific hazards.',
              },
              {
                id: 't2_3',
                title: 'Lesson 1 Summary & Review',
                order: 3,
                frameType: 2,
                duration: 180,
                content: `<div class="topic-content"><p>This concludes Lesson 1. Take the 6-question practice check below to test your understanding before advancing to the next lesson.</p></div>`,
                imagePrompt:
                  'Safety inspector reviewing HAZWOPER air monitoring data in field mobile lab, 8k',
                imageUrl:
                  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
                narrationText:
                  'This concludes Lesson 1. Take the 6 question practice check below to test your understanding.',
              },
            ],
            quiz: {
              id: 'q2_l1',
              title: 'Lesson 1 Practice Quiz (6 Questions)',
              passingScore: 70,
              isCompulsory: false,
              questions: [
                {
                  id: 'q2l1',
                  question:
                    'What zone is the Contamination Reduction Corridor located in?',
                  options: [
                    'Exclusion Zone',
                    'Contamination Reduction Zone (Warm Zone)',
                    'Support Zone',
                    'Clean Zone',
                  ],
                  correctAnswer: 1,
                  explanation:
                    'The contamination reduction corridor is located in the Warm Zone.',
                },
                {
                  id: 'q2l2',
                  question:
                    'What document is required prior to commencing any field work under HAZWOPER?',
                  options: [
                    'Purchase Order',
                    'Written Site-Specific Health and Safety Plan (HASP)',
                    'Equipment invoice',
                    'Timesheet',
                  ],
                  correctAnswer: 1,
                  explanation:
                    'A written HASP is mandatory before work begins.',
                },
                {
                  id: 'q2l3',
                  question:
                    'Who is authorized to establish and supervise site hazard zones?',
                  options: [
                    'Any worker',
                    'The designated Site Safety and Health Officer (SSHO)',
                    'Equipment vendor',
                    'Office administrator',
                  ],
                  correctAnswer: 1,
                  explanation:
                    'The designated SSHO / Qualified Person manages hazard control zones.',
                },
                {
                  id: 'q2l4',
                  question: 'What is IDLH?',
                  options: [
                    'Immediate Discharge of Liquid Hazard',
                    'Immediately Dangerous to Life or Health',
                    'Internal Decontamination Line Header',
                    'Indirect Level Hazard',
                  ],
                  correctAnswer: 1,
                  explanation:
                    'IDLH stands for Immediately Dangerous to Life or Health.',
                },
                {
                  id: 'q2l5',
                  question:
                    'What respiratory protection is required in an unknown or IDLH atmosphere?',
                  options: [
                    'N95 dust mask',
                    'Half-mask air purifying respirator',
                    'Full-face SCBA or supplied-air respirator with escape bottle',
                    'Surgical mask',
                  ],
                  correctAnswer: 2,
                  explanation:
                    'IDLH atmospheres require positive-pressure SCBA or SAR with auxiliary escape.',
                },
                {
                  id: 'q2l6',
                  question:
                    'What must be performed before leaving the Exclusion Zone?',
                  options: [
                    'Clock out',
                    'Complete gross and personal decontamination in the CRZ',
                    'Sign out with receptionist',
                    'Remove respirator immediately',
                  ],
                  correctAnswer: 1,
                  explanation:
                    'Workers must undergo thorough decontamination in the Warm Zone before entering clean areas.',
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: '3',
    numericId: 3,
    title: 'Mold Assessment & Remediation Specialist Certification',
    subtitle: 'EPA & IICRC S520 Mold Remediation Protocols',
    slug: 'mold-assessment-remediation-specialist-certification',
    description:
      'Expert guide to fungal hazard evaluation, moisture meters, negative air containment setups, HEPA filtration, and post-remediation clearance testing.',
    category: 'environmental',
    duration: 14400,
    durationLabel: '4 Hours',
    ceuCredits: '0.4 CEU',
    targetAudience:
      'Indoor Air Quality Technicians, Mold Inspectors, Restoration Contractors',
    metaTitle: 'Mold Assessment & Remediation Specialist Certification Course',
    metaDescription:
      'Professional mold remediation online training. Master moisture mapping, containment barriers, antimicrobial treatments, and post-remediation verification testing.',
    keywords:
      'mold remediation training, mold assessment, iicrc s520, indoor air quality, negative air containment, hepa filtration',
    thumbnail:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    createdAt: '2026-01-12T10:00:00.000Z',
    updatedAt: '2026-01-12T10:00:00.000Z',
    modules: [
      {
        id: 'm3_1',
        title: 'Module 1: Fungal Ecology & Containment Engineering',
        order: 1,
        lessons: [
          {
            id: 'l3_1',
            title: 'Moisture Control & Containment Setup',
            duration: '02:30',
            seconds: 150,
            order: 1,
            topics: [
              {
                id: 't3_1',
                title: 'Containment Barriers & Negative Air Pressure',
                order: 1,
                frameType: 2,
                duration: 180,
                content: `<div class="topic-content"><p>Proper mold containment prevents the migration of fungal spores into unaffected building zones. Critical containment requires 6-mil polyethylene plastic barriers and negative air machines equipped with verified HEPA filtration.</p><div class="callout callout-info"><strong>Pressure Differential:</strong> Maintain a minimum of -0.02 inches of water column (-5 Pascals) negative pressure inside the containment zone.</div></div>`,
                imagePrompt:
                  'Professional mold remediation containment barrier with air scrubber exhaust',
                imageUrl:
                  'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80',
                narrationText:
                  'Proper mold containment prevents the migration of fungal spores into unaffected building zones.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: '4',
    numericId: 4,
    title: 'Confined Space Entry & Non-Entry Rescue Standard',
    subtitle: 'OSHA 29 CFR 1910.146 Permit-Required Confined Spaces',
    slug: 'confined-space-entry-non-entry-rescue-standard',
    description:
      'Permit-required confined space entry safety, atmospheric testing (oxygen, LEL, H2S, CO), ventilation setups, attendant duties, and non-entry retrieval systems.',
    category: 'compliance',
    duration: 28800,
    durationLabel: '8 Hours',
    ceuCredits: '0.8 CEU',
    targetAudience:
      'Confined Space Entrants, Standby Attendants, Entry Supervisors',
    metaTitle:
      'Confined Space Entry & Rescue Training (29 CFR 1910.146) | Free LMS',
    metaDescription:
      'Learn permit-required confined space safety. Atmospheric testing protocols, calibration, ventilation calculation, entrant duties, and emergency tripod retrieval systems.',
    keywords:
      'confined space entry, 29 cfr 1910.146, atmospheric testing, lel oxygen testing, rescue tripod, safety training',
    thumbnail:
      'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    createdAt: '2026-01-13T10:00:00.000Z',
    updatedAt: '2026-01-13T10:00:00.000Z',
    modules: [
      {
        id: 'm4_1',
        title: 'Module 1: Atmospheric Hazards & Gas Detection',
        order: 1,
        lessons: [
          {
            id: 'l4_1',
            title: 'Atmospheric Testing Sequence & Calibration',
            duration: '03:15',
            seconds: 195,
            order: 1,
            topics: [
              {
                id: 't4_1',
                title: '4-Gas Meter Testing Sequence',
                order: 1,
                frameType: 2,
                duration: 180,
                content: `<div class="topic-content"><p>Before entering any permit-required confined space, test the atmosphere in this exact mandatory order: 1. Oxygen content (19.5% - 23.5%), 2. Flammable gases/vapors (<10% LEL), 3. Toxic contaminants (H2S and Carbon Monoxide).</p><div class="callout callout-danger"><strong>Stratified Atmospheres:</strong> Gases have different vapor densities. Always sample the top, middle, and bottom of the space at 4-foot intervals.</div></div>`,
                imagePrompt:
                  'Safety specialist lowering gas detection monitor probe into industrial manhole',
                imageUrl:
                  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
                narrationText:
                  'Before entering any permit-required confined space, test the atmosphere in this exact mandatory order.',
              },
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Retrieves all courses — uses per-course storage (v2) with automatic legacy migration.
 * @returns {Array} Array of course objects
 */
export function getAllCourses() {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_COURSES;

  // Trigger migration on first access
  migrateLegacyStorage();

  const isSeeded = localStorage.getItem('hazwoper_courses_seeded');
  const indexStr = localStorage.getItem(STORAGE_KEYS.COURSES_INDEX);
  const deletedIds = safeParse(
    localStorage.getItem('hazwoper_deleted_course_ids'),
    []
  );

  // If no index exists AND never seeded before, seed defaults
  if (
    !isSeeded &&
    (!indexStr || indexStr === 'null' || indexStr === 'undefined')
  ) {
    localStorage.setItem('hazwoper_courses_seeded', 'true');
    const defaultIndex = DEFAULT_INITIAL_COURSES.map((c) => ({
      id: c.id,
      numericId: c.numericId,
      title: c.title,
      slug: c.slug,
      category: c.category,
      status: c.status,
      thumbnail: c.thumbnail,
      durationLabel: c.durationLabel,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    safeSetItem(STORAGE_KEYS.COURSES_INDEX, JSON.stringify(defaultIndex));
    for (const course of DEFAULT_INITIAL_COURSES) {
      courseMemoryCache.set(course.id, course);
      if (course.slug) courseMemoryCache.set(course.slug, course);
      persistToIndexedDB(course);
      safeSetItem(
        `${STORAGE_KEYS.COURSE_PREFIX}${course.id}`,
        JSON.stringify(course)
      );
    }

    return DEFAULT_INITIAL_COURSES;
  }

  // If index is present, parse it and exclude any deleted courses
  const index = safeParse(indexStr, []);
  if (!Array.isArray(index)) return [];

  const validEntries = index.filter(
    (e) => !deletedIds.includes(e.id) && !deletedIds.includes(e.slug)
  );

  const courses = [];
  for (const entry of validEntries) {
    if (courseMemoryCache.has(entry.id)) {
      courses.push(courseMemoryCache.get(entry.id));
      continue;
    }

    const courseStr = localStorage.getItem(
      `${STORAGE_KEYS.COURSE_PREFIX}${entry.id}`
    );
    const course = safeParse(courseStr, null);
    if (course) {
      courseMemoryCache.set(course.id, course);
      if (course.slug) courseMemoryCache.set(course.slug, course);
      courses.push(course);
    } else {
      // Async trigger fetch from IndexedDB
      fetchFromIndexedDB(entry.id);
      courses.push({ ...entry, modules: [] });
    }
  }

  return courses;
}

/**
 * Saves a course to Memory Cache, IndexedDB, per-course localStorage, and syncs to Supabase.
 * Guaranteed to succeed without QuotaExceededError crashes.
 * @param {object} course
 * @returns {boolean} Success status
 */
export function saveCourse(course) {
  if (typeof window === 'undefined') return false;
  if (!course || !course.id) {
    console.error('Invalid course object provided for saving.');
    return false;
  }

  try {
    // Ensure migration has run
    migrateLegacyStorage();

    const indexStr = localStorage.getItem(STORAGE_KEYS.COURSES_INDEX);
    const index = safeParse(indexStr, []);

    let numericId = course.numericId;
    if (!numericId) {
      const existingEntry = index.find((c) => c.id === course.id);
      if (existingEntry?.numericId) {
        numericId = existingEntry.numericId;
      } else {
        let maxNum = 0;
        index.forEach((c) => {
          const num = parseInt(c.numericId, 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        });
        numericId = maxNum + 1;
      }
    }

    const updatedCourse = {
      ...course,
      numericId,
      author: course.author || course.publisher || 'Bilal Ghaffar',
      publisher: course.publisher || course.author || 'Bilal Ghaffar',
      publishedAt:
        course.publishedAt || course.createdAt || new Date().toISOString(),
      createdAt:
        course.createdAt || course.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Immediately cache in Memory Cache (instant sync access everywhere)
    courseMemoryCache.set(updatedCourse.id, updatedCourse);
    if (updatedCourse.slug)
      courseMemoryCache.set(updatedCourse.slug, updatedCourse);

    // 2. Persist to IndexedDB (zero quota limits, supports hundreds of MBs/GBs)
    persistToIndexedDB(updatedCourse);

    // 3. Purge large course JSON from localStorage (full courses belong in IndexedDB & Supabase DB)
    const courseKey = `${STORAGE_KEYS.COURSE_PREFIX}${course.id}`;
    if (localStorage.getItem(courseKey)) {
      localStorage.removeItem(courseKey);
    }

    // 4. Update the lightweight index (only ~1KB, always fits in localStorage)
    const indexEntry = {
      id: updatedCourse.id,
      numericId: updatedCourse.numericId,
      title: updatedCourse.title,
      slug: updatedCourse.slug,
      category: updatedCourse.category,
      status: updatedCourse.status || 'draft',
      thumbnail: updatedCourse.thumbnail,
      durationLabel: updatedCourse.durationLabel,
      author: updatedCourse.author,
      publisher: updatedCourse.publisher,
      publishedAt: updatedCourse.publishedAt,
      createdAt: updatedCourse.createdAt,
      updatedAt: updatedCourse.updatedAt,
    };

    const existingIdx = index.findIndex((c) => c.id === updatedCourse.id);
    if (existingIdx >= 0) {
      index[existingIdx] = indexEntry;
    } else {
      index.push(indexEntry);
    }

    safeSetItem(STORAGE_KEYS.COURSES_INDEX, JSON.stringify(index));

    // 5. Non-blocking async sync to Supabase Cloud Database if available
    syncCourseToCloud(updatedCourse).catch((err) => {
      console.warn('Supabase sync notice:', err?.message || err);
    });

    return true; // Always true because Memory Cache + IndexedDB + Index are saved
  } catch (error) {
    console.error('Failed to save course:', error);
    syncCourseToCloud(course).catch(() => {});
    return true;
  }
}

/**
 * Cloud sync helper for courses
 */
async function syncCourseToCloud(course) {
  if (!supabase) return;
  try {
    const payload = {
      id: course.id,
      title: course.title,
      slug: course.slug || course.id,
      description: course.description || '',
      category: course.category || 'safety',
      duration: course.duration || 7200,
      duration_label: course.durationLabel || '2 Hours',
      thumbnail: course.thumbnail || '',
      status: course.status || 'published',
      author: course.author || course.publisher || 'Se7eN AI Studio',
      settings: course.settings || {},
      modules: course.modules || [],
      final_exam: course.finalExam || {},
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('courses')
      .upsert(payload, { onConflict: 'id' });
    if (error) {
      // Fallback for 409 Conflict: Update by ID or Slug directly
      await supabase.from('courses').update(payload).eq('id', payload.id);
    }
  } catch (e) {
    // Local fallback is always preserved
  }
}

/**
 * Retrieves a specific course by ID or Slug.
 * Checks Memory Cache -> localStorage -> IndexedDB -> defaults.
 * @param {string} courseIdOrSlug
 * @returns {object|null} Course object or null
 */
export function getCourse(courseIdOrSlug) {
  if (!courseIdOrSlug) return null;
  if (typeof window === 'undefined') {
    return (
      DEFAULT_INITIAL_COURSES.find(
        (c) => c.id === courseIdOrSlug || c.slug === courseIdOrSlug
      ) || null
    );
  }

  // 1. Check Memory Cache first (instant)
  if (courseMemoryCache.has(courseIdOrSlug)) {
    return courseMemoryCache.get(courseIdOrSlug);
  }

  // 2. Ensure migration has run
  migrateLegacyStorage();

  // 3. Direct read from per-course key
  const courseStr = localStorage.getItem(
    `${STORAGE_KEYS.COURSE_PREFIX}${courseIdOrSlug}`
  );
  const course = safeParse(courseStr, null);
  if (course) {
    courseMemoryCache.set(course.id, course);
    if (course.slug) courseMemoryCache.set(course.slug, course);
    return course;
  }

  // 4. Check by slug in index
  const index = safeParse(localStorage.getItem(STORAGE_KEYS.COURSES_INDEX), []);
  const matchingEntry = index.find(
    (c) => c.id === courseIdOrSlug || c.slug === courseIdOrSlug
  );
  if (matchingEntry) {
    const entryCourseStr = localStorage.getItem(
      `${STORAGE_KEYS.COURSE_PREFIX}${matchingEntry.id}`
    );
    const entryCourse = safeParse(entryCourseStr, null);
    if (entryCourse) {
      courseMemoryCache.set(entryCourse.id, entryCourse);
      if (entryCourse.slug)
        courseMemoryCache.set(entryCourse.slug, entryCourse);
      return entryCourse;
    }
  }

  // 5. Trigger async IndexedDB load in background
  fetchFromIndexedDB(matchingEntry ? matchingEntry.id : courseIdOrSlug);

  // 6. Check default courses
  const defaultCourse = DEFAULT_INITIAL_COURSES.find(
    (c) => c.id === courseIdOrSlug || c.slug === courseIdOrSlug
  );
  if (defaultCourse) return defaultCourse;

  return null;
}

/**
 * Async course getter that awaits IndexedDB hydration if missing from memory/localStorage.
 */
export async function getCourseAsync(courseIdOrSlug) {
  if (!courseIdOrSlug) return null;
  const sync = getCourse(courseIdOrSlug);
  if (sync && Array.isArray(sync.modules) && sync.modules.length > 0) {
    return sync;
  }
  const targetId = sync?.id || courseIdOrSlug;
  let idbCourse = await fetchFromIndexedDB(targetId);

  if (!idbCourse && supabase) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .or(`id.eq.${targetId},slug.eq.${targetId}`)
        .single();
      if (!error && data) {
        idbCourse = {
          id: data.id,
          title: data.title,
          slug: data.slug || data.id,
          description: data.description || '',
          category: data.category || 'safety',
          duration: data.duration || 7200,
          durationLabel: data.duration_label || '2 Hours',
          thumbnail: data.thumbnail || '',
          status: data.status || 'published',
          settings: data.settings || {},
          modules: data.modules || [],
          finalExam: data.final_exam || {},
          updatedAt: data.updated_at || new Date().toISOString(),
        };
        courseMemoryCache.set(idbCourse.id, idbCourse);
        if (idbCourse.slug) courseMemoryCache.set(idbCourse.slug, idbCourse);
      }
    } catch (e) {}
  }

  return idbCourse || sync;
}

/**
 * Async getter for all courses that hydrates any missing modules from IndexedDB & Supabase DB.
 */
export async function getAllCoursesAsync() {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_COURSES;
  const list = getAllCourses();
  const hydrated = await Promise.all(
    list.map(async (c) => {
      if (Array.isArray(c.modules) && c.modules.length > 0) return c;
      const full = await fetchFromIndexedDB(c.id);
      return full || c;
    })
  );

  // Primary Source of Truth: Sync directly from Supabase Database
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(
          'id, title, slug, description, category, duration, duration_label, thumbnail, status, author, settings, updated_at'
        );
      if (!error && Array.isArray(data) && data.length > 0) {
        data.forEach((row) => {
          const cloudCourse = {
            id: row.id,
            title: row.title,
            slug: row.slug || row.id,
            description: row.description || '',
            category: row.category || 'safety',
            duration: row.duration || 7200,
            durationLabel: row.duration_label || '2 Hours',
            thumbnail: row.thumbnail || '',
            status: row.status || 'published',
            author: row.author || 'Bilal Ghaffar',
            settings: row.settings || {},
            modules: row.modules || [],
            finalExam: row.final_exam || {},
            updatedAt: row.updated_at || new Date().toISOString(),
          };
          const existingIdx = hydrated.findIndex(
            (c) => c.id === row.id || c.slug === row.slug
          );
          if (existingIdx !== -1) {
            hydrated[existingIdx] = {
              ...hydrated[existingIdx],
              ...cloudCourse,
            };
          } else {
            hydrated.push(cloudCourse);
          }
          courseMemoryCache.set(cloudCourse.id, cloudCourse);
          if (cloudCourse.slug)
            courseMemoryCache.set(cloudCourse.slug, cloudCourse);
        });
      }
    } catch (e) {}
  }

  // Guarantee unique sequential numericId (1, 2, 3, 4...) for all courses
  const assignedIds = new Set();
  hydrated.forEach((c, idx) => {
    let num = parseInt(c.numericId, 10);
    if (isNaN(num) || num <= 0 || assignedIds.has(num)) {
      num = idx + 1;
      while (assignedIds.has(num)) {
        num++;
      }
    }
    c.numericId = num;
    assignedIds.add(num);
  });

  return hydrated;
}

/**
 * Deletes a course permanently from in-memory cache, localStorage, IndexedDB, and Supabase cloud.
 * @param {string} courseId
 * @returns {boolean} Success status
 */
export function deleteCourse(courseId) {
  if (typeof window === 'undefined' || !courseId) return false;
  try {
    // Ensure migration has run
    migrateLegacyStorage();

    // 0. Locate course metadata (to find associated slug and titles)
    const cached = courseMemoryCache.get(courseId) || getCourse(courseId);
    const targetSlug = cached?.slug;

    // 1. Evict from in-memory Map cache
    courseMemoryCache.delete(courseId);
    if (targetSlug) courseMemoryCache.delete(targetSlug);
    for (const [key, value] of courseMemoryCache.entries()) {
      if (
        key === courseId ||
        value?.id === courseId ||
        (targetSlug && (key === targetSlug || value?.slug === targetSlug))
      ) {
        courseMemoryCache.delete(key);
      }
    }

    // 2. Remove all course records from localStorage
    localStorage.removeItem(`${STORAGE_KEYS.COURSE_PREFIX}${courseId}`);
    localStorage.removeItem(`${STORAGE_KEYS.PROGRESS_PREFIX}${courseId}`);
    localStorage.removeItem(`${STORAGE_KEYS.CERTIFICATES_PREFIX}${courseId}`);
    localStorage.removeItem(`hazwoper_seat_time_${courseId}`);
    if (targetSlug) {
      localStorage.removeItem(`${STORAGE_KEYS.COURSE_PREFIX}${targetSlug}`);
      localStorage.removeItem(`${STORAGE_KEYS.PROGRESS_PREFIX}${targetSlug}`);
      localStorage.removeItem(`hazwoper_seat_time_${targetSlug}`);
    }

    // 3. Remove from Courses Index
    const indexStr = localStorage.getItem(STORAGE_KEYS.COURSES_INDEX);
    const index = safeParse(indexStr, []);
    const filtered = index.filter(
      (c) => c.id !== courseId && (!targetSlug || c.slug !== targetSlug)
    );
    safeSetItem(STORAGE_KEYS.COURSES_INDEX, JSON.stringify(filtered));

    // 4. Mark as seeded and append to deleted course IDs blacklist
    localStorage.setItem('hazwoper_courses_seeded', 'true');
    const deletedStr = localStorage.getItem('hazwoper_deleted_course_ids');
    const deletedIds = safeParse(deletedStr, []);
    if (!deletedIds.includes(courseId)) deletedIds.push(courseId);
    if (targetSlug && !deletedIds.includes(targetSlug))
      deletedIds.push(targetSlug);
    safeSetItem('hazwoper_deleted_course_ids', JSON.stringify(deletedIds));

    // 5. Clean legacy single-blob storage if present
    const legacyStr = localStorage.getItem(STORAGE_KEYS.COURSES);
    if (legacyStr) {
      const legacyCourses = safeParse(legacyStr, []);
      const filteredLegacy = legacyCourses.filter(
        (c) => c.id !== courseId && (!targetSlug || c.slug !== targetSlug)
      );
      safeSetItem(STORAGE_KEYS.COURSES, JSON.stringify(filteredLegacy));
    }

    // 6. Delete from IndexedDB (non-blocking async)
    deleteFromIndexedDB(courseId);
    if (targetSlug) deleteFromIndexedDB(targetSlug);

    // 7. Delete from Supabase cloud database via direct SDK and server-side API
    if (typeof fetch === 'function') {
      fetch(`/api/courses/${encodeURIComponent(courseId)}`, {
        method: 'DELETE',
      }).catch(() => {});
      if (targetSlug) {
        fetch(`/api/courses/${encodeURIComponent(targetSlug)}`, {
          method: 'DELETE',
        }).catch(() => {});
      }
    }

    if (supabase) {
      const deleteFilter = targetSlug
        ? `id.eq.${courseId},slug.eq.${targetSlug}`
        : `id.eq.${courseId}`;
      supabase
        .from('courses')
        .delete()
        .or(deleteFilter)
        .then(() => {})
        .catch((err) => {
          console.warn('Supabase course deletion notice:', err?.message || err);
        });

      supabase
        .from('course_progress')
        .delete()
        .eq('course_id', courseId)
        .then(() => {})
        .catch(() => {});

      supabase
        .from('course_certificates')
        .delete()
        .eq('course_id', courseId)
        .then(() => {})
        .catch(() => {});
    }

    // 8. Fire custom window event so all open tabs/views update
    try {
      window.dispatchEvent(
        new CustomEvent('hazwoper:course_deleted', {
          detail: { courseId, slug: targetSlug },
        })
      );
    } catch {}

    return true;
  } catch (error) {
    console.error('Failed to delete course:', error);
    return false;
  }
}

/**
 * Updates specific fields of an existing course
 */
export function updateCourse(courseId, updates) {
  const course = getCourse(courseId);
  if (!course) return false;

  const updatedCourse = {
    ...course,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return saveCourse(updatedCourse);
}

/**
 * Triggers a download of the course JSON
 */
export function exportCourseJSON(courseId) {
  const course = getCourse(courseId);
  if (!course) {
    console.error('Course not found for export.');
    return;
  }

  const dataStr = JSON.stringify(course, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${course.slug || 'course'}-${courseId}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Imports a course from a JSON string
 */
export function importCourseJSON(jsonString) {
  try {
    const course =
      typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    if (!course || !course.title) {
      throw new Error('Invalid course structure.');
    }
    if (!course.id) {
      course.id = crypto?.randomUUID
        ? crypto.randomUUID()
        : 'course-' + Date.now();
    }

    const success = saveCourse(course);
    return success ? course : null;
  } catch (error) {
    console.error('Failed to import course:', error);
    return null;
  }
}

/**
 * Gets a learner's progress for a specific course
 * @param {string} courseId
 * @returns {object} Progress object
 */
export function getCourseProgress(courseId) {
  if (typeof window === 'undefined') return null;

  const defaultProgress = {
    courseId: courseId,
    startedAt: null,
    lastAccessedAt: null,
    completedTopics: [],
    completedLessons: [],
    completedModules: [],
    quizResults: {},
    examResult: null,
    overallProgress: 0,
    certificateEarned: false,
    certificateId: null,
    timeSpent: 0,
    lastTopicId: null,
  };

  const progressStr = localStorage.getItem(
    `${STORAGE_KEYS.PROGRESS_PREFIX}${courseId}`
  );
  if (!progressStr) return defaultProgress;

  const progress = safeParse(progressStr, defaultProgress);
  return { ...defaultProgress, ...progress };
}

/**
 * Saves a learner's progress
 * @param {string} courseId
 * @param {object} progressUpdates
 * @returns {boolean} Success status
 */
export function saveCourseProgress(courseId, progressUpdates) {
  if (typeof window === 'undefined') return false;

  try {
    const currentProgress = getCourseProgress(courseId);

    const newProgress = {
      ...currentProgress,
      ...progressUpdates,
      lastAccessedAt: new Date().toISOString(),
      startedAt: currentProgress.startedAt || new Date().toISOString(),
    };

    safeSetItem(
      `${STORAGE_KEYS.PROGRESS_PREFIX}${courseId}`,
      JSON.stringify(newProgress)
    );

    // Optional background sync with Supabase course_progress
    syncProgressToCloud(courseId, newProgress).catch(() => {});

    return true;
  } catch (error) {
    console.error('Failed to save course progress:', error);
    return false;
  }
}

async function syncProgressToCloud(courseId, progress) {
  if (!supabase) return;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    await supabase.from('course_progress').upsert(
      {
        user_id: session.user.id,
        course_id: courseId,
        completed_topics: progress.completedTopics || [],
        completed_lessons: progress.completedLessons || [],
        completed_modules: progress.completedModules || [],
        quiz_results: progress.quizResults || {},
        exam_result: progress.examResult || null,
        overall_progress: progress.overallProgress || 0,
        certificate_earned: progress.certificateEarned || false,
        certificate_id: progress.certificateId || null,
        time_spent: progress.timeSpent || 0,
        last_topic_id: progress.lastTopicId || null,
        last_accessed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id' }
    );
  } catch (e) {
    // Non-fatal
  }
}

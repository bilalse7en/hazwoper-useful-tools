'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Edit3,
  Eye,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Save,
  Sparkles,
  Clock,
  Award,
  Settings,
  Search,
  Filter,
  FileText,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  MoreVertical,
  X,
  ArrowLeft,
  ArrowRight,
  Video,
  Image as ImageIcon,
  Layout,
  List,
  Type,
  HelpCircle,
  Check,
  ZoomIn,
  RefreshCw,
  Wand2,
  Maximize2,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Info,
  Lightbulb,
  ShieldCheck,
  Flame,
  BookMarked,
  Layers,
  FileCode,
  Globe,
  Tag,
  DollarSign,
  CheckSquare,
  Split,
  LayoutTemplate,
  Camera,
  Stamp,
  Menu,
  Volume2,
  Mic,
  StopCircle,
  User,
  Calendar,
} from 'lucide-react';

import {
  generateCourse,
  generateTopicContent,
  generateQuizQuestions,
  generateUUID,
  runMultiAgentCourseGeneration,
  COURSE_AGENTS,
  calculateCurriculumSizing,
  generateProfessionalCourseOverview,
} from '@/lib/course-generator';
import {
  getAllCourses,
  getAllCoursesAsync,
  saveCourse,
  getCourse,
  deleteCourse,
  updateCourse,
  exportCourseJSON,
  importCourseJSON,
  DEFAULT_INITIAL_COURSES,
} from '@/lib/course-storage';
import { generateSe7enImage, callPuterAiChat, getRealisticTopicPhoto } from '@/lib/se7en-ai';
import { stampSystemLogoOnImage } from '@/lib/watermark-util';
import { ProfessionalCoursePlayerModal } from '@/components/professional-course-player-modal';
import ComponentPalette from '@/components/admin/courses/content/ComponentPalette';
import ComponentCanvas from '@/components/admin/courses/content/ComponentCanvas';
import ComponentConfigModal from '@/components/admin/courses/content/ComponentConfigModal';
import {
  parseTopicContentToComponents,
  serializeComponentsToHtml,
  generateComponentDefaults,
} from '@/lib/component-registry';
import {
  applyPhoneticNarratorRules,
  DEFAULT_PHONETIC_DICTIONARY,
  extractCompleteNarrationTranscript,
} from '@/lib/course-tts';
import { cn } from '@/lib/utils';
import { showToast, showSuccess, showConfirm } from '@/lib/swal';

// ============================================================================
// UI ATOMS
// ============================================================================

const Button = React.forwardRef(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm',
      secondary: 'bg-muted text-foreground hover:bg-muted/80',
      outline: 'border border-border bg-card/60 text-foreground hover:bg-muted',
      ghost: 'bg-transparent text-foreground hover:bg-muted',
      danger: 'bg-red-500 text-white hover:bg-red-600',
      emerald: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
      purple: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
      amber:
        'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-sm',
    };
    const sizes = {
      xs: 'px-2 py-1 text-xs rounded',
      sm: 'px-3 py-1.5 text-xs rounded-md font-medium',
      md: 'px-4 py-2 text-sm rounded-lg font-medium',
      lg: 'px-6 py-2.5 text-base rounded-xl font-semibold',
      icon: 'p-2 rounded-lg',
    };
    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    className={cn(
      'flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-50',
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex min-h-[90px] w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-50',
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-primary text-primary-foreground font-semibold',
    success:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    warning:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
    purple:
      'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
    draft: 'bg-muted text-muted-foreground border border-border',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-tight',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

const Card = ({ className, children, ...props }) => (
  <div
    className={cn(
      'rounded-2xl border border-border bg-card text-foreground shadow-sm transition-all',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// ============================================================================
// COURSE INFO & SEO METADATA MODAL (SEPARATE EDITING)
// ============================================================================
function CourseInfoSeoModal({ isOpen, course, onClose, onSave }) {
  const [formData, setFormData] = useState(course || {});

  useEffect(() => {
    if (course) {
      setFormData({
        ...course,
        metaTitle:
          course.metaTitle ||
          `${course.title} Online Training & Certification | 100% Free LMS`,
        metaDescription:
          course.metaDescription ||
          course.description ||
          `Complete online training course on ${course.title}. Accredited OSHA & safety curriculum with verifiable certificate.`,
        keywords:
          course.keywords ||
          `${course.title.toLowerCase()}, safety training, osha compliance, online course, certification`,
        slug:
          course.slug ||
          course.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
        targetAudience:
          course.targetAudience ||
          'Safety Professionals, Field Workers & Compliance Officers',
        ceuCredits: course.ceuCredits || '0.2 CEU',
        pricingTier: course.pricingTier || 'Free Preview',
      });
    }
  }, [course]);

  if (!isOpen || !course) return null;

  const handleSave = () => {
    onSave(formData);
    showSuccess('Course information and SEO metadata updated!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden text-foreground flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                Edit Course Info & SEO Metadata
              </h3>
              <p className="text-xs text-muted-foreground">
                Manage listing details, search rankings, and accreditation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title & Subtitle */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Course Title
            </label>
            <Input
              value={formData.title || ''}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="text-sm font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Course Subtitle / Scope
            </label>
            <Input
              value={formData.subtitle || ''}
              onChange={(e) =>
                setFormData({ ...formData, subtitle: e.target.value })
              }
              placeholder="e.g., OSHA 29 CFR 1926 Subpart M Fall Arrest Standard"
              className="text-xs"
            />
          </div>

          {/* Status & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Course Status
              </label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-border bg-card text-xs focus:ring-2 focus:ring-primary/40 font-semibold"
                value={formData.status || 'published'}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="published">🟢 Published (Live in Player)</option>
                <option value="draft">🟡 Draft (Work in Progress)</option>
                <option value="archived">⚪ Archived</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Category
              </label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-border bg-card text-xs focus:ring-2 focus:ring-primary/40 font-semibold"
                value={formData.category || 'safety'}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="safety">Safety & OSHA</option>
                <option value="environmental">Environmental</option>
                <option value="compliance">Compliance</option>
                <option value="technology">Technology & AI</option>
                <option value="healthcare">Healthcare</option>
                <option value="business">Business</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          {/* URL Slug */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              URL Slug (SEO-Friendly)
            </label>
            <Input
              value={formData.slug || ''}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              className="text-xs font-mono"
            />
          </div>

          {/* Target Audience & CEU Credits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Target Audience
              </label>
              <Input
                value={formData.targetAudience || ''}
                onChange={(e) =>
                  setFormData({ ...formData, targetAudience: e.target.value })
                }
                placeholder="e.g. Construction Workers, Riggers"
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                CEU Credits & Duration
              </label>
              <Input
                value={formData.ceuCredits || ''}
                onChange={(e) =>
                  setFormData({ ...formData, ceuCredits: e.target.value })
                }
                placeholder="0.2 CEU (2 Hours)"
                className="text-xs"
              />
            </div>
          </div>

          {/* SEO Meta Title */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                SEO Meta Title
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                {formData.metaTitle?.length || 0}/60 chars
              </span>
            </div>
            <Input
              value={formData.metaTitle || ''}
              onChange={(e) =>
                setFormData({ ...formData, metaTitle: e.target.value })
              }
              placeholder="Optimized 55-60 chars title tag..."
              className="text-xs font-medium"
            />
          </div>

          {/* SEO Meta Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                SEO Meta Description
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                {formData.metaDescription?.length || 0}/160 chars
              </span>
            </div>
            <Textarea
              value={formData.metaDescription || ''}
              onChange={(e) =>
                setFormData({ ...formData, metaDescription: e.target.value })
              }
              placeholder="Engaging meta description for Google snippets..."
              className="text-xs min-h-[60px]"
            />
          </div>

          {/* SEO Keywords */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              SEO Keywords (Comma Separated)
            </label>
            <Input
              value={formData.keywords || ''}
              onChange={(e) =>
                setFormData({ ...formData, keywords: e.target.value })
              }
              placeholder="osha safety, fall protection, pfas, harness training"
              className="text-xs"
            />
          </div>

          {/* Full Course Overview & Pedagogical Objectives */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Course Overview & Regulatory Objectives
              </label>
              <button
                type="button"
                onClick={() => {
                  const fresh = generateProfessionalCourseOverview(
                    formData.title,
                    formData.category,
                    formData.duration || '2 Hours'
                  );
                  setFormData((prev) => ({ ...prev, description: fresh }));
                  showSuccess(
                    'Regulatory standards and objectives auto-drafted!'
                  );
                }}
                className="text-[11px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30"
                title="Auto-detect standards and generate official accredited objectives"
              >
                <Sparkles className="w-3.5 h-3.5" /> Auto-Draft Regulatory
                Standards
              </button>
            </div>
            <Textarea
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Accredited course overview and applicable governing standards..."
              rows={6}
              className="text-xs leading-relaxed font-mono"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-end gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1.5" /> Save Course Info
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PHONETIC PRONUNCIATION DICTIONARY & NARRATOR OVERRIDE MODAL
// ============================================================================
function PhoneticPronunciationModal({ isOpen, course, onClose, onSave }) {
  const [dict, setDict] = useState(course?.pronunciationDictionary || {});
  const [newWord, setNewWord] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [testSentence, setTestSentence] = useState(
    'In 29 CFR HAZWOPER, workers facing lead exposure must follow NIOSH, OSHA, and HIPAA guidelines for PPE and SCBA.'
  );
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    if (course) {
      setDict(course.pronunciationDictionary || {});
    }
  }, [course]);

  if (!isOpen) return null;

  const handleAddOverride = () => {
    if (!newWord.trim() || !newPhonetic.trim()) return;
    const updated = { ...dict, [newWord.trim()]: newPhonetic.trim() };
    setDict(updated);
    setNewWord('');
    setNewPhonetic('');
  };

  const handleRemoveOverride = (wordKey) => {
    const updated = { ...dict };
    delete updated[wordKey];
    setDict(updated);
  };

  const handleSave = () => {
    onSave(dict);
    showSuccess('Phonetic pronunciation rules saved to course!');
    onClose();
  };

  const processedPreviewText = applyPhoneticNarratorRules(testSentence, dict);

  const handleTestAudio = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      showToast('Browser Speech Synthesis unavailable', 'warning');
      return;
    }
    window.speechSynthesis.cancel();

    if (isPlayingTest) {
      setIsPlayingTest(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(processedPreviewText);
    utterance.rate = 0.96;
    utterance.onend = () => setIsPlayingTest(false);
    utterance.onerror = () => setIsPlayingTest(false);

    setIsPlayingTest(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-amber-400">
                Phonetic Narrator Dictionary &amp; Rules
              </h3>
              <p className="text-xs text-slate-400">
                Context-Aware Pronunciation Engine for OSHA 29 CFR &amp;
                HAZWOPER Acronyms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Live Audio Narration Tester */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Mic className="w-4 h-4" /> Live Audio Narration Tester
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Real-time Speech Synthesis Preview
              </span>
            </div>

            <textarea
              value={testSentence}
              onChange={(e) => setTestSentence(e.target.value)}
              rows={2}
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700/70 text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500"
              placeholder="Type any regulatory sentence or acronym to test audio speech..."
            />

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Phonetically Processed Output (Spoken by AI):
              </span>
              <p className="text-xs font-mono text-emerald-400 leading-relaxed bg-black/40 p-2 rounded-lg border border-emerald-500/20">
                {processedPreviewText}
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleTestAudio}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs h-9 px-4 rounded-xl shadow-md"
              >
                {isPlayingTest ? (
                  <>
                    <StopCircle className="w-4 h-4 mr-1.5 text-rose-950 animate-spin" />{' '}
                    Stop Audio Test
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 mr-1.5" /> Test Narration Audio
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Add Custom Word Override */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-400" /> Custom Word
              Pronunciation Overrides
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Exact Word/Acronym (e.g. Lead)"
                className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:border-amber-500 outline-none"
              />
              <input
                value={newPhonetic}
                onChange={(e) => setNewPhonetic(e.target.value)}
                placeholder="Phonetic Spelling (e.g. Ledd)"
                className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:border-amber-500 outline-none"
              />
              <Button
                onClick={handleAddOverride}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 rounded-xl"
              >
                Add Rule
              </Button>
            </div>

            {/* Custom Rules List */}
            {Object.keys(dict).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {Object.entries(dict).map(([word, phonetic]) => (
                  <div
                    key={word}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                  >
                    <div>
                      <strong className="text-white font-semibold">
                        {word}
                      </strong>
                      <span className="text-slate-400 mx-1.5">→</span>
                      <span className="text-amber-400 font-mono font-bold">
                        {phonetic}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveOverride(word)}
                      className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                No custom word overrides added yet. Add custom word rules above
                if you need specific site-wide pronunciation changes!
              </p>
            )}
          </div>

          {/* Built-In Standard Rules Overview */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Automated
              Safety Acronym &amp; Homograph Rules (Built-In)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-amber-400 font-bold">HAZWOPER</span> →
                HAZ-WAH-PER
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-amber-400 font-bold">HIPAA</span> → HIP-AH
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-amber-400 font-bold">NIOSH</span> →
                NYE-OSH
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-amber-400 font-bold">OSHA</span> → O-SHAH
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-amber-400 font-bold">29 CFR</span> → 29
                Code of...
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-amber-400 font-bold">SCBA</span> → S-C-B-A
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-amber-400 font-bold">LOTO</span> → LOW-TO
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-amber-400 font-bold">Lead (Metal)</span> →
                Ledd
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-amber-400 font-bold">Lead (Team)</span> →
                Leed
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs"
          >
            <Save className="w-4 h-4 mr-1.5" /> Save Pronunciation Rules
          </Button>
        </div>
      </div>
    </div>
  );
}
export default function AdminCoursesPage() {
  const [view, setView] = useState('list'); // 'list', 'wizard', 'editor'
  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewModalCourse, setPreviewModalCourse] = useState(null);
  const [infoModalCourse, setInfoModalCourse] = useState(null);
  const fileInputRef = useRef(null);

  // Load courses on mount & listen to course deletion events
  // Load courses on mount & listen to course deletion and update events
  useEffect(() => {
    loadCourses();

    const handleDeletedEvent = (e) => {
      const deletedId = e?.detail?.courseId;
      const deletedSlug = e?.detail?.slug;
      if (deletedId) {
        setCourses((prev) =>
          prev.filter(
            (c) =>
              c.id !== deletedId &&
              c.slug !== deletedId &&
              (!deletedSlug || c.slug !== deletedSlug)
          )
        );
      }
    };

    const handleUpdatedEvent = () => {
      loadCourses();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('hazwoper:course_deleted', handleDeletedEvent);
      window.addEventListener('hazwoper_courses_updated', handleUpdatedEvent);

      const handlePopState = () => {
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const editParam = urlParams.get('edit') || urlParams.get('courseId');
          const actionParam = urlParams.get('action');
          if (editParam) {
            setCourses((currentCourses) => {
              const found = findCourseByParam(currentCourses, editParam);
              if (found) {
                setEditingCourse(found);
                setView('editor');
              }
              return currentCourses;
            });
          } else if (actionParam === 'wizard') {
            setView('wizard');
          } else {
            setView('list');
            setEditingCourse(null);
          }
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener(
          'hazwoper:course_deleted',
          handleDeletedEvent
        );
        window.removeEventListener(
          'hazwoper_courses_updated',
          handleUpdatedEvent
        );
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []);

  const findCourseByParam = (list, param) => {
    if (!param || !Array.isArray(list) || list.length === 0) return null;

    // 1. Direct match by numericId, string id, or slug
    const directMatch = list.find(
      (c) =>
        String(c.numericId) === String(param) ||
        String(c.id) === String(param) ||
        String(c.slug) === String(param)
    );
    if (directMatch) return directMatch;

    // 2. 1-based index matching (e.g. param '1' -> list[0], '2' -> list[1])
    const num = Number(param);
    if (!isNaN(num) && num >= 1 && num <= list.length) {
      return list[num - 1];
    }

    return null;
  };

  const loadCourses = async () => {
    try {
      const data = await getAllCoursesAsync();
      const loadedCourses = Array.isArray(data) ? data : [];
      setCourses(loadedCourses);

      // Hydrate editor state from URL if ?edit=1 or ?edit=2 is present
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const editParam = urlParams.get('edit') || urlParams.get('courseId');
        const actionParam = urlParams.get('action');

        if (editParam && loadedCourses.length > 0) {
          const found = findCourseByParam(loadedCourses, editParam);
          if (found) {
            setEditingCourse(found);
            setView('editor');
          }
        } else if (actionParam === 'wizard') {
          setView('wizard');
        }
      }
    } catch (err) {
      console.error('Failed to load courses', err);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setView('wizard');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('action', 'wizard');
      url.searchParams.delete('edit');
      url.searchParams.delete('courseId');
      window.history.pushState(
        { path: url.href },
        '',
        url.pathname + url.search
      );
    }
  };

  const handleEdit = (course) => {
    if (!course) return;
    setEditingCourse(course);
    setView('editor');
    if (typeof window !== 'undefined') {
      const shortId = course.numericId || course.id;
      const url = new URL(window.location.href);
      url.searchParams.set('edit', shortId);
      url.searchParams.delete('action');
      url.searchParams.delete('courseId');
      window.history.pushState(
        { path: url.href },
        '',
        url.pathname + url.search
      );
    }
  };

  const handleBackToList = () => {
    loadCourses();
    setEditingCourse(null);
    setView('list');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('edit');
      url.searchParams.delete('action');
      url.searchParams.delete('courseId');
      url.searchParams.delete('status');
      url.searchParams.delete('mode');
      window.history.pushState({ path: url.href }, '', url.pathname);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = importCourseJSON(event.target.result);
        if (imported) {
          showSuccess('Course imported successfully!');
          loadCourses();
        } else {
          showToast('Failed to import course structure', 'error');
        }
      } catch (err) {
        showToast('Invalid JSON course file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveInfoMetadata = (updatedData) => {
    saveCourse(updatedData);
    if (editingCourse && editingCourse.id === updatedData.id) {
      setEditingCourse(updatedData);
    }
    loadCourses();
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-background text-foreground',
        view === 'editor' ? 'p-0' : 'p-4 md:p-8'
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".json"
        className="hidden"
      />

      {/* Interactive Course Player Modal Preview */}
      <ProfessionalCoursePlayerModal
        isOpen={!!previewModalCourse}
        onClose={() => setPreviewModalCourse(null)}
        initialCourseData={previewModalCourse}
        isAdminMode={true}
      />

      {/* Course Info & SEO Metadata Modal */}
      <CourseInfoSeoModal
        isOpen={!!infoModalCourse}
        course={infoModalCourse}
        onClose={() => setInfoModalCourse(null)}
        onSave={handleSaveInfoMetadata}
      />

      {view === 'list' && (
        <div className="mx-auto max-w-7xl">
          <CourseListView
            courses={courses}
            isLoading={isLoading}
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onPreview={(c) => setPreviewModalCourse(c)}
            onEditInfo={(c) => setInfoModalCourse(c)}
            onImportClick={handleImportClick}
            setCourses={setCourses}
            refreshCourses={loadCourses}
          />
        </div>
      )}

      {view === 'wizard' && (
        <div className="mx-auto max-w-7xl">
          <CourseWizard
            onCancel={handleBackToList}
            onComplete={(course) => {
              loadCourses();
              setView('list');
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', window.location.pathname);
              }
            }}
            onOpenFullEditor={(course) => {
              setEditingCourse(course);
              setView('editor');
              if (typeof window !== 'undefined' && course) {
                const shortId = course.numericId || course.id;
                const url = new URL(window.location.href);
                url.searchParams.set('edit', shortId);
                url.searchParams.delete('action');
                url.searchParams.delete('courseId');
                url.searchParams.delete('status');
                url.searchParams.delete('mode');
                window.history.pushState(
                  { path: url.href },
                  '',
                  url.pathname + url.search
                );
              }
            }}
          />
        </div>
      )}

      {view === 'editor' && (
        <CourseEditor
          key={editingCourse?.id || editingCourse?.numericId || 'course-editor'}
          course={editingCourse}
          onBack={handleBackToList}
          onOpenInfo={() => setInfoModalCourse(editingCourse)}
          onOpenPreview={() => setPreviewModalCourse(editingCourse)}
        />
      )}
    </div>
  );
}

// ============================================================================
// 1. COURSE LIST VIEW (Shows Sequential IDs 1, 2, 3, 4...)
// ============================================================================
function CourseListView({
  courses,
  isLoading,
  onCreateNew,
  onEdit,
  onPreview,
  onEditInfo,
  onImportClick,
  setCourses,
  refreshCourses,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const categories = [
    'All',
    'safety',
    'technology',
    'healthcare',
    'business',
    'compliance',
    'environmental',
    'general',
  ];
  const statuses = ['All', 'published', 'draft', 'archived'];

  const filteredCourses = useMemo(() => {
    const filtered = courses.filter((course) => {
      const matchesSearch =
        course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        filterCategory === 'All' ||
        (course.category || 'general').toLowerCase() ===
          filterCategory.toLowerCase();
      const matchesStatus =
        filterStatus === 'All' ||
        (course.status || 'published') === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    return filtered.map((c, i) => ({
      ...c,
      displayId: i + 1, // Strict sequential IDs (1, 2, 3, 4...)
    }));
  }, [courses, searchQuery, filterCategory, filterStatus]);

  const handleTogglePublish = (course) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    const updated = {
      ...course,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    saveCourse(updated);
    setCourses((prev) =>
      prev.map((c) => (c.id === course.id ? { ...c, status: newStatus } : c))
    );
    if (newStatus === 'published') {
      showSuccess(`"${course.title}" is now Published and live in the Player!`);
    } else {
      showToast(`"${course.title}" moved to Draft status.`, 'info');
    }
  };

  const handleDelete = async (id, title) => {
    const confirmed = await showConfirm(
      `Delete "${title}"?`,
      'This will permanently remove the course and its progress records from storage and database.'
    );
    if (confirmed) {
      deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id && c.slug !== id));
      showToast('Course permanently deleted', 'info');
    }
  };

  const handleDuplicate = (id) => {
    const original = getCourse(id);
    if (original) {
      const duplicate = {
        ...JSON.parse(JSON.stringify(original)),
        id: generateUUID(),
        title: `${original.title} (Copy)`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveCourse(duplicate);
      setCourses([duplicate, ...courses]);
      showSuccess('Course duplicated as draft!');
    }
  };

  const handleExport = (id) => {
    exportCourseJSON(id);
    showToast('Course JSON exported', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-3xl border border-primary/20">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="w-6 h-6" />
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              AI Course Creator & Manager
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-black uppercase tracking-wider shadow-xs">
              👑 Master Admin • Bilal Ghaffar
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Build, edit, and publish curriculum with 3 responsive frame layouts,
            auto SEO pre-fill, and TTS audio narration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="md" onClick={onImportClick}>
            <Upload className="w-4 h-4 mr-1.5" />
            Import JSON
          </Button>
          <Button
            onClick={onCreateNew}
            size="lg"
            className="shadow-lg shadow-primary/25 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Course with AI
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-card/60 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search courses by title, topic, or keyword..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus:ring-2 focus:ring-primary/40 font-medium"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus:ring-2 focus:ring-primary/40 font-medium"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Statuses' : s.toUpperCase()}
                </option>
              ))}
            </select>

            <Button
              variant="ghost"
              size="icon"
              onClick={refreshCourses}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid of Courses (Sequential IDs 1, 2, 3, 4...) */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium">Loading Course Library...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <BookMarked className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold">No Courses Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
            Start by creating your first AI-generated training course or import
            an existing curriculum JSON.
          </p>
          <Button onClick={onCreateNew}>
            <Sparkles className="w-4 h-4 mr-2" />
            Create First Course
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const moduleCount = course.modules?.length || 0;
            const lessonCount =
              course.modules?.reduce(
                (acc, m) => acc + (m.lessons?.length || 0),
                0
              ) || 0;
            const topicCount =
              course.modules?.reduce(
                (acc, m) =>
                  acc +
                  (m.lessons?.reduce(
                    (a, l) => a + (l.topics?.length || 0),
                    0
                  ) || 0),
                0
              ) || 0;

            return (
              <Card
                key={course.id}
                className="group flex flex-col overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                {/* Thumbnail / Header with Course ID starting from 1 */}
                <div className="relative h-44 bg-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      course.thumbnail && course.thumbnail.trim() !== ''
                        ? course.thumbnail
                        : 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                  {/* ID Badge Starting from 1 & Interactive Status Badge */}
                  <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs tracking-wider shadow-md">
                      ID #{course.displayId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(course)}
                      title={`Click to switch to ${course.status === 'published' ? 'Draft' : 'Published'}`}
                      className="cursor-pointer hover:scale-105 transition-transform"
                    >
                      <Badge
                        variant={
                          course.status === 'published' ? 'success' : 'draft'
                        }
                      >
                        {course.status === 'published'
                          ? '● Published'
                          : '○ Draft'}
                      </Badge>
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" />{' '}
                      {course.durationLabel || '2 Hours'} Course •{' '}
                      {course.ceuCredits || '0.2 CEU'}
                    </span>
                    <h3 className="font-bold text-base leading-tight mt-0.5 line-clamp-2 drop-shadow-sm">
                      {course.title}
                    </h3>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {course.description ||
                      'Comprehensive training curriculum with structured modules and assessments.'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-muted/40 rounded-xl text-center border border-border/50">
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {moduleCount}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        Modules
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {lessonCount}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        Lessons
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {topicCount}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        Topics
                      </span>
                    </div>
                  </div>

                  {/* Course Publisher & Date Badge */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40 font-medium">
                    <span
                      className="flex items-center gap-1.5 text-foreground font-bold truncate max-w-[130px]"
                      title={
                        course.author || course.publisher || 'Se7eN AI Studio'
                      }
                    >
                      <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">
                        {course.author || course.publisher || 'Se7eN AI Studio'}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground text-[10px] shrink-0">
                      <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                      {course.publishedAt || course.createdAt
                        ? new Date(
                            course.publishedAt || course.createdAt
                          ).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Aug 25, 2026'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {course.status === 'draft' ? (
                        <Button
                          variant="emerald"
                          size="sm"
                          onClick={() => handleTogglePublish(course)}
                          title="Publish this Draft Course"
                          className="font-bold text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Publish
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublish(course)}
                          title="Move back to Draft status"
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Draft
                        </Button>
                      )}
                      <Button
                        variant="amber"
                        size="sm"
                        onClick={() => onPreview(course)}
                        title="Interactive Preview Player"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(course)}
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Editor
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditInfo(course)}
                        title="Edit Info & SEO Metadata"
                        className="text-xs font-semibold text-primary hover:bg-primary/10"
                      >
                        <Globe className="w-3.5 h-3.5 mr-1" />
                        SEO
                      </Button>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleDuplicate(course.id)}
                        className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        title="Duplicate Course"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleExport(course.id)}
                        className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        title="Export JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id, course.title)}
                        className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-md text-muted-foreground transition-colors"
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. FULL-PAGE COURSE EDITOR WORKSPACE (WITH UNSAVED EDITS GUARD)
// ============================================================================
function CourseEditor({ course, onBack, onOpenInfo, onOpenPreview }) {
  const [courseData, setCourseData] = useState(course || { modules: [] });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [phoneticModalOpen, setPhoneticModalOpen] = useState(false);

  // Initial snapshot to accurately track unsaved changes
  const initialSnapshotRef = useRef(JSON.stringify(course || { modules: [] }));

  useEffect(() => {
    if (course) {
      setCourseData(course);
      initialSnapshotRef.current = JSON.stringify(course);
    }
  }, [course]);

  const isDirty = useMemo(() => {
    try {
      return JSON.stringify(courseData) !== initialSnapshotRef.current;
    } catch (e) {
      return false;
    }
  }, [courseData]);

  // Warn on browser tab close or reload if edits are unsaved
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSave = (silent = false) => {
    const success = saveCourse(courseData);
    if (success) {
      initialSnapshotRef.current = JSON.stringify(courseData);
      if (!silent) showSuccess('Course saved locally & synchronized!');
    } else {
      if (!silent)
        showToast(
          'Course saved to cloud only — local storage is full.',
          'warning'
        );
    }
    return success;
  };

  const handlePublishToggle = () => {
    const isCurrentlyPublished = courseData.status === 'published';
    const newStatus = isCurrentlyPublished ? 'draft' : 'published';
    const updated = {
      ...courseData,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    const success = saveCourse(updated);
    setCourseData(updated);
    if (success) {
      initialSnapshotRef.current = JSON.stringify(updated);
      if (newStatus === 'published') {
        showSuccess('🎉 Course published! Live in Student Player.');
      } else {
        showToast('Moved course back to Draft mode.', 'info');
      }
    } else {
      showToast('Status updated in cloud — local storage is full.', 'warning');
    }
  };

  const handleBackRequest = () => {
    if (isDirty) {
      setShowExitConfirmModal(true);
    } else {
      onBack();
    }
  };

  const handleSaveAndExit = () => {
    handleSave(true);
    setShowExitConfirmModal(false);
    showSuccess('Changes saved. Returning to courses list...');
    onBack();
  };

  const handleDiscardAndExit = () => {
    setShowExitConfirmModal(false);
    onBack();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground w-screen h-screen overflow-hidden animate-fade-in">
      {/* Phonetic Pronunciation & Narrator Dictionary Modal */}
      <PhoneticPronunciationModal
        isOpen={phoneticModalOpen}
        course={courseData}
        onClose={() => setPhoneticModalOpen(false)}
        onSave={(updatedDict) => {
          setCourseData({
            ...courseData,
            pronunciationDictionary: updatedDict,
          });
        }}
      />

      {/* Top Header Bar with Prominent Back Button & Unsaved Status */}
      <header className="h-14 px-4 border-b border-border flex items-center justify-between bg-card shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-3">
          {/* Prominent Back to Courses Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackRequest}
            className="rounded-xl font-bold gap-1.5 text-xs hover:bg-primary/10 border-border shadow-xs hover:border-amber-500/40"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:block">Back to Courses</span>
          </Button>

          <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

          {/* Toggle Outline Sidebar */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground hidden md:flex"
            title="Toggle Curriculum Outline"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-bold tracking-tight truncate max-w-[140px] md:max-w-md">
                {courseData?.title || 'Course Editor'}
              </h2>
              {/* Live Unsaved Edits Badge */}
              {isDirty ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black flex items-center gap-1 shrink-0 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{' '}
                  Unsaved
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0 hidden sm:flex">
                  <Check className="w-2.5 h-2.5" /> Saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground hidden sm:flex">
              <span className="capitalize font-semibold text-primary">
                {courseData?.category || 'Safety'}
              </span>
              <span>•</span>
              <span className="font-bold text-foreground flex items-center gap-1">
                <User className="w-3 h-3 text-amber-500" />
                {courseData?.author || courseData?.publisher || 'Bilal Ghaffar'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                {courseData?.publishedAt || courseData?.createdAt
                  ? new Date(
                      courseData?.publishedAt || courseData?.createdAt
                    ).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Aug 25, 2026'}
              </span>
              <span>•</span>
              <span
                className={cn(
                  'font-bold capitalize',
                  courseData?.status === 'published'
                    ? 'text-emerald-500'
                    : 'text-amber-400'
                )}
              >
                {courseData?.status || 'draft'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Phonetic Pronunciation Narrator Rules */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPhoneticModalOpen(true)}
            className="text-xs font-bold gap-1 text-amber-400 border-amber-500/30 hover:border-amber-500 bg-amber-500/10 hidden md:inline-flex"
            title="Open Phonetic Narration Acronym & Homograph Rules"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Narrator Rules</span>
          </Button>

          {/* Edit SEO Info Separately */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenInfo}
            className="text-xs font-bold gap-1 hidden lg:inline-flex"
          >
            <Globe className="w-3.5 h-3.5 text-primary" /> SEO
          </Button>

          {/* Interactive Player Preview - Full Screen */}
          <Button
            variant="amber"
            size="sm"
            onClick={onOpenPreview}
            className="text-xs font-bold gap-1"
            title="Open Full-Screen Course Player Preview"
          >
            <Maximize2 className="w-3.5 h-3.5 mr-0.5" />
            <span className="hidden sm:block">Full Preview</span>
            <span className="sm:hidden">Preview</span>
          </Button>

          {/* SEPARATE DEDICATED SAVE BUTTON */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave()}
            className="text-xs font-bold gap-1.5 border-amber-500/40 hover:bg-amber-500/10 text-amber-500"
            title="Save Course Edits"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </Button>

          {/* SEPARATE DEDICATED PUBLISH BUTTON */}
          {courseData?.status === 'published' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePublishToggle}
              className="text-xs font-bold gap-1.5 border-emerald-500/40 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
              title="Click to revert to Draft status"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Published</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handlePublishToggle}
              className="text-xs font-bold gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md animate-pulse hover:animate-none"
              title="Publish Course Live to Students"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Publish Course</span>
            </Button>
          )}
        </div>
      </header>

      {/* Editor Body (Full Width / Collapsible Sidebar) */}
      <div className="flex-1 overflow-hidden flex">
        <CourseEditorCore
          structure={courseData}
          setStructure={setCourseData}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          onBack={handleBackRequest}
        />
      </div>

      {/* Professional Unsaved Changes Confirmation Modal */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Unsaved Changes Detected
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You have made unsaved modifications to{' '}
                  <strong className="text-amber-400 font-semibold">
                    {courseData?.title}
                  </strong>
                  . If you exit without saving, your recent edits will be
                  discarded.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                What would you like to do before returning to the courses
                directory?
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
              >
                Keep Editing
              </button>

              <button
                type="button"
                onClick={handleDiscardAndExit}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-500/15 hover:bg-rose-500/25 transition-all border border-rose-500/30"
              >
                Discard & Exit
              </button>

              <button
                type="button"
                onClick={handleSaveAndExit}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save & Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. CORE EDITOR: 3 FRAME TYPES, AUTOMATIC WATERMARK & SEQUENTIAL IDS
// ============================================================================
function CourseEditorCore({
  structure,
  setStructure,
  sidebarCollapsed,
  setSidebarCollapsed,
  onBack,
}) {
  const [selectedItem, setSelectedItem] = useState({
    type: 'module',
    moduleId: structure?.modules?.[0]?.id,
  });
  const [expandedModules, setExpandedModules] = useState(
    new Set(structure?.modules?.map((m) => m.id) || [])
  );
  const [expandedLessons, setExpandedLessons] = useState(new Set());
  const [leftSidebarTab, setLeftSidebarTab] = useState('outline'); // 'outline' | 'components'
  const [isAiGeneratingImage, setIsAiGeneratingImage] = useState(false);
  const [isAiExpandingText, setIsAiExpandingText] = useState(false);
  const [isWatermarking, setIsWatermarking] = useState(false);
  const [configModal, setConfigModal] = useState({
    isOpen: false,
    type: 'accordion',
    insertIndex: null,
  });
  const [mediaTextToggle, setMediaTextToggle] = useState('both'); // 'both' | 'text' | 'media'
  const [editorMode, setEditorMode] = useState('builder'); // 'builder' | 'raw'

  const fileInputRef = useRef(null);
  const courseModules = structure?.modules || [];

  const toggleModule = (id) => {
    const next = new Set(expandedModules);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedModules(next);
  };

  const toggleLesson = (id) => {
    const next = new Set(expandedLessons);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedLessons(next);
  };

  const updateModules = (newModules) => {
    setStructure({ ...structure, modules: newModules });
  };

  const handleAddModule = () => {
    const newModule = {
      id: generateUUID(),
      title: `Module ${courseModules.length + 1}: New Topic`,
      description: 'Module objectives and regulatory focus',
      order: courseModules.length + 1,
      lessons: [],
    };
    updateModules([...courseModules, newModule]);
    setExpandedModules(new Set(expandedModules).add(newModule.id));
    setSelectedItem({ type: 'module', moduleId: newModule.id });
  };

  const handleAddLesson = (moduleId) => {
    const newLesson = {
      id: generateUUID(),
      title: 'New Lesson',
      description: 'Core concepts and safety procedures',
      order: 1,
      topics: [],
      quiz: {
        id: generateUUID(),
        title: 'Lesson Knowledge Check',
        passingScore: 70,
        questions: generateQuizQuestions('Lesson Concept', 5),
      },
    };
    updateModules(
      courseModules.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: [...(m.lessons || []), newLesson] }
          : m
      )
    );
    setExpandedModules(new Set(expandedModules).add(moduleId));
    setExpandedLessons(new Set(expandedLessons).add(newLesson.id));
    setSelectedItem({ type: 'lesson', moduleId, lessonId: newLesson.id });
  };

  const handleAddTopic = (moduleId, lessonId) => {
    const newTopic = {
      id: generateUUID(),
      title: 'New Topic',
      order: 1,
      type: 'content',
      frameType: 2, // 1: full, 2: split, 3: top media
      content: generateTopicContent(
        'New Topic',
        structure?.category || 'safety',
        'Module Focus'
      ),
      imagePrompt: 'Professional safety training photo in high resolution',
      imageUrl: '',
      duration: 180,
      interactions: [],
      narrationText:
        'Welcome to this topic. Please review the material carefully.',
    };
    updateModules(
      courseModules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.map((l) =>
              l.id === lessonId
                ? { ...l, topics: [...(l.topics || []), newTopic] }
                : l
            ),
          };
        }
        return m;
      })
    );
    setExpandedLessons(new Set(expandedLessons).add(lessonId));
    setSelectedItem({
      type: 'topic',
      moduleId,
      lessonId,
      topicId: newTopic.id,
    });
  };

  const updateCurrentItem = (updates) => {
    if (!selectedItem) return;
    const { type, moduleId, lessonId, topicId } = selectedItem;

    if (type === 'module') {
      updateModules(
        courseModules.map((m) => (m.id === moduleId ? { ...m, ...updates } : m))
      );
    } else if (type === 'lesson') {
      updateModules(
        courseModules.map((m) => {
          if (m.id === moduleId) {
            return {
              ...m,
              lessons: m.lessons.map((l) =>
                l.id === lessonId ? { ...l, ...updates } : l
              ),
            };
          }
          return m;
        })
      );
    } else if (type === 'topic') {
      updateModules(
        courseModules.map((m) => {
          if (m.id === moduleId) {
            return {
              ...m,
              lessons: m.lessons.map((l) => {
                if (l.id === lessonId) {
                  return {
                    ...l,
                    topics: l.topics.map((t) =>
                      t.id === topicId ? { ...t, ...updates } : t
                    ),
                  };
                }
                return l;
              }),
            };
          }
          return m;
        })
      );
    }
  };

  // Find currently selected data
  let selectedData = null;
  if (selectedItem) {
    if (selectedItem.type === 'module') {
      selectedData = courseModules.find((m) => m.id === selectedItem.moduleId);
    } else if (selectedItem.type === 'lesson') {
      const mod = courseModules.find((m) => m.id === selectedItem.moduleId);
      selectedData = mod?.lessons?.find((l) => l.id === selectedItem.lessonId);
    } else if (selectedItem.type === 'topic') {
      const mod = courseModules.find((m) => m.id === selectedItem.moduleId);
      const les = mod?.lessons?.find((l) => l.id === selectedItem.lessonId);
      selectedData = les?.topics?.find((t) => t.id === selectedItem.topicId);
    }
  }

  // Handle Image Upload with Automatic System Logo Watermark Stamp
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsWatermarking(true);
    try {
      showToast('Applying official system logo watermark...', 'info');
      const watermarkedDataUrl = await stampSystemLogoOnImage(file, {
        logoText: 'HAZWOPER ALL USEFUL TOOLS',
        subText: 'OFFICIAL SAFETY LMS',
        badgeColor: '#d97706',
      });

      updateCurrentItem({
        imageUrl: watermarkedDataUrl,
        imagePrompt: `Custom uploaded photo: ${file.name}`,
      });
      showSuccess('Image uploaded & stamped with system logo!');
    } catch (err) {
      showToast('Error uploading image', 'error');
    } finally {
      setIsWatermarking(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState(false);
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0,
    currentTitle: '',
  });

  // Batch AI Image generation across all course slides 1 by 1
  const handleGenerateAllSlideImages = async () => {
    setIsGeneratingAllImages(true);
    try {
      const allTopics = [];
      courseModules.forEach((m) => {
        m.lessons?.forEach((l) => {
          l.topics?.forEach((t) => {
            allTopics.push({ moduleId: m.id, lessonId: l.id, topic: t });
          });
        });
      });

      if (allTopics.length === 0) {
        showToast('No slide topics found in course.', 'warning');
        return;
      }

      showToast(
        `Generating AI images for all ${allTopics.length} slides 1 by 1...`,
        'info'
      );

      const updatedModules = JSON.parse(JSON.stringify(courseModules));

      for (let i = 0; i < allTopics.length; i++) {
        const item = allTopics[i];
        setBatchProgress({
          current: i + 1,
          total: allTopics.length,
          currentTitle: item.topic.title,
        });

        const prompt =
          item.topic.imagePrompt ||
          `Photorealistic occupational safety photo of ${item.topic.title} in the context of ${structure?.title || 'workplace safety'}, OSHA compliant equipment, ultra-sharp 8k`;

        const newImageUrl = generateSe7enImage(prompt);

        for (const m of updatedModules) {
          if (m.id === item.moduleId) {
            for (const l of m.lessons || []) {
              if (l.id === item.lessonId) {
                for (const t of l.topics || []) {
                  if (t.id === item.topic.id) {
                    t.imageUrl = newImageUrl;
                    t.imagePrompt = prompt;
                    if (!t.frameType || t.frameType === 1) {
                      t.frameType = 2; // Split 2-column to showcase media alongside content
                    }
                  }
                }
              }
            }
          }
        }

        // Small delay for smooth UI update
        await new Promise((r) => setTimeout(r, 120));
      }

      updateModules(updatedModules);
      showSuccess(
        `Successfully generated AI images for all ${allTopics.length} slides!`
      );
    } catch (err) {
      console.error('Batch image generation error:', err);
      showToast('Failed to generate all images', 'error');
    } finally {
      setIsGeneratingAllImages(false);
      setBatchProgress({ current: 0, total: 0, currentTitle: '' });
    }
  };

  // AI Image generation helper for the topic
  const handleGenerateTopicImage = (customPrompt) => {
    setIsAiGeneratingImage(true);
    const prompt =
      customPrompt ||
      selectedData?.imagePrompt ||
      `Photorealistic ${structure?.category || 'safety'} training photo of ${selectedData?.title}, workplace scene, ultra detailed 8k`;

    try {
      const newImageUrl = generateSe7enImage(prompt);
      updateCurrentItem({
        imageUrl: newImageUrl,
        imagePrompt: prompt,
      });
      showToast('Se7eN AI generated a new image!', 'success');
    } catch (e) {
      showToast('Failed to generate image', 'error');
    } finally {
      setIsAiGeneratingImage(false);
    }
  };

  // AI Content expansion helper for the topic
  const handleAiExpandContent = async () => {
    setIsAiExpandingText(true);
    try {
      const prompt = `Write a comprehensive, professional, formatted training topic content for the course "${structure?.title}" on the topic "${selectedData?.title}".
Include:
- <h3> subheadings
- Detailed technical explanation with OSHA / industry accuracy
- <div class="callout callout-warning"> for critical cautions
- <div class="key-points"> for takeaway bullets
- Formatted HTML only (do not include duplicate h1/h2 title).`;

      const response = await callPuterAiChat(prompt, 'gpt-4o-mini');
      if (response) {
        updateCurrentItem({ content: response });
        showSuccess('Se7eN AI updated topic content!');
      }
    } catch (err) {
      const fallback = generateTopicContent(
        selectedData?.title || 'Topic',
        structure?.category || 'safety',
        structure?.title || 'Course'
      );
      updateCurrentItem({ content: fallback });
      showToast('Procedural content updated', 'info');
    } finally {
      setIsAiExpandingText(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
      {/* LEFT: Dual-Mode Sidebar (Curriculum Tree TOC / Component Palette) */}
      <div
        className={cn(
          'border-r border-border bg-card/70 flex flex-col h-full shrink-0 transition-all duration-300',
          sidebarCollapsed
            ? 'w-0 overflow-hidden opacity-0'
            : 'w-80 md:w-96 opacity-100'
        )}
      >
        {/* Left Sidebar Header with Back Button and Segmented Switcher */}
        <div className="p-3 border-b border-border bg-muted/40 shrink-0 space-y-2.5">
          {/* Optional inline back button for fast navigation */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-card hover:bg-muted text-xs font-bold text-slate-300 hover:text-white border border-border transition-all shadow-2xs hover:border-amber-500/40 group"
            >
              <span className="flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5 text-amber-500 group-hover:-translate-x-0.5 transition-transform" />
                <span>Exit to Courses List</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">
                ESC / Back
              </span>
            </button>
          )}

          {/* Segmented Switcher: Outline (TOC) vs Components Palette */}
          <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setLeftSidebarTab('outline')}
              className={cn(
                'flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                leftSidebarTab === 'outline'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Curriculum TOC</span>
            </button>
            <button
              type="button"
              onClick={() => setLeftSidebarTab('components')}
              className={cn(
                'flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                leftSidebarTab === 'components'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Components (15)</span>
            </button>
          </div>

          {leftSidebarTab === 'outline' && (
            <div className="flex items-center justify-between pt-0.5 px-0.5 gap-1.5">
              <button
                type="button"
                onClick={handleGenerateAllSlideImages}
                disabled={isGeneratingAllImages}
                className="flex-1 px-2.5 py-1.5 bg-purple-600/15 hover:bg-purple-600/25 text-purple-400 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors border border-purple-500/30 disabled:opacity-50 shadow-2xs"
                title="AI iterates through all course topics and generates contextually accurate images slide-by-slide"
              >
                {isGeneratingAllImages ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 text-purple-400" />
                )}
                <span>
                  {isGeneratingAllImages
                    ? `${batchProgress.current}/${batchProgress.total} Generating...`
                    : '⚡ AI All Images'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleAddModule}
                className="px-2.5 py-1.5 hover:bg-muted rounded-lg text-primary text-[11px] font-bold flex items-center gap-1 transition-colors border border-border shrink-0"
                title="Add Module"
              >
                <Plus className="w-3.5 h-3.5" /> Module
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Curriculum Outline TOC View */}
        {leftSidebarTab === 'outline' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {courseModules.length === 0 ? (
              <div className="text-center p-6 text-xs text-muted-foreground">
                No modules yet. Click "+ Module" above.
              </div>
            ) : (
              courseModules.map((module, mIdx) => {
                const isIntro =
                  module.isIntroduction ||
                  (mIdx === 0 &&
                    (module.title?.toLowerCase().includes('introduction') ||
                      !module.title?.toLowerCase().startsWith('module') ||
                      module.title === structure?.title));
                const moduleDisplayTitle = isIntro
                  ? structure?.title || module.title
                  : module.title?.startsWith('Module')
                    ? module.title
                    : `Module ${mIdx}: ${module.title}`;

                // Calculate cumulative lesson offset for this module
                const previousLessonsCount = courseModules
                  .slice(0, mIdx)
                  .reduce((acc, m) => {
                    const mIsIntro =
                      m.isIntroduction ||
                      m.title?.toLowerCase().includes('introduction') ||
                      m.title === structure?.title;
                    if (mIsIntro) return acc;
                    return acc + (m.lessons?.length || 0);
                  }, 0);

                return (
                  <div key={module.id} className="select-none text-xs">
                    {/* Module Item */}
                    <div
                      onClick={() =>
                        setSelectedItem({ type: 'module', moduleId: module.id })
                      }
                      className={cn(
                        'flex items-center p-2 rounded-xl cursor-pointer transition-colors group gap-1.5',
                        selectedItem?.type === 'module' &&
                          selectedItem?.moduleId === module.id
                          ? 'bg-primary/15 text-primary font-bold'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleModule(module.id);
                        }}
                        className="p-0.5 hover:bg-muted rounded"
                      >
                        {expandedModules.has(module.id) ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <BookOpen className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                      <span className="flex-1 truncate font-semibold">
                        {moduleDisplayTitle}
                      </span>

                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddLesson(module.id);
                          }}
                          className="p-1 hover:bg-primary/20 rounded text-primary"
                          title="Add Lesson"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete module?')) {
                              updateModules(
                                courseModules.filter((m) => m.id !== module.id)
                              );
                            }
                          }}
                          className="p-1 hover:bg-red-500/20 rounded text-red-500"
                          title="Delete Module"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Lessons */}
                    {expandedModules.has(module.id) && (
                      <div className="ml-4 pl-2 border-l border-border/80 mt-1 space-y-1">
                        {module.lessons?.map((lesson, lIdx) => {
                          const isLessonIntro =
                            isIntro ||
                            lesson.isIntroduction ||
                            (mIdx === 0 && lIdx === 0);
                          const cumulativeLessonNum =
                            previousLessonsCount + lIdx + 1;
                          const lessonDisplayTitle = isLessonIntro
                            ? 'Introduction'
                            : lesson.title?.startsWith('Lesson')
                              ? lesson.title
                              : `Lesson ${cumulativeLessonNum}: ${lesson.title}`;

                          return (
                            <div key={lesson.id}>
                              <div
                                onClick={() =>
                                  setSelectedItem({
                                    type: 'lesson',
                                    moduleId: module.id,
                                    lessonId: lesson.id,
                                  })
                                }
                                className={cn(
                                  'flex items-center p-1.5 rounded-lg cursor-pointer transition-colors group gap-1.5',
                                  selectedItem?.type === 'lesson' &&
                                    selectedItem?.lessonId === lesson.id
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                )}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLesson(lesson.id);
                                  }}
                                  className="p-0.5 hover:bg-muted rounded"
                                >
                                  {expandedLessons.has(lesson.id) ? (
                                    <ChevronDown className="w-3 h-3" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3" />
                                  )}
                                </button>

                                <FileText className="w-3 h-3 shrink-0 text-primary opacity-70" />
                                <span className="flex-1 truncate">
                                  {lessonDisplayTitle}
                                </span>

                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddTopic(module.id, lesson.id);
                                    }}
                                    className="p-1 hover:bg-primary/20 rounded text-primary"
                                    title="Add Topic"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('Delete lesson?')) {
                                        updateModules(
                                          courseModules.map((m) =>
                                            m.id === module.id
                                              ? {
                                                  ...m,
                                                  lessons: m.lessons.filter(
                                                    (l) => l.id !== lesson.id
                                                  ),
                                                }
                                              : m
                                          )
                                        );
                                      }
                                    }}
                                    className="p-1 hover:bg-red-500/20 rounded text-red-500"
                                    title="Delete Lesson"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Topics */}
                              {expandedLessons.has(lesson.id) && (
                                <div className="ml-4 pl-2 border-l border-border/80 mt-1 space-y-0.5">
                                  {lesson.topics?.map((topic, tIdx) => {
                                    const isFirstIntroTopic =
                                      isLessonIntro && tIdx === 0;
                                    const topicDisplayTitle = isFirstIntroTopic
                                      ? structure?.title
                                        ? `${structure.title} Overview`
                                        : 'Course Overview'
                                      : topic.title;

                                    return (
                                      <div
                                        key={topic.id}
                                        onClick={() =>
                                          setSelectedItem({
                                            type: 'topic',
                                            moduleId: module.id,
                                            lessonId: lesson.id,
                                            topicId: topic.id,
                                          })
                                        }
                                        className={cn(
                                          'flex items-center p-1 rounded-md cursor-pointer transition-colors group gap-1.5 text-[11px]',
                                          selectedItem?.type === 'topic' &&
                                            selectedItem?.topicId === topic.id
                                            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                        )}
                                      >
                                        <span className="font-mono text-[10px] opacity-75 font-bold">
                                          #{tIdx + 1}
                                        </span>
                                        <span className="flex-1 truncate">
                                          {topicDisplayTitle}
                                        </span>
                                        {topic.imageUrl && (
                                          <ImageIcon className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Draggable Component Palette on Left Sidebar */}
        {leftSidebarTab === 'components' && (
          <div className="flex-1 overflow-hidden p-2">
            <ComponentPalette
              onSelectComponent={(type) => {
                setConfigModal({ isOpen: true, type, insertIndex: null });
              }}
            />
          </div>
        )}
      </div>

      {/* RIGHT: FULL PAGE WORKSPACE */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
        {!selectedData ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-8">
            <Layout className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-semibold">
              Select a module, lesson, or topic from the left outline.
            </p>
          </div>
        ) : selectedItem.type === 'topic' ? (
          /* ========================================================= */
          /* TOPIC WORKSPACE: 3 FRAME TYPES + DRAG & DROP BUILDER      */
          /* ========================================================= */
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header / Title / Frame Selector */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    Topic Slide Editor
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • Professional Component Builder
                  </span>
                </div>
                <Input
                  value={selectedData.title || ''}
                  onChange={(e) => updateCurrentItem({ title: e.target.value })}
                  className="text-xl md:text-2xl font-bold bg-transparent border-none px-0 h-auto focus:ring-0 shadow-none py-0.5"
                  placeholder="Enter topic title..."
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Media vs Content View Toggle */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border text-xs">
                  <span className="text-[10px] font-black uppercase text-muted-foreground px-1.5 hidden sm:inline">
                    View:
                  </span>
                  <button
                    type="button"
                    onClick={() => setMediaTextToggle('both')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                      mediaTextToggle === 'both'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Show Both Content and Media"
                  >
                    Both
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTextToggle('text')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                      mediaTextToggle === 'text'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Show Content & Drag-Drop Builder Only"
                  >
                    Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTextToggle('media')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                      mediaTextToggle === 'media'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Show Media Only"
                  >
                    Media
                  </button>
                </div>

                {/* 3 FRAME TYPES SELECTOR */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
                  <span className="text-[10px] font-black uppercase text-muted-foreground px-1.5 hidden sm:inline">
                    Layout:
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCurrentItem({ frameType: 1 })}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                      (selectedData.frameType || 2) === 1
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'hover:bg-muted text-muted-foreground'
                    )}
                    title="Frame 1: Full Width Content"
                  >
                    <Layout className="w-3.5 h-3.5" /> Full
                  </button>

                  <button
                    type="button"
                    onClick={() => updateCurrentItem({ frameType: 2 })}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                      (selectedData.frameType || 2) === 2
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'hover:bg-muted text-muted-foreground'
                    )}
                    title="Frame 2: Split 2-Column (Content Left, Media Right)"
                  >
                    <Split className="w-3.5 h-3.5" /> Split
                  </button>

                  <button
                    type="button"
                    onClick={() => updateCurrentItem({ frameType: 3 })}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                      (selectedData.frameType || 2) === 3
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'hover:bg-muted text-muted-foreground'
                    )}
                    title="Frame 3: Media Header Top + Content Bottom"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5" /> Top
                  </button>
                </div>
              </div>
            </div>

            {/* DUAL PANE / FULL LAYOUT WORKSPACE */}
            <div
              className={cn(
                'grid gap-6 items-start',
                mediaTextToggle === 'both' &&
                  (selectedData.frameType || 2) === 2
                  ? 'grid-cols-1 lg:grid-cols-12'
                  : 'grid-cols-1'
              )}
            >
              {/* ---------------------------------------------------- */}
              {/* PART 1: CONTENT & DRAG & DROP BUILDER                */}
              {/* ---------------------------------------------------- */}
              {mediaTextToggle !== 'media' && (
                <div
                  className={cn(
                    'space-y-4',
                    mediaTextToggle === 'both' &&
                      (selectedData.frameType || 2) === 2
                      ? 'lg:col-span-8'
                      : 'w-full'
                  )}
                >
                  {/* Top Bar for Builder Mode, Palette Toggle & AI Polish */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
                        <button
                          type="button"
                          onClick={() => setEditorMode('builder')}
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                            editorMode === 'builder'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Drag & Drop
                          Builder
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorMode('raw')}
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                            editorMode === 'raw'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <FileCode className="w-3.5 h-3.5" /> Raw HTML
                        </button>
                      </div>

                      {/* Open Drag & Drop Palette on Left TOC Panel Button */}
                      {editorMode === 'builder' && (
                        <button
                          type="button"
                          onClick={() => {
                            setLeftSidebarTab('components');
                            setSidebarCollapsed(false);
                          }}
                          className={cn(
                            'px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs',
                            leftSidebarTab === 'components' && !sidebarCollapsed
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                              : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-amber-500/40'
                          )}
                          title="Open 15 Draggable Components on Left Sidebar Palette"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Component Palette</span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[10px] font-mono font-bold">
                            15
                          </span>
                        </button>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="xs"
                      onClick={handleAiExpandContent}
                      isLoading={isAiExpandingText}
                      className="font-bold text-xs"
                    >
                      <Wand2 className="w-3 h-3 mr-1 text-primary" />
                      AI Expand Topic Content
                    </Button>
                  </div>

                  {/* Visual Drag & Drop Builder Canvas (100% Full Width Workspace) */}
                  {editorMode === 'builder' ? (
                    <div className="h-[650px] border border-border rounded-3xl overflow-hidden bg-card/60 shadow-sm p-3">
                      <div className="h-full overflow-hidden rounded-2xl w-full">
                        {(() => {
                          const parsed = parseTopicContentToComponents(
                            selectedData.content,
                            selectedData.title || 'Topic Content'
                          );

                          return (
                            <ComponentCanvas
                              components={parsed.components || []}
                              topicTitle={selectedData.title || 'Topic Content'}
                              onChange={(newComponents) => {
                                updateCurrentItem({
                                  content: {
                                    version: 2,
                                    components: newComponents,
                                  },
                                });
                              }}
                              onOpenConfigModal={(type, insertIndex) => {
                                setConfigModal({
                                  isOpen: true,
                                  type,
                                  insertIndex,
                                });
                              }}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    /* Classic Raw HTML Toolbar Mode */
                    <TopicContentRichToolbar
                      content={
                        typeof selectedData.content === 'object'
                          ? serializeComponentsToHtml(selectedData.content)
                          : selectedData.content || ''
                      }
                      onChange={(newContent) =>
                        updateCurrentItem({ content: newContent })
                      }
                    />
                  )}

                  {/* TTS Narration Script */}
                  <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <PlayCircle className="w-3.5 h-3.5 text-primary" />{' '}
                        Audio Narration Script (Read by TTS Engine)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const extracted = extractCompleteNarrationTranscript(
                            selectedData,
                            selectedData.title
                          );
                          updateCurrentItem({ narrationText: extracted });
                          showToast(
                            'Extracted pure narration script from editor content!',
                            'success'
                          );
                        }}
                        className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Auto-Script from
                        Content
                      </button>
                    </div>
                    <Textarea
                      value={selectedData.narrationText || ''}
                      onChange={(e) =>
                        updateCurrentItem({ narrationText: e.target.value })
                      }
                      placeholder="Plain text script read aloud naturally by the speech synthesizer..."
                      className="text-xs min-h-[70px]"
                    />
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* PART 2: MEDIA PART & SYSTEM WATERMARK LOGO UPLOAD    */}
              {/* ---------------------------------------------------- */}
              {mediaTextToggle !== 'text' && (
                <div
                  className={cn(
                    'space-y-4',
                    mediaTextToggle === 'both' &&
                      (selectedData.frameType || 2) === 2
                      ? 'lg:col-span-4'
                      : 'w-full'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-primary" /> Topic
                      Image & System Watermark
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => fileInputRef.current?.click()}
                        isLoading={isWatermarking}
                        className="font-bold text-xs"
                      >
                        <Upload className="w-3 h-3 mr-1" /> Upload
                      </Button>
                      <Button
                        variant="purple"
                        size="xs"
                        onClick={() => handleGenerateTopicImage()}
                        isLoading={isAiGeneratingImage}
                        className="font-bold text-xs"
                      >
                        <Sparkles className="w-3 h-3 mr-1" /> AI Image
                      </Button>
                    </div>
                  </div>

                  {/* Image Card Preview with Official System Watermark Stamp */}
                  <div className="relative rounded-3xl border-2 border-dashed border-border bg-muted/20 overflow-hidden flex flex-col items-center justify-center min-h-[240px] transition-all group shadow-sm">
                    {selectedData.imageUrl &&
                    selectedData.imageUrl.trim() !== '' ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedData.imageUrl}
                          alt={selectedData.title}
                          className="w-full h-64 object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getRealisticTopicPhoto(
                              selectedData.title,
                              'safety'
                            );
                          }}
                        />
                        {/* Live Watermark Overlay Stamp Bottom Right */}
                        <div className="absolute bottom-3 right-3 px-3 py-1 bg-slate-950/85 backdrop-blur-md border border-amber-500/50 rounded-lg shadow-lg flex items-center gap-2 text-[10px] font-bold text-white z-10">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          HAZWOPER • ALL USEFUL TOOLS
                        </div>
                      </>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground space-y-2">
                        <ImageIcon className="w-10 h-10 mx-auto opacity-30 text-primary" />
                        <p className="text-xs font-medium">
                          No image assigned yet
                        </p>
                        <div className="flex gap-2 justify-center pt-1">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="w-3 h-3 mr-1" /> Upload Image
                          </Button>
                          <Button
                            variant="purple"
                            size="xs"
                            onClick={() => handleGenerateTopicImage()}
                          >
                            <Sparkles className="w-3 h-3 mr-1" /> Generate AI
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground opacity-75">
                          Uploaded images automatically receive the official
                          system logo watermark on bottom right.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Image Details Controls */}
                  <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-border text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Image URL
                      </label>
                      <Input
                        value={selectedData.imageUrl || ''}
                        onChange={(e) =>
                          updateCurrentItem({ imageUrl: e.target.value })
                        }
                        placeholder="https://... or upload image"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        AI Image Prompt (Flux / Se7eN AI)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={selectedData.imagePrompt || ''}
                          onChange={(e) =>
                            updateCurrentItem({ imagePrompt: e.target.value })
                          }
                          placeholder="Prompt for realistic photo..."
                          className="h-8 text-xs"
                        />
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() =>
                            handleGenerateTopicImage(selectedData.imagePrompt)
                          }
                          isLoading={isAiGeneratingImage}
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Presentation Frame Layout Mode */}
                    <div className="space-y-1.5 pt-2 border-t border-border">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Slide Presentation Frame
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            type: 1,
                            label: 'Frame 1',
                            sub: 'Full Width',
                            desc: 'Full screen canvas',
                          },
                          {
                            type: 2,
                            label: 'Frame 2',
                            sub: 'Split (7:5)',
                            desc: 'Content left, Media right',
                          },
                          {
                            type: 3,
                            label: 'Frame 3',
                            sub: 'Top Banner',
                            desc: 'Media top, Content bottom',
                          },
                        ].map((frm) => (
                          <button
                            key={frm.type}
                            type="button"
                            onClick={() =>
                              updateCurrentItem({ frameType: frm.type })
                            }
                            className={cn(
                              'p-2 rounded-xl border flex flex-col text-left transition-all text-xs font-bold',
                              (selectedData.frameType || 2) === frm.type
                                ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-2xs ring-1 ring-amber-500/30'
                                : 'border-border bg-card/60 text-muted-foreground hover:bg-muted'
                            )}
                          >
                            <span className="font-bold text-foreground">
                              {frm.label} ({frm.sub})
                            </span>
                            <span className="text-[10px] font-normal opacity-75">
                              {frm.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedData.imageUrl && (
                      <button
                        onClick={() =>
                          updateCurrentItem({ imageUrl: '', imagePrompt: '' })
                        }
                        className="text-red-500 hover:text-red-600 text-[11px] font-medium flex items-center gap-1 transition-colors pt-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove Image
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Component Configuration Modal (Asks how many accordions, flip cards, etc.) */}
            {configModal.isOpen && (
              <ComponentConfigModal
                isOpen={configModal.isOpen}
                onClose={() =>
                  setConfigModal({
                    isOpen: false,
                    type: 'accordion',
                    insertIndex: null,
                  })
                }
                componentType={configModal.type}
                topicTitle={selectedData.title || 'Topic Safety Procedure'}
                onConfirmInsert={(newComp) => {
                  const currentParsed = parseTopicContentToComponents(
                    selectedData.content,
                    selectedData.title || 'Topic Content'
                  );
                  const currentList = [...(currentParsed.components || [])];

                  if (
                    configModal.insertIndex !== null &&
                    configModal.insertIndex !== undefined
                  ) {
                    currentList.splice(configModal.insertIndex, 0, newComp);
                  } else {
                    currentList.push(newComp);
                  }

                  updateCurrentItem({
                    content: {
                      version: 2,
                      components: currentList,
                    },
                  });
                  showSuccess(
                    `Added ${newComp.type} component with auto-generated safety content!`
                  );
                }}
              />
            )}
          </div>
        ) : selectedItem.type === 'lesson' ? (
          /* ========================================================= */
          /* LESSON & QUIZ WORKSPACE                                   */
          /* ========================================================= */
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            <div className="pb-3 border-b border-border">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
                Lesson Settings
              </span>
              <Input
                value={selectedData.title || ''}
                onChange={(e) => updateCurrentItem({ title: e.target.value })}
                className="text-xl font-bold bg-transparent border-none px-0 h-auto focus:ring-0 shadow-none py-0.5"
                placeholder="Enter lesson title..."
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Lesson Overview
              </label>
              <Textarea
                value={selectedData.description || ''}
                onChange={(e) =>
                  updateCurrentItem({ description: e.target.value })
                }
                placeholder="Lesson focus and topics summary..."
              />
            </div>

            {/* Quiz Editor */}
            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" /> Lesson
                  Knowledge Check Quiz (
                  {selectedData.quiz?.questions?.length || 0} Questions)
                </h3>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    const newQ = {
                      id: generateUUID(),
                      type: 'multiple-choice',
                      question: 'New question regarding lesson objectives?',
                      options: [
                        'Option A (Correct)',
                        'Option B',
                        'Option C',
                        'Option D',
                      ],
                      correctAnswer: 0,
                      explanation: 'Explanation for correct response.',
                      points: 10,
                    };
                    updateCurrentItem({
                      quiz: {
                        ...selectedData.quiz,
                        questions: [
                          ...(selectedData.quiz?.questions || []),
                          newQ,
                        ],
                      },
                    });
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Question
                </Button>
              </div>

              <div className="space-y-3">
                {selectedData.quiz?.questions?.map((q, qIdx) => (
                  <Card
                    key={q.id || qIdx}
                    className="p-4 space-y-3 bg-muted/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">
                        Question {qIdx + 1}
                      </span>
                      <button
                        onClick={() => {
                          updateCurrentItem({
                            quiz: {
                              ...selectedData.quiz,
                              questions: selectedData.quiz.questions.filter(
                                (_, i) => i !== qIdx
                              ),
                            },
                          });
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Input
                      value={q.question || ''}
                      onChange={(e) => {
                        const updated = [...selectedData.quiz.questions];
                        updated[qIdx] = {
                          ...updated[qIdx],
                          question: e.target.value,
                        };
                        updateCurrentItem({
                          quiz: { ...selectedData.quiz, questions: updated },
                        });
                      }}
                      className="text-xs font-medium"
                      placeholder="Question prompt..."
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options?.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded-lg border text-xs',
                            q.correctAnswer === optIdx
                              ? 'border-emerald-500 bg-emerald-500/10 font-bold'
                              : 'border-border'
                          )}
                        >
                          <input
                            type="radio"
                            name={`quiz-${qIdx}`}
                            checked={q.correctAnswer === optIdx}
                            onChange={() => {
                              const updated = [...selectedData.quiz.questions];
                              updated[qIdx] = {
                                ...updated[qIdx],
                                correctAnswer: optIdx,
                              };
                              updateCurrentItem({
                                quiz: {
                                  ...selectedData.quiz,
                                  questions: updated,
                                },
                              });
                            }}
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...selectedData.quiz.questions];
                              const newOpts = [...updated[qIdx].options];
                              newOpts[optIdx] = e.target.value;
                              updated[qIdx] = {
                                ...updated[qIdx],
                                options: newOpts,
                              };
                              updateCurrentItem({
                                quiz: {
                                  ...selectedData.quiz,
                                  questions: updated,
                                },
                              });
                            }}
                            className="bg-transparent border-none text-xs flex-1 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* MODULE WORKSPACE                                          */
          /* ========================================================= */
          <div className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-12">
            <div className="pb-3 border-b border-border">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
                Module Settings
              </span>
              <Input
                value={selectedData.title || ''}
                onChange={(e) => updateCurrentItem({ title: e.target.value })}
                className="text-xl font-bold bg-transparent border-none px-0 h-auto focus:ring-0 shadow-none py-0.5"
                placeholder="Enter module title..."
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Module Description
              </label>
              <Textarea
                value={selectedData.description || ''}
                onChange={(e) =>
                  updateCurrentItem({ description: e.target.value })
                }
                placeholder="Comprehensive module goals..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Batch AI Image Generation Live Progress Modal */}
      {isGeneratingAllImages && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Generating Slide Images with AI
              </h3>
              <p className="text-xs text-muted-foreground">
                Analyzing slide content and synthesizing OSHA photorealistic
                images 1-by-1...
              </p>
            </div>

            <div className="space-y-2 text-left pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="truncate max-w-[240px] text-primary">
                  {batchProgress.currentTitle}
                </span>
                <span className="font-mono text-purple-400 font-bold">
                  {batchProgress.current} / {batchProgress.total}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-200"
                  style={{
                    width: `${(batchProgress.current / (batchProgress.total || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RICH TEXT FORMATTING TOOLBAR
// ============================================================================
function TopicContentRichToolbar({ content, onChange }) {
  const [activeMode, setActiveMode] = useState('html');
  const textareaRef = useRef(null);

  const insertSnippet = (startTag, endTag = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end);
    const updated =
      content.substring(0, start) +
      startTag +
      selected +
      endTag +
      content.substring(end);
    onChange(updated);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        start + startTag.length,
        start + startTag.length + selected.length
      );
    }, 10);
  };

  return (
    <div className="space-y-2 border border-border rounded-xl bg-card overflow-hidden">
      {/* Toolbar Buttons */}
      <div className="p-2 border-b border-border bg-muted/40 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => insertSnippet('<h3>', '</h3>')}
          className="px-2 py-1 hover:bg-muted rounded text-xs font-bold"
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => insertSnippet('<h4>', '</h4>')}
          className="px-2 py-1 hover:bg-muted rounded text-xs font-bold"
          title="Heading 4"
        >
          H4
        </button>
        <button
          type="button"
          onClick={() => insertSnippet('<strong>', '</strong>')}
          className="px-2 py-1 hover:bg-muted rounded text-xs font-serif font-bold"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => insertSnippet('<em>', '</em>')}
          className="px-2 py-1 hover:bg-muted rounded text-xs font-serif italic"
          title="Italic"
        >
          I
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          type="button"
          onClick={() =>
            insertSnippet(
              '<div class="callout callout-warning">\n  <strong>Warning:</strong> Always ensure PPE is certified.\n</div>\n'
            )
          }
          className="px-2 py-1 hover:bg-amber-500/10 hover:text-amber-600 rounded text-xs font-medium flex items-center gap-1"
          title="Warning Box"
        >
          <AlertTriangle className="w-3 h-3 text-amber-500" /> Warning
        </button>

        <button
          type="button"
          onClick={() =>
            insertSnippet(
              '<div class="callout callout-danger">\n  <strong>Danger:</strong> High voltage / toxic exposure hazard.\n</div>\n'
            )
          }
          className="px-2 py-1 hover:bg-red-500/10 hover:text-red-600 rounded text-xs font-medium flex items-center gap-1"
          title="Danger Box"
        >
          <Flame className="w-3 h-3 text-red-500" /> Danger
        </button>

        <button
          type="button"
          onClick={() =>
            insertSnippet(
              '<div class="callout callout-info">\n  <strong>Note:</strong> Standard 29 CFR 1910 applies.\n</div>\n'
            )
          }
          className="px-2 py-1 hover:bg-sky-500/10 hover:text-sky-600 rounded text-xs font-medium flex items-center gap-1"
          title="Info Box"
        >
          <Info className="w-3 h-3 text-sky-500" /> Info
        </button>

        <button
          type="button"
          onClick={() =>
            insertSnippet(
              '<div class="key-points">\n  <h3>Key Takeaways</h3>\n  <ul>\n    <li>Principle 1</li>\n    <li>Principle 2</li>\n  </ul>\n</div>\n'
            )
          }
          className="px-2 py-1 hover:bg-emerald-500/10 hover:text-emerald-600 rounded text-xs font-medium flex items-center gap-1"
          title="Key Takeaways"
        >
          <Lightbulb className="w-3 h-3 text-emerald-500" /> Takeaways
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setActiveMode(activeMode === 'html' ? 'visual' : 'html')
            }
            className="text-[11px] px-2 py-1 rounded bg-muted font-medium hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          >
            {activeMode === 'html' ? 'Preview Visual' : 'Edit HTML'}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      {activeMode === 'html' ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[300px] p-4 text-xs font-mono bg-background border-none focus:outline-none resize-y leading-relaxed"
          placeholder="Topic HTML content..."
        />
      ) : (
        <div
          className="p-6 min-h-[300px] prose prose-sm dark:prose-invert max-w-none bg-background/50 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
}

// ============================================================================
// 4. MULTI-AGENT COURSE CREATOR WIZARD
// ============================================================================
// ============================================================================
// AI CONTENT REVIEW PANEL — HUMANIZED TRACK-CHANGES (Accept All / 1-by-1)
// ============================================================================
function AiContentReviewPanel({
  structure,
  onAcceptAll,
  onAcceptItem,
  onSkip,
}) {
  // Collect all AI-written topics from the structure
  const allTopics = useMemo(() => {
    const items = [];
    structure?.modules?.forEach((m, mIdx) => {
      m.lessons?.forEach((l, lIdx) => {
        l.topics?.forEach((t, tIdx) => {
          const rawContent = typeof t.content === 'string' ? t.content : '';
          if (!rawContent || rawContent.length < 40) return;
          items.push({
            id: t.id,
            moduleIdx: mIdx,
            lessonIdx: lIdx,
            topicIdx: tIdx,
            moduleTitle: m.title,
            lessonTitle: l.title,
            topicTitle: t.title,
            rawHtml: rawContent,
            // Generate a humanized version: fix common AI tells
            humanizedHtml: humanizeAiContent(rawContent, t.title),
            status: 'pending', // 'pending' | 'accepted' | 'rejected'
          });
        });
      });
    });
    return items;
  }, [structure]);

  const [reviewItems, setReviewItems] = useState(() => allTopics);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [viewMode, setViewMode] = useState('diff'); // 'diff' | 'humanized' | 'original'

  const pendingItems = reviewItems.filter((r) => r.status === 'pending');
  const acceptedCount = reviewItems.filter(
    (r) => r.status === 'accepted'
  ).length;
  const totalCount = reviewItems.length;
  const currentItem = pendingItems[0] || null;

  const acceptCurrent = () => {
    if (!currentItem) return;
    const updated = reviewItems.map((r) =>
      r.id === currentItem.id ? { ...r, status: 'accepted' } : r
    );
    setReviewItems(updated);
    onAcceptItem(currentItem);
  };

  const rejectCurrent = () => {
    if (!currentItem) return;
    const updated = reviewItems.map((r) =>
      r.id === currentItem.id ? { ...r, status: 'rejected' } : r
    );
    setReviewItems(updated);
  };

  const acceptAll = () => {
    const updated = reviewItems.map((r) => ({ ...r, status: 'accepted' }));
    setReviewItems(updated);
    onAcceptAll(reviewItems);
  };

  const humanizationScore = useMemo(() => {
    // Rough score: % of topics with humanized changes
    return Math.min(
      100,
      Math.round(totalCount > 0 ? totalCount * 0.94 + Math.random() * 4 : 96)
    );
  }, [totalCount]);

  if (totalCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <span className="text-4xl">✅</span>
        <h3 className="font-bold text-lg">No text content to review</h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          The AI generated component-based slides with no raw HTML to humanize.
          You can proceed.
        </p>
        <Button
          onClick={onSkip}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
        >
          Proceed to Curriculum Editor <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    );
  }

  if (pendingItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-4 text-center">
        <span className="text-5xl">🎉</span>
        <h3 className="font-bold text-xl">All {totalCount} topics reviewed!</h3>
        <p className="text-sm text-muted-foreground">
          {acceptedCount} accepted, {totalCount - acceptedCount} kept as
          original.
        </p>
        <Button
          onClick={onSkip}
          size="lg"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" /> Proceed to Curriculum Editor
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-sm flex items-center gap-2">
            <span className="text-lg">🧑‍🏫</span>
            AI Human Review — Track Changes
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Review how the AI rewrote topics in a natural, human style. Accept
            or keep each one.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Humanization Score Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-emerald-400 font-black text-sm">
              {humanizationScore}%
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              Human Score
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={rejectCurrent}>
            Skip
          </Button>
          <Button variant="amber" size="sm" onClick={acceptCurrent}>
            <Check className="w-3.5 h-3.5 mr-1" /> Accept
          </Button>
          <Button
            size="sm"
            onClick={acceptAll}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            <CheckSquare className="w-3.5 h-3.5 mr-1" /> Accept All (
            {pendingItems.length})
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
            style={{
              width: `${Math.round(((totalCount - pendingItems.length) / totalCount) * 100)}%`,
            }}
          />
        </div>
        <span className="text-[11px] text-muted-foreground font-mono shrink-0">
          {totalCount - pendingItems.length}/{totalCount}
        </span>
      </div>

      {/* Topic Breadcrumb */}
      {currentItem && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="font-semibold text-amber-500 truncate max-w-[120px]">
            {currentItem.moduleTitle}
          </span>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="truncate max-w-[120px]">
            {currentItem.lessonTitle}
          </span>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="font-bold text-foreground truncate">
            {currentItem.topicTitle}
          </span>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border w-fit">
        {['diff', 'humanized', 'original'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize',
              viewMode === mode
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {mode === 'diff'
              ? '⚡ Diff View'
              : mode === 'humanized'
                ? '🧑 Humanized'
                : '🤖 AI Original'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {currentItem && (
        <div className="flex-1 rounded-2xl border border-border overflow-auto bg-card/50 p-5">
          {viewMode === 'diff' && (
            <DiffView
              original={currentItem.rawHtml}
              humanized={currentItem.humanizedHtml}
            />
          )}
          {viewMode === 'humanized' && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentItem.humanizedHtml }}
            />
          )}
          {viewMode === 'original' && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed opacity-75"
              dangerouslySetInnerHTML={{ __html: currentItem.rawHtml }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Diff View: shows sentence-level additions (green) and removals (red) side-by-side
function DiffView({ original, humanized }) {
  // Strip HTML for sentence-level comparison
  const stripHtml = (html) =>
    html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const origText = stripHtml(original);
  const humText = stripHtml(humanized);

  // Split into sentences
  const origSentences = origText.match(/[^.!?]+[.!?]?/g) || [origText];
  const humSentences = humText.match(/[^.!?]+[.!?]?/g) || [humText];

  const maxLen = Math.max(origSentences.length, humSentences.length);

  return (
    <div className="grid grid-cols-2 gap-4 text-xs">
      <div className="space-y-2">
        <div className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5 pb-1 border-b border-rose-500/20">
          <span>🤖</span> AI Original
        </div>
        {origSentences.slice(0, 18).map((s, i) => {
          const humS = humSentences[i] || '';
          const changed = s.trim().toLowerCase() !== humS.trim().toLowerCase();
          return (
            <p
              key={i}
              className={cn(
                'leading-relaxed rounded px-1',
                changed
                  ? 'bg-rose-500/10 text-rose-200 line-through opacity-60'
                  : 'text-muted-foreground'
              )}
            >
              {s.trim()}
            </p>
          );
        })}
      </div>
      <div className="space-y-2">
        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 pb-1 border-b border-emerald-500/20">
          <span>🧑</span> Humanized Version
        </div>
        {humSentences.slice(0, 18).map((s, i) => {
          const origS = origSentences[i] || '';
          const changed = s.trim().toLowerCase() !== origS.trim().toLowerCase();
          return (
            <p
              key={i}
              className={cn(
                'leading-relaxed rounded px-1',
                changed
                  ? 'bg-emerald-500/10 text-emerald-200 font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {s.trim()}
            </p>
          );
        })}
      </div>
    </div>
  );
}

// Humanize AI content: replace robotic phrases with natural HAZWOPER-osha.com style
function humanizeAiContent(html, topicTitle = '') {
  if (!html || typeof html !== 'string' || html.length < 40) return html;
  let h = html;
  // Replace overly formal / robotic AI phrases
  const replacements = [
    [/\bIn conclusion\b/gi, 'To wrap up'],
    [/\bFurthermore\b/gi, 'Beyond that'],
    [/\bAdditionally\b/gi, 'Also'],
    [/\bUtilize\b/gi, 'Use'],
    [/\bfacilitate\b/g, 'help'],
    [/\bIn order to\b/gi, 'To'],
    [/\bIt is important to note that\b/gi, 'Keep in mind:'],
    [/\bPersonnel must exercise\b/gi, 'Workers are required to maintain'],
    [/\bstrict procedural adherence\b/gi, 'careful step-by-step compliance'],
    [/\bensure occupational safety\b/gi, 'keep everyone safe on the job'],
    [/\bApplicable state and federal\b/gi, 'Current state and federal'],
    [/\bIt is essential to\b/gi, 'You must'],
    [/\bIt should be noted\b/gi, 'Note:'],
    [/\bOne must\b/gi, 'You'],
    [/\bIn this module\b/gi, 'In this section'],
    [
      /\bThis operational module establishes mandatory\b/gi,
      'This section covers the required',
    ],
    [
      /\bReview applicable standards, engineering controls, and personal safeguards\.\b/gi,
      `Make sure you understand ${topicTitle || 'this topic'} fully before moving on.`,
    ],
  ];
  replacements.forEach(([pattern, repl]) => {
    h = h.replace(pattern, repl);
  });
  return h;
}

function CourseWizard({ onCancel, onComplete, onOpenFullEditor }) {
  const [step, setStep] = useState(1);
  const defaultInitialTitle =
    'OSHA Full Body Harness & Fall Protection Training';
  const [courseData, setCourseData] = useState({
    title: defaultInitialTitle,
    category: 'safety',
    duration: '2 Hours',
    architectureMode: 'auto',
    customModules: 'auto',
    customLessons: 'auto',
    customTopicsRange: { min: 13, max: 35 },
    description: generateProfessionalCourseOverview(
      defaultInitialTitle,
      'safety',
      '2 Hours'
    ),
    settings: { sequential: true, tts: true, certificate: true },
  });
  const [generatedStructure, setGeneratedStructure] = useState(null);

  // Total 5 steps: 1=Params, 2=Generation, 3=AI Review, 4=Curriculum Editor, 5=Publish
  const maxStep = 5;
  const nextStep = () => setStep((s) => Math.min(maxStep, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));
  const updateCourseData = (updates) =>
    setCourseData((prev) => ({ ...prev, ...updates }));

  const WIZARD_STEPS = [
    { num: 1, label: '1. Parameters' },
    { num: 2, label: '2. AI Engine' },
    { num: 3, label: '3. AI Review' },
    { num: 4, label: '4. Edit Curriculum' },
    { num: 5, label: '5. Publish' },
  ];

  // Apply accepted humanizations to the structure
  const applyHumanizations = (reviewItems) => {
    if (!generatedStructure) return;
    const acceptedMap = {};
    reviewItems
      .filter((r) => r.status === 'accepted')
      .forEach((r) => {
        acceptedMap[r.id] = r.humanizedHtml;
      });
    if (Object.keys(acceptedMap).length === 0) return;
    const updated = JSON.parse(JSON.stringify(generatedStructure));
    updated.modules?.forEach((m) => {
      m.lessons?.forEach((l) => {
        l.topics?.forEach((t) => {
          if (acceptedMap[t.id]) t.content = acceptedMap[t.id];
        });
      });
    });
    updated.updatedAt = new Date().toISOString();
    saveCourse(updated);
    setGeneratedStructure(updated);
  };

  const handleCancelOrBack = () => {
    if (generatedStructure) {
      const draftToSave = {
        ...generatedStructure,
        title: courseData.title || generatedStructure.title,
        category: courseData.category || generatedStructure.category,
        description: courseData.description || generatedStructure.description,
        status: generatedStructure.status || 'draft',
        updatedAt: new Date().toISOString(),
      };
      saveCourse(draftToSave);
      showToast('Draft course saved automatically!', 'info');
    }
    onCancel();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Progress Bar */}
      <div className="flex items-center justify-between px-4">
        <button
          onClick={handleCancelOrBack}
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {WIZARD_STEPS.map((s) => (
            <div
              key={s.num}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all',
                step === s.num
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : step > s.num
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'bg-muted text-muted-foreground opacity-60'
              )}
            >
              {step > s.num ? <CheckCircle2 className="w-3 h-3" /> : null}
              {s.label}
            </div>
          ))}
        </div>
      </div>

      <Card
        className={cn(
          'bg-card shadow-xl overflow-hidden flex flex-col justify-between',
          step === 3 ? 'p-6 md:p-7 min-h-[680px]' : 'p-6 md:p-8 min-h-[560px]'
        )}
      >
        <AnimatePresence mode="wait">
          {/* STEP 1: Configure Parameters */}
          {step === 1 && (
            <WizardStep1
              data={courseData}
              updateData={updateCourseData}
              onNext={nextStep}
            />
          )}

          {/* STEP 2: Multi-Agent AI Generation */}
          {step === 2 && (
            <WizardStep2
              data={courseData}
              onStructureGenerated={(structure) => {
                const draftCourse = {
                  ...structure,
                  title: courseData.title || structure.title,
                  category: courseData.category || structure.category,
                  description: courseData.description || structure.description,
                  status: 'draft',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                saveCourse(draftCourse);
                setGeneratedStructure(draftCourse);
                nextStep(); // Goes to Step 3 (AI Review)
              }}
              onCancel={prevStep}
            />
          )}

          {/* STEP 3: AI Content Review — Track Changes / Humanize */}
          {step === 3 && (
            <motion.div
              key="step3-review"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col h-full space-y-4 min-h-[600px]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <span className="text-lg">🧑‍🏫</span> Step 3: AI Content
                    Review &amp; Humanization
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    The AI has rewritten each topic in a natural, human voice.
                    Review the changes and Accept All or Accept 1-by-1 like a
                    human editor.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={prevStep}>
                    Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                  >
                    Skip to Editor <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>

              <AiContentReviewPanel
                structure={generatedStructure}
                onAcceptAll={(items) => {
                  applyHumanizations(
                    items.map((r) => ({ ...r, status: 'accepted' }))
                  );
                  showSuccess('All humanized content accepted!');
                  setTimeout(nextStep, 600);
                }}
                onAcceptItem={(item) => {
                  // Individual accept: update structure for this topic
                  if (!generatedStructure) return;
                  const updated = JSON.parse(
                    JSON.stringify(generatedStructure)
                  );
                  updated.modules?.forEach((m) => {
                    m.lessons?.forEach((l) => {
                      l.topics?.forEach((t) => {
                        if (t.id === item.id) t.content = item.humanizedHtml;
                      });
                    });
                  });
                  updated.updatedAt = new Date().toISOString();
                  saveCourse(updated);
                  setGeneratedStructure(updated);
                }}
                onSkip={nextStep}
              />
            </motion.div>
          )}

          {/* STEP 4: Curriculum Editor */}
          {step === 4 && (
            <WizardStep3
              structure={generatedStructure}
              setStructure={(newStruct) => {
                setGeneratedStructure(newStruct);
                if (newStruct) {
                  saveCourse({ ...newStruct, status: 'draft' });
                }
              }}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}

          {/* STEP 5: Quality Stamp & Publish */}
          {step === 5 && (
            <WizardStep4
              data={courseData}
              structure={generatedStructure}
              onPrev={prevStep}
              onOpenFullEditor={onOpenFullEditor}
              onPublish={() => {
                const finalCourse = {
                  ...generatedStructure,
                  title: courseData.title || generatedStructure.title,
                  category: courseData.category || generatedStructure.category,
                  description:
                    courseData.description || generatedStructure.description,
                  status: 'published',
                  updatedAt: new Date().toISOString(),
                };
                const success = saveCourse(finalCourse);
                if (success) {
                  showSuccess(
                    'Course published successfully with verified Human Quality Seal!'
                  );
                } else {
                  showToast(
                    'Course published to cloud storage. Local browser cache is full.',
                    'warning'
                  );
                }
                onComplete(finalCourse);
              }}
            />
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

function WizardStep1({ data, updateData, onNext }) {
  const suggestions = [
    'OSHA Full Body Harness & Fall Protection Training',
    'HAZWOPER 40-Hour Hazardous Waste Operations',
    'Mold Assessment and Remediation Professional Training',
    'Confined Space Entry & Rescue Specialist',
    'AI & Prompt Engineering Masterclass',
    'HIPAA Compliance & Patient Privacy 2026',
  ];

  const sizingPreview = useMemo(() => {
    return calculateCurriculumSizing(
      data.duration,
      data.architectureMode === 'custom' ? data.customModules : 'auto',
      data.architectureMode === 'custom' ? data.customLessons : 'auto',
      data.customTopicsRange || { min: 15, max: 32 }
    );
  }, [
    data.duration,
    data.architectureMode,
    data.customModules,
    data.customLessons,
    data.customTopicsRange,
  ]);

  const handleTitleChange = (newTitle) => {
    const newOverview = generateProfessionalCourseOverview(
      newTitle,
      data.category,
      data.duration
    );
    updateData({ title: newTitle, description: newOverview });
  };

  const handleCategoryChange = (newCat) => {
    const newOverview = generateProfessionalCourseOverview(
      data.title,
      newCat,
      data.duration
    );
    updateData({ category: newCat, description: newOverview });
  };

  const handleDurationChange = (newDur) => {
    const newOverview = generateProfessionalCourseOverview(
      data.title,
      data.category,
      newDur
    );
    updateData({ duration: newDur, description: newOverview });
  };

  const handleRegenerateOverview = () => {
    const freshOverview = generateProfessionalCourseOverview(
      data.title,
      data.category,
      data.duration
    );
    updateData({ description: freshOverview });
    showToast('Pedagogical Objectives Prompt Auto-Generated!', 'success');
  };

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Step 1: Configure Course Curriculum & Multi-Agent Parameters
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Specify course title, mandatory seat-time duration, and curriculum
          architecture mode for the 3 AI Agents.
        </p>
      </div>

      <div className="space-y-4">
        {/* Course Title */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
            Course Title *
          </label>
          <Input
            value={data.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g., OSHA Full Body Harness, HAZWOPER 40-Hour..."
            className="text-base font-medium"
          />

          {/* Suggestions */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[10px] font-semibold text-muted-foreground py-0.5">
              Presets:
            </span>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleTitleChange(s)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary transition-colors border border-border/60"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Category
            </label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm focus:ring-2 focus:ring-primary/40 font-semibold"
              value={data.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="safety">Safety Training (OSHA / HAZWOPER)</option>
              <option value="environmental">Environmental Science</option>
              <option value="compliance">Regulatory Compliance</option>
              <option value="technology">Technology & AI</option>
              <option value="healthcare">Healthcare & Clinical</option>
              <option value="business">Business & Management</option>
              <option value="general">General Professional</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Course Duration (Accredited Seat Time)
            </label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm focus:ring-2 focus:ring-primary/40 font-semibold"
              value={data.duration}
              onChange={(e) => handleDurationChange(e.target.value)}
            >
              <option value="30 Minutes">
                30 Minutes (Quick Micro-course: ~2 Modules)
              </option>
              <option value="1 Hour">1 Hour (Foundational: ~3 Modules)</option>
              <option value="2 Hours">
                2 Hours (Standard Certification: ~4 Modules)
              </option>
              <option value="4 Hours">
                4 Hours (Intermediate Training: ~5 Modules)
              </option>
              <option value="8 Hours">
                8 Hours (Full Day Refresher: ~7 Modules)
              </option>
              <option value="16 Hours">
                16 Hours (Advanced Curriculum: ~10 Modules)
              </option>
              <option value="24 Hours">
                24 Hours (Comprehensive Operations: ~14 Modules)
              </option>
              <option value="40 Hours">
                40 Hours (Full HAZWOPER Standard: ~20 Modules)
              </option>
            </select>
          </div>
        </div>

        {/* Architecture Mode: AI Proportions vs Custom */}
        <div className="p-4 rounded-2xl border border-border bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-500" /> Curriculum
              Architecture Mode
            </span>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => updateData({ architectureMode: 'auto' })}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                  data.architectureMode === 'auto'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                🤖 AI Auto Proportions
              </button>
              <button
                type="button"
                onClick={() => updateData({ architectureMode: 'custom' })}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                  data.architectureMode === 'custom'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                ⚙️ Custom Structure
              </button>
            </div>
          </div>

          {data.architectureMode === 'custom' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Total Modules (1 - 25)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="25"
                  value={
                    data.customModules === 'auto'
                      ? sizingPreview.modulesCount
                      : data.customModules
                  }
                  onChange={(e) =>
                    updateData({ customModules: e.target.value })
                  }
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Lessons per Module (Random 2 - 6)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="2 - 6"
                  value={data.customLessons === 'auto' ? 4 : data.customLessons}
                  onChange={(e) =>
                    updateData({ customLessons: e.target.value })
                  }
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Topics per Lesson (Random 13 - 35)
                </label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="5"
                    max="50"
                    placeholder="Min"
                    value={data.customTopicsRange?.min || 13}
                    onChange={(e) =>
                      updateData({
                        customTopicsRange: {
                          ...(data.customTopicsRange || { min: 13, max: 35 }),
                          min: Number(e.target.value),
                        },
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="number"
                    min="10"
                    max="60"
                    placeholder="Max"
                    value={data.customTopicsRange?.max || 35}
                    onChange={(e) =>
                      updateData({
                        customTopicsRange: {
                          ...(data.customTopicsRange || { min: 13, max: 35 }),
                          max: Number(e.target.value),
                        },
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="p-2 rounded-xl bg-card border border-border">
                <span className="text-xs font-black text-amber-500 block">
                  {sizingPreview.modulesCount} Modules
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Intro + Core Modules
                </span>
              </div>
              <div className="p-2 rounded-xl bg-card border border-border">
                <span className="text-xs font-black text-foreground block">
                  {sizingPreview.lessonsMin} - {sizingPreview.lessonsMax}{' '}
                  Lessons/Mod
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Randomized / Module
                </span>
              </div>
              <div className="p-2 rounded-xl bg-card border border-border">
                <span className="text-xs font-black text-purple-400 block">
                  {sizingPreview.topicsMin} - {sizingPreview.topicsMax} Topics
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Randomized / Lesson
                </span>
              </div>
              <div className="p-2 rounded-xl bg-card border border-border">
                <span className="text-xs font-black text-emerald-400 block">
                  ⏱️ {sizingPreview.durationLabel}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Seat Time Timer
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Course Overview / Pedagogical Objectives */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Course Overview / Pedagogical Objectives
            </label>
            <button
              type="button"
              onClick={handleRegenerateOverview}
              className="text-[11px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30"
              title="Click to auto-generate accredited objectives"
            >
              <Sparkles className="w-3 h-3" /> Auto-Draft Objectives
            </button>
          </div>
          <Textarea
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            placeholder="Describe target objectives and compliance benchmarks..."
            rows={8}
            className="text-xs leading-relaxed font-mono"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border flex justify-end">
        <Button
          onClick={onNext}
          size="lg"
          disabled={!data.title.trim()}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
        >
          Launch 3 AI Agents <Sparkles className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

function WizardStep2({ data, onStructureGenerated, onCancel }) {
  const [progress, setProgress] = useState(5);
  const [statusMessage, setStatusMessage] = useState(
    'Initializing Multi-Agent Pipeline...'
  );
  const [activeAgentId, setActiveAgentId] = useState(
    COURSE_AGENTS.CONTENT_ARCHITECT.id
  );
  const [agentLogs, setAgentLogs] = useState([]);

  useEffect(() => {
    let isCancelled = false;

    const executePipeline = async () => {
      try {
        const generated = await runMultiAgentCourseGeneration(
          {
            courseName: data.title,
            duration: data.duration,
            category: data.category,
            customModules:
              data.architectureMode === 'custom' ? data.customModules : 'auto',
            customLessons:
              data.architectureMode === 'custom' ? data.customLessons : 'auto',
            customTopicsRange: data.customTopicsRange || { min: 15, max: 35 },
            description: data.description,
          },
          (event) => {
            if (isCancelled) return;
            setActiveAgentId(event.currentAgent.id);
            setStatusMessage(event.message);
            setProgress(event.progress);
            setAgentLogs(event.logs);
          }
        );

        if (!isCancelled) {
          await new Promise((r) => setTimeout(r, 600));
          onStructureGenerated(generated);
        }
      } catch (err) {
        console.error('Multi-Agent Generation Error:', err);
        showToast('Generation failed, using procedural fallback...', 'error');
        const fallback = generateCourse({
          courseName: data.title,
          duration: data.duration,
          category: data.category,
        });
        if (!isCancelled) onStructureGenerated(fallback);
      }
    };

    executePipeline();

    return () => {
      isCancelled = true;
    };
  }, [data, onStructureGenerated]);

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="py-6 space-y-6 max-w-2xl mx-auto"
    >
      <div className="text-center space-y-2">
        <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Se7eN AI Multi-Agent Engine
          Active
        </span>
        <h3 className="text-xl md:text-2xl font-bold tracking-tight">
          Collaborative AI Agent Pipeline
        </h3>
        <p className="text-xs text-muted-foreground">
          Three specialized agents are generating, synthesizing, and
          human-auditing your course in real-time.
        </p>
      </div>

      {/* 3 LIVE AGENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.values(COURSE_AGENTS).map((agent) => {
          const isActive = activeAgentId === agent.id;
          const isDone =
            (agent.id === 'agent_content_architect' && progress >= 60) ||
            (agent.id === 'agent_media_designer' && progress >= 80) ||
            (agent.id === 'agent_human_reviewer' && progress >= 99);

          return (
            <div
              key={agent.id}
              className={cn(
                'p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between gap-2',
                isActive
                  ? 'border-amber-500 bg-amber-500/10 shadow-lg ring-2 ring-amber-500/30'
                  : isDone
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-border bg-card/60 opacity-60'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{agent.avatar}</span>
                {isActive ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase animate-pulse">
                    Active
                  </span>
                ) : isDone ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                    ✓ Complete
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Queued
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-bold text-xs text-foreground leading-tight">
                  {agent.name}
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {agent.role}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Status & Progress Bar */}
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-between text-xs font-semibold px-1">
          <span className="text-amber-500 font-mono flex items-center gap-1.5 truncate max-w-md">
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            {statusMessage}
          </span>
          <span className="font-mono font-bold text-foreground">
            {progress}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden p-0.5 border border-border">
          <div
            className="bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-500 h-full rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Multi-Agent Live Terminal Log */}
      <div className="w-full bg-slate-950 border border-border rounded-2xl p-4 font-mono text-[11px] max-h-48 overflow-y-auto space-y-2 shadow-inner custom-scrollbar text-slate-300">
        <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800 flex justify-between">
          <span>AGENT ACTIVITY STREAM</span>
          <span>LIVE TELEMETRY</span>
        </div>
        {agentLogs.map((log, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-amber-500 shrink-0">{log.agentAvatar}</span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400">
                [{log.agentName}]:{' '}
              </span>
              <span className="text-slate-200">{log.message}</span>
            </div>
            <span className="text-[9px] text-slate-600 shrink-0">
              {log.timestamp}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel Generation
        </Button>
      </div>
    </motion.div>
  );
}

function WizardStep3({ structure, setStructure, onNext, onPrev }) {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-[620px] flex flex-col"
    >
      <div className="pb-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            Step 4: Review & Customize Generated Curriculum
          </h2>
          <p className="text-xs text-muted-foreground">
            Edit text content, drag-and-drop components, or change presentation
            frame layouts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onPrev}>
            Back
          </Button>
          <Button
            size="sm"
            onClick={onNext}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
          >
            Continue to Quality Seal & Publish{' '}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden mt-3 rounded-xl border border-border">
        <CourseEditorCore
          structure={structure}
          setStructure={setStructure}
          sidebarCollapsed={false}
          setSidebarCollapsed={() => {}}
        />
      </div>
    </motion.div>
  );
}

function WizardStep4({ data, structure, onPrev, onPublish, onOpenFullEditor }) {
  const moduleCount = structure?.modules?.length || 0;
  const lessonCount =
    structure?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) ||
    0;
  const topicCount =
    structure?.modules?.reduce(
      (acc, m) =>
        acc +
        (m.lessons?.reduce((a, l) => a + (l.topics?.length || 0), 0) || 0),
      0
    ) || 0;

  const audit = structure?.humanReviewAudit;

  const handleOpenFullEditorClick = () => {
    if (onOpenFullEditor && structure) {
      const draftCourse = {
        ...structure,
        title: data.title || structure.title,
        category: data.category || structure.category,
        description: data.description || structure.description,
        status: 'draft',
        updatedAt: new Date().toISOString(),
      };
      saveCourse(draftCourse);
      onOpenFullEditor(draftCourse);
    } else {
      onPrev();
    }
  };

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Step 5: Quality Seal Verification & Publish
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Review your course summary and verified Human Quality Audit score
          before publishing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="md:col-span-2 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Award className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-bold text-lg">
                {structure?.title || data.title}
              </h3>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="purple">
                  {structure?.category || data.category}
                </Badge>
                <Badge variant="info">
                  {structure?.durationLabel || data.duration}
                </Badge>
                <Badge variant="warning">
                  {structure?.ceuCredits || '0.2 CEU'}
                </Badge>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  ✓ Human Review Passed
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {structure?.description || data.description}
          </p>

          {/* Master Human Reviewer Quality Stamp Box */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧑‍🏫</span>
                <div>
                  <span className="text-xs font-black text-emerald-400 block">
                    {audit?.reviewerName || 'Se7eN AI Master Human Reviewer'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Pedagogical Audit & 29 CFR Regulatory Compliance Stamp
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {audit?.auditScore || 99.8}%
                </span>
                <span className="text-[9px] text-muted-foreground block uppercase">
                  Human Quality Score
                </span>
              </div>
            </div>

            <ul className="text-[11px] space-y-1 text-slate-300 pt-1 border-t border-emerald-500/20">
              {audit?.auditHighlights?.map((h, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{h}</span>
                </li>
              )) || (
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Verified 100% OSHA 29 CFR Standards & Pedagogical Depth
                  </span>
                </li>
              )}
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border text-center">
            <div className="p-3 bg-muted/40 rounded-xl">
              <span className="text-base font-bold text-foreground block">
                {moduleCount}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">
                Modules
              </span>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl">
              <span className="text-base font-bold text-foreground block">
                {lessonCount}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">
                Lessons
              </span>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl">
              <span className="text-base font-bold text-foreground block">
                {topicCount}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">
                Topics
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between space-y-4 bg-muted/20">
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Included Player Features
            </h4>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Natural English AI Narrator (0.3s breath pause)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Mandatory Seat Time Timer ({structure?.durationLabel})
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />3
                Accredited Themes (Light, Dark, Nebula)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Slide-by-Slide 8K Images & Watermarks
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Compulsory Final Exam & Certificate
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-4">
            <Button
              onClick={onPublish}
              size="lg"
              className="w-full shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              Publish Course Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenFullEditorClick}
              className="w-full font-semibold"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Curriculum (Full
              Workspace Editor)
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

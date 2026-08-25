'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Zap,
  Play,
  Download,
  BookOpen,
  CheckCircle2,
  Layers,
  Award,
  Clock,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { generateCourseStructure } from '@/lib/course-generator';
import { saveCourse, exportCourseJSON } from '@/lib/course-storage';
import { ProfessionalCoursePlayerModal } from '@/components/professional-course-player-modal';
import { showToast } from '@/lib/swal';

export function AICourseCreatorGenerator() {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('safety');
  const [targetAudience, setTargetAudience] = useState(
    'Construction Workers & Field Technicians'
  );
  const [moduleCount, setModuleCount] = useState(3);
  const [complianceStandard, setComplianceStandard] = useState(
    'OSHA 29 CFR 1910 / HAZWOPER'
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!topic.trim()) {
      showToast(
        'Missing Topic',
        'Please enter a course topic or title to proceed.',
        'warning'
      );
      return;
    }

    setIsGenerating(true);
    setProgress(10);
    setProgressMessage('Initializing Multi-Agent AI Course Engine...');

    try {
      const course = await generateCourseStructure(
        {
          topic: topic.trim(),
          category,
          targetAudience,
          moduleCount: Number(moduleCount) || 3,
          complianceStandard,
        },
        (stageProgress, stageMsg) => {
          setProgress(stageProgress);
          setProgressMessage(stageMsg);
        }
      );

      if (course) {
        // Quota-safe save to IndexedDB & Memory Cache
        saveCourse(course);
        setGeneratedCourse(course);
        setProgress(100);
        setProgressMessage('Course generation complete!');
        showToast(
          'Course Created!',
          `Successfully generated "${course.title}".`,
          'success'
        );
      } else {
        throw new Error('Course generation returned an empty result.');
      }
    } catch (err) {
      console.error('AI Course Creator error:', err);
      showToast(
        'Generation Notice',
        err?.message || 'Failed to complete course generation.',
        'error'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (generatedCourse) {
      exportCourseJSON(generatedCourse);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Player Modal Preview */}
      <ProfessionalCoursePlayerModal
        isOpen={playerModalOpen}
        onClose={() => setPlayerModalOpen(false)}
        initialCourseData={generatedCourse}
      />

      {/* Header Banner */}
      <div className="bg-card/60 backdrop-blur-2xl border border-border p-8 rounded-[36px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge
                variant="secondary"
                className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-black uppercase text-[9px] tracking-widest flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                ALWAYS PAID • PRO ENGINE
              </Badge>
              <Badge
                variant="outline"
                className="px-3 py-1 border-primary/30 text-primary font-bold text-[9px] uppercase tracking-wider"
              >
                Multi-Agent AI
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
              AI Course Creator Studio
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">
              Generate fully structured, interactive LMS training courses
              complete with canvas visuals, audio scripts, and quizzes.
            </p>
          </div>

          {generatedCourse && (
            <div className="flex items-center gap-3 shrink-0">
              <Button
                onClick={() => setPlayerModalOpen(true)}
                className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Launch Player
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Generator Form & Progress */}
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border bg-card/40 backdrop-blur-xl rounded-[32px] shadow-xl relative overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Course Topic or Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. OSHA 24-Hour HAZWOPER Field Safety & Emergency Response"
                  className="h-14 rounded-2xl bg-muted/30 border-border text-base font-medium focus:ring-2 focus:ring-primary/40"
                  disabled={isGenerating}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-foreground">
                    Category / Domain
                  </Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isGenerating}
                    className="w-full h-12 rounded-2xl bg-muted/30 border border-border px-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="safety">Occupational Safety & Health</option>
                    <option value="hazwoper">
                      HAZWOPER & Chemical Hazards
                    </option>
                    <option value="environmental">
                      Environmental Compliance
                    </option>
                    <option value="general">
                      General Industry & Construction
                    </option>
                    <option value="onboarding">Corporate Onboarding</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-foreground">
                    Target Audience
                  </Label>
                  <Input
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Field Technicians, Safety Inspectors"
                    className="h-12 rounded-2xl bg-muted/30 border-border text-sm font-medium"
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-foreground">
                    Number of Curriculum Modules
                  </Label>
                  <select
                    value={moduleCount}
                    onChange={(e) => setModuleCount(Number(e.target.value))}
                    disabled={isGenerating}
                    className="w-full h-12 rounded-2xl bg-muted/30 border border-border px-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value={2}>2 Modules (~1 Hour Training)</option>
                    <option value={3}>3 Modules (~2 Hours Training)</option>
                    <option value={4}>4 Modules (~3 Hours Training)</option>
                    <option value={5}>
                      5 Modules (~4 Hours Comprehensive)
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-foreground">
                    Regulatory Standard
                  </Label>
                  <Input
                    value={complianceStandard}
                    onChange={(e) => setComplianceStandard(e.target.value)}
                    placeholder="e.g. OSHA 29 CFR 1910.120 / EPA"
                    className="h-12 rounded-2xl bg-muted/30 border-border text-sm font-medium"
                    disabled={isGenerating}
                  />
                </div>
              </div>

              {/* Progress Tracker */}
              {isGenerating && (
                <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-primary flex items-center gap-2">
                      <Zap className="w-4 h-4 animate-bounce" />
                      {progressMessage}
                    </span>
                    <span className="font-mono text-primary">{progress}%</span>
                  </div>
                  <Progress
                    value={progress}
                    className="h-2 rounded-full bg-primary/20"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base uppercase tracking-wider shadow-xl shadow-primary/25 border-none transition-transform hover:scale-[1.01]"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 animate-spin" />
                    Generating AI Course Structure...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Generate Full Course Package
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Course Summary Side Panel */}
        <div className="space-y-6">
          {generatedCourse ? (
            <Card className="border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl rounded-[32px] p-6 space-y-6 shadow-xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <Badge className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5">
                    Ready to Play
                  </Badge>
                  <h3 className="text-lg font-black text-foreground mt-1 line-clamp-1">
                    {generatedCourse.title}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {generatedCourse.description || generatedCourse.subtitle}
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-background/60 border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Modules
                  </span>
                  <span className="font-mono font-black text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    {generatedCourse.modules?.length || 0}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-background/60 border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Duration
                  </span>
                  <span className="font-mono font-black text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {generatedCourse.durationLabel || '2 Hours'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => setPlayerModalOpen(true)}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Preview in Player
                </Button>

                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="w-full h-11 rounded-xl border-border font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-muted-foreground" />
                  Export Course JSON
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="border-border bg-card/40 backdrop-blur-xl rounded-[32px] p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-foreground">
                PRO Features Included
              </h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Automated Canvas Visual Blocks
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Audio Narration Script Generation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Interactive Hazard Matching Quizzes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Unlimited Local IndexedDB Storage
                </li>
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default AICourseCreatorGenerator;

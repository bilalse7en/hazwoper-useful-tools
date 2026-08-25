'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  BookOpen,
  Play,
  Clock,
  Award,
  ShieldCheck,
  Lock,
  ArrowRight,
  Eye,
  Zap,
  CheckCircle2,
  X,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ProfessionalCoursePlayerModal } from '@/components/professional-course-player-modal';
import {
  DEFAULT_INITIAL_COURSES,
  getAllCourses,
  getAllCoursesAsync,
} from '@/lib/course-storage';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function FeaturedCoursesSection() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPreviewCourse, setSelectedPreviewCourse] = useState(null);
  const [paywallModalOpen, setPaywallModalOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadCourses = async () => {
      const loaded = await getAllCoursesAsync();
      if (isMounted) setCourses(Array.isArray(loaded) ? loaded : []);
    };
    loadCourses();

    const handleUpdate = () => loadCourses();
    window.addEventListener('hazwoper_courses_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('hazwoper_courses_updated', handleUpdate);
    };
  }, []);

  // Curate top 8 best selling courses
  const bestSellingCourses = useMemo(() => {
    return courses.slice(0, 8);
  }, [courses]);

  const itemsPerPage = 4;
  const totalSlides = Math.ceil(bestSellingCourses.length / itemsPerPage) || 1;

  // Auto-play slider: advance every 5 seconds (paused on hover)
  useEffect(() => {
    if (isHovered || totalSlides <= 1) return;
    const timer = setInterval(() => {
      setSliderIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, totalSlides]);

  const visibleCourses = bestSellingCourses.slice(
    sliderIndex * itemsPerPage,
    sliderIndex * itemsPerPage + itemsPerPage
  );

  const isAdmin = user?.role === 'admin';
  const hasGeneratorAccess = user?.has_generator_access || isAdmin;

  const handleCreateCourseClick = () => {
    if (hasGeneratorAccess) {
      router.push('/admin/courses');
    } else {
      setPaywallModalOpen(true);
    }
  };

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="py-24 bg-gradient-to-b from-background via-muted/10 to-background border-b border-border relative overflow-hidden"
    >
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Interactive Course Player Modal Preview */}
      <ProfessionalCoursePlayerModal
        isOpen={!!selectedPreviewCourse}
        onClose={() => setSelectedPreviewCourse(null)}
        initialCourseData={selectedPreviewCourse}
      />

      {/* Paywall Modal for AI Course Creator */}
      {paywallModalOpen && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden text-foreground">
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    AI Course Creator (Pro Feature)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Unlock unlimited AI-generated training programs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaywallModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-foreground block">
                    Generate Unlimited Custom Safety Courses
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    Build accredited courses tailored to your jobsite with
                    automatic curriculum sizing, multi-agent photorealistic
                    visuals, humanized TTS narration, and interactive quizzes
                    for only <strong>$20 lifetime access</strong>.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-2xl border border-border space-y-2 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>AI Course Generator License</span>
                  <span className="text-amber-500 font-bold">$20.00 USD</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Access Tier</span>
                  <span>Lifetime Unlimited</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  alert(
                    'Stripe Checkout Simulator: $20.00 Payment Successful! AI Generator Unlocked.'
                  );
                  setPaywallModalOpen(false);
                  router.push('/admin/courses');
                }}
                className="w-full h-12 rounded-2xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20"
              >
                <CreditCard className="w-4 h-4 mr-2" /> Pay $20 & Unlock Course
                Generator
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant="secondary"
                className="px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1.5 w-fit"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  🔥 Top 8 Best Selling Courses
                </span>
              </Badge>
              {totalSlides > 1 && (
                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      isHovered
                        ? 'bg-amber-400'
                        : 'bg-emerald-400 animate-pulse'
                    )}
                  />
                  {isHovered ? 'Paused' : 'Auto-Playing'}
                </span>
              )}
            </div>

            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
              Best Selling <span className="text-primary">Safety Courses</span>
            </h2>
            <p className="text-muted-foreground font-medium text-sm md:text-base mt-2 max-w-2xl">
              Explore our 8 highest-rated OSHA-compliant programs with full
              audio narration, 3 responsive frame layouts, knowledge quizzes,
              and verifiable certification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View All Courses Page Link Button */}
            <Link href="/courses">
              <Button
                variant="outline"
                size="lg"
                className="h-11 px-5 rounded-2xl font-bold border-border hover:border-amber-500/50 hover:bg-amber-500/10 gap-2"
              >
                <BookOpen className="w-4 h-4 text-amber-500" />
                View All Courses
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Button
              onClick={handleCreateCourseClick}
              size="lg"
              className="h-11 px-5 rounded-2xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 border-none gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Create AI Course
              <Badge className="bg-slate-950 text-white font-black text-[9px] px-1.5 py-0.5 ml-1 border-none">
                PAID
              </Badge>
            </Button>
          </div>
        </div>

        {/* 4 Featured Courses in 1 Row (Slider View) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleCourses.map((course, idx) => {
            const courseId =
              course.numericId || sliderIndex * itemsPerPage + idx + 1;
            return (
              <motion.div
                key={course.id || `${sliderIndex}_${idx}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="group flex flex-col h-full"
              >
                <Card className="flex flex-col h-full overflow-hidden border-border bg-card/60 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 rounded-[28px]">
                  {/* Thumbnail Banner */}
                  <div className="relative h-44 bg-muted overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        typeof course.thumbnail === 'string' &&
                        course.thumbnail.trim() !== ''
                          ? course.thumbnail
                          : 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80'
                      }
                      alt={course.title || 'Course Thumbnail'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

                    {/* Sequential Course ID Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs tracking-wider shadow-md">
                        ID #{courseId}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                        {course.category?.toUpperCase() || 'SAFETY'}
                      </span>
                    </div>

                    {/* Quick Preview Hover Trigger */}
                    <button
                      onClick={() => setSelectedPreviewCourse(course)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="px-4 py-2 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl hover:scale-105 transition-transform">
                        <Play className="w-3.5 h-3.5 fill-slate-950" /> View
                        Demo Course
                      </div>
                    </button>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" />{' '}
                        {course.durationLabel || '2 Hours'} •{' '}
                        {course.ceuCredits || '0.2 CEU'}
                      </span>
                      <h3 className="font-bold text-sm leading-tight mt-1 line-clamp-2 drop-shadow-sm">
                        {course.title}
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="space-y-3 pt-2 border-t border-border">
                      <Button
                        onClick={() => setSelectedPreviewCourse(course)}
                        className="w-full h-10 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        View Demo Course
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Carousel Dots & All Courses Navigation Banner */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/50">
          {totalSlides > 1 && (
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSlides }).map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => setSliderIndex(dotIdx)}
                  className={cn(
                    'h-2.5 rounded-full transition-all duration-300',
                    sliderIndex === dotIdx
                      ? 'w-8 bg-amber-500'
                      : 'w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  )}
                  title={`Slide page ${dotIdx + 1}`}
                />
              ))}
            </div>
          )}

          <div className="flex items-center">
            <span className="text-xs text-muted-foreground">
              Showing <strong>{visibleCourses.length}</strong> of{' '}
              <strong>{courses.length}</strong> available courses
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

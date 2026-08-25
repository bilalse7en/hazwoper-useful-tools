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
  Search,
  Filter,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ProfessionalCoursePlayerModal } from '@/components/professional-course-player-modal';
import { getAllCoursesAsync } from '@/lib/course-storage';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AllCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPreviewCourse, setSelectedPreviewCourse] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadCourses = async () => {
      setLoading(true);
      const loaded = await getAllCoursesAsync();
      if (isMounted) {
        setCourses(Array.isArray(loaded) ? loaded : []);
        setLoading(false);
      }
    };
    loadCourses();

    const handleUpdate = () => loadCourses();
    window.addEventListener('hazwoper_courses_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('hazwoper_courses_updated', handleUpdate);
    };
  }, []);

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'safety', label: 'Safety & OSHA' },
    { id: 'environmental', label: 'Environmental' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'technology', label: 'Technology & AI' },
    { id: 'healthcare', label: 'Healthcare' },
    { id: 'business', label: 'Business & PM' },
  ];

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' ||
        (course.category || 'safety').toLowerCase() ===
          selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [courses, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Interactive Course Player Modal Preview */}
      <ProfessionalCoursePlayerModal
        isOpen={!!selectedPreviewCourse}
        onClose={() => setSelectedPreviewCourse(null)}
        initialCourseData={selectedPreviewCourse}
      />

      {/* Hero Header Section */}
      <div className="border-b border-border bg-gradient-to-b from-muted/30 via-background to-background relative overflow-hidden py-14 md:py-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10 space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link
              href="/"
              className="hover:text-amber-500 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Course Catalog</span>
          </div>

          <div className="max-w-3xl space-y-3">
            <Badge
              variant="secondary"
              className="px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1.5 w-fit"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Accredited Training Catalog
              </span>
            </Badge>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              Explore All{' '}
              <span className="text-primary">Certified Courses</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Explore comprehensive OSHA-aligned, environmental, and technical
              training curriculum featuring interactive slide components,
              humanized voice narration, practice quizzes, and verifiable
              certification.
            </p>
          </div>

          {/* Search Bar & Category Filters */}
          <div className="pt-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search courses by title, topic, or standard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-2xl border-border bg-card shadow-xs text-xs font-medium"
              />
            </div>

            {/* Total Results Count */}
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <span>
                Showing <strong>{filteredCourses.length}</strong> of{' '}
                <strong>{courses.length}</strong> courses
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shadow-2xs',
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-amber-500/40'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Courses Grid Section */}
      <div className="container mx-auto px-6 py-12 flex-1">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-semibold">
              Loading accredited curriculum catalog...
            </p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-24 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base">No matching courses found</h3>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search terms or select another category filter.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="rounded-xl text-xs font-bold"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCourses.map((course, idx) => {
              const courseId = course.numericId || idx + 1;
              return (
                <motion.div
                  key={course.id || idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(idx * 0.05, 0.3),
                  }}
                  className="group flex flex-col h-full"
                >
                  <Card className="flex flex-col h-full overflow-hidden border-border bg-card hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 rounded-[28px]">
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

                      {/* Quick Preview Hover Overlay */}
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

                      <div className="space-y-2.5 pt-2 border-t border-border">
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
        )}
      </div>
    </div>
  );
}

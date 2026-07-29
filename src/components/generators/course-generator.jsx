'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Upload,
  Code,
  Eye,
  Copy,
  CheckCircle2,
  AlertCircle,
  History,
  Sparkles,
  MessageSquare,
  Layers,
  LineChart,
  FileImage,
  Award,
  Globe,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  processCourseFile,
  generateOverviewCode,
  generateCourseObjectivesCode,
  generateSyllabusCode,
  generateFAQCode,
  generateMainPointsCode,
  generateCustomerReviewsCode,
  generateIdealTrainingFormatCode,
  generateROICode,
  generateFeatureImageCode,
  generateRecommendedCoursesCode,
} from '@/lib/docx-processor';
import { PreviewDrawer } from '@/components/preview-drawer';
import { ProgressButton } from '@/components/progress-button';
import { HistoryList } from '@/components/history-list';
import { useAuthAction } from '@/lib/use-auth-action';
import { showToast } from '@/lib/swal';
import { saveGeneratorState } from '@/lib/tool-history';

export function CourseGenerator() {
  const [courseName, setCourseName] = useState('');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [courseData, setCourseData] = useState(null);
  const { performAction } = useAuthAction();

  // Generated Code States
  const [overviewCode, setOverviewCode] = useState('');
  const [objectivesCode, setObjectivesCode] = useState('');
  const [syllabusCode, setSyllabusCode] = useState('');
  const [faqCode, setFaqCode] = useState('');
  const [mainPointsCode, setMainPointsCode] = useState('');
  const [reviewsCode, setReviewsCode] = useState('');
  const [trainingFormatCode, setTrainingFormatCode] = useState('');
  const [roiCode, setRoiCode] = useState('');
  const [featureImageCode, setFeatureImageCode] = useState('');
  const [recommendedCoursesCode, setRecommendedCoursesCode] = useState('');
  const [metaDetailsCode, setMetaDetailsCode] = useState('');
  const [announcementLink, setAnnouncementLink] = useState('');
  const [announcementCode, setAnnouncementCode] = useState('');
  const [copiedReviewParts, setCopiedReviewParts] = useState({});

  // Media URL for Overview (auto-detects if it's video or image)
  const [mediaUrl, setMediaUrl] = useState('');
  const [restoredFileName, setRestoredFileName] = useState('');

  // View State
  const [activeView, setActiveView] = useState('mainpoints'); // mainpoints, overview, objectives, syllabus, faq, reviews, trainingformat, roi, shortdesc, recommended, metadetails, announcement
  const fileInputRef = useRef(null);

  // Preview Drawer State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // Auto-save helper
  const persistState = async (updates = {}) => {
    const currentState = {
      courseName,
      courseData,
      overviewCode,
      objectivesCode,
      syllabusCode,
      faqCode,
      mainPointsCode,
      mediaUrl,
      reviewsCode,
      trainingFormatCode,
      roiCode,
      featureImageCode,
      recommendedCoursesCode,
      metaDetailsCode,
      announcementLink,
      announcementCode,
      fileName:
        updates.fileName ||
        file?.name ||
        restoredFileName ||
        courseName ||
        'Course Content',
      ...updates,
    };
    await saveGeneratorState(
      'course_generator',
      currentState,
      currentState.fileName
    );
  };

  const showNotification = (message, type = 'success') => {
    showToast(message, type);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Reset all generated states for new file context
      setCourseData(null);
      setOverviewCode('');
      setObjectivesCode('');
      setSyllabusCode('');
      setFaqCode('');
      setMainPointsCode('');
      setReviewsCode('');
      setTrainingFormatCode('');
      setRoiCode('');
      setFeatureImageCode('');
      setRecommendedCoursesCode('');
      setMetaDetailsCode('');
      setAnnouncementLink('');
      setAnnouncementCode('');
      setCopiedReviewParts({});
      setActiveView('mainpoints');
      showNotification(`Selected: ${e.target.files[0].name}`, 'info');
    }
  };

  const handleUpload = async () => {
    if (!file)
      return showNotification('Please select a file to upload.', 'warning');
    if (!courseName)
      return showNotification('Please enter a course name.', 'warning');

    setIsProcessing(true);
    setProgress(10);
    setProgressText('Reading DOCX file...');

    try {
      // Record to media hub
      const { recordMediaUpload } = await import('@/lib/media-hub');
      await recordMediaUpload({
        fileName: file.name,
        fileType:
          file.type ||
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: file.size,
      });
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 200);

      const data = await processCourseFile(file, courseName);

      clearInterval(interval);
      setProgress(100);
      setProgressText('Course content extracted successfully!');
      setCourseData(data);
      showNotification('Course content extracted successfully!', 'success');
      persistState({ courseData: data, courseName });

      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
        setProgressText('');
      }, 2000);
    } catch (error) {
      setIsProcessing(false);
      showNotification('Error extractng content: ' + error.message, 'error');
    }
  };

  const handleGenerateOverview = () => {
    if (!courseData?.fileProcessed)
      return showNotification(
        'Please upload and process a DOCX file first.',
        'warning'
      );
    const code = generateOverviewCode(courseData, mediaUrl);
    setOverviewCode(code);
    setActiveView('overview');
    showNotification('Overview code generated successfully!');
    persistState({ overviewCode: code, activeView: 'overview' });
  };

  const handleGenerateObjectives = () => {
    if (!courseData?.fileProcessed)
      return showNotification(
        'Please upload and process a DOCX file first.',
        'warning'
      );
    const code = generateCourseObjectivesCode(courseData);
    setObjectivesCode(code);
    setActiveView('objectives');
    showNotification('Course Objectives code generated successfully!');
    persistState({ objectivesCode: code, activeView: 'objectives' });
  };

  const handleGenerateSyllabus = () => {
    if (!courseData?.fileProcessed)
      return showNotification(
        'Please upload and process a DOCX file first.',
        'warning'
      );
    const code = generateSyllabusCode(courseData);
    setSyllabusCode(code);
    setActiveView('syllabus');
    showNotification('Syllabus code generated successfully!');
    persistState({ syllabusCode: code, activeView: 'syllabus' });
  };

  const handleGenerateFAQ = () => {
    if (!courseData?.fileProcessed)
      return showNotification(
        'Please upload and process a DOCX file first.',
        'warning'
      );
    const code = generateFAQCode(courseData);
    setFaqCode(code);
    setActiveView('faq');
    showNotification('FAQ code generated successfully!');
    persistState({ faqCode: code, activeView: 'faq' });
  };

  const handleGenerateMainPoints = () => {
    if (!courseData?.fileProcessed)
      return showNotification(
        'Please upload and process a DOCX file first.',
        'warning'
      );
    const code = generateMainPointsCode(courseData);
    setMainPointsCode(code);
    setActiveView('mainpoints');
    showNotification('Main Points code generated successfully!');
    persistState({ mainPointsCode: code, activeView: 'mainpoints' });
  };

  const handleGenerateReviews = () => {
    if (!courseData?.fileProcessed)
      return showNotification(
        'Please upload and process a DOCX file first.',
        'warning'
      );
    const code = generateCustomerReviewsCode(courseData.reviews);
    setReviewsCode(code);
    setActiveView('reviews');
    showNotification('Customer Reviews HTML generated successfully!');
    persistState({ reviewsCode: code, activeView: 'reviews' });
  };

  const handleGenerateIdealFormat = () => {
    if (!courseData?.fileProcessed)
      return showNotification(
        'Please upload and process a DOCX file first.',
        'warning'
      );
    const code = generateIdealTrainingFormatCode(
      courseData.idealTrainingFormat
    );
    setTrainingFormatCode(code);
    setActiveView('trainingformat');
    showNotification('Ideal Training Format HTML generated successfully!');
    persistState({ trainingFormatCode: code, activeView: 'trainingformat' });
  };

  const handleGenerateROI = () => {
    if (!courseData?.fileProcessed)
      return showNotification(
        'Please upload and process a DOCX file first.',
        'warning'
      );
    const code = generateROICode(courseData.courseTitle);
    setRoiCode(code);
    setActiveView('roi');
    showNotification(
      'ROI of Online Safety Training HTML generated successfully!'
    );
    persistState({ roiCode: code, activeView: 'roi' });
  };

  const handleGenerateShortDesc = () => {
    if (!courseData?.fileProcessed)
      return showNotification(
        'Please upload and process a DOCX file first.',
        'warning'
      );
    const code = generateFeatureImageCode(courseData.shortDescAndFeatureImage);
    setFeatureImageCode(code);
    setActiveView('shortdesc');
    showNotification('Short Description & Image HTML generated successfully!');
    persistState({ featureImageCode: code, activeView: 'shortdesc' });
  };

  const handleGenerateRecommended = () => {
    if (!courseData?.fileProcessed)
      return showNotification(
        'Please upload and process a DOCX file first.',
        'warning'
      );
    const code = generateRecommendedCoursesCode(courseData.recommendedCourses);
    setRecommendedCoursesCode(code);
    setActiveView('recommended');
    showNotification('Recommended Courses HTML generated successfully!');
    persistState({ recommendedCoursesCode: code, activeView: 'recommended' });
  };

  const handleGenerateMetaDetails = () => {
    if (!courseData?.fileProcessed)
      return showNotification(
        'Please upload and process a DOCX file first.',
        'warning'
      );
    const details = courseData.metaDetails || {};
    const text = `ONLINE COURSE
Meta Title: ${details.onlineMetaTitle || ''}
Meta Description: ${details.onlineMetaDesc || ''}

DEMO COURSE
Meta Title: ${details.demoMetaTitle || ''}
Meta Description: ${details.demoMetaDesc || ''}

TAGS
Industry: ${details.industry || ''}
Regulation: ${details.regulation || ''}
Role: ${details.role || ''}`;
    setMetaDetailsCode(text);
    setActiveView('metadetails');
    showNotification('Meta Details compiled successfully!');
    persistState({ metaDetailsCode: text, activeView: 'metadetails' });
  };

  const updateAnnouncementCode = (linkVal) => {
    const titleUpper = (
      courseData?.courseTitle ||
      courseName ||
      ''
    ).toUpperCase();
    const l = linkVal === undefined ? announcementLink : linkVal;

    // Wrapped in anchor tag if it exists: e.g. <a href="LINK">TITLE</a> otherwise <a href="">TITLE</a>
    const code = `<div class="announcement-banner">New Course Released: <a href="${l || ''}">${titleUpper}</a></div>`;
    setAnnouncementCode(code);
    persistState({ announcementCode: code, announcementLink: l });
  };

  const handleGenerateAnnouncement = () => {
    if (!courseData?.fileProcessed)
      return showNotification(
        'Please upload and process a DOCX file first.',
        'warning'
      );
    updateAnnouncementCode(announcementLink);
    setActiveView('announcement');
    showNotification('Announcement HTML generated successfully!');
  };

  const downloadDemoFile = () => {
    performAction(
      () => {
        const link = document.createElement('a');
        link.href =
          'https://gyglsbmpxopaoeljoofp.supabase.co/storage/v1/object/public/media/library/1782908044936-website_content_sample.docx';
        link.download = 'website_content_sample.docx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      { type: 'download', name: 'Demo Course File' }
    );
  };

  const openPreview = (content, title) => {
    setPreviewContent(content);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  const copyToClipboard = (text) => {
    performAction(
      () => {
        navigator.clipboard.writeText(text);
      },
      { type: 'copy', name: 'Course Code' }
    );
  };

  const handleRestore = (state) => {
    if (!state) return;
    setCourseName(state.courseName || '');
    setCourseData(state.courseData || null);
    setOverviewCode(state.overviewCode || '');
    setObjectivesCode(state.objectivesCode || '');
    setSyllabusCode(state.syllabusCode || '');
    setFaqCode(state.faqCode || '');
    setMainPointsCode(state.mainPointsCode || '');
    setReviewsCode(state.reviewsCode || '');
    setTrainingFormatCode(state.trainingFormatCode || '');
    setRoiCode(state.roiCode || '');
    setFeatureImageCode(state.featureImageCode || '');
    setRecommendedCoursesCode(state.recommendedCoursesCode || '');
    setMetaDetailsCode(state.metaDetailsCode || '');
    setAnnouncementLink(state.announcementLink || '');
    setAnnouncementCode(state.announcementCode || '');
    setMediaUrl(state.mediaUrl || '');
    setRestoredFileName(state.fileName || '');
    if (state.activeView) setActiveView(state.activeView);
    showNotification('Identity session synchronized', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 border-primary/20 hover:bg-primary/5 transition-all shadow-sm"
            >
              <History className="h-4 w-4 text-primary" /> Neural Sync History
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full sm:max-w-[50%] p-0 glass-panel-deep border-l border-border animate-in slide-in-from-right duration-500 z-[200]"
          >
            <SheetHeader className="p-8 border-b border-border/50 bg-muted/20">
              <SheetTitle className="flex items-center gap-3 text-sm font-black">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <History className="h-5 w-5 text-primary" />
                </div>
                Neural Sync Hub
              </SheetTitle>
            </SheetHeader>
            <HistoryList
              toolType="course_generator"
              onRestore={handleRestore}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Controls */}
        <div className="space-y-6">
          {/* Upload Card */}
          <Card className="card">
            <CardHeader className="card-header">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-warning" />
                Upload DOCX File
              </CardTitle>
            </CardHeader>
            <CardContent className="card-body space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courseName">Course Name</Label>
                <Input
                  id="courseName"
                  placeholder="Enter course name (e.g., Swing Stage Scaffold Training)"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Download our demo file to check the required structure. Create
                  your course file following the same format, then upload for
                  easy website content code generation.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadDemoFile}
                  className="btn"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Download Demo Course File
                </Button>
              </div>

              <div className="space-y-4">
                <div
                  className="file-upload-area p-8 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload DOCX file
                  </p>
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="text-xs text-muted-foreground mt-1 text-center font-medium italic">
                  {file
                    ? `Selected: ${file.name}`
                    : restoredFileName
                      ? `Identity Restored: ${restoredFileName}`
                      : 'No file selected'}
                </div>

                {/* Media URL - Integration */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground pl-1">
                    Overview Media (Optional)
                  </Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Vimeo/YouTube URL or image path"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      className="form-control text-xs"
                    />
                    <p className="text-[9px] text-muted-foreground italic pl-1">
                      Auto-detects video or image based on URL. Leave empty to
                      skip.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <ProgressButton
                    onClick={handleUpload}
                    isLoading={isProcessing}
                    progress={progress}
                    disabled={!file || !courseName}
                    label="Process and Prepare Course"
                    loadingLabel={progressText || 'Processing'}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-[0.98]"
                    variant="default"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card - Hidden until processed */}
          {courseData && (
            <Card className="card animate-in fade-in slide-in-from-top-4 duration-500">
              <CardHeader className="card-header">
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-info" />
                  Generate HTML Content
                </CardTitle>
              </CardHeader>
              <CardContent className="card-body">
                {/* Course Info */}
                {courseData?.fileProcessed && (
                  <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-lg bg-muted/40 border">
                    <div className="text-center">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                        Cost
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {courseData.courseCost || '—'}
                      </p>
                    </div>
                    <div className="text-center border-x">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                        Hours
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {courseData.courseHours || '—'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                        CEU
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {courseData.courseCEU || '—'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={handleGenerateMainPoints}
                    className="btn bg-purple-600 hover:bg-purple-700 text-white h-11 rounded-xl font-medium text-sm"
                  >
                    <Code className="mr-2 h-4 w-4" /> Main Points
                  </Button>
                  <Button
                    onClick={handleGenerateOverview}
                    className="btn bg-green-600 hover:bg-green-700 text-white h-11 rounded-xl font-medium text-sm"
                  >
                    <Code className="mr-2 h-4 w-4" /> Generate Overview
                  </Button>
                  <Button
                    onClick={handleGenerateObjectives}
                    className="btn bg-green-600 hover:bg-green-700 text-white h-11 rounded-xl font-medium text-sm"
                  >
                    <Code className="mr-2 h-4 w-4" /> Course Objectives
                  </Button>
                  <Button
                    onClick={handleGenerateSyllabus}
                    className="btn bg-green-600 hover:bg-green-700 text-white h-11 rounded-xl font-medium text-sm"
                  >
                    <Code className="mr-2 h-4 w-4" /> Generate Syllabus
                  </Button>
                  <Button
                    onClick={handleGenerateFAQ}
                    className="btn bg-green-600 hover:bg-green-700 text-white h-11 rounded-xl font-medium text-sm"
                  >
                    <Code className="mr-2 h-4 w-4" /> Generate FAQ
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extracted Sections Preview — shown as direct text after processing */}
          {courseData?.fileProcessed && (
            <Card className="card animate-in fade-in slide-in-from-top-4 duration-500">
              <CardHeader className="card-header pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Extracted Course Details
                </CardTitle>
              </CardHeader>
              <CardContent className="card-body space-y-5">
                {/* ── Customer Reviews ── */}
                {courseData.reviews?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                      <MessageSquare className="h-3.5 w-3.5" /> Customer Reviews
                    </h4>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {courseData.reviews.map((r, i) => {
                        const isFullyCopied =
                          copiedReviewParts[i]?.name &&
                          copiedReviewParts[i]?.review;
                        const fullName = `${r.name}${r.designation ? `, ${r.designation}` : ''}`;
                        const reviewQuote = `<q>${r.review}</q>`;

                        return (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border transition-all duration-300 ${
                              isFullyCopied
                                ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/30'
                                : 'bg-muted/40 border-border/50'
                            }`}
                          >
                            <blockquote className="text-xs italic text-foreground/90 border-l-2 border-amber-500 pl-3 mb-2">
                              <q>{r.review}</q>
                            </blockquote>
                            <p className="text-[10px] text-muted-foreground mb-3">
                              — <strong>{r.name}</strong>
                              {r.designation ? `, ${r.designation}` : ''}
                            </p>
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                              <Button
                                size="sm"
                                variant={
                                  copiedReviewParts[i]?.name
                                    ? 'default'
                                    : 'outline'
                                }
                                className={`h-6 text-[10px] px-2 ${copiedReviewParts[i]?.name ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                                onClick={() => {
                                  copyToClipboard(fullName);
                                  setCopiedReviewParts((prev) => ({
                                    ...prev,
                                    [i]: { ...prev[i], name: true },
                                  }));
                                }}
                              >
                                {copiedReviewParts[i]?.name ? (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                ) : (
                                  <Copy className="h-3 w-3 mr-1" />
                                )}
                                Copy Name
                              </Button>
                              <Button
                                size="sm"
                                variant={
                                  copiedReviewParts[i]?.review
                                    ? 'default'
                                    : 'outline'
                                }
                                className={`h-6 text-[10px] px-2 ${copiedReviewParts[i]?.review ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                                onClick={() => {
                                  copyToClipboard(reviewQuote);
                                  setCopiedReviewParts((prev) => ({
                                    ...prev,
                                    [i]: { ...prev[i], review: true },
                                  }));
                                }}
                              >
                                {copiedReviewParts[i]?.review ? (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                ) : (
                                  <Copy className="h-3 w-3 mr-1" />
                                )}
                                Copy &lt;q&gt;
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Ideal Training Format ── */}
                {courseData.idealTrainingFormat && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Layers className="h-3.5 w-3.5" /> Your Ideal Training
                      Format
                    </h4>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-xs">
                        <tbody>
                          <tr className="border-b bg-muted/30">
                            <td className="px-3 py-2 font-semibold">
                              SCORM Package
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-primary">
                              {courseData.idealTrainingFormat.scormPackage}
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="px-3 py-2 font-semibold">
                              Online On-Demand
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-primary">
                              {courseData.idealTrainingFormat.onlineOnDemand}
                            </td>
                          </tr>
                          <tr className="border-b bg-muted/30">
                            <td className="px-3 py-2 font-semibold">
                              Virtual Instructor-Led
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-primary">
                              {
                                courseData.idealTrainingFormat
                                  .virtualInstructorLed
                              }
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-semibold">
                              Client-Site In-Person
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-primary">
                              {
                                courseData.idealTrainingFormat
                                  .clientSiteInPerson
                              }
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── ROI of Online Safety Training ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <LineChart className="h-3.5 w-3.5" /> The ROI of Online
                      Safety Training
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[10px]"
                      onClick={() =>
                        copyToClipboard(
                          '<p>Discover the value of our efficient alternative to live training and calculate your return on investment.</p>'
                        )
                      }
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy HTML
                    </Button>
                  </div>
                  <p className="text-xs text-foreground/80 p-3 rounded-lg bg-muted/40 border">
                    Discover the value of our efficient alternative to live
                    training and calculate your return on investment.
                  </p>
                </div>

                {/* ── Short Description & Feature Image ── */}
                {courseData.shortDescAndFeatureImage && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <FileImage className="h-3.5 w-3.5" /> Short Description
                        & Feature Image
                      </h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[10px]"
                        onClick={() =>
                          copyToClipboard(
                            courseData.shortDescAndFeatureImage.shortDescription
                          )
                        }
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy Desc
                      </Button>
                    </div>
                    <div className="space-y-2 p-3 rounded-lg bg-muted/40 border">
                      <p className="text-xs text-foreground/80">
                        {courseData.shortDescAndFeatureImage.shortDescription}
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed text-[10px]">
                        <div>
                          <span className="text-muted-foreground font-bold">
                            File #:
                          </span>{' '}
                          <span className="text-primary font-semibold">
                            {
                              courseData.shortDescAndFeatureImage
                                .featureImageFileNum
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-bold">
                            Title:
                          </span>{' '}
                          <span className="text-primary font-semibold">
                            {courseData.shortDescAndFeatureImage.imageTitle}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground font-bold">
                            Alt Text:
                          </span>{' '}
                          <span className="text-primary font-semibold">
                            {courseData.shortDescAndFeatureImage.altText}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Recommended Courses ── */}
                {courseData.recommendedCourses?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Award className="h-3.5 w-3.5" /> Recommended Courses
                    </h4>
                    <ul className="space-y-1 p-3 rounded-lg bg-muted/40 border">
                      {courseData.recommendedCourses.map((c, i) => (
                        <li
                          key={i}
                          className="text-xs text-foreground/80 flex items-start gap-1.5"
                        >
                          <span className="text-amber-500 mt-0.5">•</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ── Meta Details ── */}
                {courseData.metaDetails && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Globe className="h-3.5 w-3.5" /> Meta Details
                    </h4>
                    <div className="space-y-3 p-3 rounded-lg bg-muted/40 border text-[10px]">
                      {/* Online Course Section */}
                      <div className="space-y-1">
                        <p className="font-black text-muted-foreground uppercase tracking-wider mb-1">
                          Online Course
                        </p>

                        <div className="relative group p-1.5 rounded hover:bg-background/80 transition-colors pr-10 border border-transparent hover:border-border/60">
                          <span className="font-bold text-muted-foreground">
                            Meta Title:
                          </span>{' '}
                          <span className="text-foreground/90">
                            {courseData.metaDetails.onlineMetaTitle}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 absolute right-[5px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy Meta Title"
                            onClick={() =>
                              copyToClipboard(
                                courseData.metaDetails.onlineMetaTitle
                              )
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="relative group p-1.5 rounded hover:bg-background/80 transition-colors pr-10 border border-transparent hover:border-border/60">
                          <span className="font-bold text-muted-foreground">
                            Meta Desc:
                          </span>{' '}
                          <span className="text-foreground/90">
                            {courseData.metaDetails.onlineMetaDesc}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 absolute right-[5px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy Meta Description"
                            onClick={() =>
                              copyToClipboard(
                                courseData.metaDetails.onlineMetaDesc
                              )
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Demo Course Section */}
                      <div className="border-t border-dashed pt-2 space-y-1">
                        <p className="font-black text-muted-foreground uppercase tracking-wider mb-1">
                          Demo Course
                        </p>

                        <div className="relative group p-1.5 rounded hover:bg-background/80 transition-colors pr-10 border border-transparent hover:border-border/60">
                          <span className="font-bold text-muted-foreground">
                            Meta Title:
                          </span>{' '}
                          <span className="text-foreground/90">
                            {courseData.metaDetails.demoMetaTitle}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 absolute right-[5px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy Meta Title"
                            onClick={() =>
                              copyToClipboard(
                                courseData.metaDetails.demoMetaTitle
                              )
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="relative group p-1.5 rounded hover:bg-background/80 transition-colors pr-10 border border-transparent hover:border-border/60">
                          <span className="font-bold text-muted-foreground">
                            Meta Desc:
                          </span>{' '}
                          <span className="text-foreground/90">
                            {courseData.metaDetails.demoMetaDesc}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 absolute right-[5px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy Meta Description"
                            onClick={() =>
                              copyToClipboard(
                                courseData.metaDetails.demoMetaDesc
                              )
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Tags Section */}
                      <div className="border-t border-dashed pt-2 space-y-1">
                        <p className="font-black text-muted-foreground uppercase tracking-wider mb-1">
                          Tags
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {courseData.metaDetails.industry && (
                            <div className="relative group p-1 rounded hover:bg-background/80 transition-colors pr-10 border border-transparent hover:border-border/60 flex items-center justify-between">
                              <span>
                                <span className="font-bold text-muted-foreground">
                                  Industry:
                                </span>{' '}
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-medium">
                                  {courseData.metaDetails.industry}
                                </span>
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 absolute right-[5px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy Industry Tag"
                                onClick={() =>
                                  copyToClipboard(
                                    courseData.metaDetails.industry
                                  )
                                }
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {courseData.metaDetails.regulation && (
                            <div className="relative group p-1 rounded hover:bg-background/80 transition-colors pr-10 border border-transparent hover:border-border/60 flex items-center justify-between">
                              <span>
                                <span className="font-bold text-muted-foreground">
                                  Regulation:
                                </span>{' '}
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-medium">
                                  {courseData.metaDetails.regulation}
                                </span>
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 absolute right-[5px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy Regulation Tag"
                                onClick={() =>
                                  copyToClipboard(
                                    courseData.metaDetails.regulation
                                  )
                                }
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {courseData.metaDetails.role && (
                            <div className="relative group p-1 rounded hover:bg-background/80 transition-colors pr-10 border border-transparent hover:border-border/60 flex items-center justify-between">
                              <span>
                                <span className="font-bold text-muted-foreground">
                                  Role:
                                </span>{' '}
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-medium">
                                  {courseData.metaDetails.role}
                                </span>
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 absolute right-[5px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy Role Tag"
                                onClick={() =>
                                  copyToClipboard(courseData.metaDetails.role)
                                }
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Announcement ── */}
                <div>
                  {(() => {
                    const title =
                      courseName ||
                      courseData.announcement ||
                      courseData.courseTitle ||
                      'Course name here';
                    const link = announcementLink || 'course link here';
                    const alertHtml = `<p class="alert alert-success m-2 small">New Course Released: <a href="${link}">${title}</a></p>`;

                    return (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" /> Announcement
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px]"
                            onClick={() => copyToClipboard(alertHtml)}
                          >
                            <Copy className="h-3 w-3 mr-1" /> Copy HTML
                          </Button>
                        </div>
                        <div className="space-y-2 p-3 rounded-lg bg-muted/40 border">
                          <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-mono break-all">
                            {alertHtml}
                          </div>
                          <Input
                            placeholder="Optional course link URL for href"
                            value={announcementLink}
                            onChange={(e) =>
                              setAnnouncementLink(e.target.value)
                            }
                            className="form-control text-xs mt-1"
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Output */}
        <div className="space-y-6">
          <div className="card bg-card border rounded-lg shadow-sm min-h-[600px] flex flex-col overflow-hidden">
            {/* Selector Buttons */}
            {mainPointsCode ||
            overviewCode ||
            objectivesCode ||
            syllabusCode ||
            faqCode ? (
              <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
                <button
                  onClick={() => setActiveView('mainpoints')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'mainpoints'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-accent text-muted-foreground'
                  }`}
                >
                  Main Points
                </button>
                <button
                  onClick={() => setActiveView('overview')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'overview'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-accent text-muted-foreground'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('objectives')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'objectives'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-accent text-muted-foreground'
                  }`}
                >
                  Objectives
                </button>
                <button
                  onClick={() => setActiveView('syllabus')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'syllabus'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-accent text-muted-foreground'
                  }`}
                >
                  Syllabus
                </button>
                <button
                  onClick={() => setActiveView('faq')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'faq'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-accent text-muted-foreground'
                  }`}
                >
                  FAQ
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10">
                <Code className="h-12 w-12 mb-4 opacity-20" />
                <h4 className="text-xl font-medium mb-2">
                  No Code Generated Yet
                </h4>
                <p className="text-sm text-center max-w-xs">
                  Upload a file and generate content to see the code here
                </p>
              </div>
            )}

            {/* Textarea Content */}
            {(mainPointsCode ||
              overviewCode ||
              objectivesCode ||
              syllabusCode ||
              faqCode) && (
              <div className="flex-1 p-4 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-2 mt-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    {activeView === 'mainpoints' && 'Main Points Code'}
                    {activeView === 'overview' && 'Overview Code'}
                    {activeView === 'objectives' && 'Course Objectives Code'}
                    {activeView === 'syllabus' && (
                      <span className="flex items-center gap-2">
                        Syllabus Code
                        {courseData?.syllabusModules && (
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-primary/10 text-[9px] font-black text-primary border border-primary/20">
                            L=
                            {courseData.syllabusModules.reduce(
                              (acc, m) => acc + (m.lessons?.length || 0),
                              0
                            )}{' '}
                            M={courseData.syllabusModules.length}
                          </span>
                        )}
                      </span>
                    )}
                    {activeView === 'faq' && 'Full FAQ HTML Code'}
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="preview-icon-btn"
                      onClick={() => {
                        const content = {
                          mainpoints: mainPointsCode,
                          overview: overviewCode,
                          objectives: objectivesCode,
                          syllabus: syllabusCode,
                          faq: faqCode,
                        }[activeView];
                        const title = {
                          mainpoints: 'Main Points',
                          overview: 'Overview',
                          objectives: 'Course Objectives',
                          syllabus: 'Syllabus',
                          faq: 'FAQ',
                        }[activeView];
                        openPreview(content, title);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" /> Preview
                    </Button>
                    <Button
                      size="sm"
                      className="copy-btn"
                      onClick={() => {
                        const content = {
                          mainpoints: mainPointsCode,
                          overview: overviewCode,
                          objectives: objectivesCode,
                          syllabus: syllabusCode,
                          faq: faqCode,
                        }[activeView];
                        copyToClipboard(content);
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy All
                    </Button>
                  </div>
                </div>

                <textarea
                  className="flex-1 w-full bg-muted/50 border rounded-md p-4 font-mono text-xs resize-none focus:outline-ring code-editor"
                  value={
                    activeView === 'mainpoints'
                      ? mainPointsCode
                      : activeView === 'overview'
                        ? overviewCode
                        : activeView === 'objectives'
                          ? objectivesCode
                          : activeView === 'syllabus'
                            ? syllabusCode
                            : activeView === 'faq'
                              ? faqCode
                              : ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (activeView === 'mainpoints') setMainPointsCode(val);
                    else if (activeView === 'overview') setOverviewCode(val);
                    else if (activeView === 'objectives')
                      setObjectivesCode(val);
                    else if (activeView === 'syllabus') setSyllabusCode(val);
                    else if (activeView === 'faq') setFaqCode(val);
                  }}
                  placeholder="Code will appear here..."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <PreviewDrawer
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={previewTitle}
        content={previewContent}
        data={activeView === 'faq' ? courseData?.faqData : null}
      />

      {/* Notification system standardized to SweetAlert2 utility */}
    </div>
  );
}

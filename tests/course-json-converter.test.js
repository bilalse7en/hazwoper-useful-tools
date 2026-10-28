import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  normalizeHtmlContent,
  wrapInLmsContainer,
  calculateTopicDuration,
  calculateWordCount,
} from '../src/lib/course-converter/html-normalizer.js';
import {
  parseQuizFromHtml,
  isQuizHeading,
  isFinalExamHeading,
} from '../src/lib/course-converter/quiz-extractor.js';
import {
  segmentLessonWiseHtml,
  segmentCourseWiseHtml,
  parseDocxDocument,
} from '../src/lib/course-converter/doc-parser.js';
import { buildCourseJson } from '../src/lib/course-converter/schema-builder.js';
import { validateCourseJson } from '../src/lib/course-converter/validator.js';
import { convertDocumentToCourseJson } from '../src/lib/course-converter/index.js';

describe('CourseJsonConverter Core Engine', () => {
  describe('HTML Normalizer (Section 5.1)', () => {
    it('strips MsoNormal classes, mso- styles, and Office XML tags', () => {
      const raw = `
        <p class="MsoNormal" style="mso-margin-top-alt:auto; line-height:115%">
          <o:p></o:p>This is a <span style="mso-spacerun:yes">test</span> sentence.
        </p>
      `;
      const clean = normalizeHtmlContent(raw);
      expect(clean).not.toContain('MsoNormal');
      expect(clean).not.toContain('mso-');
      expect(clean).not.toContain('<o:p>');
      expect(clean).toContain('This is a test sentence.');
    });

    it('preserves semantic elements: headings, lists, bold, tables', () => {
      const raw = `
        <h2 class="some-heading" style="color:red">Subheading Level 2</h2>
        <p class="text-p" style="margin:0">Paragraph with <b>bold text</b> and <i>italics</i>.</p>
        <ul class="list-bullet"><li style="font-size:14px">Item 1</li><li>Item 2</li></ul>
        <table class="grid-table" style="width:100%"><tr style="height:20px"><th class="hdr">Header</th><td style="padding:4px">Data</td></tr></table>
      `;
      const clean = normalizeHtmlContent(raw);
      expect(clean).toContain('<h2>Subheading Level 2</h2>');
      expect(clean).toContain('<strong>bold text</strong>');
      expect(clean).toContain('<em>italics</em>');
      expect(clean).toContain('<ul><li>Item 1</li><li>Item 2</li></ul>');
      expect(clean).toContain(
        '<table><tr><th>Header</th><td>Data</td></tr></table>'
      );
      expect(clean).not.toContain('class=');
      expect(clean).not.toContain('style=');
    });

    it('wraps content in strictly 1 parent div with all classes and styles stripped', () => {
      const wrapped = wrapInLmsContainer(
        '<div class="wrapper" style="padding:10px"><div class="inner"><p class="text" style="color:blue">Lesson content</p></div></div>'
      );
      expect(wrapped).toBe('<div><p>Lesson content</p></div>');
      expect(wrapped.startsWith('<div>')).toBe(true);
      expect(wrapped.endsWith('</div>')).toBe(true);
      expect((wrapped.match(/<div>/g) || []).length).toBe(1);
      expect((wrapped.match(/<\/div>/g) || []).length).toBe(1);
      expect(wrapped).not.toContain('class=');
      expect(wrapped).not.toContain('style=');
    });

    it('calculates topic reading duration based on word count with 30s minimum', () => {
      const shortText = 'A quick summary.';
      expect(calculateTopicDuration(shortText)).toBe(30);

      const hundredWords = Array(100).fill('word').join(' ');
      expect(calculateTopicDuration(hundredWords)).toBe(50); // 100 * 0.5 = 50s
    });

    it('skips images, image callouts, and #897489635 asset codes when stripImages is enabled', () => {
      const rawWithImage = `
        <p>Before topic text explaining utility service.</p>
        <p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA" alt="Substation" /></p>
        <p>[Image: High-voltage substation transformer #897489635]</p>
        <p>AI Image Prompt: Photorealistic 8K portrait view of utility switchgear</p>
        <p>Operating principles for high-voltage entrance configuration.</p>
      `;

      // When stripImages is enabled (default)
      const cleanWithoutImages = normalizeHtmlContent(rawWithImage, {
        stripImages: true,
      });
      expect(cleanWithoutImages).not.toContain('<img');
      expect(cleanWithoutImages).not.toContain('#897489635');
      expect(cleanWithoutImages).not.toContain('AI Image Prompt');
      expect(cleanWithoutImages).not.toContain('[Image:');
      expect(cleanWithoutImages).toContain(
        'Before topic text explaining utility service.'
      );
      expect(cleanWithoutImages).toContain(
        'Operating principles for high-voltage entrance configuration.'
      );

      // When stripImages is disabled (Images ON)
      const cleanWithImages = normalizeHtmlContent(rawWithImage, {
        stripImages: false,
      });
      expect(cleanWithImages).toContain('<img');
      expect(cleanWithImages).toContain('#897489635');
    });

    it('extracts image asset code #897489635 and AI prompt metadata accurately', async () => {
      const { extractImageMetadata } =
        await import('../src/lib/course-converter/html-normalizer.js');

      const sample = `
        <p>Utility service entry equipment illustration.</p>
        <p>[Image: Pad-mounted transformer #897489635]</p>
        <p>AI Image Prompt: Photorealistic 8K portrait of electrical transformer with cooling fins</p>
      `;

      const meta = extractImageMetadata(sample);
      expect(meta.primaryImageCode).toBe('#897489635');
      expect(meta.imageCodes).toContain('#897489635');
      expect(meta.primaryPrompt).toContain(
        'Photorealistic 8K portrait of electrical transformer'
      );
    });

    it('extracts FILE #: and Adobe Stock numeric codes while stripping them and Slide markers from body content', async () => {
      const {
        extractImageMetadata,
        normalizeHtmlContent,
        wrapInLmsContainer,
        purgeInitialStageArtifacts,
      } = await import('../src/lib/course-converter/html-normalizer.js');

      // Test arbitrary user numbers like FILE #: 2315646879
      const userArbitraryFile = `
        <h1>Utility Overview</h1>
        <p>FILE #: 2315646879</p>
        <p>File #: #202252558</p>
        <p>Critical safety procedures for facility operators.</p>
      `;
      const purged = purgeInitialStageArtifacts(userArbitraryFile, {
        stripImages: true,
      });
      expect(purged).not.toContain('2315646879');
      expect(purged).not.toContain('202252558');
      expect(purged).not.toContain('FILE #:');
      expect(purged).toContain(
        'Critical safety procedures for facility operators.'
      );

      const rawWithSlideAndFileCode = `
        <p><strong><img src="data:image/png;base64,iVBORw0KGgoAAA" alt="Icon" /></strong></p>
        <p><a href="https://stock.adobe.com/images/stop-symbol-3d-icon-isolated-on-white/43500089?prev_url=detail"><strong>FILE #:  43500089</strong></a></p>
        <p><strong>Slide 3 </strong></p>
        <p>The material and information presented in this training is for educational purposes only.</p>
        <p><strong>Slide 5</strong></p>
        <p><a href="https://stock.adobe.com/images/certificate-icon/271990967?prev_url=detail"><strong>FILE #: </strong> 271990967</a></p>
        <p>Participants must complete all required modules before taking the evaluation.</p>
      `;

      // 1. Verify metadata extraction
      const meta = extractImageMetadata(rawWithSlideAndFileCode);
      expect(meta.hasImages).toBe(true);
      expect(meta.primaryImageCode).toBe('#43500089');
      expect(meta.imageCodes).toContain('#43500089');
      expect(meta.imageCodes).toContain('#271990967');

      // 2. Verify HTML normalization with stripImages: true
      const cleanHtml = normalizeHtmlContent(rawWithSlideAndFileCode, {
        stripImages: true,
      });

      expect(cleanHtml).not.toContain('FILE #:');
      expect(cleanHtml).not.toContain('43500089');
      expect(cleanHtml).not.toContain('271990967');
      expect(cleanHtml).not.toContain('Slide 3');
      expect(cleanHtml).not.toContain('Slide 5');
      expect(cleanHtml).not.toContain('<img');
      expect(cleanHtml).not.toContain('stock.adobe.com');

      // 3. Verify clean educational content is preserved
      expect(cleanHtml).toContain(
        'The material and information presented in this training is for educational purposes only.'
      );
      expect(cleanHtml).toContain(
        'Participants must complete all required modules before taking the evaluation.'
      );

      // 4. Verify 1 parent div container
      const wrapped = wrapInLmsContainer(cleanHtml, { stripImages: true });
      expect(wrapped.startsWith('<div>')).toBe(true);
      expect(wrapped.endsWith('</div>')).toBe(true);
      expect((wrapped.match(/<div>/g) || []).length).toBe(1);
      expect((wrapped.match(/<\/div>/g) || []).length).toBe(1);
    });

    it('removes leading Slide prefix from content paragraphs without losing body text', () => {
      const raw = `
        <p><strong>Slide 1:</strong> Overview of safety procedures for data centers.</p>
        <p>Slide 2 - Operating requirements for high-voltage systems.</p>
      `;
      const clean = normalizeHtmlContent(raw, { stripImages: true });
      expect(clean).not.toContain('Slide 1:');
      expect(clean).not.toContain('Slide 2 -');
      expect(clean).toContain(
        'Overview of safety procedures for data centers.'
      );
      expect(clean).toContain(
        'Operating requirements for high-voltage systems.'
      );
    });
  });

  describe('Quiz Extractor', () => {
    it('identifies quiz and final exam headings accurately', () => {
      expect(isQuizHeading('Lesson Quiz')).toBe(true);
      expect(isQuizHeading('Knowledge Check')).toBe(true);
      expect(isQuizHeading('Quiz Questions')).toBe(true);
      expect(isQuizHeading('Introduction')).toBe(false);

      expect(isFinalExamHeading('Final Exam')).toBe(true);
      expect(isFinalExamHeading('Comprehensive Final Exam')).toBe(true);
      expect(isFinalExamHeading('Lesson Quiz')).toBe(false);
    });

    it('parses multiple choice questions with inline (correct) markers and explanations', () => {
      const quizHtml = `
        <h3>Question 1</h3>
        <p>What is the voltage of standard low-voltage utility service?</p>
        <p>A. 120V / 208V (correct)</p>
        <p>B. 500kV</p>
        <p>C. 13.8kV</p>
        <p>D. 480kV</p>
        <p>Explanation: 120/208V is a standard low-voltage distribution service in North America.</p>
      `;
      const parsed = parseQuizFromHtml(quizHtml);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].question_id).toBe('q1');
      expect(parsed[0].question).toBe(
        'What is the voltage of standard low-voltage utility service?'
      );
      expect(parsed[0].options).toHaveLength(4);
      expect(parsed[0].correct_answer).toBe('A');
      expect(parsed[0].options[0].label).toBe('120V / 208V');
      expect(parsed[0].explanation).toContain(
        '120/208V is a standard low-voltage distribution service'
      );
    });

    it('parses questions with separate "Answer: C" and "Rationale: ..."', () => {
      const quizHtml = `
        <p>Question 2: Which standard governs general industry electrical safety?</p>
        <p>A. OSHA 1926 Subpart K</p>
        <p>B. NFPA 101</p>
        <p>C. OSHA 29 CFR 1910 Subpart S</p>
        <p>D. EPA Section 608</p>
        <p>Answer: C</p>
        <p>Rationale: Subpart S specifically governs electrical safety for general industry.</p>
      `;
      const parsed = parseQuizFromHtml(quizHtml);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].correct_answer).toBe('C');
      expect(parsed[0].explanation).toContain(
        'Subpart S specifically governs electrical safety'
      );
    });
  });

  describe('Document Parser & Schema Builder (End-to-End)', () => {
    it('accurately parses reference docx and matches reference schema structure', async () => {
      const docxPath =
        'C:/Users/User/Desktop/Lesson 1_Utility Power Entry and Service Configuration.docx';
      if (!fs.existsSync(docxPath)) return;

      const buf = fs.readFileSync(docxPath);
      const { courseJson, validation } = await convertDocumentToCourseJson(
        buf,
        {
          fileName: 'Lesson 1.docx',
          mode: 'A',
        }
      );

      expect(courseJson.course_id).toBe('course_1');
      expect(courseJson.course_title).toBe(
        'Power Systems & Electrical Fundamentals'
      );
      expect(courseJson.total_modules).toBe(1);
      expect(courseJson.total_topics).toBe(10);
      expect(courseJson.modules[0].lessons[0].topics).toHaveLength(10);
      expect(courseJson.modules[0].lessons[0].knowledge_check).toHaveLength(6);

      // Duration checks
      expect(courseJson.duration.basis).toBe('reading');
      expect(courseJson.duration.knowledge_check_seconds).toBe(360);
      expect(courseJson.duration.slides_seconds).toBeGreaterThan(800);
      expect(courseJson.duration.total_seconds).toBe(
        courseJson.duration.slides_seconds +
          courseJson.duration.knowledge_check_seconds
      );

      // Validation suite
      expect(validation.isValid).toBe(true);
      expect(validation.score).toBe(100);
      expect(validation.summary.errors).toBe(0);
      expect(validation.summary.warnings).toBe(0);
    });

    it('supports Course-wise conversion Mode B with multiple modules and final exam', () => {
      const mockHtml = [
        '<h1>Course: Advanced HAZWOPER Specialist</h1>',
        '<h2>Module 1: Chemical Safety</h2>',
        '<h2>Lesson 1: Toxic Gases</h2>',
        '<h1>Properties of Chlorine</h1>',
        '<p>Chlorine is a yellowish-green gas with a pungent odor.</p>',
        '<h1>Handling Chlorine Cylinders</h1>',
        '<p>Always keep cylinders upright and secured with chains.</p>',
        '<h1>Lesson Quiz</h1>',
        '<h3>Question 1</h3>',
        '<p>What is the primary color of chlorine gas?</p>',
        '<p>A. Clear</p>',
        '<p>B. Yellowish-green (correct)</p>',
        '<p>C. Bright blue</p>',
        '<p>D. Dark red</p>',
        '<p>Explanation: Chlorine is characteristically yellowish-green.</p>',
        '<h2>Module 2: Emergency Response</h2>',
        '<h2>Lesson 1: Incident Command</h2>',
        '<h1>First 15 Minutes on Scene</h1>',
        '<p>Establish unified command and secure the perimeter.</p>',
        '<h1>Lesson Quiz</h1>',
        '<h3>Question 1</h3>',
        '<p>What is the first action upon arriving at a hazmat scene?</p>',
        '<p>A. Immediately enter hot zone</p>',
        '<p>B. Establish command and secure the perimeter (correct)</p>',
        '<p>Explanation: First priority is command and scene control.</p>',
        '<h1>Final Exam</h1>',
        '<h3>Question 1</h3>',
        '<p>Under OSHA 1910.120, who holds ultimate authority on-scene?</p>',
        '<p>A. The Incident Commander (correct)</p>',
        '<p>B. The Safety Officer</p>',
        '<p>C. The local mayor</p>',
        '<p>D. Any trained technician</p>',
        '<p>Explanation: Incident Commander has ultimate authority.</p>',
      ].join('\n');

      const parsed = segmentCourseWiseHtml(mockHtml);
      const courseJson = buildCourseJson(parsed);
      const validation = validateCourseJson(courseJson);

      expect(courseJson.course_title).toBe('Advanced HAZWOPER Specialist');
      expect(courseJson.total_modules).toBe(2);
      expect(courseJson.total_topics).toBe(3);
      expect(courseJson.final_exam).toBeDefined();
      expect(courseJson.final_exam.questions).toHaveLength(1);
      expect(validation.isValid).toBe(true);
      expect(validation.score).toBe(100);
    });

    it('honors includeQuizzes: false by omitting quizzes and final exam completely from Course JSON', () => {
      const mockHtml = [
        '<h1>Course: Clean Topics Only Course</h1>',
        '<h2>Module 1: General Safety</h2>',
        '<h2>Lesson 1: Introduction</h2>',
        '<h1>Hazard Identification</h1>',
        '<p>Learn to spot hazards on the job site.</p>',
        '<h1>Lesson Quiz</h1>',
        '<h3>Question 1</h3>',
        '<p>What is a hazard?</p>',
        '<p>A. A safe condition</p>',
        '<p>B. A potential source of harm (correct)</p>',
        '<h1>Final Exam</h1>',
        '<h3>Question 1</h3>',
        '<p>What is OSHA?</p>',
        '<p>A. Safety administration (correct)</p>',
        '<p>B. Tax agency</p>',
      ].join('\n');

      // Segment with includeQuizzes: false
      const parsedWithoutQuizzes = segmentCourseWiseHtml(
        mockHtml,
        {},
        { includeQuizzes: false }
      );
      const courseJson = buildCourseJson(parsedWithoutQuizzes, {
        includeQuizzes: false,
      });
      const validation = validateCourseJson(courseJson);

      expect(courseJson.duration.knowledge_check_seconds).toBe(0);
      expect(courseJson.duration.final_exam_seconds).toBe(0);
      expect(courseJson.final_exam).toBeFalsy();
      courseJson.modules.forEach((mod) => {
        mod.lessons.forEach((les) => {
          expect(les.knowledge_check).toHaveLength(0);
          expect(les.has_assessment_after).toBe(false);
        });
      });
      expect(validation.isValid).toBe(true);
      expect(validation.score).toBe(100);
    });
  });

  describe('Course Folder Ingestion & Sequential Hierarchy Builder', () => {
    it('accurately normalizes module and lesson titles with underscore formatting', async () => {
      const { formatHierarchyTitle } =
        await import('../src/lib/course-converter/folder-converter.js');
      expect(
        formatHierarchyTitle(
          'Module 1_Utility Interconnection & Distribution',
          'module'
        )
      ).toBe('Module 1: Utility Interconnection & Distribution');

      expect(
        formatHierarchyTitle('Module 2_Transformers & Switchgear', 'module')
      ).toBe('Module 2: Transformers & Switchgear');

      expect(
        formatHierarchyTitle(
          'Module 3_UPS Systems Design & Operations',
          'module'
        )
      ).toBe('Module 3: UPS Systems Design & Operations');

      expect(
        formatHierarchyTitle(
          'Lesson 1_Utility Power Entry and Service Configuration.docx',
          'lesson'
        )
      ).toBe('Lesson 1: Utility Power Entry and Service Configuration');

      expect(
        formatHierarchyTitle(
          'Lesson 5_Transformer Cooling^J Protection, and Efficiency.docx',
          'lesson'
        )
      ).toBe('Lesson 5: Transformer Cooling, Protection, and Efficiency');
    });

    it('strictly enforces Lesson 1: Lesson 2: prefix via ensureLessonNumberPrefix', async () => {
      const { ensureLessonNumberPrefix } =
        await import('../src/lib/course-converter/folder-converter.js');

      expect(
        ensureLessonNumberPrefix(
          'Utility Power Entry and Service Configuration',
          1
        )
      ).toBe('Lesson 1: Utility Power Entry and Service Configuration');

      expect(ensureLessonNumberPrefix('Lesson 1_Utility Power Entry', 1)).toBe(
        'Lesson 1: Utility Power Entry'
      );

      expect(
        ensureLessonNumberPrefix(
          'Transformer Types and Operating Principles',
          2
        )
      ).toBe('Lesson 2: Transformer Types and Operating Principles');

      expect(ensureLessonNumberPrefix('Lesson 4: Transformer Types', 4)).toBe(
        'Lesson 4: Transformer Types'
      );
    });

    it('strictly omits image codes, image URLs, and sets slide_type to content when stripImages is enabled', async () => {
      const { segmentLessonWiseHtml } =
        await import('../src/lib/course-converter/doc-parser.js');

      const htmlWithImage = `
        <p>Lesson 1: Utility Power Entry and Service Configuration</p>
        <h1>Utility Service Entrance Fundamentals</h1>
        <p><a href="https://stock.adobe.com/images/.../202252558"><strong>FILE #: </strong> 202252558</a></p>
        <p><strong>Slide 3</strong></p>
        <p>Electric power enters through the service entrance.</p>
      `;

      const parsed = segmentLessonWiseHtml(
        htmlWithImage,
        {
          courseTitle: 'Power Systems',
          lessonTitle:
            'Lesson 1: Utility Power Entry and Service Configuration',
        },
        { stripImages: true }
      );

      expect(parsed.topics).toHaveLength(1);
      const top = parsed.topics[0];
      expect(top.image_source).toBe('');
      expect(top.image_code).toBe('');
      expect(top.image_prompt).toBe('');
      expect(top.has_embedded_image).toBe(false);
      expect(top.slide_type).toBe('image');
      expect(top.leftDiv.image.isImage).toBe(false);
      expect(top.leftDiv.image.imageURL).toBe('');
      expect(top.leftDiv.editorHtml).not.toContain('202252558');
      expect(top.leftDiv.editorHtml).not.toContain('Slide 3');
      expect(top.leftDiv.editorHtml).toContain(
        'Electric power enters through the service entrance.'
      );
    });

    it('organizes uploaded course folder into sequenced 3-module 11-lesson hierarchy', async () => {
      const { groupFilesByCourseHierarchy } =
        await import('../src/lib/course-converter/folder-converter.js');

      const mockFolderItems = [
        // Module 1 (3 lessons)
        {
          relativePath:
            'Power Systems/Module 1_Utility Interconnection & Distribution/Lesson 1_Utility Power Entry and Service Configuration.docx',
        },
        {
          relativePath:
            'Power Systems/Module 1_Utility Interconnection & Distribution/Lesson 3_Distribution Resilience and Backup Power Integration.docx',
        },
        {
          relativePath:
            'Power Systems/Module 1_Utility Interconnection & Distribution/Lesson 2_Main Distribution Pathways and Topologies.docx',
        },

        // Module 2 (4 lessons)
        {
          relativePath:
            'Power Systems/Module 2_Transformers & Switchgear/Lesson 4_Transformer Types and Operating Principles.docx',
        },
        {
          relativePath:
            'Power Systems/Module 2_Transformers & Switchgear/Lesson 6_Medium-Voltage Switchgear and Breaker Topologies.docx',
        },
        {
          relativePath:
            'Power Systems/Module 2_Transformers & Switchgear/Lesson 5_Transformer Cooling^J Protection, and Efficiency.docx',
        },
        {
          relativePath:
            'Power Systems/Module 2_Transformers & Switchgear/Lesson 7_Switchgear Maintenance and Operational Safety.docx',
        },

        // Module 3 (4 lessons)
        {
          relativePath:
            'Power Systems/Module 3_UPS Systems Design & Operations/Lesson 10_UPS Battery Maintenance and Safety Standards.docx',
        },
        {
          relativePath:
            'Power Systems/Module 3_UPS Systems Design & Operations/Lesson 8_UPS Topology and Architecture in Critical Facilities.docx',
        },
        {
          relativePath:
            'Power Systems/Module 3_UPS Systems Design & Operations/Lesson 9_UPS Battery Chemistry and Energy Storage.docx',
        },
        {
          relativePath:
            'Power Systems/Module 3_UPS Systems Design & Operations/Lesson 12_UPS Efficiency and Thermal Management.docx',
        },
      ];

      const hierarchy = groupFilesByCourseHierarchy(mockFolderItems);

      expect(hierarchy.courseTitle).toBe('Power Systems');
      expect(hierarchy.totalFiles).toBe(11);
      expect(hierarchy.modules).toHaveLength(3);

      // Verify Module 1 ordering and lessons
      expect(hierarchy.modules[0].moduleTitle).toBe(
        'Module 1: Utility Interconnection & Distribution'
      );
      expect(hierarchy.modules[0].lessons).toHaveLength(3);
      expect(hierarchy.modules[0].lessons.map((l) => l.lessonNumber)).toEqual([
        1, 2, 3,
      ]);

      // Verify Module 2 ordering and lessons
      expect(hierarchy.modules[1].moduleTitle).toBe(
        'Module 2: Transformers & Switchgear'
      );
      expect(hierarchy.modules[1].lessons).toHaveLength(4);
      expect(hierarchy.modules[1].lessons.map((l) => l.lessonNumber)).toEqual([
        4, 5, 6, 7,
      ]);

      // Verify Module 3 ordering and lessons
      expect(hierarchy.modules[2].moduleTitle).toBe(
        'Module 3: UPS Systems Design & Operations'
      );
      expect(hierarchy.modules[2].lessons).toHaveLength(4);
      expect(hierarchy.modules[2].lessons.map((l) => l.lessonNumber)).toEqual([
        8, 9, 10, 12,
      ]);
    });

    it('sequentially converts a multi-module course folder with live progress reporting', async () => {
      const { Document, Paragraph, HeadingLevel, Packer } =
        await import('docx');
      const { convertCourseFolderSequentially } =
        await import('../src/lib/course-converter/folder-converter.js');

      // Helper to generate a minimal docx buffer with topics and a quiz
      async function createTestDocx(lessonTitle, topicTitle, questionText) {
        const doc = new Document({
          sections: [
            {
              children: [
                new Paragraph({
                  text: lessonTitle,
                  heading: HeadingLevel.TITLE,
                }),
                new Paragraph({
                  text: topicTitle,
                  heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                  text: 'This is the instructional content for ' + topicTitle,
                }),
                new Paragraph({
                  text: 'Lesson Quiz',
                  heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                  text: questionText,
                  heading: HeadingLevel.HEADING_3,
                }),
                new Paragraph({ text: 'A. Correct Option (correct)' }),
                new Paragraph({ text: 'B. Distractor Option' }),
                new Paragraph({ text: 'Explanation: Test explanation.' }),
              ],
            },
          ],
        });
        return await Packer.toBuffer(doc);
      }

      const buf1 = await createTestDocx(
        'Lesson 1: Utility Power Entry and Service Configuration',
        'Utility Service Entrance Fundamentals',
        'Question 1: What is the service entrance?'
      );
      const buf2 = await createTestDocx(
        'Lesson 2: Main Distribution Pathways and Topologies',
        'Main Switchboard Distribution',
        'Question 1: What is switchboard topology?'
      );
      const buf3 = await createTestDocx(
        'Lesson 4: Transformer Types and Operating Principles',
        'Step-Down Transformers',
        'Question 1: How does a transformer step down voltage?'
      );

      const mockHierarchy = {
        courseTitle: 'Power Systems & Electrical Fundamentals',
        modules: [
          {
            moduleNumber: 1,
            moduleTitle: 'Module 1: Utility Interconnection & Distribution',
            lessons: [
              {
                fileName: 'Lesson 1_Utility Power Entry.docx',
                lessonNumber: 1,
                lessonTitle:
                  'Lesson 1: Utility Power Entry and Service Configuration',
                file: { name: 'Lesson 1.docx', buffer: buf1 },
              },
              {
                fileName: 'Lesson 2_Main Distribution.docx',
                lessonNumber: 2,
                lessonTitle:
                  'Lesson 2: Main Distribution Pathways and Topologies',
                file: { name: 'Lesson 2.docx', buffer: buf2 },
              },
            ],
          },
          {
            moduleNumber: 2,
            moduleTitle: 'Module 2: Transformers & Switchgear',
            lessons: [
              {
                fileName: 'Lesson 4_Transformer Types.docx',
                lessonNumber: 4,
                lessonTitle:
                  'Lesson 4: Transformer Types and Operating Principles',
                file: { name: 'Lesson 4.docx', buffer: buf3 },
              },
            ],
          },
        ],
      };

      const progressSteps = [];
      const result = await convertCourseFolderSequentially(
        mockHierarchy,
        { course_id: 'course_power_systems' },
        (p) => progressSteps.push(p)
      );

      expect(progressSteps.length).toBe(3);
      expect(progressSteps[0].current).toBe(1);
      expect(progressSteps[0].total).toBe(3);
      expect(progressSteps[2].percent).toBe(100);

      // Verify Course JSON output
      const { courseJson, validation } = result;
      expect(courseJson.course_id).toBe('course_power_systems');
      expect(courseJson.course_title).toBe(
        'Power Systems & Electrical Fundamentals'
      );
      expect(courseJson.total_modules).toBe(2);
      expect(courseJson.total_topics).toBe(3);

      // Verify Module 1
      expect(courseJson.modules[0].module_id).toBe('mod_1');
      expect(courseJson.modules[0].lessons).toHaveLength(2);
      expect(courseJson.modules[0].lessons[0].lesson_id).toBe('les_1_1');
      expect(courseJson.modules[0].lessons[0].topics).toHaveLength(1);
      expect(courseJson.modules[0].lessons[0].knowledge_check).toHaveLength(1);
      expect(courseJson.modules[0].lessons[1].lesson_id).toBe('les_1_2');

      // Verify Module 2
      expect(courseJson.modules[1].module_id).toBe('mod_2');
      expect(courseJson.modules[1].lessons).toHaveLength(1);
      expect(courseJson.modules[1].lessons[0].lesson_id).toBe('les_2_3');
      expect(courseJson.modules[1].lessons[0].lesson_title).toContain(
        'Lesson 3:'
      );

      // Verify Durations
      expect(courseJson.duration.lessons).toHaveLength(3);
      expect(courseJson.total_duration_seconds).toBeGreaterThan(0);

      // Verify clean topic content without base64 or raw_body_content leakage
      courseJson.modules.forEach((mod) => {
        mod.lessons.forEach((les) => {
          les.topics.forEach((top) => {
            expect(top).not.toHaveProperty('raw_body_content');
            expect(top.leftDiv.editorHtml).not.toContain('base64');
            expect(top.leftDiv.editorHtml).not.toContain('FILE #:');
            expect(top.leftDiv.editorHtml).not.toMatch(/Slide\s*\d+/);
          });
        });
      });

      // 14-Point Validation Suite
      expect(validation.isValid).toBe(true);
      expect(validation.score).toBe(100);
      expect(validation.summary.errors).toBe(0);
    });

    it('enforces Module 0 & Lesson 0 Introduction rules when a module matches the course title', () => {
      const mockRawData = {
        course_id: 'course_hazwoper_40',
        courseTitle: 'HAZWOPER 40-Hour Training',
        modules: [
          {
            module_id: 'mod_1',
            module_title: 'Module 1: Chemical Safety & Toxicology',
            lessons: [
              {
                lesson_id: 'les_1_1',
                lesson_title: 'Toxic Chemical Classifications',
                topics: [
                  {
                    id: 'top_1_1_1',
                    name: 'Toxicology Basics',
                    allocated_duration_seconds: 40,
                    leftDiv: {
                      editorHtml: '<div><p>Chemical exposure limits.</p></div>',
                    },
                  },
                ],
              },
              {
                lesson_id: 'les_1_2',
                lesson_title: 'Exposure Routes',
                topics: [
                  {
                    id: 'top_1_2_1',
                    name: 'Inhalation & Ingestion',
                    allocated_duration_seconds: 35,
                    leftDiv: {
                      editorHtml: '<div><p>Routes of entry.</p></div>',
                    },
                  },
                ],
              },
            ],
          },
          {
            module_id: 'mod_2',
            module_title: 'HAZWOPER 40-Hour Training Overview',
            lessons: [
              {
                lesson_id: 'les_2_1',
                lesson_title: 'Lesson 0',
                topics: [
                  {
                    id: 'top_2_1_1',
                    name: 'Course Scope & Welcome',
                    allocated_duration_seconds: 30,
                    leftDiv: {
                      editorHtml:
                        '<div><p>Welcome to 40-hour training.</p></div>',
                    },
                  },
                ],
              },
            ],
          },
          {
            module_id: 'mod_3',
            module_title: 'Module 2: Emergency Response',
            lessons: [
              {
                lesson_id: 'les_3_1',
                lesson_title: 'Incident Command',
                topics: [
                  {
                    id: 'top_3_1_1',
                    name: 'Command Structure',
                    allocated_duration_seconds: 45,
                    leftDiv: {
                      editorHtml: '<div><p>Incident commanders.</p></div>',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      const courseJson = buildCourseJson(mockRawData);

      // Module with course title MUST become Module 0 and be on top (index 0)
      // User rule: "dont add module 0 with its name let it be"
      expect(courseJson.modules[0].module_id).toBe('mod_0');
      expect(courseJson.modules[0].module_title).toBe(
        'HAZWOPER 40-Hour Training Overview'
      );
      expect(courseJson.modules[0].module_title).not.toContain('Module 0:');

      // Inside Module 0, Lesson 0 MUST be strictly named "Introduction" instead of "Lesson 0"
      expect(courseJson.modules[0].lessons[0].lesson_id).toBe('les_0_0');
      expect(courseJson.modules[0].lessons[0].lesson_title).toBe(
        'Introduction'
      );

      // The subsequent modules MUST have continuous sequential lesson numbering:
      // Module 1: Lesson 1 & Lesson 2
      expect(courseJson.modules[1].module_id).toBe('mod_1');
      expect(courseJson.modules[1].module_title).toContain('Module 1:');
      expect(courseJson.modules[1].lessons[0].lesson_id).toBe('les_1_1');
      expect(courseJson.modules[1].lessons[0].lesson_title).toBe(
        'Lesson 1: Toxic Chemical Classifications'
      );
      expect(courseJson.modules[1].lessons[1].lesson_id).toBe('les_1_2');
      expect(courseJson.modules[1].lessons[1].lesson_title).toBe(
        'Lesson 2: Exposure Routes'
      );

      // Module 2: Continues sequentially from Lesson 3
      expect(courseJson.modules[2].module_id).toBe('mod_2');
      expect(courseJson.modules[2].module_title).toBe(
        'Module 2: Emergency Response'
      );
      expect(courseJson.modules[2].lessons[0].lesson_id).toBe('les_2_3');
      expect(courseJson.modules[2].lessons[0].lesson_title).toBe(
        'Lesson 3: Incident Command'
      );
    });

    it('removes images, file codes, and slide titles when images are OFF', () => {
      const rawHtml = `
        <h1>Topic 1: Electrical Service</h1>
        <p><strong>Slide 1: Electrical Service</strong></p>
        <p>Slide Title: Utility Power Entrance</p>
        <p><img src="https://ftcdn.net/sample.jpg" alt="switchgear" /></p>
        <p>FILE #: 2315646879</p>
        <p>#43500089</p>
        <p>Primary utility service switchgear distributes high-voltage current safely.</p>
      `;

      const mockData = {
        courseTitle: 'Electrical Training',
        topics: [
          {
            id: 'top_1_1_1',
            name: 'Topic 1: Electrical Service',
            headingContent: 'Topic 1: Electrical Service',
            slide_type: 'image',
            image_source: '#2315646879',
            image_code: '#2315646879',
            image_prompt: 'High-res switchgear photo',
            has_embedded_image: true,
            leftDiv: {
              image: { isImage: true, imageURL: '#2315646879' },
              editorHtml: rawHtml,
            },
          },
        ],
      };

      const courseJson = buildCourseJson(mockData, { stripImages: true });
      const topic = courseJson.modules[0].lessons[0].topics[0];

      // Verifies all image codes and slide type are converted
      expect(topic.slide_type).toBe('content');
      expect(topic.image_source).toBe('');
      expect(topic.image_code).toBe('');
      expect(topic.image_prompt).toBe('');
      expect(topic.has_embedded_image).toBe(false);
      expect(topic.leftDiv.image.isImage).toBe(false);

      // Verifies HTML content is purged of img, file codes, and slide title repetitions
      const cleanHtml = topic.leftDiv.editorHtml;
      expect(cleanHtml).not.toContain('<img');
      expect(cleanHtml).not.toContain('2315646879');
      expect(cleanHtml).not.toContain('#43500089');
      expect(cleanHtml).not.toContain('Slide Title');
      expect(cleanHtml).not.toContain('Slide 1:');
      expect(cleanHtml).toContain(
        'Primary utility service switchgear distributes high-voltage current safely.'
      );
    });

    it('enhanceAndCleanCourseJson cleans and validates arbitrary JSON payloads', () => {
      const legacyJson = {
        course_id: 'legacy_course',
        course_title: 'Confined Space Safety',
        modules: [
          {
            module_id: 'mod_1',
            module_title: 'Confined Space Overview',
            lessons: [
              {
                lesson_id: 'les_1',
                lesson_title: 'Lesson 0',
                topics: [
                  {
                    id: 'top_1',
                    name: 'Course Intro',
                    slide_type: 'image',
                    image_code: '#99887766',
                    has_embedded_image: true,
                    leftDiv: {
                      editorHtml:
                        '<p class="MsoNormal">Slide 1: Course Intro</p><p>FILE #: 99887766</p><p>Proper entry protocols.</p>',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      const { success, courseJson, validation } = buildCourseJson
        ? import('../src/lib/course-converter/schema-builder.js').then((m) =>
            m.enhanceAndCleanCourseJson(legacyJson, { stripImages: true })
          )
        : {};

      return import('../src/lib/course-converter/schema-builder.js').then(
        (m) => {
          const res = m.enhanceAndCleanCourseJson(legacyJson, {
            stripImages: true,
          });
          expect(res.success).toBe(true);
          expect(res.courseJson.modules[0].module_id).toBe('mod_0');
          expect(res.courseJson.modules[0].lessons[0].lesson_title).toBe(
            'Introduction'
          );
          expect(
            res.courseJson.modules[0].lessons[0].topics[0].slide_type
          ).toBe('content');
          expect(
            res.courseJson.modules[0].lessons[0].topics[0].leftDiv.editorHtml
          ).not.toContain('FILE #:');
          expect(
            res.courseJson.modules[0].lessons[0].topics[0].leftDiv.editorHtml
          ).not.toContain('Slide 1');
          expect(res.validation.isValid).toBe(true);
        }
      );
    });
  });
});

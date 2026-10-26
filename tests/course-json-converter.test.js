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
  });
});

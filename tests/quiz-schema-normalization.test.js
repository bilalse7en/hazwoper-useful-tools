import { describe, it, expect } from 'vitest';
import {
  normalizeQuizQuestion,
  normalizeFinalExam,
  enhanceAndCleanCourseJson,
  validateCourseJson,
  buildCourseJson,
} from '../src/lib/course-converter/index.js';

describe('Quiz Schema Normalization & Key Guard Engine', () => {
  it('normalizes DB/Supabase question schema with question_text and option_text to LMS schema', () => {
    const dbQuestion = {
      course_id: 'sample-course-id',
      topic_id: 'les_1_1',
      question_number: 1,
      question_type: 'knowledge_check',
      question_text:
        'Under the typical colocation shared responsibility split, which party keeps the authorized user list current?',
      options: [
        {
          option_text:
            'The provider, because it operates the badge readers at data hall entry',
          is_correct: false,
        },
        {
          option_text:
            'The customer, while the provider enforces the list at entry',
          is_correct: true,
        },
        {
          option_text:
            'The external auditor, who validates the list during each SOC 2 engagement',
          is_correct: false,
        },
        {
          option_text:
            'The provider facilities team, because it installs the cage and lock hardware',
          is_correct: false,
        },
      ],
      explanation:
        'In the typical split, the customer keeps the authorized user list current and the provider enforces it at entry.',
    };

    const normalized = normalizeQuizQuestion(dbQuestion, 'q_1_1_1');

    expect(normalized.question).toBe(
      'Under the typical colocation shared responsibility split, which party keeps the authorized user list current?'
    );
    expect(normalized.question_text).toBe(normalized.question);
    expect(normalized.correct_answer).toBe('B');
    expect(normalized.options).toHaveLength(4);

    expect(normalized.options[0].value).toBe('A');
    expect(normalized.options[0].label).toBe(
      'The provider, because it operates the badge readers at data hall entry'
    );
    expect(normalized.options[0].is_correct).toBe(false);

    expect(normalized.options[1].value).toBe('B');
    expect(normalized.options[1].label).toBe(
      'The customer, while the provider enforces the list at entry'
    );
    expect(normalized.options[1].is_correct).toBe(true);

    expect(normalized.explanation).toContain(
      'In the typical split, the customer keeps the authorized user list current'
    );
  });

  it('normalizes final_exam when provided as an array into a valid final_exam LMS object', () => {
    const rawExamArray = [
      {
        question_number: 1,
        question_text: 'What is the primary perimeter defense?',
        options: [
          { option_text: 'Motion sensors', is_correct: false },
          { option_text: 'Perimeter fencing', is_correct: true },
        ],
        explanation: 'Fencing provides the initial physical boundary.',
      },
    ];

    const feObj = normalizeFinalExam(rawExamArray);
    expect(feObj).toBeDefined();
    expect(feObj.id).toBe('final_exam');
    expect(feObj.title).toBe('Comprehensive Final Exam');
    expect(feObj.questionCount).toBe(1);
    expect(feObj.questions).toHaveLength(1);
    expect(feObj.questions[0].correct_answer).toBe('B');
    expect(feObj.questions[0].question).toBe(
      'What is the primary perimeter defense?'
    );
  });

  it('enhances and normalizes a multi-module course with alternative question schemas to 100% schema health', () => {
    const sampleCourse = {
      course_id: 'test-course',
      course_title: 'Security and Compliance Training',
      modules: [
        {
          module_id: 'mod_0',
          module_title: 'Security and Compliance Training',
          lessons: [
            {
              lesson_id: 'les_0_0',
              lesson_title: 'Introduction',
              topics: [
                {
                  id: 'top_0_0_1',
                  name: 'Course Overview',
                  headingContent: 'Course Overview',
                  leftDiv: {
                    editorHtml: '<div><p>Welcome to the course.</p></div>',
                  },
                },
              ],
            },
          ],
        },
        {
          module_id: 'mod_1',
          module_title: 'Module 1: Foundations',
          lessons: [
            {
              lesson_id: 'les_1_1',
              lesson_title: 'Lesson 1: Security Landscape',
              knowledge_check: [
                {
                  question_text: 'Which party owns the authorized user list?',
                  options: [
                    { option_text: 'Provider', is_correct: false },
                    { option_text: 'Customer', is_correct: true },
                  ],
                  explanation: 'Customer owns it.',
                },
              ],
              topics: [
                {
                  id: 'top_1_1_1',
                  name: 'Foundations Slide',
                  headingContent: 'Foundations Slide',
                  leftDiv: {
                    editorHtml: '<div><p>Instructional content.</p></div>',
                  },
                },
              ],
            },
          ],
        },
      ],
      final_exam: [
        {
          question_text: 'Exam question 1',
          options: [
            { option_text: 'Opt 1', is_correct: true },
            { option_text: 'Opt 2', is_correct: false },
          ],
          explanation: 'Exam explanation.',
        },
      ],
    };

    const res = enhanceAndCleanCourseJson(sampleCourse);
    expect(res.success).toBe(true);
    expect(res.validation.score).toBe(100);
    expect(res.courseJson.final_exam.id).toBe('final_exam');
    expect(
      res.courseJson.modules[1].lessons[0].knowledge_check[0].correct_answer
    ).toBe('B');
    expect(
      res.courseJson.modules[1].lessons[0].knowledge_check[0].question
    ).toBe('Which party owns the authorized user list?');
  });

  it('detects correct answer letter attached at the end of question like (A), (B), (C), (D), marks it as correct answer, and strips it from question text', () => {
    const rawQuestion = {
      question:
        'Which equipment protects the electrical utility distribution system from transient overvoltage surges? (C)',
      options: [
        { label: 'Step-down transformer' },
        { label: 'Lockout hasp' },
        { label: 'Surge arrester' },
        { label: 'Grounding rod' },
      ],
      explanation:
        'Surge arresters divert transient overvoltage safely to ground.',
    };

    const normalized = normalizeQuizQuestion(rawQuestion, 'q_test_1');

    // 1. Must remove (C) from the question text
    expect(normalized.question).toBe(
      'Which equipment protects the electrical utility distribution system from transient overvoltage surges?'
    );
    expect(normalized.question_text).toBe(
      'Which equipment protects the electrical utility distribution system from transient overvoltage surges?'
    );
    expect(normalized.question).not.toContain('(C)');

    // 2. Must select 'C' as correct answer
    expect(normalized.correct_answer).toBe('C');

    // 3. Option C must have is_correct = true, others false
    expect(normalized.options[0].is_correct).toBe(false);
    expect(normalized.options[1].is_correct).toBe(false);
    expect(normalized.options[2].is_correct).toBe(true);
    expect(normalized.options[3].is_correct).toBe(false);
  });

  it('never eats letters or words starting with "O" in options and questions (e.g. On, Only, One, Operating, Inside)', async () => {
    const { parseQuizFromHtml } =
      await import('../src/lib/course-converter/quiz-extractor.js');

    const html = `
      <p>Question 1</p>
      <p>A facility is adding a surge protective device (SPD) to work with an existing UPS. According to the lesson, where should the SPD be installed? [A]</p>
      <ol>
        <li>On the utility side of the UPS, ideally on the bypass line</li>
        <li>On the output side of the UPS, directly at each critical load</li>
        <li>Inside the UPS cabinet, between the rectifier and the inverter</li>
        <li>On the DC bus, between the battery bank and the inverter</li>
      </ol>
      <p>Question 2</p>
      <p>Which statement best describes the role of a UPS in layered surge protection? (A)</p>
      <ul>
        <li>Operating under load with continuous double-conversion</li>
        <li>Only protecting downstream non-critical panels</li>
        <li>One primary fuse block for the entire substation</li>
      </ul>
    `;

    const parsed = parseQuizFromHtml(html, 'q');
    expect(parsed).toHaveLength(2);

    // Question 1 assertions
    const q1 = parsed[0];
    expect(q1.question).toBe(
      'A facility is adding a surge protective device (SPD) to work with an existing UPS. According to the lesson, where should the SPD be installed?'
    );
    expect(q1.correct_answer).toBe('A');
    expect(q1.options[0].label).toBe(
      'On the utility side of the UPS, ideally on the bypass line'
    );
    expect(q1.options[0].label).not.toMatch(/^n\s/); // Must NOT eat 'O'
    expect(q1.options[1].label).toBe(
      'On the output side of the UPS, directly at each critical load'
    );
    expect(q1.options[1].label).not.toMatch(/^n\s/); // Must NOT eat 'O'
    expect(q1.options[2].label).toBe(
      'Inside the UPS cabinet, between the rectifier and the inverter'
    );
    expect(q1.options[3].label).toBe(
      'On the DC bus, between the battery bank and the inverter'
    );
    expect(q1.options[3].label).not.toMatch(/^n\s/); // Must NOT eat 'O'

    // Question 2 assertions
    const q2 = parsed[1];
    expect(q2.question).toBe(
      'Which statement best describes the role of a UPS in layered surge protection?'
    );
    expect(q2.correct_answer).toBe('A');
    expect(q2.options[0].label).toBe(
      'Operating under load with continuous double-conversion'
    );
    expect(q2.options[1].label).toBe(
      'Only protecting downstream non-critical panels'
    );
    expect(q2.options[2].label).toBe(
      'One primary fuse block for the entire substation'
    );
  });

  it('strips attached question markers (A)-(D) and [A]-[D] and Answer: A from UPS knowledge check questions', async () => {
    const { parseQuizFromHtml } =
      await import('../src/lib/course-converter/quiz-extractor.js');

    const questions = [
      'A facility is adding a surge protective device (SPD) to work with an existing UPS. According to the lesson, where should the SPD be installed? [A]',
      'Which statement best describes the role of a UPS in layered surge protection? (A)',
      'A technician opens the input breaker of a UPS and sees that the central panel is dark. Why does this NOT prove the cabinet is safe to work on? (A)',
      'When sizing a backup generator to work with a UPS, what must the generator be able to supply? (A)',
      'During generator operation, the UPS cannot synchronize with its bypass source, which blocks a safe transfer to bypass. Which coordination factor is the most likely cause? (A)',
      'How does a vented lead-acid (VLA) battery differ from a valve-regulated lead-acid (VRLA) battery? (A)',
    ];

    const html = questions
      .map(
        (q, idx) => `
        <p>Question ${idx + 1}</p>
        <p>${q}</p>
        <p>A. Option Alpha</p>
        <p>B. Option Beta</p>
        <p>C. Option Gamma</p>
        <p>D. Option Delta</p>
      `
      )
      .join('\n');

    const parsed = parseQuizFromHtml(html, 'q');
    expect(parsed).toHaveLength(6);

    parsed.forEach((item) => {
      expect(item.question).not.toMatch(/\([A-D]\)$/);
      expect(item.question).not.toMatch(/\[[A-D]\]$/);
      expect(item.question.endsWith('?')).toBe(true);
      expect(item.correct_answer).toBe('A');
    });
  });
});

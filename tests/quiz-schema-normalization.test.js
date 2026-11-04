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
});

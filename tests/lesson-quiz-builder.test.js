import { describe, it, expect } from 'vitest';
import {
  parseQuizFromText,
  generateLessonQuizCode,
} from '../src/lib/docx-processor.js';

describe('Final Exam & Lesson Quiz Parser', () => {
  it('detects Final Exam header and extracts questions correctly', () => {
    const rawText = `# Final Exam

1. What is the primary purpose of OSHA 29 CFR 1910.120 HAZWOPER regulations?
A. Regulate offshore maritime cargo tariffs
B. Protect workers involved in hazardous waste operations and emergency response
C. Standardize residential building electrical wiring codes
D. Supervise federal income tax filings
Correct Answer: B

2. Which level of personal protective equipment (PPE) provides the highest level of respiratory and skin protection?
A. Level A
B. Level B
C. Level C
D. Level D
Answer: A
`;

    const questions = parseQuizFromText(rawText);

    expect(questions).toBeDefined();
    expect(questions.length).toBe(2);
    expect(questions.detectedType).toBe('final-exam');
    expect(questions.detectedHeading).toMatch(/Final Exam/i);

    // Question 1
    expect(questions[0].question).toContain('OSHA 29 CFR 1910.120');
    expect(questions[0].options.length).toBe(4);
    expect(questions[0].options[0].letter).toBe('A');
    expect(questions[0].options[1].letter).toBe('B');
    expect(questions[0].correctAnswer).toBe('B');

    // Question 2
    expect(questions[1].question).toContain('personal protective equipment');
    expect(questions[1].correctAnswer).toBe('A');
  });

  it('detects Lesson Quiz header and extracts questions', () => {
    const rawText = `Lesson Quiz

Question 1: What does SCBA stand for?
A. Surface Controlled Breathing Apparatus
B. Self-Contained Breathing Apparatus
C. Standard Continuous Bio Air
D. Secondary Containment Barrier Area
Answer Key: B

Question 2: Who requires HAZWOPER certification?
A. Emergency response personnel handling hazardous spills
B. Office receptionists in retail banks
C. Long-haul commercial pilots
D. High school chemistry lab students only
Answer: A
`;

    const questions = parseQuizFromText(rawText);

    expect(questions.length).toBe(2);
    expect(questions.detectedType).toBe('lesson-quiz');
    expect(questions[0].correctAnswer).toBe('B');
    expect(questions[1].correctAnswer).toBe('A');
  });

  it('handles in-line (CORRECT) tags on options', () => {
    const rawText = `# Final Examination

1. What is the lower explosive limit (LEL)?
A. The maximum temperature at which vapor will burn
B. The lowest concentration of vapor in air that will produce a flash of fire (CORRECT)
C. The minimum pressure inside a gas cylinder
D. None of the above
`;

    const questions = parseQuizFromText(rawText);

    expect(questions.length).toBe(1);
    expect(questions.detectedType).toBe('final-exam');
    expect(questions[0].correctAnswer).toBe('B');
    expect(questions[0].options[1].text).not.toContain('(CORRECT)');
  });

  it('generates final-exam-container HTML for Final Exams and lesson-quiz-container for Lesson Quizzes', () => {
    const examQuestions = parseQuizFromText(
      `# Final Exam\n1. Safety question?\nA. No\nB. Yes\nAnswer: B`
    );
    const examHtml = generateLessonQuizCode(examQuestions);
    expect(examHtml).toContain('final-exam-container');

    const quizQuestions = parseQuizFromText(
      `# Lesson Quiz\n1. Safety question?\nA. No\nB. Yes\nAnswer: B`
    );
    const quizHtml = generateLessonQuizCode(quizQuestions);
    expect(quizHtml).toContain('lesson-quiz-container');
  });
});

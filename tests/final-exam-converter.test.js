import { describe, it, expect } from 'vitest';
import {
  parseFinalExamFromTextOrHtml,
  mergeFinalExamIntoCourse,
  addLessonToCourse,
  reorderLessonsInCourse,
  updateQuestionInCourse,
  deleteQuestionFromCourse,
  renumberAllLessons,
  recalculateCourseDurations,
  segmentLessonWiseHtml,
  buildCourseJson,
  validateCourseJson,
} from '../src/lib/course-converter/index.js';

describe('Final Exam & Course Management Engine', () => {
  const sampleUserExamText = `Final Exam
Question 1
Which of the following is considered fraud in the context of Illinois Medicaid MCO billing?
A. Intentionally submitting false claims for services not rendered (correct)
B. Occasionally missing documentation for a claim
C. Billing for services at the standard contracted rate
D. Requesting prior authorization before providing services
Explanation: Fraud involves intentional deception or misrepresentation to obtain unauthorized payment. Submitting false claims for services not rendered is a clear example of fraudulent billing practices covered in Lesson 1.
Question 2
What is the primary difference between waste and abuse in Illinois Medicaid?
A. Waste is the overuse or misuse of resources, while abuse is practice inconsistent with sound fiscal, business, or medical standards; neither requires proof of intent (correct)
B. Waste involves monetary loss, while abuse involves only service delivery issues
C. Waste applies only to administrative staff, while abuse applies only to clinical staff
D. Waste is never reportable, while abuse always requires immediate reporting
Explanation: Lesson 1 defines waste as the overuse or misuse of program resources and abuse as practice inconsistent with sound fiscal, business, or medical practice that creates unnecessary cost (42 CFR 455.2). Intent is what separates fraud from both.
Question 3
A provider bills for 10 office visits when only 5 were actually conducted. What compliance violation does this represent?
A. Fraud (correct)
B. Waste
C. A documentation error requiring correction
D. An acceptable practice with MCO prior approval
Explanation: Billing for services not rendered is a fraudulent billing practice, as covered in Lesson 1's Billing and Coding Red Flags section.
Question 4
Which of the following is a red flag for potential billing and coding violations in Illinois Medicaid MCO?
A. Consistently billing for higher-level services than clinically documented (correct)
B. Using correct procedure codes that match the services provided
C. Maintaining detailed clinical documentation
D. Submitting claims within the appropriate timeframe
Explanation: Lesson 1 identifies upcoding—billing for higher-level services than warranted by clinical documentation—as a red flag for potential fraud and abuse.
Question 5
Under Illinois Medicaid MCO regulations, what is a provider's responsibility when abuse or neglect of a member is suspected?
A. Report the suspected abuse or neglect as required by the MCO and state regulations (correct)
B. Document the concern privately and monitor for additional incidents
C. Discuss the matter only with the member's family
D. Wait for the MCO to discover the issue independently
Explanation: Lesson 2 covers Abuse, Neglect, Exploitation, and Critical Incident Reporting, which requires providers to report suspected abuse or neglect according to MCO and state protocols.
Question 6
What does cultural competency in healthcare provider settings include?
A. Understanding and respecting the diverse backgrounds, beliefs, and values of members (correct)
B. Requiring all members to follow the provider's standard treatment protocols without modification
C. Providing services only in English
D. Limiting services to members from the provider's own cultural background
Explanation: Lesson 3 emphasizes that cultural competency involves understanding and respecting the diverse backgrounds, beliefs, and values of the populations served.
Question 7
A member who is deaf requests a qualified interpreter during a medical appointment. How should the provider respond?
A. Arrange for a qualified interpreter at no cost to the member (correct)
B. Ask the member to bring a family member to interpret
C. Use a telephone relay service and charge the member for the service
D. Suggest that the member reschedule when an interpreter is not needed
Explanation: Lesson 3 explains that the ADA and Section 504 require providers to furnish qualified sign language interpreters and other auxiliary aids at no cost to ensure effective communication with members who are deaf or hard of hearing.
Question 8
Which of the following is a requirement for Americans with Disabilities Act (ADA) compliance in provider settings?
A. Ensuring physical facilities are accessible and communication aids are available (correct)
B. Offering services only to members without disabilities
C. Charging additional fees for accessibility accommodations
D. Requiring members to provide their own assistive devices
Explanation: Lesson 3 covers ADA Compliance in Provider Settings, which requires providers to maintain accessible facility design and provide communication aids and accommodations at no additional cost.
Question 9
What is a dual-eligible beneficiary in Illinois Medicaid MCO?
A. A member who qualifies for both Medicare and Medicaid benefits (correct)
B. A member enrolled in two different MCO health plans simultaneously
C. A member with coverage from both their employer and Medicaid
D. A member who has been approved for two separate medical procedures
Explanation: Lesson 4 defines dual-eligible beneficiaries as individuals who qualify for both Medicare and Medicaid benefits, requiring coordinated care and Special Needs Plan (SNP) models.
Question 10
In a Special Needs Plan (SNP) model for dual-eligible members, what is the primary goal of care coordination?
A. To integrate services and ensure coordinated benefits between Medicare and Medicaid (correct)
B. To limit member access to certain providers
C. To reduce administrative costs by denying claims
D. To transfer all member care to a single provider
Explanation: Lesson 4 explains that SNP care coordination ensures integrated service delivery and proper coordination of Medicare and Medicaid benefits for dual-eligible members.
Question 11
A home health nurse suspects that a caregiver is financially exploiting a 45-year-old member with a physical disability who lives at home. Where should the nurse report, and by when?
A. To DCFS immediately
B. To Adult Protective Services within 24 hours, then notify the member's health plan (correct)
C. Directly to HFS within 30 days
D. Only to the member's health plan at the next care plan review
Explanation: Lesson 2 explains that APS covers adults 18–59 with disabilities and adults 60 and older living in the community, with a 24-hour reporting deadline. Notifying the plan is an additional step.
Question 12
Which statement about Illinois dual-eligible plans is accurate for 2026?
A. MMAI continues to operate alongside FIDE SNPs.
B. Dual-eligible members must choose either Medicare or Medicaid coverage.
C. FIDE SNPs replaced MMAI on January 1, 2026. (correct)
D. Blue Cross Blue Shield is the only Illinois FIDE SNP.
Explanation: Lesson 4 explains that MMAI ended December 31, 2025, and four FIDE SNPs (Aetna, Humana, Molina, and Wellcare/Meridian) began serving dual-eligible members on January 1, 2026.
Question 13
Which item must be included on the HFS Attestation of Training Completion form?
A. Each trained employee's Social Security number
B. The final exam score for each employee
C. A copy of the provider agreement with each plan
D. The organization's NPI or Tax ID and an authorized representative's signature (correct)
Explanation: Lesson 5 explains that the form identifies the organization by NPI or Tax ID, requires an authorized representative's signature, and lists each person trained with the date of training.`;

  it('parses the user 13-question Final Exam Word text format accurately', () => {
    const exam = parseFinalExamFromTextOrHtml(sampleUserExamText);
    expect(exam.id).toBe('final_exam');
    expect(exam.title).toContain('Final Exam');
    expect(exam.questionCount).toBe(13);
    expect(exam.questions.length).toBe(13);

    // Verify Question 1
    const q1 = exam.questions[0];
    expect(q1.question).toContain('Which of the following is considered fraud');
    expect(q1.options.length).toBe(4);
    expect(q1.correct_answer).toBe('A');
    expect(q1.options[0].label).toBe(
      'Intentionally submitting false claims for services not rendered'
    );
    expect(q1.explanation).toContain('Fraud involves intentional deception');

    // Verify Question 11 has B as correct answer
    const q11 = exam.questions[10];
    expect(q11.correct_answer).toBe('B');

    // Verify Question 12 has C as correct answer
    const q12 = exam.questions[11];
    expect(q12.correct_answer).toBe('C');

    // Verify Question 13 has D as correct answer
    const q13 = exam.questions[12];
    expect(q13.correct_answer).toBe('D');
  });

  it('parses direct Word HTML without <h1> tags as a valid Final Exam course', () => {
    const wordHtml = `
      <p>Final Exam</p>
      <p>Question 1</p>
      <p>What is fraud?</p>
      <p>A. Submitting false claims (correct)</p>
      <p>B. Legitimate billing</p>
      <p>Explanation: Intentional deception.</p>
    `;
    const res = segmentLessonWiseHtml(wordHtml, {
      fileName: 'Final Exam.docx',
    });
    expect(res.final_exam).toBeDefined();
    expect(res.final_exam.questions.length).toBe(1);
    expect(res.final_exam.questions[0].correct_answer).toBe('A');

    const course = buildCourseJson(res);
    expect(course.final_exam).toBeDefined();
    expect(course.duration.final_exam_seconds).toBe(60);
    const val = validateCourseJson(course);
    expect(val.isValid).toBe(true);
  });

  // Base 5-lesson course fixture for testing additions, moves, and reordering
  function createBase5LessonCourse() {
    const lessons = [];
    for (let i = 1; i <= 5; i++) {
      lessons.push({
        lesson_id: `les_1_${i}`,
        lesson_title: `Lesson ${i}: Compliance Fundamentals Part ${i}`,
        has_assessment_after: true,
        knowledge_check: [
          {
            question_id: `q_1_${i}_1`,
            question: `Sample Question for Lesson ${i}`,
            options: [
              { value: 'A', label: 'Option A' },
              { value: 'B', label: 'Option B' },
            ],
            correct_answer: 'A',
            explanation: `Explanation for Lesson ${i}`,
          },
        ],
        topics: [
          {
            id: `top_1_${i}_1`,
            name: `Topic 1 of Lesson ${i}`,
            headingContent: `Topic 1 of Lesson ${i}`,
            lessonId: `les_1_${i}`,
            moduleId: 'mod_1',
            allocated_duration_seconds: 60,
            leftDiv: {
              editor: '<div><p>Topic body</p></div>',
              editorHtml: '<div><p>Topic body</p></div>',
            },
          },
        ],
      });
    }

    const course = {
      course_id: 'course_1',
      course_title: 'Illinois Medicaid MCO Compliance',
      total_modules: 1,
      total_topics: 5,
      total_duration_seconds: 600,
      planned_duration_seconds: 600,
      duration: {
        total_seconds: 600,
        slides_seconds: 300,
        knowledge_check_seconds: 300,
        final_exam_seconds: 0,
        lessons: [],
      },
      modules: [
        {
          module_id: 'mod_1',
          module_title: 'Module 1: General Curriculum',
          lessons,
        },
      ],
    };

    return recalculateCourseDurations(course);
  }

  it('merges a final exam into an existing course and updates durations & validation', () => {
    const baseCourse = createBase5LessonCourse();
    expect(baseCourse.final_exam).toBeUndefined();
    expect(baseCourse.duration.final_exam_seconds).toBe(0);

    const exam = parseFinalExamFromTextOrHtml(sampleUserExamText);
    const { courseJson, validation } = mergeFinalExamIntoCourse(
      baseCourse,
      exam
    );

    expect(courseJson.final_exam).toBeDefined();
    expect(courseJson.final_exam.questions.length).toBe(13);
    // 13 questions * 60s = 780s
    expect(courseJson.duration.final_exam_seconds).toBe(780);
    expect(courseJson.total_duration_seconds).toBe(
      baseCourse.duration.slides_seconds +
        baseCourse.duration.knowledge_check_seconds +
        780
    );
    expect(validation.isValid).toBe(true);
  });

  it('adds a 6th lesson to an existing 5-lesson course at the end with auto-renumbering', () => {
    const baseCourse = createBase5LessonCourse();
    expect(baseCourse.modules[0].lessons.length).toBe(5);

    const newLesson = {
      lesson_title: 'Special Needs Plan Coordination',
      topics: [
        {
          name: 'SNP Models',
          allocated_duration_seconds: 120,
          leftDiv: {
            editor: '<div><p>SNP content</p></div>',
            editorHtml: '<div><p>SNP content</p></div>',
          },
        },
      ],
      knowledge_check: [],
    };

    const { courseJson, validation } = addLessonToCourse(
      baseCourse,
      newLesson,
      {
        position: 'end',
      }
    );

    const lessons = courseJson.modules[0].lessons;
    expect(lessons.length).toBe(6);
    expect(lessons[5].lesson_title).toBe(
      'Lesson 6: Special Needs Plan Coordination'
    );
    expect(lessons[5].lesson_id).toBe('les_1_6');
    expect(validation.isValid).toBe(true);
  });

  it('adds a new lesson at the beginning and shifts all subsequent lessons: Lesson 1 -> Lesson 2 ...', () => {
    const baseCourse = createBase5LessonCourse();
    const newLesson = {
      lesson_title: 'Introduction & Course Orientation',
      topics: [
        {
          name: 'Orientation',
          allocated_duration_seconds: 60,
          leftDiv: {
            editor: '<div><p>Orientation</p></div>',
            editorHtml: '<div><p>Orientation</p></div>',
          },
        },
      ],
      knowledge_check: [],
    };

    const { courseJson } = addLessonToCourse(baseCourse, newLesson, {
      position: 'start',
    });

    const lessons = courseJson.modules[0].lessons;
    expect(lessons.length).toBe(6);
    expect(lessons[0].lesson_title).toBe(
      'Lesson 1: Introduction & Course Orientation'
    );
    expect(lessons[0].lesson_id).toBe('les_1_1');
    expect(lessons[1].lesson_title).toBe(
      'Lesson 2: Compliance Fundamentals Part 1'
    );
    expect(lessons[1].lesson_id).toBe('les_1_2');
    expect(lessons[5].lesson_title).toBe(
      'Lesson 6: Compliance Fundamentals Part 5'
    );
    expect(lessons[5].lesson_id).toBe('les_1_6');
  });

  it('moves Lesson 1 to Lesson 6 position and dynamically renumbers Lesson 1 to Lesson 6', () => {
    const baseCourse = createBase5LessonCourse();
    // Add a 6th lesson first
    const { courseJson: with6Lessons } = addLessonToCourse(baseCourse, {
      lesson_title: 'Lesson 6: Final Review',
      topics: [
        {
          id: 'top_1_6_1',
          name: 'Review',
          headingContent: 'Review',
          allocated_duration_seconds: 30,
          leftDiv: {
            editor: '<div><p>Hi</p></div>',
            editorHtml: '<div><p>Hi</p></div>',
          },
        },
      ],
      knowledge_check: [],
    });

    expect(with6Lessons.modules[0].lessons[0].lesson_title).toBe(
      'Lesson 1: Compliance Fundamentals Part 1'
    );
    expect(with6Lessons.modules[0].lessons[5].lesson_title).toBe(
      'Lesson 6: Final Review'
    );

    // User requirement: "if i move lesson 1 into lesson 6: change lesson 1: number into Lesson 6:"
    // Move lesson from index 0 to index 5
    const { courseJson, validation } = reorderLessonsInCourse(
      with6Lessons,
      'mod_1',
      0,
      5
    );

    const lessons = courseJson.modules[0].lessons;
    expect(lessons.length).toBe(6);

    // Old Lesson 2 is now Lesson 1
    expect(lessons[0].lesson_title).toBe(
      'Lesson 1: Compliance Fundamentals Part 2'
    );
    expect(lessons[0].lesson_id).toBe('les_1_1');

    // Old Lesson 1 (Compliance Fundamentals Part 1) is now in 6th place, so its title is updated to "Lesson 6: ..."!
    expect(lessons[5].lesson_title).toBe(
      'Lesson 6: Compliance Fundamentals Part 1'
    );
    expect(lessons[5].lesson_id).toBe('les_1_6');

    expect(validation.isValid).toBe(true);
  });

  it('allows editing question correct answer and options in quizzes and final exam', () => {
    const baseCourse = createBase5LessonCourse();
    const exam = parseFinalExamFromTextOrHtml(sampleUserExamText);
    const { courseJson: withExam } = mergeFinalExamIntoCourse(baseCourse, exam);

    // Initially Q1 in exam has correct_answer = 'A'
    expect(withExam.final_exam.questions[0].correct_answer).toBe('A');

    // Change Q1 correct answer to 'B'
    const { courseJson: updatedExam } = updateQuestionInCourse(
      withExam,
      withExam.final_exam.questions[0].question_id,
      { correct_answer: 'B' },
      { isFinalExam: true }
    );

    expect(updatedExam.final_exam.questions[0].correct_answer).toBe('B');

    // Edit question text and explanation
    const { courseJson: editedText } = updateQuestionInCourse(
      updatedExam,
      updatedExam.final_exam.questions[0].question_id,
      {
        question: 'Updated stem: Which is considered fraud?',
        explanation: 'Updated explanation rationale.',
      },
      { isFinalExam: true }
    );

    expect(editedText.final_exam.questions[0].question).toBe(
      'Updated stem: Which is considered fraud?'
    );
    expect(editedText.final_exam.questions[0].explanation).toBe(
      'Updated explanation rationale.'
    );

    // Edit lesson quiz question
    const lessonQId =
      baseCourse.modules[0].lessons[0].knowledge_check[0].question_id;
    const { courseJson: updatedQuiz } = updateQuestionInCourse(
      editedText,
      lessonQId,
      { correct_answer: 'B' },
      { isFinalExam: false }
    );

    expect(
      updatedQuiz.modules[0].lessons[0].knowledge_check[0].correct_answer
    ).toBe('B');
  });

  it('deletes question from exam and updates duration & counts', () => {
    const baseCourse = createBase5LessonCourse();
    const exam = parseFinalExamFromTextOrHtml(sampleUserExamText);
    const { courseJson: withExam } = mergeFinalExamIntoCourse(baseCourse, exam);

    const initialQCount = withExam.final_exam.questions.length;
    const firstQId = withExam.final_exam.questions[0].question_id;

    const { courseJson: afterDelete } = deleteQuestionFromCourse(
      withExam,
      firstQId,
      { isFinalExam: true }
    );

    expect(afterDelete.final_exam.questions.length).toBe(initialQCount - 1);
    expect(afterDelete.final_exam.questionCount).toBe(initialQCount - 1);
    expect(afterDelete.duration.final_exam_seconds).toBe(
      (initialQCount - 1) * 60
    );
  });
});

import { describe, it, expect } from 'vitest';
import { parseCourseTOC, parseHeaderText } from '@/lib/adobe-stock/toc-parser';

describe('Course TOC & Word Document Parser', () => {
  const userSampleDoc = `Utility Power Entry and Service Configuration
Introduction
This lesson looks at how utility power enters a data center: the service entrance, metering and monitoring...
Learning Objectives
Map utility power entry points and trace how service flows...
Utility Service Entrance Fundamentals
The utility service entrance is where utility power physically enters your facility...
Service Entrance Components
A service entrance includes the utility's supply lines...
Service Reliability and Redundancy
Most data centers take utility service from two separate utility feeds...
Safety at the Service Entrance
Only qualified personnel operate main disconnects...
Utility Service Entrance Equipment
The service entrance includes the meter, main disconnect switch...
Key Components
The service disconnect is a manually operated switch...
Safety and Maintenance
Service entrance equipment is always energized...
Three-Phase vs. Single-Phase Service Configuration
Data centers receive utility power in one of two configurations...
Voltage and Current Characteristics in Facility Distribution
Facility distribution systems carry power at multiple voltage levels...
Power Factor and Harmonic Distortion Effects
Power factor measures how efficiently electrical power is being used...
Metering and Monitoring at the Service Entrance
The service entrance metering and monitoring equipment provides real-time visibility...
Service Entrance Safety Requirements
29 CFR 1910 Subpart S sets mandatory electrical safety standards...
Summary
Utility power entry and service configuration form the foundation...
Lesson Quiz
Question 1
When power factor drops below 1.0 due to reactive components in equipment, what is the underlying cause?
A. Current and voltage become misaligned (correct)
B. The utility meter fails to measure
Explanation: Power factor is a measure of how efficiently...
Question 2
In the context of facility electrical systems, what dual purpose do the metering and monitoring equipment serve?
A. They measure power consumption for billing (correct)
B. They step down voltage levels
Explanation: Metering and monitoring perform two critical functions...
`;

  it('correctly extracts lesson name and topics while strictly discarding quiz and questions', () => {
    const result = parseCourseTOC(userSampleDoc, false);

    expect(result.lessonTitle).toBe(
      'Utility Power Entry and Service Configuration'
    );
    expect(result.totalTopics).toBeGreaterThanOrEqual(8);

    // Verify critical topics are extracted
    const titles = result.topics.map((t) => t.title);
    expect(titles).toContain('Utility Service Entrance Fundamentals');
    expect(titles).toContain('Service Entrance Components');
    expect(titles).toContain('Utility Service Entrance Equipment');
    expect(titles).toContain(
      'Three-Phase vs. Single-Phase Service Configuration'
    );
    expect(titles).toContain('Power Factor and Harmonic Distortion Effects');

    // STRICT CHECK: Quizzes and question items must be completely absent
    const allText = titles.join(' ').toLowerCase();
    expect(allText).not.toContain('lesson quiz');
    expect(allText).not.toContain('question 1');
    expect(allText).not.toContain('question 2');
    expect(allText).not.toContain('current and voltage become misaligned');
    expect(allText).not.toContain('explanation');
  });

  it('detects Course, Module, and Lesson headers in complex curricula', () => {
    const complexDoc = `Course: Data Center Infrastructure & Safety
Module 1: Electrical Distribution
Lesson 1: Utility Interconnection
Utility Power Entry Points
Main Service Disconnects
Lesson 2: Backup Power Systems
Diesel Generators and Fuel Storage
Automatic Transfer Switches
Lesson Quiz
Question 1: What is ATS?
`;

    const result = parseCourseTOC(complexDoc, false);

    expect(result.courseTitle).toBe('Data Center Infrastructure & Safety');
    expect(
      result.topics.some((t) => t.title === 'Utility Power Entry Points')
    ).toBe(true);
    expect(
      result.topics.some((t) => t.title === 'Automatic Transfer Switches')
    ).toBe(true);
    expect(result.topics.some((t) => t.title.includes('Question'))).toBe(false);
  });

  it('handles HTML formatted docx output from mammoth', () => {
    const htmlSample = `
      <h1>Utility Power Entry and Service Configuration</h1>
      <p>Introductory text goes here...</p>
      <h2>Utility Service Entrance Fundamentals</h2>
      <p>Paragraph body...</p>
      <h2>Service Entrance Equipment</h2>
      <p>Paragraph body...</p>
      <h2>Lesson Quiz</h2>
      <p>Question 1: Sample question</p>
      <p>A. Option 1</p>
    `;

    const result = parseCourseTOC(htmlSample, true);
    expect(result.lessonTitle).toBe(
      'Utility Power Entry and Service Configuration'
    );
    expect(result.totalTopics).toBe(2);
    expect(result.topics[0].title).toBe(
      'Utility Service Entrance Fundamentals'
    );
    expect(result.topics[1].title).toBe('Service Entrance Equipment');
    expect(result.topics.some((t) => t.title.includes('Quiz'))).toBe(false);
  });

  it('efficiently parses large topic lists (up to 2000 topics) without slowdown', () => {
    const lines = ['Course: Mega Enterprise Curriculum'];
    for (let m = 1; m <= 20; m++) {
      lines.push(`Module ${m}: High-Voltage Systems Section ${m}`);
      for (let l = 1; l <= 10; l++) {
        lines.push(`Lesson ${l}: Safety Operation Stage ${l}`);
        for (let t = 1; t <= 10; t++) {
          lines.push(`Topic Inspection Procedure ${m}-${l}-${t}`);
          lines.push(`Detailed description for procedure ${m}-${l}-${t}...`);
        }
      }
    }

    const t0 = performance.now();
    const result = parseCourseTOC(lines.join('\n'), false);
    const duration = performance.now() - t0;

    expect(result.totalTopics).toBe(2000);
    expect(duration).toBeLessThan(100); // Should parse 2000 topics in under 100ms
  });

  it('correctly extracts course, module, and lesson from Word document headers', () => {
    const rawHeader = `
      Lesson 1: Utility Power Entry and Service Configuration
      Module 1: Utility Interconnection & Distribution
      Course Name: Power Systems & Electrical Fundamentals
    `;

    const meta = parseHeaderText(rawHeader);
    expect(meta.courseTitle).toBe('Power Systems & Electrical Fundamentals');
    expect(meta.moduleTitle).toBe(
      'Module 1: Utility Interconnection & Distribution'
    );
    expect(meta.lessonTitle).toBe(
      'Lesson 1: Utility Power Entry and Service Configuration'
    );
  });

  it('strictly extracts only primary H1 topic headings without H3 subsections polluting the TOC', () => {
    const html = `
      <h1>Utility Service Entrance Equipment</h1>
      <p>Body intro</p>
      <h3>Key Components</h3>
      <p>Switch details</p>
      <h3>Safety and Maintenance</h3>
      <p>Maintenance rules</p>
      <h1>Three-Phase vs. Single-Phase Service Configuration</h1>
      <p>Body text</p>
      <h3>Single-Phase Service</h3>
      <h3>Three-Phase Service</h3>
    `;

    const result = parseCourseTOC(html, true, {
      lessonTitle: 'Lesson 1: Power Distribution',
    });
    // Must contain ONLY the 2 H1 topics, and ZERO of the H3 subsections
    expect(result.totalTopics).toBe(2);
    expect(result.topics[0].title).toBe('Utility Service Entrance Equipment');
    expect(result.topics[1].title).toBe(
      'Three-Phase vs. Single-Phase Service Configuration'
    );

    const titlesList = result.topics.map((t) => t.title);
    expect(titlesList).not.toContain('Key Components');
    expect(titlesList).not.toContain('Safety and Maintenance');
    expect(titlesList).not.toContain('Single-Phase Service');
    expect(titlesList).not.toContain('Three-Phase Service');
  });

  it('extracts exactly the 8 H1 topics from the user reference docx, including Summary and skipping Intro, Objectives, and Quiz', async () => {
    let html = '';
    const fs = await import('fs');
    const docxPath =
      'C:/Users/User/.gemini/antigravity/brain/e7cfeae1-d1f4-4ff0-914c-3120b50f3d39/.user_uploaded/media_1793034430662_53e10ceb.docx';

    if (fs.existsSync(docxPath)) {
      const mammoth = await import('mammoth');
      const { value } = await mammoth.convertToHtml({ path: docxPath });
      html = value;
    } else {
      html = `
        <p>Utility Power Entry and Service Configuration</p>
        <h1>Introduction</h1>
        <p>This lesson looks at how utility power enters a data center...</p>
        <h1>Learning Objectives</h1>
        <p>Map utility power entry points...</p>
        <h1>Utility Service Entrance Fundamentals</h1>
        <p>Content for topic 1...</p>
        <h3>Subheader A</h3>
        <p>Details A</p>
        <h1>Utility Service Entrance Equipment</h1>
        <p>Content for topic 2...</p>
        <h3>Key Components</h3>
        <p>Switch details</p>
        <h3>Safety and Maintenance</h3>
        <p>Maintenance rules</p>
        <h1>Three-Phase vs. Single-Phase Service Configuration</h1>
        <p>Content for topic 3...</p>
        <h3>Single-Phase Service</h3>
        <h3>Three-Phase Service</h3>
        <h1>Voltage and Current Characteristics in Facility Distribution</h1>
        <p>Content for topic 4...</p>
        <h3>Voltage Drop Considerations</h3>
        <h1>Power Factor and Harmonic Distortion Effects</h1>
        <p>Content for topic 5...</p>
        <h3>Total Harmonic Distortion (THD)</h3>
        <h1>Metering and Monitoring at the Service Entrance</h1>
        <p>Content for topic 6...</p>
        <h3>Metering Technologies</h3>
        <h1>Service Entrance Safety Requirements</h1>
        <p>Content for topic 7...</p>
        <h3>29 CFR 1910 Subpart S</h3>
        <h1>Summary</h1>
        <p>Content for summary slide...</p>
        <h1>Lesson Quiz</h1>
        <h3>Question 1</h3>
        <p>Quiz question text...</p>
      `;
    }

    const result = parseCourseTOC(html, true);

    expect(result.totalTopics).toBe(8);
    expect(result.topics.map((t) => t.title)).toEqual([
      'Utility Service Entrance Fundamentals',
      'Utility Service Entrance Equipment',
      'Three-Phase vs. Single-Phase Service Configuration',
      'Voltage and Current Characteristics in Facility Distribution',
      'Power Factor and Harmonic Distortion Effects',
      'Metering and Monitoring at the Service Entrance',
      'Service Entrance Safety Requirements',
      'Summary',
    ]);
  });

  it('includes Summary in TOC while strictly skipping Introduction, Learning Objectives, and Lesson Quizzes across multiple lessons', () => {
    const multiLessonDoc = `Course: Advanced Hazardous Operations
Module 1: Chemical Response
Lesson 1: Spill Containment Fundamentals
Introduction
This is lesson 1 intro.
Learning Objectives
Objectives for lesson 1.
Spill Containment Berms and Booms
Deploying barriers to prevent spread.
Absorbent Materials and Neutralization
Using absorbent pads and chemical neutralizers.
Summary
This is lesson 1 summary.
Lesson Quiz
Question 1: What is a boom?
A. Barrier (correct)
B. Weapon

Lesson 2: Decontamination Procedures
Introduction / Learning Objectives
Combined intro and objectives for lesson 2.
Decontamination Line Setup
Setting up warm and hot zone wash stations.
PPE Removal Sequence
Carefully doffing Level A suit.
Lesson Summary
Wrap up of decontamination procedures.
Lesson Quiz
Question 1: Where do you doff suits?
A. Contamination Reduction Zone (correct)
B. Clean Zone
`;

    const result = parseCourseTOC(multiLessonDoc, false);

    expect(result.courseTitle).toBe('Advanced Hazardous Operations');
    expect(result.totalTopics).toBe(6);

    const titles = result.topics.map((t) => t.title);
    expect(titles).toEqual([
      'Spill Containment Berms and Booms',
      'Absorbent Materials and Neutralization',
      'Summary',
      'Decontamination Line Setup',
      'PPE Removal Sequence',
      'Lesson Summary',
    ]);

    // Check lesson association
    expect(result.topics[0].lesson).toContain('Lesson 1');
    expect(result.topics[1].lesson).toContain('Lesson 1');
    expect(result.topics[2].lesson).toContain('Lesson 1');
    expect(result.topics[3].lesson).toContain('Lesson 2');
    expect(result.topics[4].lesson).toContain('Lesson 2');
    expect(result.topics[5].lesson).toContain('Lesson 2');

    // Verify intros, objectives and quizzes are completely absent
    const titlesStr = titles.join(' ').toLowerCase();
    expect(titlesStr).not.toContain('introduction');
    expect(titlesStr).not.toContain('learning objectives');
    expect(titlesStr).not.toContain('lesson quiz');
    expect(titlesStr).not.toContain('question');
  });
});

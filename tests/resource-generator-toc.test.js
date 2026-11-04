import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  processSheet,
  parseHyperlinkFormula,
  resolveRegulationUrl,
} from '../src/lib/excel-processor.js';

const sampleTocCsv = `,,,,,
,,,,,
Cal/OSHA Fire Safety and Emergency Evacuation Training,,,,,
Lesson No. ,Title ,Original Lesson Source,Animations ,Resources: PDFs,Resources: Links
0 ,Introduction ,,How to Use the Course,,
,,,,,
1,Fire Safety – An Overview,OSHA Fire Safety Training for Workplace Safety Lesson 1: Fire Safety – An Overview. (Course Content and Animation taken from this lesson),"The Significance of Fire Safety: Lessons Learned from the Past
Stages of Fire",,=HYPERLINK("https://www.dir.ca.gov/title8/3220.html", "8 CCR Section 3220 – Emergency Action Plan")
,,,,,"=HYPERLINK(""https://www.dir.ca.gov/title8/3221.html"", ""8 CCR Section 3221 – Fire Prevention Plan"")"
,,,,,"=HYPERLINK(""https://www.dir.ca.gov/title8/6151.html"", ""8 CCR Section 6151 – Portable Fire Extinguishers"")"
,,,,,"=HYPERLINK(""https://www.dir.ca.gov/title8/5415.html"", ""8 CCR Section 5415 – Definitions"")"
,,,,,"=HYPERLINK(""https://www.dir.ca.gov/title8/5157.html"", ""8 CCR Section 5157 – Permit-Required Confined Spaces"")"
,,,,,"=HYPERLINK(""https://www.dir.ca.gov/title8/5158.html"", ""8 CCR Section 5158 – Other Confined Space Operations"")"
,,,,,"=HYPERLINK(""https://www.dgs.ca.gov/BSC/Codes"", ""2025 California Building Code Volumes 1 and 2, Title 24, Part 2 with January 2026 Errata"")"
,,,,,"=HYPERLINK(""https://osfm.fire.ca.gov/"", ""2025 California Wildland-Urban Interface Code, Title 24, Part 7 with January 2026 Errata"")"
,,,,,"=HYPERLINK(""https://www.nfpa.org/"", ""NFPA – Reporters Guide: All About Fire"")"
,,,,,"=HYPERLINK(""https://osfm.fire.ca.gov/"", ""2025 California Fire Code, Title 24, Part 9"")"
2,Fire Prevention,OSHA Fire Safety Training for Workplace Safety Lesson 2: Fire Prevention (Course Content and Animation taken from this lesson),Fire Prevention Plan ,"NFPA Sample Hot Work Permit
ANSI-ASC Z49.1-94
California Electrical Code (Title 24, Part 3)
NFPA 51B",=HYPERLINK("https://www.dir.ca.gov/title8/3221.html", "8 CCR Section 3221 – Fire Prevention Plan")
,,,,,"=HYPERLINK(""https://dtsc.ca.gov/"", ""DTSC – Trinity CUPA Hazardous Materials Release Response Plans and Inventory Program (Business Plan)"")"
,,,,,"=HYPERLINK(""https://cers.calepa.ca.gov/"", ""California Environmental Reporting System (CERS)"")"
,,,,,"=HYPERLINK(""https://www.dir.ca.gov/title8/5194.html"", ""8 CCR Section 5194 – Hazard Communication"")"
Final Exam,,,,,`;

describe('Resource Generator with Formula Links', () => {
  it('parses formulas with quotes, commas, and namespaces', () => {
    const f1 =
      'HYPERLINK("https://www.dir.ca.gov/title8/3220.html", "8 CCR Section 3220 – Emergency Action Plan")';
    const r1 = parseHyperlinkFormula(f1);
    expect(r1.url).toBe('https://www.dir.ca.gov/title8/3220.html');
    expect(r1.label).toBe('8 CCR Section 3220 – Emergency Action Plan');

    const f2 = '_xlfn.HYPERLINK("https://example.com/test.pdf"; "Test PDF")';
    const r2 = parseHyperlinkFormula(f2);
    expect(r2.url).toBe('https://example.com/test.pdf');
    expect(r2.label).toBe('Test PDF');
  });

  it('processes workbook with formula cells and does NOT produce # links', () => {
    const wb = XLSX.read(sampleTocCsv, { type: 'string', cellFormula: true });
    const ws = wb.Sheets[wb.SheetNames[0]];

    const { html, count } = processSheet(ws);
    expect(count).toBeGreaterThan(0);

    // Verify no href="#" on generated resource links
    expect(html).not.toContain('href="#"');
    expect(html).toContain('https://www.dir.ca.gov/title8/3220.html');
    expect(html).toContain('8 CCR Section 3220 – Emergency Action Plan');
    expect(html).toContain('https://www.dir.ca.gov/title8/3221.html');
    expect(html).toContain('8 CCR Section 3221 – Fire Prevention Plan');
  });

  it('resolves citation fallback URLs if links are provided as plain text citations without formulas', () => {
    const fallbackUrl = resolveRegulationUrl(
      '8 CCR Section 3220 – Emergency Action Plan'
    );
    expect(fallbackUrl).toContain('dir.ca.gov/title8/3220');
  });

  it('processes user-uploaded xlsx file with formulas and generates zero href="#" links', async () => {
    const fs = await import('fs');
    const path =
      'C:/Users/User/.gemini/antigravity/brain/71f33eb9-aaed-4a35-9fd4-9310ddb1643e/.user_uploaded/media_1793279179269_f62cf868.xlsx';
    if (!fs.existsSync(path)) return;

    const data = fs.readFileSync(path);
    const wb = XLSX.read(data, {
      type: 'buffer',
      cellFormula: true,
      cellNF: true,
    });
    const ws = wb.Sheets[wb.SheetNames[0]];

    const { html, count } = processSheet(ws);
    expect(count).toBeGreaterThan(0);
    expect(html).not.toContain('href="#"');
    expect(html).toContain('8 CCR');
    expect(html).toContain('dir.ca.gov');
  });
});

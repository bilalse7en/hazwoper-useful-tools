import * as XLSX from 'xlsx';

// ==========================================
// EXCEL & FORMULA UTILS
// ==========================================

export const extractActualUrl = (url) =>
  url
    ? 'string' == typeof url
      ? url
      : url.Target ||
        url.target ||
        url.url ||
        url.href ||
        (url.Rel && url.Rel.Target) ||
        ''
    : '';

/**
 * Resolves standard Cal/OSHA (8 CCR), Federal OSHA (29 CFR), NFPA, CA Title 24,
 * and state safety regulations to their authoritative official links.
 */
export function resolveRegulationUrl(title) {
  if (!title || typeof title !== 'string') return '';
  const str = title.trim();

  // 1. Cal/OSHA Title 8 CCR (e.g. "8 CCR Section 3220", "8 CCR 3221", "Title 8 Section 5194", "8 CCR § 3220")
  const ccrMatch = str.match(
    /(?:8\s*CCR|Title\s*8)\s*(?:Section|Sec\.?|§)?\s*(\d+)/i
  );
  if (ccrMatch) {
    return `https://www.dir.ca.gov/title8/${ccrMatch[1]}.html`;
  }

  // 2. Federal OSHA 29 CFR (e.g. "29 CFR 1910.120", "29 CFR Section 1926.65")
  const cfrMatch = str.match(
    /29\s*CFR\s*(?:Section|Sec\.?|§)?\s*(\d+(?:\.\d+)?)/i
  );
  if (cfrMatch) {
    const sec = cfrMatch[1];
    if (sec.startsWith('1910.')) {
      return `https://www.osha.gov/laws-regs/regulations/standardnumber/1910/${sec}`;
    }
    if (sec.startsWith('1926.')) {
      return `https://www.osha.gov/laws-regs/regulations/standardnumber/1926/${sec}`;
    }
    return `https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XVII/part-${sec.split('.')[0]}`;
  }

  // 3. California Title 24 (Building Standards, Fire Code, Electrical Code)
  if (
    /Title\s*24/i.test(str) ||
    /California\s+(Building|Fire|Electrical|Mechanical|Plumbing|Wildland)/i.test(
      str
    )
  ) {
    if (/Wildland|Fire\s*Code/i.test(str)) {
      return 'https://osfm.fire.ca.gov/';
    }
    return 'https://www.dgs.ca.gov/BSC/Codes';
  }

  // 4. NFPA Codes (e.g. "NFPA 51B", "NFPA 10", "NFPA 101", "NFPA Sample Hot Work Permit")
  const nfpaMatch = str.match(/NFPA\s*(\d+[A-Z]?)/i);
  if (nfpaMatch) {
    return `https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=${nfpaMatch[1]}`;
  }
  if (/NFPA/i.test(str)) {
    return 'https://www.nfpa.org/';
  }

  // 5. ANSI Standards (e.g. "ANSI-ASC Z49.1-94")
  if (/ANSI/i.test(str)) {
    return 'https://webstore.ansi.org/';
  }

  // 6. CERS / CalEPA
  if (/CERS|CalEPA/i.test(str)) {
    return 'https://cers.calepa.ca.gov/';
  }

  // 7. DTSC / CUPA
  if (/DTSC|CUPA/i.test(str)) {
    return 'https://dtsc.ca.gov/';
  }

  return '';
}

/**
 * Parses Excel formulas like =HYPERLINK("https://...", "Label")
 * Supports _xlfn.HYPERLINK, comma or semicolon delimiters, quotes, and cell references.
 */
export function parseHyperlinkFormula(formulaStr, worksheet = null) {
  if (!formulaStr || typeof formulaStr !== 'string') return null;
  const trimmed = formulaStr.trim();
  const match = trimmed.match(
    /(?:=_xlfn\.|_xlfn\.|=\s*)?HYPERLINK\s*\(([\s\S]*)\)/i
  );
  if (!match) return null;

  const inner = match[1].trim();

  // Parse arguments handling double and single quotes
  const args = [];
  let current = '';
  let inDoubleQuote = false;
  let inSingleQuote = false;

  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    const nextCh = inner[i + 1];

    if (ch === '"' && !inSingleQuote) {
      if (inDoubleQuote && nextCh === '"') {
        current += '"';
        i++;
      } else {
        inDoubleQuote = !inDoubleQuote;
      }
    } else if (ch === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if ((ch === ',' || ch === ';') && !inDoubleQuote && !inSingleQuote) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) args.push(current.trim());

  if (args.length === 0) return null;

  const cleanArg = (arg) => {
    let s = (arg || '').trim();
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))
    ) {
      s = s.slice(1, -1);
    }
    s = s.replace(/""/g, '"');
    return s.trim();
  };

  let url = cleanArg(args[0]);
  let label = args[1] !== undefined ? cleanArg(args[1]) : '';

  // If url is a cell address like A1, lookup in worksheet
  if (
    worksheet &&
    /^[A-Z]+[0-9]+$/i.test(url) &&
    worksheet[url.toUpperCase()]
  ) {
    const targetCell = worksheet[url.toUpperCase()];
    url = targetCell.v || targetCell.w || url;
  }

  if (!label) {
    label = url;
  }

  return { url, label };
}

export function normCell(cell, worksheet = null) {
  if (!cell) return { text: '', url: '', isHyperlink: false };

  // 1. String inputs (e.g. from CSV rows or text splits)
  if (typeof cell === 'string') {
    const trimmed = cell.trim();
    if (!trimmed) return { text: '', url: '', isHyperlink: false };

    // Check if it's a formula string
    if (/^(?:=_xlfn\.|_xlfn\.|=\s*)?HYPERLINK/i.test(trimmed)) {
      const parsed = parseHyperlinkFormula(trimmed, worksheet);
      if (parsed) {
        return {
          text: parsed.label || parsed.url,
          url: parsed.url,
          isHyperlink: true,
        };
      }
    }

    // Check markdown [label](url)
    const mdMatch = trimmed.match(/^\[([^\]]+)\]\((https?:\/\/[^\)]+)\)$/);
    if (mdMatch) {
      return {
        text: mdMatch[1],
        url: mdMatch[2],
        isHyperlink: true,
      };
    }

    // Check raw URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return {
        text: trimmed,
        url: trimmed,
        isHyperlink: true,
      };
    }

    // Fallback regulation resolution
    const regUrl = resolveRegulationUrl(trimmed);
    return {
      text: trimmed,
      url: regUrl || '',
      isHyperlink: !!regUrl,
    };
  }

  // 2. SheetJS cell objects
  if (typeof cell === 'object') {
    // Check cell.f (formula in xlsx)
    if (cell.f && typeof cell.f === 'string' && /HYPERLINK/i.test(cell.f)) {
      const parsed = parseHyperlinkFormula(cell.f, worksheet);
      if (parsed) {
        const displayLabel =
          (cell.w !== undefined && cell.w !== null ? cell.w : cell.v) ||
          parsed.label ||
          parsed.url;
        return {
          text: String(displayLabel).trim(),
          url: parsed.url,
          isHyperlink: true,
        };
      }
    }

    // Check cell.v if raw formula in CSV
    const rawVal =
      cell.v !== undefined && cell.v !== null ? String(cell.v) : cell.w || '';
    if (rawVal && /^(?:=_xlfn\.|_xlfn\.|=\s*)?HYPERLINK/i.test(rawVal.trim())) {
      const parsed = parseHyperlinkFormula(rawVal.trim(), worksheet);
      if (parsed) {
        return {
          text: parsed.label || parsed.url,
          url: parsed.url,
          isHyperlink: true,
        };
      }
    }

    // Check native hyperlink (cell.l)
    const cellL = cell.l || cell.hyperlink || null;
    const extractedUrl = extractActualUrl(cellL);

    let text = cell.w !== undefined && null !== cell.w ? cell.w : cell.v;
    if (typeof text === 'object') text = cell.w || JSON.stringify(text) || '';
    const textStr = String(text == null ? '' : text).trim();

    if (extractedUrl) {
      return {
        text: textStr || extractedUrl,
        url: extractedUrl,
        isHyperlink: true,
      };
    }

    if (
      textStr &&
      (textStr.startsWith('http://') ||
        textStr.startsWith('https://') ||
        textStr.includes('://'))
    ) {
      return {
        text: textStr,
        url: textStr,
        isHyperlink: true,
      };
    }

    const regUrl = resolveRegulationUrl(textStr);
    return {
      text: textStr,
      url: regUrl || '',
      isHyperlink: !!regUrl,
    };
  }

  const str = String(cell || '').trim();
  const regUrl = resolveRegulationUrl(str);
  return {
    text: str,
    url: regUrl || '',
    isHyperlink: !!regUrl,
  };
}

export function splitMulti(cell, worksheet = null) {
  if (!cell) return [];

  // If cell object with formula in .f, normCell handles it directly
  if (typeof cell === 'object' && cell.f && /HYPERLINK/i.test(cell.f)) {
    const item = normCell(cell, worksheet);
    if (item.text) return [item];
  }

  // If cell object with native link .l and without multiple lines
  if (
    typeof cell === 'object' &&
    cell.l &&
    (!cell.v || !String(cell.v).includes('\n'))
  ) {
    const item = normCell(cell, worksheet);
    if (item.text) return [item];
  }

  // Extract raw text
  let rawText = '';
  if (typeof cell === 'object') {
    rawText =
      cell.v !== undefined && cell.v !== null ? String(cell.v) : cell.w || '';
  } else {
    rawText = String(cell || '');
  }

  rawText = rawText.trim();
  if (!rawText) return [];

  // Split lines: split by \r?\n first
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const results = [];
  for (const line of lines) {
    // If line is not a formula and contains semicolons, split by semicolon
    if (!line.toLowerCase().includes('hyperlink') && line.includes(';')) {
      const parts = line
        .split(';')
        .map((p) => p.trim())
        .filter(Boolean);
      for (const part of parts) {
        const item = normCell(part, worksheet);
        if (item.text) results.push(item);
      }
    } else {
      const item = normCell(line, worksheet);
      if (item.text) results.push(item);
    }
  }

  return results;
}

const pdfHref = (pdf) => {
  if (pdf && pdf.url && pdf.url.toString().trim()) {
    return pdf.url.toString().trim();
  }
  if (pdf && pdf.text) {
    return (
      resolveRegulationUrl(pdf.text) ||
      `https://www.google.com/search?q=${encodeURIComponent(pdf.text)}`
    );
  }
  return '#glossary';
};

export function linkDisplay(link) {
  if (!link) return '';
  if (link.text && link.text !== link.url) return link.text;
  try {
    const url = new URL(link.url || link.text);
    const hostname = url.hostname.toLowerCase();
    return hostname.includes('google.com')
      ? 'Google'
      : hostname.includes('youtube.com')
        ? 'YouTube'
        : hostname.includes('github.com')
          ? 'GitHub'
          : hostname.includes('dir.ca.gov')
            ? 'Cal/OSHA (DIR)'
            : hostname.includes('osha.gov')
              ? 'OSHA'
              : hostname.includes('nfpa.org')
                ? 'NFPA'
                : url.hostname.replace('www.', '').split('.')[0] || link.text;
  } catch (e) {
    return link.text || '';
  }
}

// ==========================================
// RESOURCE GENERATOR LOGIC
// ==========================================

export async function processResourceFile(file, manualGlossaryLink = '') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
          type: 'array',
          cellFormula: true,
          cellNF: true,
        });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        let mergedCells = {};

        if (worksheet['!merges']) {
          worksheet['!merges'].forEach((merge) => {
            const startCell = XLSX.utils.encode_cell({
              r: merge.s.r,
              c: merge.s.c,
            });
            for (let row = merge.s.r; row <= merge.e.r; ++row) {
              for (let col = merge.s.c; col <= merge.e.c; ++col) {
                const cell = XLSX.utils.encode_cell({ r: row, c: col });
                mergedCells[cell] = startCell;
                if (!worksheet[cell]) {
                  worksheet[cell] = {
                    t: 's',
                    v: worksheet[startCell] ? worksheet[startCell].v : '',
                  };
                }
              }
            }
          });
        }

        const result = processSheet(worksheet, mergedCells, manualGlossaryLink);
        resolve(result);
      } catch (e) {
        console.error('Error processing resource file:', e);
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
}

export async function processResourceText(rawText, manualGlossaryLink = '') {
  if (!rawText || !rawText.trim()) {
    return { html: '', count: 0 };
  }
  const workbook = XLSX.read(rawText, {
    type: 'string',
    cellFormula: true,
    cellNF: true,
  });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return processSheet(worksheet, {}, manualGlossaryLink);
}

function repairCellFormulas(row, colIndex) {
  if (colIndex < 0 || !row[colIndex]) return row[colIndex];
  let cell = row[colIndex];

  // Check cell.f
  if (
    cell.f &&
    typeof cell.f === 'string' &&
    /HYPERLINK/i.test(cell.f) &&
    !cell.f.includes(')')
  ) {
    let combinedF = cell.f;
    for (let c = colIndex + 1; c < row.length; c++) {
      const nextCell = row[c];
      if (!nextCell) continue;
      const part =
        nextCell.f ||
        nextCell.w ||
        (nextCell.v !== undefined ? String(nextCell.v) : '');
      combinedF += ',' + part;
      if (part && String(part).includes(')')) break;
    }
    cell = { ...cell, f: combinedF };
  }

  // Check cell.v
  const rawV =
    cell.v !== undefined && cell.v !== null
      ? String(cell.v)
      : typeof cell === 'string'
        ? cell
        : '';
  if (rawV && /HYPERLINK/i.test(rawV) && !rawV.includes(')')) {
    let combinedV = rawV;
    for (let c = colIndex + 1; c < row.length; c++) {
      const nextCell = row[c];
      if (!nextCell) continue;
      const part =
        nextCell.v !== undefined && nextCell.v !== null
          ? String(nextCell.v)
          : nextCell.w || '';
      combinedV += ',' + part;
      if (part && String(part).includes(')')) break;
    }
    if (typeof cell === 'object') {
      cell = { ...cell, v: combinedV };
    } else {
      cell = combinedV;
    }
  }

  return cell;
}

export function processSheet(
  worksheet,
  mergedCells = {},
  manualGlossaryLink = ''
) {
  const cells = {};
  for (const cell in worksheet) {
    if (!cell.startsWith('!')) cells[cell] = worksheet[cell];
  }

  const keys = Object.keys(cells);
  if (keys.length === 0) return { html: '', count: 0 };

  let maxRow = 0;
  let maxCol = 0;
  for (const key of keys) {
    const decoded = XLSX.utils.decode_cell(key);
    if (decoded.r > maxRow) maxRow = decoded.r;
    if (decoded.c > maxCol) maxCol = decoded.c;
  }
  const numCols = Math.max(maxCol + 1, 10);
  const rows = [];

  for (let row = 0; row <= maxRow; row++) {
    const rowData = [];
    for (let col = 0; col < numCols; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      rowData[col] = cells[cellAddress] || null;
    }
    rows.push(rowData);
  }

  const headerRow = rows.find((row) =>
    row.some(
      (cell) =>
        cell &&
        typeof (cell.v || cell.w) === 'string' &&
        String(cell.v || cell.w)
          .toLowerCase()
          .includes('title')
    )
  );
  const headerIndex = headerRow ? rows.indexOf(headerRow) : 0;

  const headers = rows[headerIndex].map((cell) => {
    if (!cell) return '';
    const val = cell.w !== undefined && cell.w !== null ? cell.w : cell.v;
    return val ? String(val).trim().toLowerCase() : '';
  });

  let moduleCol = headers.findIndex((h) => h.includes('module'));
  if (moduleCol === -1) {
    moduleCol = headers.findIndex(
      (h) => h.includes('lesson') && !h.includes('source')
    );
  }
  const titleCol = headers.findIndex((h) => h.includes('title'));
  const pdfCol = headers.findIndex((h) => h.includes('pdf'));
  const linkCol = headers.findIndex((h) => h.includes('link'));

  let titleIndex = -1 === titleCol ? 1 : titleCol;
  let pdfIndex = -1 === pdfCol ? 2 : pdfCol;
  let linkIndex = -1 === linkCol ? 3 : linkCol;

  const dataRows = rows.slice(headerIndex + 1);
  const resources = [];
  const resourceMap = {};
  let currentModule = '';
  let currentTitle = '';
  let glossaryLink = '';

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const moduleCell =
      moduleCol >= 0 && row[moduleCol]
        ? normCell(row[moduleCol], worksheet).text
        : '';
    const pdfCell =
      pdfIndex >= 0
        ? XLSX.utils.encode_cell({ r: i + headerIndex + 1, c: pdfIndex })
        : '';
    const linkCell =
      linkIndex >= 0
        ? XLSX.utils.encode_cell({ r: i + headerIndex + 1, c: linkIndex })
        : '';

    const isPdfMerged =
      !pdfCell || !mergedCells[pdfCell] || mergedCells[pdfCell] === pdfCell;
    const isLinkMerged =
      !linkCell || !mergedCells[linkCell] || mergedCells[linkCell] === linkCell;

    const targetPdfCell = repairCellFormulas(row, pdfIndex);
    const targetLinkCell = repairCellFormulas(row, linkIndex);

    const pdfs =
      isPdfMerged && pdfIndex >= 0 && targetPdfCell
        ? splitMulti(targetPdfCell, worksheet)
        : [];
    const links =
      isLinkMerged && linkIndex >= 0 && targetLinkCell
        ? splitMulti(targetLinkCell, worksheet)
        : [];

    let titleCell =
      titleIndex >= 0 && row[titleIndex]
        ? normCell(row[titleIndex], worksheet).text
        : '';

    if (!(moduleCell || titleCell || pdfs.length || links.length)) continue;

    // Check for glossary indicators
    if (
      (moduleCell && moduleCell.toLowerCase().includes('glossary')) ||
      (titleCell && titleCell.toLowerCase().includes('glossary'))
    ) {
      glossaryLink = links[0]?.url || pdfs[0]?.url || '#glossary';
      continue;
    }

    // Format module label if numeric or lesson
    if (moduleCell) {
      if (/^\d+$/.test(moduleCell.trim())) {
        const headerName = headers[moduleCol] || '';
        const prefix = headerName.includes('lesson') ? 'Lesson' : 'Module';
        currentModule = `${prefix} ${moduleCell.trim()}`;
      } else {
        currentModule = moduleCell.trim();
      }
    }

    if (
      !currentModule &&
      titleCell &&
      /^(Module|Lesson)\s*\d+:/i.test(titleCell)
    ) {
      const match = titleCell.match(/^((?:Module|Lesson)\s*\d+):\s*(.*)/i);
      if (match) {
        currentModule = match[1] + (match[2] ? ': ' + match[2].trim() : '');
        continue;
      }
    }

    if (titleCell) {
      if (/^(Module|Lesson)\s*\d+:/i.test(titleCell)) {
        const match = titleCell.match(/^((?:Module|Lesson)\s*\d+):/i);
        if (match) {
          if (!currentModule) currentModule = match[1];
          titleCell = titleCell
            .replace(/^(?:Module|Lesson)\s*\d+:\s*/i, '')
            .trim();
        }
      }
      currentTitle = titleCell;
      const resourceKey = (currentModule || '') + '||' + currentTitle;
      if (!resourceMap[resourceKey]) {
        const resource = {
          module: currentModule || null,
          title: currentTitle,
          pdfs: [],
          links: [],
        };
        resources.push(resource);
        resourceMap[resourceKey] = resource;
      }
    } else if (!currentTitle) {
      continue;
    }

    const resource = resourceMap[(currentModule || '') + '||' + currentTitle];
    if (resource) {
      pdfs.forEach((pdf) => {
        if (
          pdf &&
          pdf.text &&
          !resource.pdfs.some(
            (existing) =>
              existing.text === pdf.text &&
              (existing.url || '') === (pdf.url || '')
          )
        ) {
          resource.pdfs.push(pdf);
        }
      });
      links.forEach((link) => {
        if (
          link &&
          link.text &&
          !resource.links.some(
            (existing) =>
              existing.text === link.text &&
              (existing.url || '') === (link.url || '')
          )
        ) {
          resource.links.push(link);
        }
      });
    }
  }

  const filteredResources = resources.filter(
    (resource) =>
      (resource.pdfs && resource.pdfs.length) ||
      (resource.links && resource.links.length)
  );

  const finalGlossaryLink = manualGlossaryLink || glossaryLink || '#glossary';
  const html = generateResourceHTML(finalGlossaryLink, filteredResources);

  return { html, count: filteredResources.length };
}

function generateResourceHTML(glossaryLink, resources) {
  const isInternalGlossary = glossaryLink
    .toLowerCase()
    .includes('hazwoper-useful-tools.vercel.app');
  const glossaryRel = isInternalGlossary ? '' : ' rel="noopener noreferrer"';

  let html = `<style>.bg-black.rounded-md.shadow-md:hover {border-left: 4px solid #000;transform: translate(2px);transition: .1s;}.bg-yellow-400.rounded-md.shadow-md:hover {border-left: 4px solid #ffc107;transform: translate(2px);transition: .1s;}</style><div class="bg-black rounded-md shadow-md"><div class="rounded-sm bg-yellow-400 my-4 p-3 w-full"><h2 class="text-2xl leading-none m-0 flex items-center space-x-2"><i class="fa fa-book"></i><a href="${glossaryLink}" target="_blank"${glossaryRel} class="text-blue-600 hover:underline">Glossary</a></h2></div></div>\n`;

  const groupedResources = {};
  const generateResourceList = (resource) => {
    if (!resource.links.length && !resource.pdfs.length) return '';
    let list = '  <ul class="ml-8 list-none space-y-1">\n';
    for (const link of resource.links) {
      if (!link.text) continue;
      let linkUrl = link.url && link.url.trim() ? link.url : '';
      if (!linkUrl || linkUrl === '#') {
        linkUrl =
          resolveRegulationUrl(link.text) ||
          `https://www.google.com/search?q=${encodeURIComponent(link.text)}`;
      }
      const isInternalLink = linkUrl
        .toLowerCase()
        .includes('hazwoper-useful-tools.vercel.app');
      const linkRel = isInternalLink ? '' : ' rel="noopener noreferrer"';
      list += `    <li><i class="fa fa-link text-blue-600 me-2"></i><a href="${linkUrl}" target="_blank"${linkRel} class="text-blue-600 hover:underline">${linkDisplay(link)}</a></li>\n`;
    }
    for (const pdf of resource.pdfs) {
      if (!pdf.text) continue;
      let pdfUrl = pdfHref(pdf);
      const isInternalPdf = pdfUrl
        .toLowerCase()
        .includes('hazwoper-useful-tools.vercel.app');
      const pdfRel = isInternalPdf ? '' : ' rel="noopener noreferrer"';
      list += `    <li><i class="fa fa-file-pdf text-red-600 me-2"></i><a href="${pdfUrl}" target="_blank"${pdfRel} class="ml-1 text-red-600 hover:underline">${pdf.text}</a></li>\n`;
    }
    return (
      list +
      '  </ul><hr class="bg-yellow-400 border-0 mx-3 my-2 opacity-75 pt-1 shadow">\n'
    );
  };

  let hasModules = false;
  for (const resource of resources) {
    if (resource.module) {
      hasModules = true;
      if (!groupedResources[resource.module])
        groupedResources[resource.module] = [];
      groupedResources[resource.module].push(resource);
    }
  }

  if (hasModules) {
    for (const [module, moduleResources] of Object.entries(groupedResources)) {
      html += `<div class="bg-yellow-400 rounded-md shadow-md"><div class="rounded-sm bg-gray-100 my-4 p-3 w-full"><h4 class="mb-2 text-2xl font-semibold flex items-center space-x-2"><i class="fa fa-book-open-reader text-green-600"></i><span>${module}</span></h4><hr class="bg-green-600 border border-green-600 mb-3 mt-0 opacity-75 pt-1">`;
      for (const resource of moduleResources) {
        html += `  <h5 class="flex font-semibold items-center mx-3 space-x-2 text-xl"><i class="fa fa-check-circle text-yellow-400"></i><span>${resource.title}</span></h5><hr class="bg-yellow-400 border-0 mx-3 my-2 opacity-75 pt-1 shadow">${generateResourceList(resource)}`;
      }
      html += '</div></div>\n';
    }
  } else {
    for (const resource of resources) {
      html += `<div class="bg-yellow-400 rounded-md shadow-md"><div class="rounded-sm bg-gray-100 my-4 p-3 w-full"><h5 class="flex font-semibold items-center mx-3 space-x-2 text-xl"><i class="fa fa-check-circle text-yellow-400"></i><span>${resource.title}</span></h5><hr class="bg-yellow-400 border-0 mx-3 my-2 opacity-75 pt-1 shadow">${generateResourceList(resource)}</div></div>\n`;
    }
  }

  return html.replace(/&nbsp;/g, ' ');
}

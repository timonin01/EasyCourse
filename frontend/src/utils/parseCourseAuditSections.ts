export interface AuditReportSections {
  summary: string;
  improvements: string;
  newContent: string;
  plan: string;
}

const SECTION_PATTERNS: Array<{ key: keyof AuditReportSections; patterns: RegExp[] }> = [
  {
    key: 'summary',
    patterns: [/^##\s*Краткий итог/m, /^##\s*1\)\s*Краткий/m],
  },
  {
    key: 'improvements',
    patterns: [
      /^##\s*Улучшения по существующим/m,
      /^##\s*2\)\s*Улучшения/m,
      /^##\s*Улучшения по модулям/m,
      /^Улучшения\s+по\s+существующим/im,
    ],
  },
  {
    key: 'newContent',
    patterns: [
      /^##\s*Новые\s+модули/im,
      /^##\s*3\)\s*Новые/im,
      /^##\s*Новый\s+контент/im,
      /^Новые\s+модули\s+и\s+уроки\s*$/im,
    ],
  },
  {
    key: 'plan',
    patterns: [/^##\s*План внедрения/m, /^##\s*4\)\s*План/m],
  },
];

export function splitAuditReport(markdown: string): AuditReportSections {
  const sections: AuditReportSections = {
    summary: '',
    improvements: '',
    newContent: '',
    plan: '',
  };

  if (!markdown.trim()) {
    return sections;
  }

  const indices: Array<{ key: keyof AuditReportSections; start: number }> = [];

  for (const { key, patterns } of SECTION_PATTERNS) {
    for (const pattern of patterns) {
      const match = pattern.exec(markdown);
      if (match?.index != null) {
        indices.push({ key, start: match.index });
        break;
      }
    }
  }

  if (indices.length === 0) {
    sections.summary = markdown;
    return sections;
  }

  indices.sort((a, b) => a.start - b.start);

  for (let i = 0; i < indices.length; i += 1) {
    const { key, start } = indices[i];
    const end = i + 1 < indices.length ? indices[i + 1].start : markdown.length;
    const chunk = markdown.slice(start, end).trim();
    if (!sections[key]) {
      sections[key] = chunk;
    }
  }

  if (!sections.newContent.trim() || sections.newContent.replace(/^##[^\n]*\n?/, '').trim().length < 40) {
    const peeled = peelNewContentFromImprovements(sections.improvements);
    if (peeled.newContent) {
      sections.improvements = peeled.improvements;
      sections.newContent = peeled.newContent;
    } else {
      const fallback = extractNewContentFallback(markdown, sections);
      if (fallback.length > sections.newContent.length) {
        sections.newContent = fallback;
      }
    }
  } else if (sections.improvements.includes('Новые модули')) {
    const peeled = peelNewContentFromImprovements(sections.improvements);
    if (peeled.newContent) {
      sections.improvements = peeled.improvements;
    }
  }

  return sections;
}

const NEW_CONTENT_TITLE_RE = /^(?:#{1,3}\s*)?Новые\s+модули(?:\s+и\s+уроки)?\s*$/im;
const PART_A_RE = /^(?:#{1,3}\s*)?Часть\s*A\s*[—–-]\s*Новые\s+уроки/im;
const PLAN_SECTION_RE = /^##\s*План\s+внедрения/im;

function peelNewContentFromImprovements(improvements: string): {
  improvements: string;
  newContent: string;
} {
  if (!improvements.trim()) {
    return { improvements: '', newContent: '' };
  }

  const titleMatch = NEW_CONTENT_TITLE_RE.exec(improvements);
  if (titleMatch?.index != null && titleMatch.index > 0) {
    return splitAtBoundary(improvements, titleMatch.index);
  }

  const partAMatch = PART_A_RE.exec(improvements);
  if (partAMatch?.index != null && partAMatch.index > 0) {
    return splitAtBoundary(improvements, partAMatch.index);
  }

  return { improvements, newContent: '' };
}

function splitAtBoundary(
  text: string,
  boundaryIndex: number
): { improvements: string; newContent: string } {
  const before = text.slice(0, boundaryIndex).trim();
  let after = text.slice(boundaryIndex).trim();

  const planMatch = PLAN_SECTION_RE.exec(after);
  if (planMatch?.index != null && planMatch.index > 0) {
    after = after.slice(0, planMatch.index).trim();
  }

  return {
    improvements: before,
    newContent: formatNewContentSection(after),
  };
}

function formatNewContentSection(text: string): string {
  if (/^#{1,2}\s*Новые\s+модули/im.test(text)) {
    return text;
  }
  const body = text.replace(/^(?:#{1,3}\s*)?Новые\s+модули(?:\s+и\s+уроки)?\s*\n+/i, '');
  return body === text ? `## Новые модули и уроки\n\n${text}` : `## Новые модули и уроки\n\n${body}`;
}

const NEW_CONTENT_MARKERS = [
  /^##\s*Новые\s+модули/im,
  /^Новые\s+модули\s+и\s+уроки\s*$/im,
  /^#{1,3}\s*Часть\s*A\s*[—–-]\s*Новые\s+уроки/im,
  /^#{1,3}\s*Часть\s*B\s*[—–-]\s*Новые\s+модули/im,
  /^\[НОВЫЙ\]\s*Модуль/im,
];

function extractNewContentFallback(
  markdown: string,
  sections: AuditReportSections
): string {
  const peeled = peelNewContentFromImprovements(sections.improvements);
  if (peeled.newContent) {
    return peeled.newContent;
  }

  const searchFrom = sections.improvements
    ? markdown.indexOf(sections.improvements) + sections.improvements.length
    : 0;
  const tail = markdown.slice(Math.max(0, searchFrom));

  let start = -1;
  for (const marker of NEW_CONTENT_MARKERS) {
    const match = marker.exec(tail);
    if (match?.index != null && (start === -1 || match.index < start)) {
      start = match.index;
    }
  }

  if (start === -1) {
    return '';
  }

  const slice = tail.slice(start);
  const planMatch = PLAN_SECTION_RE.exec(slice);
  const end = planMatch?.index != null && planMatch.index > 0 ? planMatch.index : slice.length;

  const extracted = slice.slice(0, end).trim();
  if (!extracted) {
    return '';
  }

  return formatNewContentSection(extracted);
}

/** Вкладка «Отчёт»: только итог и план */
export function buildReportTabContent(sections: AuditReportSections): string {
  return [sections.summary, sections.plan].filter(Boolean).join('\n\n');
}

/** Вкладка «Идеи для улучшения»: существующие уроки + новый контент */
export function buildImprovementsTabContent(sections: AuditReportSections): string {
  return [sections.improvements, sections.newContent].filter(Boolean).join('\n\n');
}

/** Убирает дублирующий заголовок секции перед отображением */
export function stripSectionHeading(
  markdown: string,
  kind: 'improvements' | 'newContent'
): string {
  if (kind === 'improvements') {
    return markdown
      .replace(/^(?:#{1,2}\s*)?Улучшения\s+по\s+существующим\s+урокам\s*\n+/im, '')
      .trim();
  }
  return markdown
    .replace(/^(?:#{1,2}\s*)?Новые\s+модули(?:\s+и\s+уроки)?\s*\n+/im, '')
    .replace(/^(?:#{1,2}\s*)?Новые\s+модули(?:\s+и\s+уроки)?\s*\n+/im, '')
    .trim();
}

/** Убирает «1)» из заголовков и лишние дубли секций для отображения */
export function normalizeAuditMarkdown(markdown: string): string {
  return markdown
    .replace(/^##\s*\d+\)\s*/gm, '## ')
    .replace(/^###\s*\d+\)\s*/gm, '### ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

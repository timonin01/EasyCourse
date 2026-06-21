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
    ],
  },
  {
    key: 'newContent',
    patterns: [/^##\s*Новые модули/m, /^##\s*3\)\s*Новые/m],
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

  return sections;
}

/** Вкладка «Отчёт»: только итог и план */
export function buildReportTabContent(sections: AuditReportSections): string {
  return [sections.summary, sections.plan].filter(Boolean).join('\n\n');
}

/** Вкладка «Идеи для улучшения»: существующие уроки + новый контент */
export function buildImprovementsTabContent(sections: AuditReportSections): string {
  return [sections.improvements, sections.newContent].filter(Boolean).join('\n\n');
}

/** Убирает «1)» из заголовков и лишние дубли секций для отображения */
export function normalizeAuditMarkdown(markdown: string): string {
  return markdown
    .replace(/^##\s*\d+\)\s*/gm, '## ')
    .replace(/^###\s*\d+\)\s*/gm, '### ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export type AuditTab = 'report' | 'existing' | 'newContent';

export type StoredCourseAudit = {
  selectedCourseId: string;
  auditedCourseId: string | null;
  analyzeResult: string | null;
  hintLessonIds: Record<string, string>;
  activeTab: AuditTab;
};

const STORAGE_PREFIX = 'easycourse-course-audit';

const AUDIT_TABS = new Set<AuditTab>(['report', 'existing', 'newContent']);

function storageKey(userId: number): string {
  return `${STORAGE_PREFIX}-${userId}`;
}

function isPlainStringRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((item) => typeof item === 'string');
}

export function readStoredCourseAudit(userId: number): StoredCourseAudit | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<StoredCourseAudit>;
    if (typeof parsed.selectedCourseId !== 'string') {
      return null;
    }
    const activeTab = AUDIT_TABS.has(parsed.activeTab as AuditTab)
      ? (parsed.activeTab as AuditTab)
      : 'report';
    return {
      selectedCourseId: parsed.selectedCourseId,
      auditedCourseId: typeof parsed.auditedCourseId === 'string' ? parsed.auditedCourseId : null,
      analyzeResult: typeof parsed.analyzeResult === 'string' ? parsed.analyzeResult : null,
      hintLessonIds: isPlainStringRecord(parsed.hintLessonIds) ? parsed.hintLessonIds : {},
      activeTab,
    };
  } catch {
    return null;
  }
}

export function writeStoredCourseAudit(userId: number, data: StoredCourseAudit): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch {
    // ignore quota / private mode
  }
}

export function clearStoredCourseAudit(userId: number): void {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}

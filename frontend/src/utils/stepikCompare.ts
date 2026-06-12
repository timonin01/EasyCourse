import type { Step } from '../types';
import type { StepikStepSourceResponseData } from '../types';

/**
 * Удаляет HTML теги из строки, оставляя только текстовое содержимое.
 */
function stripHtml(html: unknown): string {
  if (typeof html !== 'string') return String(html ?? '');
  // Создаем временный DOM элемент для парсинга HTML
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function canonicalJson(value: unknown): string {
  if (value === null || value === undefined) return JSON.stringify(value);
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map((v) => canonicalJson(v)).join(',') + ']';
  }
  const keys = Object.keys(value as object).sort();
  const parts = keys.map((k) => {
    const v = (value as Record<string, unknown>)[k];
    return JSON.stringify(k) + ':' + canonicalJson(v);
  });
  return '{' + parts.join(',') + '}';
}

/** Служебные поля Stepik, не влияющие на содержание шага — не участвуют в сравнении. */
const BLOCK_IGNORE_KEYS = new Set([
  'name',
  'video',
  'options',
  'subtitles',
  'subtitle_files',
  'tests_archive',
  'feedback_correct',
  'feedback_wrong',
  'is_deprecated',
  'is_html_enabled',
]);

/** Копия блока без служебных полей — для сравнения. */
function blockForComparison(block: unknown): unknown {
  if (block === null || block === undefined || typeof block !== 'object') {
    // Если это строка, проверяем, не является ли она HTML (простая проверка)
    if (typeof block === 'string' && block.trim().startsWith('<')) {
      return stripHtml(block);
    }
    return block;
  }
  if (Array.isArray(block)) {
    return block.map(item => blockForComparison(item));
  }
  const obj = block as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) {
    if (BLOCK_IGNORE_KEYS.has(k)) continue;
    // Рекурсивно обрабатываем вложенные объекты, чтобы исключить is_html_enabled и там тоже
    const value = obj[k];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      out[k] = blockForComparison(value);
    } else if (Array.isArray(value)) {
      out[k] = value.map(item => blockForComparison(item));
    } else {
      // Удаляем HTML из поля text перед сравнением
      if (k === 'text' && typeof value === 'string') {
        out[k] = stripHtml(value);
      } else if (typeof value === 'string' && value.trim().startsWith('<')) {
        // Также обрабатываем другие строки, которые выглядят как HTML
        out[k] = stripHtml(value);
      } else {
        out[k] = value;
      }
    }
  }
  return out;
}

/**
 * Сравнивает локальный шаг и Stepik только по: position, cost, stepikBlock.
 * Возвращает true, если совпадают.
 */
export function stepMatchesStepik(
  step: Step,
  stepik: StepikStepSourceResponseData
): boolean {
  const localPos = step.position ?? 0;
  const remotePos = stepik.position ?? 0;
  if (localPos !== remotePos) return false;

  const localCost = step.cost ?? 0;
  const remoteCost = stepik.cost ?? 0;
  if (Number(localCost) !== Number(remoteCost)) return false;

  let localBlock: unknown = null;
  if (step.stepikBlockData) {
    try {
      localBlock =
        typeof step.stepikBlockData === 'string'
          ? JSON.parse(step.stepikBlockData)
          : step.stepikBlockData;
    } catch {
      return false;
    }
  }
  const remoteBlock = stepik.block ?? null;
  return canonicalJson(blockForComparison(localBlock)) === canonicalJson(blockForComparison(remoteBlock));
}

export interface StepDiffInfo {
  position?: { local: number; remote: number };
  cost?: { local: number; remote: number };
  /** Пути в JSON stepikBlock, по которым есть отличия (напр. "text", "source.options"). */
  blockPaths?: string[];
  /** Сырой локальный блок и блок со Stepik — для вывода JSON при отличии. */
  localBlockJson?: string;
  remoteBlockJson?: string;
}

function getBlockDiffPaths(
  local: unknown,
  remote: unknown,
  path: string
): string[] {
  const out: string[] = [];
  const push = (p: string) => {
    if (p) out.push(p);
  };

  if (local === null || local === undefined) {
    if (remote !== null && remote !== undefined) push(path || 'block');
    return out;
  }
  if (remote === null || remote === undefined) {
    push(path || 'block');
    return out;
  }
  if (typeof local !== 'object' || typeof remote !== 'object') {
    if (JSON.stringify(local) !== JSON.stringify(remote)) push(path || 'block');
    return out;
  }
  if (Array.isArray(local) && Array.isArray(remote)) {
    if (canonicalJson(local) !== canonicalJson(remote)) push(path || 'block');
    return out;
  }
  if (Array.isArray(local) !== Array.isArray(remote)) {
    push(path || 'block');
    return out;
  }

  const loc = local as Record<string, unknown>;
  const rem = remote as Record<string, unknown>;
  const keys = new Set([...Object.keys(loc), ...Object.keys(rem)]);

  for (const k of keys) {
    // Игнорируем is_html_enabled при поиске различий
    if (k === 'is_html_enabled') continue;
    
    const p = path ? `${path}.${k}` : k;
    const lv = loc[k];
    const rv = rem[k];

    if (!(k in loc)) {
      push(p + ' (только на Stepik)');
      continue;
    }
    if (!(k in rem)) {
      push(p + ' (только локально)');
      continue;
    }

    const lObj = typeof lv === 'object' && lv !== null && !Array.isArray(lv);
    const rObj = typeof rv === 'object' && rv !== null && !Array.isArray(rv);
    if (lObj && rObj) {
      out.push(...getBlockDiffPaths(lv, rv, p));
    } else if (Array.isArray(lv) && Array.isArray(rv)) {
      if (canonicalJson(lv) !== canonicalJson(rv)) push(p);
    } else {
      if (JSON.stringify(lv) !== JSON.stringify(rv)) push(p);
    }
  }
  return out;
}

/**
 * Возвращает отличия по position, cost и stepikBlock. Другие поля не сравниваются.
 * При отличии блока заполняет blockPaths (чем отличается) и localBlockJson/remoteBlockJson (сами JSON).
 */
export function getStepDiff(
  step: Step,
  stepik: StepikStepSourceResponseData
): StepDiffInfo {
  const info: StepDiffInfo = {};
  const localPos = step.position ?? 0;
  const remotePos = stepik.position ?? 0;
  if (localPos !== remotePos) {
    info.position = { local: localPos, remote: remotePos };
  }

  const localCost = Number(step.cost ?? 0);
  const remoteCost = Number(stepik.cost ?? 0);
  if (localCost !== remoteCost) {
    info.cost = { local: localCost, remote: remoteCost };
  }

  let localBlock: unknown = null;
  if (step.stepikBlockData) {
    try {
      localBlock =
        typeof step.stepikBlockData === 'string'
          ? JSON.parse(step.stepikBlockData)
          : step.stepikBlockData;
    } catch {
      info.blockPaths = ['ошибка парсинга stepikBlockData'];
      info.localBlockJson = String(step.stepikBlockData ?? '').slice(0, 2000);
      info.remoteBlockJson = JSON.stringify(stepik.block ?? null, null, 2).slice(0, 2000);
      return info;
    }
  }
  const remoteBlock = stepik.block ?? null;
  const localForCompare = blockForComparison(localBlock);
  const remoteForCompare = blockForComparison(remoteBlock);

  if (canonicalJson(localForCompare) !== canonicalJson(remoteForCompare)) {
    info.blockPaths = getBlockDiffPaths(localForCompare, remoteForCompare, '');
    if (!info.blockPaths.length) info.blockPaths = ['block'];
    try {
      info.localBlockJson = JSON.stringify(localBlock, null, 2);
      info.remoteBlockJson = JSON.stringify(remoteBlock, null, 2);
    } catch {
      info.localBlockJson = String(localBlock);
      info.remoteBlockJson = String(remoteBlock);
    }
  }
  return info;
}

/**
 * Форматирует StepDiffInfo в строку для tooltip (при наведении).
 * Если есть blockPaths — перечисляет пути; если есть JSON — добавляет секции "Локальный block" / "Stepik block" (сокращённо).
 */
export function formatStepDiffTooltip(diff: StepDiffInfo): string {
  const lines: string[] = [];
  if (diff.position) {
    lines.push(`Позиция: локально ${diff.position.local}, Stepik ${diff.position.remote}`);
  }
  if (diff.cost) {
    lines.push(`Стоимость: локально ${diff.cost.local}, Stepik ${diff.cost.remote}`);
  }
  if (diff.blockPaths && diff.blockPaths.length) {
    lines.push(`stepikBlock: ${diff.blockPaths.join(', ')}`);
  }
  if (diff.localBlockJson != null && diff.remoteBlockJson != null) {
    const maxLen = 400;
    const localSnip = diff.localBlockJson.length > maxLen
      ? diff.localBlockJson.slice(0, maxLen) + '…'
      : diff.localBlockJson;
    const remoteSnip = diff.remoteBlockJson.length > maxLen
      ? diff.remoteBlockJson.slice(0, maxLen) + '…'
      : diff.remoteBlockJson;
    lines.push('---');
    lines.push('Локальный block:');
    lines.push(localSnip);
    lines.push('---');
    lines.push('Stepik block:');
    lines.push(remoteSnip);
  }
  return lines.join('\n');
}

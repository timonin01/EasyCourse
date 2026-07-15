import type { StepikBlockRequest } from '../types';

type LooseSource = Record<string, unknown> | null | undefined;

function asSource(block: StepikBlockRequest): LooseSource {
  return (block as { source?: LooseSource }).source;
}

function textOf(block: StepikBlockRequest): string {
  return ((block as { text?: string }).text ?? '').trim();
}

/**
 * Soft validation before persisting a step block.
 * Returns first human-readable error, or null if OK.
 */
export function validateStepikBlock(block: StepikBlockRequest | null | undefined): string | null {
  if (!block || !block.name) {
    return 'Некорректный блок шага';
  }

  const name = block.name;
  const text = textOf(block);
  const source = asSource(block);

  if (name !== 'text' && name !== 'fill-blanks' && name !== 'code' && !text) {
    return 'Заполните текст задания';
  }

  switch (name) {
    case 'text':
      if (!text) return 'Введите текст шага';
      return null;

    case 'choice': {
      const options = (source?.options as { text?: string; is_correct?: boolean }[] | undefined) ?? [];
      if (options.length < 2) return 'Добавьте минимум 2 варианта ответа';
      if (options.some((o) => !(o.text ?? '').trim())) return 'У всех вариантов должен быть текст';
      if (!options.some((o) => o.is_correct)) return 'Отметьте хотя бы один правильный вариант';
      return null;
    }

    case 'matching': {
      const pairs = (source?.pairs as { first?: string; second?: string }[] | undefined) ?? [];
      if (pairs.length < 1) return 'Добавьте хотя бы одну пару';
      if (pairs.some((p) => !(p.first ?? '').trim() || !(p.second ?? '').trim())) {
        return 'Заполните обе стороны всех пар';
      }
      return null;
    }

    case 'sorting': {
      const options = (source?.options as { text?: string }[] | undefined) ?? [];
      if (options.length < 2) return 'Добавьте минимум 2 элемента для сортировки';
      if (options.some((o) => !(o.text ?? '').trim())) return 'У всех элементов должен быть текст';
      return null;
    }

    case 'fill-blanks': {
      const components = (source?.components as {
        type?: string;
        text?: string;
        options?: { text?: string; is_correct?: boolean }[];
      }[] | undefined) ?? [];
      const blanks = components.filter((c) =>
        c.type === 'blank' || c.type === 'input' || c.type === 'select'
      );
      if (blanks.length < 1) return 'Добавьте хотя бы один пропуск';
      for (const blank of blanks) {
        const options = blank.options ?? [];
        if (options.length < 2) return 'У каждого пропуска должно быть минимум 2 варианта';
        if (options.some((o) => !(o.text ?? '').trim())) return 'Заполните текст всех вариантов пропуска';
        if (!options.some((o) => o.is_correct)) return 'В каждом пропуске отметьте правильный вариант';
      }
      const hasAnyText = components.some((c) => c.type === 'text' && (c.text ?? '').trim())
        || text;
      if (!hasAnyText) return 'Добавьте текст вокруг пропусков или описание задания';
      return null;
    }

    case 'string': {
      const pattern = String(source?.pattern ?? '').trim();
      if (!pattern) return 'Укажите ожидаемый ответ (pattern)';
      return null;
    }

    case 'number': {
      const options = (source?.options as { answer?: string }[] | undefined) ?? [];
      if (options.length < 1) return 'Добавьте хотя бы один правильный ответ';
      if (options.some((o) => String(o.answer ?? '').trim() === '')) {
        return 'Укажите числовой ответ';
      }
      return null;
    }

    case 'math': {
      const answer = String(source?.answer ?? '').trim();
      if (!answer) return 'Укажите правильный ответ';
      return null;
    }

    case 'free-answer':
      if (!text) return 'Введите формулировку задания';
      return null;

    case 'table': {
      const rows = (source?.rows as { name?: string }[] | undefined) ?? [];
      const columns = (source?.columns as string[] | undefined) ?? [];
      if (columns.length < 1) return 'Добавьте хотя бы одну колонку';
      if (rows.length < 1) return 'Добавьте хотя бы одну строку';
      if (rows.some((r) => !(r.name ?? '').trim())) return 'Укажите названия строк таблицы';
      return null;
    }

    case 'random-tasks': {
      const task = String(source?.task ?? '').trim();
      const solve = String(source?.solve ?? '').trim();
      if (!task) return 'Заполните шаблон задачи';
      if (!solve) return 'Заполните решение';
      return null;
    }

    case 'code': {
      if (!text) return 'Введите условие задачи';
      const testCases = (source?.test_cases as unknown[][] | undefined) ?? [];
      if (testCases.length < 1) return 'Добавьте хотя бы один тест-кейс';
      const templates = String(source?.templates_data ?? '').trim();
      if (!templates) return 'Укажите язык / templates_data';
      return null;
    }

    default:
      return null;
  }
}

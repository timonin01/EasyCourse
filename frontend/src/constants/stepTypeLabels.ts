export const STEP_TYPE_LABELS: Record<string, string> = {
  text: 'Текстовый контент',
  choice: 'Выбор ответа',
  matching: 'Сопоставление',
  sorting: 'Сортировка',
  'fill-blanks': 'Заполнить пропуски',
  string: 'Ввод строки',
  number: 'Ввод числа',
  'free-answer': 'Свободный ответ',
  math: 'Математическая задача',
  'random-tasks': 'Случайные задачи',
  table: 'Таблица',
  code: 'Задача по программированию',
  video: 'Видео',
};

/** Normalize API / enum / block names to label dictionary keys. */
function normalizeStepTypeKey(type: string): string {
  const raw = type.trim().toLowerCase().replace(/_/g, '-');
  switch (raw) {
    case 'fill-blank':
    case 'fill-blanks':
    case 'fillblanks':
      return 'fill-blanks';
    case 'free-answer':
    case 'freeanswer':
      return 'free-answer';
    case 'random-task':
    case 'random-tasks':
    case 'randomtasks':
      return 'random-tasks';
    default:
      return raw;
  }
}

export function getStepTypeLabel(type: string): string {
  const key = normalizeStepTypeKey(type);
  return STEP_TYPE_LABELS[key] || type;
}

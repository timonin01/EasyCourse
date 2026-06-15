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
};

export function getStepTypeLabel(type: string): string {
  return STEP_TYPE_LABELS[type] || type;
}

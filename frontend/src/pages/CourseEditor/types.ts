import type { StepType } from '../../types';

export type ChoiceOptionEdit = { text: string; is_correct: boolean; feedback: string };
export type MatchingPairEdit = { first: string; second: string };
export type NumberOptionEdit = { answer: string; maxError: string };
export type FillBlanksComponentEdit = {
  type: 'text' | 'blank';
  text: string;
  options: { text: string; is_correct: boolean }[];
};
export type TableRowEdit = { name: string; columns: boolean[] };

export const STEP_TYPES: { value: StepType; label: string }[] = [
  { value: 'TEXT', label: 'Текст' },
  { value: 'CHOICE', label: 'Выбор ответа' },
  { value: 'MATCHING', label: 'Сопоставление' },
  { value: 'SORTING', label: 'Сортировка' },
  { value: 'TABLE', label: 'Таблица' },
  { value: 'FILL_BLANK', label: 'Заполнить пропуски' },
  { value: 'STRING', label: 'Ввод строки' },
  { value: 'NUMBER', label: 'Ввод числа' },
  { value: 'FREE_ANSWER', label: 'Свободный ответ' },
  { value: 'MATH', label: 'Математика' },
  { value: 'RANDOM_TASKS', label: 'Случайные задания' },
  { value: 'CODE', label: 'Задача по программированию' },
];

export function stepTypeToAIString(stepType: StepType): string {
  const mapping: Record<StepType, string> = {
    TEXT: 'text',
    CHOICE: 'choice',
    MATCHING: 'matching',
    SORTING: 'sorting',
    FILL_BLANK: 'fill-blanks',
    STRING: 'string',
    NUMBER: 'number',
    FREE_ANSWER: 'free-answer',
    MATH: 'math',
    RANDOM_TASKS: 'random-tasks',
    TABLE: 'table',
    CODE: 'text',
    VIDEO: 'text',
  };
  return mapping[stepType] || 'text';
}

export const EDIT_TASK_BLOCK_NAMES = [
  'code',
  'choice',
  'matching',
  'text',
  'free-answer',
  'math',
  'number',
  'sorting',
  'string',
  'fill-blanks',
  'table',
  'random-tasks',
] as const;

import type { StepType, StepikBlockRequest } from '../types';

const STEP_TYPE_TO_BLOCK: Record<StepType, string> = {
  TEXT: 'text',
  CHOICE: 'choice',
  SORTING: 'sorting',
  MATCHING: 'matching',
  TABLE: 'table',
  FILL_BLANK: 'fill-blanks',
  STRING: 'string',
  NUMBER: 'number',
  MATH: 'math',
  FREE_ANSWER: 'free-answer',
  CODE: 'code',
  VIDEO: 'video',
  RANDOM_TASKS: 'random-tasks',
};

export function stepTypeToBlockName(type: StepType): string {
  return STEP_TYPE_TO_BLOCK[type] ?? 'text';
}

export function blockNameToStepType(blockName: string): StepType {
  const entry = Object.entries(STEP_TYPE_TO_BLOCK).find(([, name]) => name === blockName);
  return (entry?.[0] as StepType) ?? 'TEXT';
}

/** Empty but structurally valid draft blocks for the visual editor. */
export function createDefaultStepikBlock(type: StepType): StepikBlockRequest {
  const name = stepTypeToBlockName(type);

  switch (name) {
    case 'text':
      return { name: 'text', text: '' };

    case 'choice':
      return {
        name: 'choice',
        text: '',
        source: {
          is_multiple_choice: false,
          sample_size: 2,
          options: [
            { text: '', is_correct: true, feedback: '' },
            { text: '', is_correct: false, feedback: '' },
          ],
        },
      };

    case 'matching':
      return {
        name: 'matching',
        text: '',
        source: {
          pairs: [
            { first: '', second: '' },
            { first: '', second: '' },
          ],
        },
      };

    case 'sorting':
      return {
        name: 'sorting',
        text: '',
        source: {
          options: [
            { id: 1, text: '' },
            { id: 2, text: '' },
          ],
        },
      };

    case 'fill-blanks':
      return {
        name: 'fill-blanks',
        text: '',
        source: {
          components: [
            { type: 'text', text: '', options: [] },
            {
              type: 'select',
              text: '',
              options: [
                { text: '', is_correct: true },
                { text: '', is_correct: false },
              ],
            },
            { type: 'text', text: '', options: [] },
          ],
          is_case_sensitive: false,
          is_detailed_feedback: false,
          is_partially_correct: false,
        },
      };

    case 'string':
      return {
        name: 'string',
        text: '',
        source: {
          pattern: '',
          use_re: false,
          match_substring: false,
          case_sensitive: false,
          code: '',
        },
      };

    case 'number':
      return {
        name: 'number',
        text: '',
        source: {
          options: [{ answer: '0', max_error: '0' }],
        },
      };

    case 'math':
      return {
        name: 'math',
        text: '',
        source: { answer: '', max_error: '1e-06' },
      };

    case 'free-answer':
      return {
        name: 'free-answer',
        text: '',
        source: {
          is_attachments_enabled: false,
          is_html_enabled: false,
          manual_scoring: false,
        },
      };

    case 'table':
      return {
        name: 'table',
        text: '',
        source: {
          columns: ['Да', 'Нет'],
          rows: [{ name: '', columns: [true, false] }],
        },
      };

    case 'random-tasks':
      return {
        name: 'random-tasks',
        text: '',
        source: { task: '', solve: '', max_error: '' },
      };

    case 'code':
      return {
        name: 'code',
        text: '',
        video: null,
        options: null,
        source: {
          code: '',
          templates_data: '::java21',
          test_cases: [['', '']],
          execution_time_limit: 5,
          execution_memory_limit: 256,
          samples_count: 1,
          are_all_tests_run: true,
          is_run_user_code_allowed: true,
          is_time_limit_scaled: true,
          is_memory_limit_scaled: true,
          manual_time_limits: [],
          manual_memory_limits: [],
          test_archive: [],
        },
      };

    case 'video':
      return { name: 'video', text: '', video: null };

    default:
      return { name: 'text', text: '' };
  }
}

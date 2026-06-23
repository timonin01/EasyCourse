export type ChoiceOptionEdit = { text: string; is_correct: boolean; feedback: string };
export type MatchingPairEdit = { first: string; second: string };
export type NumberOptionEdit = { answer: string; maxError: string };
export type SortingOptionEdit = { id: number; text: string };
export type FillBlanksComponentEdit = {
  type: 'text' | 'blank';
  text: string;
  options: { text: string; is_correct: boolean }[];
  inputType?: 'input' | 'select';
};
export type TableRowEdit = { name: string; columns: boolean[] };

export type CodeEditData = {
  templates_data: string;
  code: string;
  test_cases: [string, string][];
  execution_time_limit: number;
  execution_memory_limit: number;
};

export type FreeAnswerEditData = {
  is_attachments_enabled: boolean;
  is_html_enabled: boolean;
  manual_scoring: boolean;
};

export type MathEditData = { answer: string; maxError: string };

export type StringEditData = {
  pattern: string;
  use_re: boolean;
  match_substring: boolean;
  case_sensitive: boolean;
  code: string;
};

export type FillBlanksEditData = {
  components: FillBlanksComponentEdit[];
  isCaseSensitive: boolean;
  isDetailedFeedback: boolean;
  isPartiallyCorrect: boolean;
};

export type TableEditData = { columnNames: string[]; rows: TableRowEdit[] };

export type RandomTasksEditData = { task: string; solve: string; maxError: string };

import type { StepikBlockRequest } from '../../../types';

export interface StepikBlockEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: StepikBlockRequest | null;
  onSave: (block: StepikBlockRequest) => void | Promise<void>;
  title?: string;
}

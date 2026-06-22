import { useEffect, useState } from 'react';
import type { StepikBlockRequest } from '../../../types';
import { buildBlockFromFormFields } from './buildBlockForm';
import { parseBlockToFormFields, type BlockFormFields } from './parseBlockForm';
import type {
  ChoiceOptionEdit,
  MatchingPairEdit,
  NumberOptionEdit,
  SortingOptionEdit,
  CodeEditData,
  FreeAnswerEditData,
  MathEditData,
  StringEditData,
  FillBlanksEditData,
  TableEditData,
  RandomTasksEditData,
} from './types';

const DEFAULT_CODE_DATA: CodeEditData = {
  templates_data: '::java21',
  code: '',
  test_cases: [['', '']],
  execution_time_limit: 5,
  execution_memory_limit: 256,
};

const DEFAULT_FREE_ANSWER: FreeAnswerEditData = {
  is_attachments_enabled: false,
  is_html_enabled: false,
  manual_scoring: false,
};

const DEFAULT_MATH_DATA: MathEditData = { answer: '', maxError: '1e-06' };

const DEFAULT_STRING_DATA: StringEditData = {
  pattern: '',
  use_re: false,
  match_substring: false,
  case_sensitive: false,
  code: '',
};

const DEFAULT_FILL_BLANKS: FillBlanksEditData = {
  components: [],
  isCaseSensitive: false,
  isDetailedFeedback: false,
  isPartiallyCorrect: false,
};

const DEFAULT_TABLE_DATA: TableEditData = { columnNames: [], rows: [] };

const DEFAULT_RANDOM_TASKS: RandomTasksEditData = { task: '', solve: '', maxError: '' };

export function useStepikBlockForm(block: StepikBlockRequest | null, isOpen: boolean, blockName: string) {
  const [text, setText] = useState('');
  const [feedbackCorrect, setFeedbackCorrect] = useState('');
  const [feedbackWrong, setFeedbackWrong] = useState('');
  const [choiceOptions, setChoiceOptions] = useState<ChoiceOptionEdit[]>([]);
  const [choiceSourceRest, setChoiceSourceRest] = useState<Record<string, unknown>>({});
  const [matchingPairs, setMatchingPairs] = useState<MatchingPairEdit[]>([]);
  const [matchingSourceRest, setMatchingSourceRest] = useState<Record<string, unknown>>({});
  const [codeData, setCodeData] = useState<CodeEditData>(DEFAULT_CODE_DATA);
  const [freeAnswer, setFreeAnswer] = useState<FreeAnswerEditData>(DEFAULT_FREE_ANSWER);
  const [mathData, setMathData] = useState<MathEditData>(DEFAULT_MATH_DATA);
  const [mathNtRest, setMathNtRest] = useState<Record<string, unknown>>({});
  const [numberOptions, setNumberOptions] = useState<NumberOptionEdit[]>([]);
  const [numberSourceRest, setNumberSourceRest] = useState<Record<string, unknown>>({});
  const [sortingOptions, setSortingOptions] = useState<SortingOptionEdit[]>([]);
  const [sortingSourceRest, setSortingSourceRest] = useState<Record<string, unknown>>({});
  const [stringData, setStringData] = useState<StringEditData>(DEFAULT_STRING_DATA);
  const [fillBlanks, setFillBlanks] = useState<FillBlanksEditData>(DEFAULT_FILL_BLANKS);
  const [tableData, setTableData] = useState<TableEditData>(DEFAULT_TABLE_DATA);
  const [tableOptions, setTableOptions] = useState<Record<string, unknown>>({});
  const [randomTasks, setRandomTasks] = useState<RandomTasksEditData>(DEFAULT_RANDOM_TASKS);
  const [sourceJson, setSourceJson] = useState('');

  useEffect(() => {
    if (!isOpen || !block) return;

    const parsed = parseBlockToFormFields(block, blockName);

    setText(parsed.text ?? '');
    setFeedbackCorrect(parsed.feedbackCorrect ?? '');
    setFeedbackWrong(parsed.feedbackWrong ?? '');

    if (parsed.choiceOptions) setChoiceOptions(parsed.choiceOptions);
    if (parsed.choiceSourceRest) setChoiceSourceRest(parsed.choiceSourceRest);
    if (parsed.matchingPairs) setMatchingPairs(parsed.matchingPairs);
    if (parsed.matchingSourceRest) setMatchingSourceRest(parsed.matchingSourceRest);
    if (parsed.codeData) setCodeData(parsed.codeData);
    if (parsed.freeAnswer) setFreeAnswer(parsed.freeAnswer);
    if (parsed.mathData) setMathData(parsed.mathData);
    if (parsed.mathNtRest) setMathNtRest(parsed.mathNtRest);
    if (parsed.numberOptions) setNumberOptions(parsed.numberOptions);
    if (parsed.numberSourceRest) setNumberSourceRest(parsed.numberSourceRest);
    if (parsed.sortingOptions) setSortingOptions(parsed.sortingOptions);
    if (parsed.sortingSourceRest) setSortingSourceRest(parsed.sortingSourceRest);
    if (parsed.stringData) setStringData(parsed.stringData);
    if (parsed.fillBlanks) setFillBlanks(parsed.fillBlanks);
    if (parsed.tableData) setTableData(parsed.tableData);
    if (parsed.tableOptions) setTableOptions(parsed.tableOptions);
    if (parsed.randomTasks) setRandomTasks(parsed.randomTasks);
    if (parsed.sourceJson !== undefined) setSourceJson(parsed.sourceJson);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, block, blockName]);

  const getFormFields = (): BlockFormFields => ({
    text,
    feedbackCorrect,
    feedbackWrong,
    choiceOptions,
    choiceSourceRest,
    matchingPairs,
    matchingSourceRest,
    codeData,
    freeAnswer,
    mathData,
    mathNtRest,
    numberOptions,
    numberSourceRest,
    sortingOptions,
    sortingSourceRest,
    stringData,
    fillBlanks,
    tableData,
    tableOptions,
    randomTasks,
    sourceJson,
  });

  const buildUpdatedBlock = (): StepikBlockRequest | null => {
    if (!block) return null;
    return buildBlockFromFormFields(block, blockName, getFormFields());
  };

  return {
    text,
    setText,
    feedbackCorrect,
    setFeedbackCorrect,
    feedbackWrong,
    setFeedbackWrong,
    choiceOptions,
    setChoiceOptions,
    matchingPairs,
    setMatchingPairs,
    codeData,
    setCodeData,
    freeAnswer,
    setFreeAnswer,
    mathData,
    setMathData,
    numberOptions,
    setNumberOptions,
    sortingOptions,
    setSortingOptions,
    stringData,
    setStringData,
    fillBlanks,
    setFillBlanks,
    tableData,
    setTableData,
    randomTasks,
    setRandomTasks,
    sourceJson,
    setSourceJson,
    buildUpdatedBlock,
  };
}

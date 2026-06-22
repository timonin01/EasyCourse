import { KNOWN_BLOCK_NAMES } from '../blockMeta';
import type { useStepikBlockForm } from '../useStepikBlockForm';
import { TextBlockEditor } from './TextBlockEditor';
import { ChoiceBlockEditor } from './ChoiceBlockEditor';
import { MatchingBlockEditor } from './MatchingBlockEditor';
import { CodeBlockEditor } from './CodeBlockEditor';
import { FreeAnswerBlockEditor } from './FreeAnswerBlockEditor';
import { MathBlockEditor } from './MathBlockEditor';
import { NumberBlockEditor } from './NumberBlockEditor';
import { SortingBlockEditor } from './SortingBlockEditor';
import { StringBlockEditor } from './StringBlockEditor';
import { FillBlanksBlockEditor } from './FillBlanksBlockEditor';
import { TableBlockEditor } from './TableBlockEditor';
import { RandomTasksBlockEditor } from './RandomTasksBlockEditor';
import { GenericBlockEditor } from './GenericBlockEditor';

type FormState = ReturnType<typeof useStepikBlockForm>;

interface BlockEditorBodyProps {
  blockName: string;
  form: FormState;
}

export function BlockEditorBody({ blockName, form }: BlockEditorBodyProps) {
  const feedbackProps = {
    feedbackCorrect: form.feedbackCorrect,
    feedbackWrong: form.feedbackWrong,
    onFeedbackCorrectChange: form.setFeedbackCorrect,
    onFeedbackWrongChange: form.setFeedbackWrong,
  };

  switch (blockName) {
    case 'text':
      return (
        <TextBlockEditor
          text={form.text}
          onTextChange={form.setText}
          {...feedbackProps}
        />
      );
    case 'choice':
      return (
        <ChoiceBlockEditor
          text={form.text}
          onTextChange={form.setText}
          choiceOptions={form.choiceOptions}
          onChoiceOptionsChange={form.setChoiceOptions}
          {...feedbackProps}
        />
      );
    case 'matching':
      return (
        <MatchingBlockEditor
          text={form.text}
          onTextChange={form.setText}
          matchingPairs={form.matchingPairs}
          onMatchingPairsChange={form.setMatchingPairs}
          {...feedbackProps}
        />
      );
    case 'code':
      return (
        <CodeBlockEditor
          text={form.text}
          onTextChange={form.setText}
          codeData={form.codeData}
          onCodeDataChange={form.setCodeData}
          {...feedbackProps}
        />
      );
    case 'free-answer':
      return (
        <FreeAnswerBlockEditor
          text={form.text}
          onTextChange={form.setText}
          freeAnswer={form.freeAnswer}
          onFreeAnswerChange={form.setFreeAnswer}
          {...feedbackProps}
        />
      );
    case 'math':
      return (
        <MathBlockEditor
          text={form.text}
          onTextChange={form.setText}
          mathData={form.mathData}
          onMathDataChange={form.setMathData}
          {...feedbackProps}
        />
      );
    case 'number':
      return (
        <NumberBlockEditor
          text={form.text}
          onTextChange={form.setText}
          numberOptions={form.numberOptions}
          onNumberOptionsChange={form.setNumberOptions}
          {...feedbackProps}
        />
      );
    case 'sorting':
      return (
        <SortingBlockEditor
          text={form.text}
          onTextChange={form.setText}
          sortingOptions={form.sortingOptions}
          onSortingOptionsChange={form.setSortingOptions}
          {...feedbackProps}
        />
      );
    case 'string':
      return (
        <StringBlockEditor
          text={form.text}
          onTextChange={form.setText}
          stringData={form.stringData}
          onStringDataChange={form.setStringData}
          {...feedbackProps}
        />
      );
    case 'fill-blanks':
      return (
        <FillBlanksBlockEditor
          text={form.text}
          onTextChange={form.setText}
          fillBlanks={form.fillBlanks}
          onFillBlanksChange={form.setFillBlanks}
          {...feedbackProps}
        />
      );
    case 'table':
      return (
        <TableBlockEditor
          text={form.text}
          onTextChange={form.setText}
          tableData={form.tableData}
          onTableDataChange={form.setTableData}
          {...feedbackProps}
        />
      );
    case 'random-tasks':
      return (
        <RandomTasksBlockEditor
          text={form.text}
          onTextChange={form.setText}
          randomTasks={form.randomTasks}
          onRandomTasksChange={form.setRandomTasks}
          {...feedbackProps}
        />
      );
    default:
      if (!KNOWN_BLOCK_NAMES.includes(blockName)) {
        return (
          <GenericBlockEditor
            text={form.text}
            onTextChange={form.setText}
            sourceJson={form.sourceJson}
            onSourceJsonChange={form.setSourceJson}
            {...feedbackProps}
          />
        );
      }
      return null;
  }
}

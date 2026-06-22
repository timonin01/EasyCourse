import { Code, Settings2, Hash } from 'lucide-react';
import { FormSection, Input } from '../../../ui';
import type { RandomTasksEditData } from '../types';
import { ConditionSection } from '../sections/ConditionSection';
import { FeedbackSection } from '../sections/FeedbackSection';

interface RandomTasksBlockEditorProps {
  text: string;
  onTextChange: (value: string) => void;
  randomTasks: RandomTasksEditData;
  onRandomTasksChange: (data: RandomTasksEditData | ((prev: RandomTasksEditData) => RandomTasksEditData)) => void;
  feedbackCorrect: string;
  feedbackWrong: string;
  onFeedbackCorrectChange: (value: string) => void;
  onFeedbackWrongChange: (value: string) => void;
}

export function RandomTasksBlockEditor({
  text,
  onTextChange,
  randomTasks,
  onRandomTasksChange,
  feedbackCorrect,
  feedbackWrong,
  onFeedbackCorrectChange,
  onFeedbackWrongChange,
}: RandomTasksBlockEditorProps) {
  return (
    <>
      <ConditionSection text={text} onTextChange={onTextChange} rows={4} placeholder="Общее описание задачи..." />
      <FormSection title="Шаблон задачи (task)" icon={<Code className="w-4 h-4" />} description="Python-код для генерации текста и параметров задачи" variant="highlight">
        <textarea
          value={randomTasks.task}
          onChange={(e) => onRandomTasksChange((p) => ({ ...p, task: e.target.value }))}
          rows={5}
          placeholder="# Код генерации задачи..."
          className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-xl text-dark-100 font-mono text-sm focus:ring-2 focus:ring-primary-500/50"
        />
      </FormSection>
      <FormSection title="Шаблон решения (solve)" icon={<Code className="w-4 h-4" />} description="Python-код для вычисления правильного ответа">
        <textarea
          value={randomTasks.solve}
          onChange={(e) => onRandomTasksChange((p) => ({ ...p, solve: e.target.value }))}
          rows={5}
          placeholder="# Код решения..."
          className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-xl text-dark-100 font-mono text-sm focus:ring-2 focus:ring-primary-500/50"
        />
      </FormSection>
      <FormSection title="Настройки проверки" icon={<Settings2 className="w-4 h-4" />}>
        <Input label="Допустимая погрешность (max_error)" value={randomTasks.maxError} onChange={(e) => onRandomTasksChange((p) => ({ ...p, maxError: e.target.value }))} placeholder="0.01" hint="Для числовых ответов" icon={<Hash className="w-4 h-4" />} />
      </FormSection>
      <FeedbackSection
        feedbackCorrect={feedbackCorrect}
        feedbackWrong={feedbackWrong}
        onFeedbackCorrectChange={onFeedbackCorrectChange}
        onFeedbackWrongChange={onFeedbackWrongChange}
      />
    </>
  );
}

import { Settings2, Paperclip, Code, UserCheck } from 'lucide-react';
import { FormSection, Toggle } from '../../../ui';
import type { FreeAnswerEditData } from '../types';
import { ConditionSection } from '../sections/ConditionSection';
import { FeedbackSection } from '../sections/FeedbackSection';

interface FreeAnswerBlockEditorProps {
  text: string;
  onTextChange: (value: string) => void;
  freeAnswer: FreeAnswerEditData;
  onFreeAnswerChange: (data: FreeAnswerEditData | ((prev: FreeAnswerEditData) => FreeAnswerEditData)) => void;
  feedbackCorrect: string;
  feedbackWrong: string;
  onFeedbackCorrectChange: (value: string) => void;
  onFeedbackWrongChange: (value: string) => void;
}

export function FreeAnswerBlockEditor({
  text,
  onTextChange,
  freeAnswer,
  onFreeAnswerChange,
  feedbackCorrect,
  feedbackWrong,
  onFeedbackCorrectChange,
  onFeedbackWrongChange,
}: FreeAnswerBlockEditorProps) {
  return (
    <>
      <ConditionSection text={text} onTextChange={onTextChange} rows={5} placeholder="Опишите задание для студента..." />
      <FormSection title="Настройки ответа" icon={<Settings2 className="w-4 h-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Paperclip className="w-4 h-4" /></div>
            <Toggle checked={freeAnswer.is_attachments_enabled} onChange={(v) => onFreeAnswerChange((p) => ({ ...p, is_attachments_enabled: v }))} label="Вложения" description="Разрешить прикреплять файлы" size="sm" />
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Code className="w-4 h-4" /></div>
            <Toggle checked={freeAnswer.is_html_enabled} onChange={(v) => onFreeAnswerChange((p) => ({ ...p, is_html_enabled: v }))} label="HTML" description="Разрешить форматирование" size="sm" />
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><UserCheck className="w-4 h-4" /></div>
            <Toggle checked={freeAnswer.manual_scoring} onChange={(v) => onFreeAnswerChange((p) => ({ ...p, manual_scoring: v }))} label="Ручная оценка" description="Преподаватель проверяет" size="sm" />
          </div>
        </div>
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

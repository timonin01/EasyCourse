import { Plus, Trash2, ArrowUpDown, GripVertical } from 'lucide-react';
import { FormSection, AddButton, SortableList } from '../../../ui';
import type { SortingOptionEdit } from '../types';
import { ConditionSection } from '../sections/ConditionSection';
import { FeedbackSection } from '../sections/FeedbackSection';

interface SortingBlockEditorProps {
  text: string;
  onTextChange: (value: string) => void;
  sortingOptions: SortingOptionEdit[];
  onSortingOptionsChange: (options: SortingOptionEdit[]) => void;
  feedbackCorrect: string;
  feedbackWrong: string;
  onFeedbackCorrectChange: (value: string) => void;
  onFeedbackWrongChange: (value: string) => void;
}

export function SortingBlockEditor({
  text,
  onTextChange,
  sortingOptions,
  onSortingOptionsChange,
  feedbackCorrect,
  feedbackWrong,
  onFeedbackCorrectChange,
  onFeedbackWrongChange,
}: SortingBlockEditorProps) {
  return (
    <>
      <ConditionSection text={text} onTextChange={onTextChange} rows={4} placeholder="Расположите элементы в правильном порядке..." />
      <FormSection title="Элементы для сортировки" icon={<ArrowUpDown className="w-4 h-4" />} description="Перетаскивайте элементы, чтобы задать правильный порядок" variant="highlight">
        <SortableList
          items={sortingOptions}
          onReorder={onSortingOptionsChange}
          className="pl-0"
          renderItem={(opt, index) => (
            <div className="flex gap-3 items-center p-3 rounded-xl bg-dark-800/50 border border-dark-600 hover:border-primary-500/30 transition-colors group">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-dark-500 cursor-grab active:cursor-grabbing" />
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-500/10 text-primary-400 text-sm font-medium">{index + 1}</div>
              </div>
              <input
                type="text"
                value={opt.text}
                onChange={(e) => {
                  const next = [...sortingOptions];
                  const idx = next.findIndex((o) => o.id === opt.id);
                  if (idx !== -1) {
                    next[idx] = { ...next[idx], text: e.target.value };
                    onSortingOptionsChange(next);
                  }
                }}
                placeholder="Введите текст элемента..."
                className="flex-1 px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50"
              />
              <button
                type="button"
                onClick={() => {
                  const next = sortingOptions.filter((o) => o.id !== opt.id);
                  onSortingOptionsChange(next.length ? next : [{ id: Date.now(), text: '' }]);
                }}
                className="p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
        <AddButton
          variant="dashed"
          fullWidth
          className="mt-3"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            const newId = Math.max(...sortingOptions.map((o) => o.id), 0) + 1;
            onSortingOptionsChange([...sortingOptions, { id: newId, text: '' }]);
          }}
        >
          Добавить элемент
        </AddButton>
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

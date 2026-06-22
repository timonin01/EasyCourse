import { ArrowLeftRight, Link2 } from 'lucide-react';
import { FormSection, OptionCard, AddButton } from '../../../ui';
import type { MatchingPairEdit } from '../types';
import { ConditionSection } from '../sections/ConditionSection';
import { FeedbackSection } from '../sections/FeedbackSection';

interface MatchingBlockEditorProps {
  text: string;
  onTextChange: (value: string) => void;
  matchingPairs: MatchingPairEdit[];
  onMatchingPairsChange: (pairs: MatchingPairEdit[]) => void;
  feedbackCorrect: string;
  feedbackWrong: string;
  onFeedbackCorrectChange: (value: string) => void;
  onFeedbackWrongChange: (value: string) => void;
}

export function MatchingBlockEditor({
  text,
  onTextChange,
  matchingPairs,
  onMatchingPairsChange,
  feedbackCorrect,
  feedbackWrong,
  onFeedbackCorrectChange,
  onFeedbackWrongChange,
}: MatchingBlockEditorProps) {
  return (
    <>
      <ConditionSection text={text} onTextChange={onTextChange} rows={4} placeholder="Опишите задание для студента..." />
      <FormSection title="Пары для сопоставления" icon={<ArrowLeftRight className="w-4 h-4" />} description="Соедините элементы левого столбца с правым" variant="highlight">
        <div className="space-y-3">
          {matchingPairs.map((pair, i) => (
            <OptionCard
              key={i}
              onDelete={() => {
                const next = matchingPairs.filter((_, j) => j !== i);
                onMatchingPairsChange(next.length ? next : [{ first: '', second: '' }]);
              }}
            >
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <div className="text-xs text-dark-500 mb-1">Левая часть</div>
                  <input
                    type="text"
                    value={pair.first}
                    onChange={(e) => {
                      const next = [...matchingPairs];
                      next[i] = { ...next[i], first: e.target.value };
                      onMatchingPairsChange(next);
                    }}
                    placeholder="Элемент слева..."
                    className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                  />
                </div>
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <div className="w-8 h-px bg-gradient-to-r from-primary-500/50 to-emerald-500/50" />
                  <ArrowLeftRight className="w-4 h-4 text-primary-400" />
                  <div className="w-8 h-px bg-gradient-to-r from-primary-500/50 to-emerald-500/50" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-dark-500 mb-1">Правая часть</div>
                  <input
                    type="text"
                    value={pair.second}
                    onChange={(e) => {
                      const next = [...matchingPairs];
                      next[i] = { ...next[i], second: e.target.value };
                      onMatchingPairsChange(next);
                    }}
                    placeholder="Соответствующий элемент..."
                    className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                  />
                </div>
              </div>
            </OptionCard>
          ))}
        </div>
        <AddButton
          variant="dashed"
          fullWidth
          className="mt-3"
          icon={<Link2 className="w-4 h-4" />}
          onClick={() => onMatchingPairsChange([...matchingPairs, { first: '', second: '' }])}
        >
          Добавить пару
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

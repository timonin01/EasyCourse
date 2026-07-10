import { Bot, Loader2, Send, Sparkles, User } from 'lucide-react';
import { clsx } from 'clsx';
import type { KeyboardEvent, RefObject } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Textarea } from '../../../components/ui/Textarea';
import type { EntityCandidate, CoursePlanDTO } from '../../../types';
import type { CourseAgentChatMessage } from '../useCourseAgent';
import { PlanPanel } from './PlanPanel';

interface CourseAgentChatPanelProps {
  messages: CourseAgentChatMessage[];
  candidates: EntityCandidate[];
  pendingPlan: CoursePlanDTO | null;
  isLoading: boolean;
  isExecuting: boolean;
  input: string;
  messagesEndRef: RefObject<HTMLDivElement>;
  onInputChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onChooseCandidate: (candidate: EntityCandidate) => void;
  onConfirmPlan: () => void;
  onCancelPlan: () => void;
  onChangePlan: (plan: CoursePlanDTO) => void;
}

export function CourseAgentChatPanel({
  messages,
  candidates,
  pendingPlan,
  isLoading,
  isExecuting,
  input,
  messagesEndRef,
  onInputChange,
  onKeyDown,
  onSend,
  onChooseCandidate,
  onConfirmPlan,
  onCancelPlan,
  onChangePlan,
}: CourseAgentChatPanelProps) {
  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden" padding="none">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {messages.length === 0 && candidates.length === 0 ? (
          <div className="flex h-full min-h-[16rem] flex-col items-center justify-center px-4 text-center">
            <div className="mb-4 rounded-2xl bg-dark-800 p-4">
              <Sparkles className="h-10 w-10 text-primary-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-dark-200">AI-агент курса</h3>
            <p className="max-w-lg text-sm text-dark-500">
              Опишите задачу или выберите модуль, урок или шаг в структуре справа.
              Например: «Создай модуль про наследование с 2 уроками и задачами».
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={clsx('flex gap-3', message.role === 'user' ? 'justify-end' : '')}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600/15">
                    <Bot className="h-4 w-4 text-primary-400" />
                  </div>
                )}
                <div
                  className={clsx(
                    'max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm',
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'border border-dark-700 bg-dark-850 text-dark-200',
                  )}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dark-800">
                    <User className="h-4 w-4 text-dark-400" />
                  </div>
                )}
              </div>
            ))}

            {candidates.length > 0 && (
              <div className="rounded-xl border border-dark-700 bg-dark-850 p-3">
                <div className="mb-2 text-xs text-dark-500">Выберите вариант:</div>
                <div className="flex flex-col gap-1.5">
                  {candidates.map((candidate) => (
                    <button
                      key={`${candidate.type}-${candidate.id}`}
                      type="button"
                      onClick={() => onChooseCandidate(candidate)}
                      className="rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-left text-sm text-dark-200 transition-colors hover:border-primary-500 hover:text-primary-300"
                    >
                      {candidate.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-dark-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {pendingPlan ? 'Корректирую план…' : 'Думаю…'}
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {pendingPlan && (
        <div className="flex min-h-0 max-h-[min(50vh,28rem)] shrink-0 flex-col border-t border-dark-700/60">
          <PlanPanel
            plan={pendingPlan}
            isExecuting={isExecuting}
            onConfirm={onConfirmPlan}
            onCancel={onCancelPlan}
            onChange={onChangePlan}
          />
        </div>
      )}

      <div className="shrink-0 border-t border-dark-700/60 p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={pendingPlan
                ? 'Напишите, что скорректировать в плане…'
                : 'Опишите задачу для агента…'}
              rows={3}
              disabled={isLoading || isExecuting}
              className="min-h-[4.5rem] resize-none"
            />
          </div>
          <Button
            variant="primary"
            onClick={onSend}
            disabled={isLoading || isExecuting || !input.trim()}
            className="h-9 w-9 shrink-0 p-0"
            aria-label="Отправить"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

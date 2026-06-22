import { Bot, User, Eye, Send } from 'lucide-react';
import { Button, Card, Select, LlmModelSelect, Badge, Spinner } from '../../../components/ui';
import { ChatMarkdown } from '../../../components/ui/ChatMarkdown';
import { CHAT_PROMPT_SUGGESTIONS, GENERATE_PROMPT_SUGGESTIONS } from '../../../constants/aiPromptSuggestions';
import { clampPromptLength } from '../../../constants/aiPromptLimits';
import { MODEL_PRO_MESSAGE } from '../../../constants/subscription';
import { getStepTypeLabel } from '../../../constants/stepTypeLabels';
import type { RefObject, KeyboardEvent } from 'react';
import toast from 'react-hot-toast';
import { PromptSuggestionChips } from './PromptSuggestionChips';
import { STEP_TYPE_OPTIONS } from '../constants';
import type { AIGeneratorMode } from '../types';
import type { ChatMessage, StepikBlockRequest } from '../../../types';

interface ChatPanelProps {
  mode: AIGeneratorMode;
  stepType: string;
  messages: ChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement>;
  isLoading: boolean;
  input: string;
  promptMaxLength: number;
  selectedLlmModel: string;
  canSelectModel: boolean;
  onStepTypeChange: (value: string) => void;
  onInputChange: (value: string) => void;
  onKeyPress: (e: KeyboardEvent) => void;
  onSend: () => void;
  onLlmModelChange: (value: string) => void;
  onRestoreGeneratedStep: (step: StepikBlockRequest) => void;
}

export function ChatPanel({
  mode,
  stepType,
  messages,
  messagesEndRef,
  isLoading,
  input,
  promptMaxLength,
  selectedLlmModel,
  canSelectModel,
  onStepTypeChange,
  onInputChange,
  onKeyPress,
  onSend,
  onLlmModelChange,
  onRestoreGeneratedStep,
}: ChatPanelProps) {
  return (
    <>
      {mode === 'generate' && (
        <div className="mb-4 flex-shrink-0 space-y-3">
          <Select
            label="Тип генерируемого шага"
            options={[...STEP_TYPE_OPTIONS]}
            value={stepType}
            onChange={(e) => onStepTypeChange(e.target.value)}
          />
        </div>
      )}

      <Card className="flex-1 overflow-hidden flex flex-col min-h-0" padding="none">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 min-w-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-2">
              <div className="p-4 bg-primary-600/20 rounded-2xl mb-4">
                <Bot className="w-12 h-12 text-primary-400" />
              </div>
              <h3 className="text-lg font-medium text-dark-200 mb-2">Привет! Я ваш AI-ассистент</h3>
              <p className="text-dark-400 max-w-md">
                {mode === 'chat'
                  ? 'Задайте любой вопрос, и я постараюсь помочь. Я могу объяснить сложные темы, помочь с идеями для курсов или просто поболтать.'
                  : 'Опишите, какой шаг вы хотите создать, и я сгенерирую его для вас. Например: "Создай тест про фотосинтез с 4 вариантами ответа"'}
              </p>
              <PromptSuggestionChips
                suggestions={mode === 'chat' ? CHAT_PROMPT_SUGGESTIONS : GENERATE_PROMPT_SUGGESTIONS}
                onSelect={(prompt) => onInputChange(clampPromptLength(prompt, promptMaxLength))}
                maxLength={promptMaxLength}
              />
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex gap-3 min-w-0 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-primary-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] min-w-0 break-words rounded-2xl px-4 py-3 ${
                    message.role === 'user' ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-200'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <ChatMarkdown content={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}

                  {message.role === 'assistant' && message.generatedStep && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-dark-700">
                      <Badge variant="info">{getStepTypeLabel(message.stepType || stepType)}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRestoreGeneratedStep(message.generatedStep!)}
                        className="h-7 px-2 text-dark-300 hover:text-dark-100"
                        title="Показать этот шаг в предпросмотре"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        В предпросмотр
                      </Button>
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-dark-300" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary-600/20 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-400" />
              </div>
              <div className="bg-dark-800 rounded-2xl px-4 py-3">
                <Spinner size="sm" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 flex-shrink-0 min-w-0 overflow-x-hidden">
          <div className="space-y-1.5">
            <div className="flex justify-end">
              <span className={`text-xs ${input.length >= promptMaxLength ? 'text-amber-400' : 'text-dark-500'}`}>
                {input.length}/{promptMaxLength}
              </span>
            </div>
            <div className="flex min-h-[7rem] flex-col rounded-xl border border-dark-600 bg-dark-800/80 transition-all duration-200 hover:border-dark-500 focus-within:border-primary-500/50 focus-within:ring-2 focus-within:ring-primary-500/50">
              <textarea
                placeholder={mode === 'chat' ? 'Напишите сообщение...' : 'Опишите шаг, который хотите создать...'}
                value={input}
                onChange={(e) => onInputChange(clampPromptLength(e.target.value, promptMaxLength))}
                onKeyDown={onKeyPress}
                rows={4}
                maxLength={promptMaxLength}
                className="block min-h-[4.5rem] max-h-40 w-full flex-1 resize-none overflow-y-auto bg-transparent px-4 pt-3 pb-2 text-dark-100 placeholder-dark-500 focus:outline-none scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-transparent"
              />
              <div className="flex flex-shrink-0 items-center justify-between gap-2 px-2 pb-2 pt-2">
                <div className="w-40 min-w-0 sm:w-44">
                  <LlmModelSelect
                    value={selectedLlmModel}
                    onChange={onLlmModelChange}
                    menuPlacement="top"
                    className="h-9 border-dark-600/80 bg-dark-700/60 py-1.5"
                    canSelectModel={canSelectModel}
                    onProModelAttempt={() => toast.error(MODEL_PRO_MESSAGE)}
                  />
                </div>
                <Button onClick={onSend} disabled={!input.trim() || isLoading} className="ml-auto h-9 w-9 flex-shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

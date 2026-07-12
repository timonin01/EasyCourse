import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot } from 'lucide-react';
import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import toast from 'react-hot-toast';
import { stepsApi } from '../../api';
import type { Step } from '../../types';
import { MainLayout } from '../../components/Layout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { useResizableWidth } from '../../hooks/useResizableWidth';
import { CourseAgentChatPanel } from './components/CourseAgentChatPanel';
import { CourseTreePanel } from './components/CourseTreePanel';
import { StepPreviewModal } from './components/StepPreviewModal';
import type { CourseTreeSelection } from './types';
import { useCourseAgent } from './useCourseAgent';
import { useCourseStructure } from './useCourseStructure';
import { buildContextPrompt } from './utils/contextPrompt';
import { resolveTreeNode } from './utils/resolveTreeNode';

export function CourseAgent() {
  const agent = useCourseAgent();
  const { pendingHandoff, clearPendingHandoff } = agent;
  const structure = useCourseStructure(agent.selectedCourseId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [treeSelection, setTreeSelection] = useState<CourseTreeSelection | null>(null);
  const [previewStep, setPreviewStep] = useState<Step | null>(null);
  const [previewStepLoading, setPreviewStepLoading] = useState(false);
  const [stepModalOpen, setStepModalOpen] = useState(false);

  const { width: treeWidth, isResizing, startResize } = useResizableWidth({
    storageKey: 'course-agent-tree-width',
    defaultWidth: 320,
    minWidth: 260,
    maxWidth: 480,
  });

  useEffect(() => {
    agent.registerStructureRefresh(() => {
      void structure.loadStructure();
    });
  }, [agent.registerStructureRefresh, structure.loadStructure]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agent.messages, agent.candidates, agent.isLoading, agent.pendingPlan]);

  useEffect(() => {
    if (!agent.pendingPlan && !agent.candidates.length) {
      return;
    }

    if (agent.pendingPlan?.actions) {
      for (const action of agent.pendingPlan.actions) {
        if (action.targetSectionId) {
          structure.expandToNode('section', action.targetSectionId);
        }
        if (action.targetLessonId) {
          structure.expandToNode('lesson', action.targetLessonId);
        }
        if (action.targetStepId) {
          structure.expandToNode('step', action.targetStepId);
        }
      }
    }
    for (const candidate of agent.candidates) {
      structure.expandToNode(candidate.type, candidate.id);
    }
  }, [
    agent.pendingPlan,
    agent.candidates,
    structure.expandToNode,
  ]);

  useEffect(() => {
    for (const sectionId of agent.treeHighlight.sectionIds) {
      structure.expandToNode('section', sectionId);
    }
    for (const lessonId of agent.treeHighlight.lessonIds) {
      structure.expandToNode('lesson', lessonId);
    }
    for (const stepId of agent.treeHighlight.stepIds) {
      structure.expandToNode('step', stepId);
    }
  }, [agent.treeHighlight, structure.expandToNode]);

  useEffect(() => {
    if (!pendingHandoff?.lessonId || structure.sections.length === 0) {
      return;
    }

    const lessonId = pendingHandoff.lessonId;
    structure.expandToNode('lesson', lessonId);
    setTreeSelection({ type: 'lesson', id: lessonId });
    clearPendingHandoff();
  }, [pendingHandoff, structure.sections.length, structure.expandToNode, clearPendingHandoff]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      agent.handleSend();
    }
  };

  const handleSelectNode = useCallback((selection: CourseTreeSelection) => {
    setTreeSelection(selection);
    structure.expandToNode(selection.type, selection.id);

    if (selection.type === 'step') {
      setStepModalOpen(true);
      setPreviewStepLoading(true);
      void stepsApi.getStep(selection.id)
        .then(setPreviewStep)
        .catch((error) => {
          console.error('Failed to load step preview:', error);
          toast.error('Не удалось загрузить содержимое шага');
          setPreviewStep(null);
          setStepModalOpen(false);
        })
        .finally(() => setPreviewStepLoading(false));
      return;
    }

    setStepModalOpen(false);
    setPreviewStep(null);
    const context = buildContextPrompt(selection, structure.sections);
    agent.appendInputContext(context);
  }, [agent.appendInputContext, structure.expandToNode, structure.sections]);

  const handleClosePreview = useCallback(() => {
    setStepModalOpen(false);
    setPreviewStep(null);
    setPreviewStepLoading(false);
    if (treeSelection?.type === 'step') {
      setTreeSelection(null);
    }
  }, [treeSelection?.type]);

  const handleAddStepToChat = useCallback(() => {
    if (!treeSelection || treeSelection.type !== 'step') {
      return;
    }
    const context = buildContextPrompt(treeSelection, structure.sections);
    agent.appendInputContext(context);
    handleClosePreview();
  }, [agent.appendInputContext, handleClosePreview, structure.sections, treeSelection]);

  const previewMeta = useMemo(() => {
    if (!treeSelection || treeSelection.type !== 'step') {
      return {};
    }
    return resolveTreeNode(treeSelection, structure.sections);
  }, [structure.sections, treeSelection]);

  const handleRefreshStructure = useCallback(() => {
    void structure.loadStructure();
  }, [structure.loadStructure]);

  const treePanelStyle = useMemo(
    () => ({ '--tree-width': `${treeWidth}px` } as CSSProperties),
    [treeWidth],
  );

  return (
    <MainLayout>
      <div className="flex min-h-0 h-[calc(100dvh-7rem)] max-h-[calc(100dvh-7rem)] flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            title="AI-агент курса"
            description="Опишите задачу в чате или выберите элемент в структуре курса справа"
            icon={<Bot className="h-5 w-5" />}
            iconAccent="purple"
            className="mb-0"
          />
          <div className="w-full max-w-sm shrink-0">
            <Select
              label="Курс"
              options={agent.courseOptions.length ? agent.courseOptions : [{ value: '', label: 'Нет курсов' }]}
              value={agent.selectedCourseId ? String(agent.selectedCourseId) : ''}
              onChange={(event) => {
                setTreeSelection(null);
                setPreviewStep(null);
                setPreviewStepLoading(false);
                setStepModalOpen(false);
                agent.setSelectedCourseId(event.target.value ? Number(event.target.value) : null);
              }}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <CourseAgentChatPanel
              messages={agent.messages}
              candidates={agent.candidates}
              pendingPlan={agent.pendingPlan}
              agentMode={agent.agentMode}
              onAgentModeChange={agent.setAgentMode}
              isLoading={agent.isLoading}
              isExecuting={agent.isExecuting}
              loadingStatus={agent.loadingStatus}
              input={agent.input}
              messagesEndRef={messagesEndRef}
              onInputChange={agent.setInput}
              onKeyDown={handleKeyDown}
              onSend={agent.handleSend}
              onChooseCandidate={(candidate) => void agent.chooseCandidate(candidate)}
              onConfirmPlan={() => void agent.confirmPlan()}
              onCancelPlan={() => void agent.cancelPlan()}
              onChangePlan={agent.updatePlan}
              onResetSession={() => void agent.resetSession()}
            />
          </div>

          <div
            className={clsx(
              'relative flex min-h-[280px] shrink-0 flex-col xl:min-h-0 xl:w-[var(--tree-width)]',
              isResizing && 'select-none',
            )}
            style={treePanelStyle}
          >
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Изменить ширину панели структуры"
              title="Потяните, чтобы изменить ширину"
              onMouseDown={startResize}
              className={clsx(
                'absolute -left-3 top-0 z-10 hidden h-full w-6 cursor-col-resize xl:block',
                'before:absolute before:left-1/2 before:top-0 before:h-full before:w-1 before:-translate-x-1/2 before:rounded-full before:transition-colors',
                isResizing
                  ? 'before:bg-primary-400'
                  : 'before:bg-transparent hover:before:bg-dark-600',
              )}
            />
            <CourseTreePanel
              sections={structure.sections}
              isLoading={structure.isLoading}
              expandedSections={structure.expandedSections}
              expandedLessons={structure.expandedLessons}
              highlight={agent.treeHighlight}
              selection={treeSelection}
              onToggleSection={structure.toggleSection}
              onToggleLesson={structure.toggleLesson}
              onSelectNode={handleSelectNode}
              onRefresh={handleRefreshStructure}
            />
          </div>
        </div>
      </div>

      <StepPreviewModal
        isOpen={stepModalOpen}
        step={previewStep}
        isLoading={previewStepLoading}
        sectionTitle={previewMeta.sectionTitle}
        lessonTitle={previewMeta.lessonTitle}
        onClose={handleClosePreview}
        onAddToChat={handleAddStepToChat}
      />
    </MainLayout>
  );
}

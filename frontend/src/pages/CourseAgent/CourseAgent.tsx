import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot } from 'lucide-react';
import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import toast from 'react-hot-toast';
import { lessonsApi, sectionsApi, stepsApi } from '../../api';
import type { Step, StepType } from '../../types';
import { MainLayout } from '../../components/Layout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StepikBlockEditModal } from '../../components/steps/StepikBlockEditModal';
import { useResizableWidth } from '../../hooks/useResizableWidth';
import { extractApiErrorMessage } from '../../utils/apiError';
import { validateTitle } from '../../utils/validation';
import { CreateLessonModal } from '../CourseEditor/modals/CreateLessonModal';
import { CreateModelModal } from '../CourseEditor/modals/CreateModelModal';
import { CreateStepModal } from '../CourseEditor/modals/CreateStepModal';
import { EditTitleModal } from '../CourseEditor/modals/EditTitleModal';
import { StepViewModal } from '../CourseEditor/modals/StepViewModal';
import { StepContentAiEditModal } from '../CourseEditor/components/StepContentAiEditModal';
import { CourseAgentChatPanel } from './components/CourseAgentChatPanel';
import { CourseTreePanel } from './components/CourseTreePanel';
import { StepPreviewModal } from './components/StepPreviewModal';
import { StructureDeleteModal } from './components/StructureDeleteModal';
import { StructureMoveModal } from './components/StructureMoveModal';
import type { CourseTreeSelection } from './types';
import { useAgentStepEdit } from './useAgentStepEdit';
import { useAgentStructureActions } from './useAgentStructureActions';
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
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isStepCreateModalOpen, setIsStepCreateModalOpen] = useState(false);
  const [createSectionId, setCreateSectionId] = useState<number | null>(null);
  const [createLessonId, setCreateLessonId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({ title: '', description: '' });
  const [createStepType, setCreateStepType] = useState<StepType>('TEXT');
  const [isCreating, setIsCreating] = useState(false);

  const { width: treeWidth, isResizing, startResize } = useResizableWidth({
    storageKey: 'course-agent-tree-width',
    defaultWidth: 320,
    minWidth: 260,
    maxWidth: 480,
  });

  const handleStepUpdated = useCallback((updated: Step) => {
    structure.patchStep(updated.id, updated);
    setPreviewStep((prev) => (prev?.id === updated.id ? updated : prev));
  }, [structure.patchStep]);

  const handleStepCreated = useCallback((created: Step) => {
    structure.addStep(created);
  }, [structure.addStep]);

  const stepEdit = useAgentStepEdit({
    onStepUpdated: handleStepUpdated,
    onStepCreated: handleStepCreated,
  });

  const structureActions = useAgentStructureActions({
    sections: structure.sections,
    selection: treeSelection,
    setSelection: setTreeSelection,
    patchSection: structure.patchSection,
    patchLesson: structure.patchLesson,
    removeSection: structure.removeSection,
    removeLesson: structure.removeLesson,
    removeStep: structure.removeStep,
    reorderSections: structure.reorderSections,
    reorderLessons: structure.reorderLessons,
    reorderSteps: structure.reorderSteps,
    reloadStructure: structure.loadStructure,
    onStepRemoved: (stepId) => {
      if (previewStep?.id === stepId) {
        setStepModalOpen(false);
        setPreviewStep(null);
      }
      if (stepEdit.editingStep?.id === stepId) {
        stepEdit.closeView();
      }
    },
  });

  useEffect(() => {
    agent.registerStructureHandlers({
      refresh: () => {
        void structure.loadStructure();
      },
      addSection: structure.addSection,
      addLesson: structure.addLesson,
      addStep: structure.addStep,
      expandToNode: structure.expandToNode,
    });
  }, [
    agent.registerStructureHandlers,
    structure.loadStructure,
    structure.addSection,
    structure.addLesson,
    structure.addStep,
    structure.expandToNode,
  ]);

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

  const structureLocked = agent.isLoading || agent.isExecuting;

  const handleEditStep = useCallback(() => {
    if (!previewStep) return;
    if (structureLocked) {
      toast.error('Дождитесь окончания генерации');
      return;
    }
    setStepModalOpen(false);
    stepEdit.openEdit(previewStep);
  }, [structureLocked, previewStep, stepEdit]);

  const handleDeletePreviewStep = useCallback(() => {
    if (!previewStep) return;
    if (structureLocked) {
      toast.error('Дождитесь окончания генерации');
      return;
    }
    structureActions.openDeleteStep(previewStep.id);
  }, [structureLocked, previewStep, structureActions]);

  const previewMeta = useMemo(() => {
    if (!treeSelection || treeSelection.type !== 'step') {
      return {};
    }
    return resolveTreeNode(treeSelection, structure.sections);
  }, [structure.sections, treeSelection]);

  const handleRefreshStructure = useCallback(() => {
    void structure.loadStructure();
  }, [structure.loadStructure]);

  const openCreateSection = useCallback(() => {
    if (structureLocked) {
      toast.error('Дождитесь окончания генерации');
      return;
    }
    setCreateForm({ title: '', description: '' });
    setIsSectionModalOpen(true);
  }, [structureLocked]);

  const openCreateLesson = useCallback((sectionId: number) => {
    if (structureLocked) {
      toast.error('Дождитесь окончания генерации');
      return;
    }
    setCreateSectionId(sectionId);
    setCreateForm({ title: '', description: '' });
    setIsLessonModalOpen(true);
    structure.expandToNode('section', sectionId);
  }, [structureLocked, structure.expandToNode]);

  const openCreateStep = useCallback((lessonId: number) => {
    if (structureLocked) {
      toast.error('Дождитесь окончания генерации');
      return;
    }
    setCreateLessonId(lessonId);
    setCreateStepType('TEXT');
    setIsStepCreateModalOpen(true);
    structure.expandToNode('lesson', lessonId);
  }, [structureLocked, structure.expandToNode]);

  const guardStructureMutation = useCallback((action: () => void) => {
    if (structureLocked) {
      toast.error('Дождитесь окончания генерации');
      return;
    }
    action();
  }, [structureLocked]);

  const handleCreateSection = useCallback(async () => {
    if (structureLocked) {
      toast.error('Дождитесь окончания генерации');
      return;
    }
    if (!agent.selectedCourseId) {
      toast.error('Сначала выберите курс');
      return;
    }
    const titleError = validateTitle(createForm.title, 'Название модуля');
    if (titleError) {
      toast.error(titleError);
      return;
    }

    setIsCreating(true);
    try {
      const created = await sectionsApi.createSection({
        courseId: agent.selectedCourseId,
        title: createForm.title.trim(),
        description: createForm.description.trim(),
      });
      structure.addSection(created);
      setIsSectionModalOpen(false);
      setCreateForm({ title: '', description: '' });
      toast.success('Модуль создан');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось создать модуль'));
    } finally {
      setIsCreating(false);
    }
  }, [structureLocked, agent.selectedCourseId, createForm.description, createForm.title, structure.addSection]);

  const handleCreateLesson = useCallback(async () => {
    if (structureLocked) {
      toast.error('Дождитесь окончания генерации');
      return;
    }
    if (!createSectionId) {
      toast.error('Не выбран модуль для урока');
      return;
    }
    const titleError = validateTitle(createForm.title, 'Название урока');
    if (titleError) {
      toast.error(titleError);
      return;
    }

    setIsCreating(true);
    try {
      const created = await lessonsApi.createLesson({
        sectionId: createSectionId,
        title: createForm.title.trim(),
      });
      structure.addLesson(created);
      setIsLessonModalOpen(false);
      setCreateSectionId(null);
      setCreateForm({ title: '', description: '' });
      toast.success('Урок создан');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось создать урок'));
    } finally {
      setIsCreating(false);
    }
  }, [structureLocked, createForm.title, createSectionId, structure.addLesson]);

  const handleContinueCreateStep = useCallback(() => {
    if (structureLocked) {
      toast.error('Дождитесь окончания генерации');
      return;
    }
    if (!createLessonId) {
      toast.error('Не выбран урок для шага');
      return;
    }
    const lessonId = createLessonId;
    const type = createStepType;
    setIsStepCreateModalOpen(false);
    setCreateLessonId(null);
    setCreateStepType('TEXT');
    stepEdit.blockEdit.openCreateStepBlockEdit(lessonId, type);
  }, [structureLocked, createLessonId, createStepType, stepEdit.blockEdit]);

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
              selectedLlmModel={agent.selectedLlmModel}
              onLlmModelChange={agent.setSelectedLlmModel}
              canSelectModel={agent.canSelectModel}
              isLoading={agent.isLoading}
              isExecuting={agent.isExecuting}
              executionLive={agent.executionLive}
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
              busyIds={structureActions.busyIds}
              canCreate={!!agent.selectedCourseId}
              structureLocked={structureLocked}
              onToggleSection={structure.toggleSection}
              onToggleLesson={structure.toggleLesson}
              onSelectNode={handleSelectNode}
              onCreateSection={openCreateSection}
              onCreateLesson={openCreateLesson}
              onCreateStep={openCreateStep}
              onRenameSection={(sectionId) => guardStructureMutation(() => structureActions.openRenameSection(sectionId))}
              onRenameLesson={(lessonId) => guardStructureMutation(() => structureActions.openRenameLesson(lessonId))}
              onDeleteSection={(sectionId) => guardStructureMutation(() => structureActions.openDeleteSection(sectionId))}
              onDeleteLesson={(lessonId) => guardStructureMutation(() => structureActions.openDeleteLesson(lessonId))}
              onDeleteStep={(stepId) => guardStructureMutation(() => structureActions.openDeleteStep(stepId))}
              onReorderSections={(ordered) => guardStructureMutation(() => {
                void structureActions.persistSectionOrder(ordered);
              })}
              onReorderLessons={(sectionId, ordered) => guardStructureMutation(() => {
                void structureActions.persistLessonOrder(sectionId, ordered);
              })}
              onReorderSteps={(lessonId, ordered) => guardStructureMutation(() => {
                void structureActions.persistStepOrder(lessonId, ordered);
              })}
              onRequestMoveStep={(sourceStepId, targetLessonId) => guardStructureMutation(() => {
                structureActions.requestMoveStep(sourceStepId, targetLessonId);
              })}
              onRequestMoveLesson={(sourceLessonId, targetSectionId) => guardStructureMutation(() => {
                structureActions.requestMoveLesson(sourceLessonId, targetSectionId);
              })}
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
        onEdit={handleEditStep}
        onDelete={handleDeletePreviewStep}
      />

      <CreateModelModal
        isOpen={isSectionModalOpen}
        onClose={() => {
          setIsSectionModalOpen(false);
          setCreateForm({ title: '', description: '' });
        }}
        title={createForm.title}
        description={createForm.description}
        onTitleChange={(value) => setCreateForm((prev) => ({ ...prev, title: value }))}
        onDescriptionChange={(value) => setCreateForm((prev) => ({ ...prev, description: value }))}
        onSubmit={() => void handleCreateSection()}
        isSaving={isCreating}
      />

      <CreateLessonModal
        isOpen={isLessonModalOpen}
        onClose={() => {
          setIsLessonModalOpen(false);
          setCreateSectionId(null);
          setCreateForm({ title: '', description: '' });
        }}
        title={createForm.title}
        onTitleChange={(value) => setCreateForm((prev) => ({ ...prev, title: value }))}
        onSubmit={() => void handleCreateLesson()}
        isSaving={isCreating}
      />

      <CreateStepModal
        isOpen={isStepCreateModalOpen}
        onClose={() => {
          setIsStepCreateModalOpen(false);
          setCreateLessonId(null);
          setCreateStepType('TEXT');
        }}
        type={createStepType}
        onTypeChange={setCreateStepType}
        onContinue={handleContinueCreateStep}
      />

      <EditTitleModal
        isOpen={!!structureActions.renameTarget}
        onClose={() => structureActions.setRenameTarget(null)}
        currentTitle={structureActions.renameTarget?.title ?? ''}
        label={structureActions.renameTarget?.type === 'lesson' ? 'урока' : 'модуля'}
        onSave={structureActions.saveRename}
      />

      <StructureDeleteModal
        target={structureActions.deleteTarget}
        isDeleting={structureActions.isDeleting}
        onClose={() => structureActions.setDeleteTarget(null)}
        onConfirm={() => void structureActions.confirmDelete()}
      />

      <StructureMoveModal
        target={structureActions.moveTarget}
        isMoving={structureActions.isMoving}
        onClose={() => structureActions.setMoveTarget(null)}
        onConfirm={() => void structureActions.confirmMove()}
      />

      <StepViewModal
        isOpen={stepEdit.isViewOpen}
        onClose={stepEdit.closeView}
        selectedStep={stepEdit.editingStep}
        canChangeType={false}
        canChangeStepType={false}
        canEditTask={stepEdit.canEditTask}
        isCodeBlock={stepEdit.isCodeBlock}
        onOpenStepTypeChange={() => undefined}
        onEditTask={stepEdit.openBlockEdit}
        onOpenContentEdit={stepEdit.openAiEdit}
      />

      <StepContentAiEditModal
        isOpen={stepEdit.isAiEditOpen}
        onClose={() => stepEdit.setIsAiEditOpen(false)}
        selectedStep={stepEdit.editingStep}
        contentEditData={stepEdit.contentEditData}
        onContentEditDataChange={stepEdit.setContentEditData}
        selectedLlmModel={stepEdit.selectedLlmModel}
        onLlmModelChange={stepEdit.setSelectedLlmModel}
        canSelectModel={stepEdit.canSelectModel}
        isGeneratingContent={stepEdit.isGeneratingContent}
        isSaving={stepEdit.isSavingContent}
        onGenerate={() => void stepEdit.handleGenerateNewContent()}
        onSave={() => void stepEdit.handleSaveContentChanges()}
      />

      <StepikBlockEditModal
        isOpen={stepEdit.blockEdit.isBlockEditOpen}
        onClose={stepEdit.blockEdit.closeBlockEdit}
        block={stepEdit.blockEdit.editingBlock}
        title={stepEdit.blockEdit.blockEditTitle}
        onSave={stepEdit.blockEdit.handleSaveBlockEdit}
      />
    </MainLayout>
  );
}

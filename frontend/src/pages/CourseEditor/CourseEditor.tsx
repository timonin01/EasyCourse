import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState } from 'react';
import { MainLayout } from '../../components/Layout';
import { Breadcrumbs, StaggerList, StaggerItem } from '../../components/ui';
import { StepikBlockEditModal } from '../../components/steps/StepikBlockEditModal';
import { StructureMoveModal } from '../../components/structure/StructureMoveModal';
import { getStepDisplayType, getStepBlockName } from '../../types';
import { STEP_TYPE_CHANGE_PRO_MESSAGE } from '../../constants/subscription';
import { EDIT_TASK_BLOCK_NAMES } from './types';
import { CreateModelModal, CreateLessonModal, CreateStepModal, StepViewModal, StepTypeChangeModal, StepDiffModal } from './modals';
import { ModelsColumn, LessonsColumn, StepsColumn } from './columns';
import { CourseEditorHeader } from './components/CourseEditorHeader';
import { StepContentAiEditModal } from './components/StepContentAiEditModal';
import { DeleteCourseModals } from './components/DeleteCourseModals';
import { useCourseEditorPage } from './hooks/useCourseEditorPage';
import { parseEditorDragId } from './utils/editorDragIds';

export function CourseEditor() {
  const page = useCourseEditorPage();
  const navigate = useNavigate();
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<'step' | 'lesson' | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const parsed = parseEditorDragId(event.active.id);
    if (!parsed) {
      setActiveDragLabel(null);
      setDraggingType(null);
      return;
    }
    if (parsed.type === 'section') {
      setActiveDragLabel(page.sections.find((item) => item.id === parsed.id)?.title ?? 'Модуль');
      setDraggingType(null);
      return;
    }
    if (parsed.type === 'lesson') {
      setActiveDragLabel(page.lessons.find((item) => item.id === parsed.id)?.title ?? 'Урок');
      setDraggingType('lesson');
      return;
    }
    const step = page.steps.find((item) => item.id === parsed.id);
    setActiveDragLabel(step ? `Шаг ${step.position}` : 'Шаг');
    setDraggingType('step');
  };

  const clearDragState = () => {
    setActiveDragLabel(null);
    setDraggingType(null);
  };

  return (
    <MainLayout>
      <Breadcrumbs
        items={[
          { label: 'Дашборд', to: '/dashboard' },
          { label: 'Мои курсы', to: '/courses' },
          { label: page.selectedCourse?.title || 'Редактор' },
        ]}
      />
      <CourseEditorHeader
        course={page.selectedCourse}
        hasUnsyncedContent={page.hasUnsyncedContent}
        needsRefresh={page.needsRefresh}
        courseId={page.courseId}
        onRefreshComplete={() => page.setNeedsRefresh(false)}
        onDeleteClick={() => page.setIsDeleteCourseModalOpen(true)}
        setSelectedCourse={page.setSelectedCourse}
        setModels={page.setModels}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={(event) => {
          page.handleEditorDragEnd(event);
          clearDragState();
        }}
        onDragCancel={clearDragState}
      >
        <StaggerList className="flex gap-6" stagger={0.08}>
          <StaggerItem className="flex-shrink-0 w-80 min-w-[280px]">
            <ModelsColumn
              sections={page.sections}
              isLoading={page.isSectionsLoading}
              selectedModel={page.selectedModel}
              onSelectModel={page.setSelectedModel}
              onAddClick={() => page.setIsModelModalOpen(true)}
              onReorder={page.handleReorderModels}
              isUnsynced={page.isModelUnsynced}
              onSync={page.handleSyncModel}
              onDeleteLocal={page.handleDeleteModelLocal}
              onDeleteFromStepik={page.handleDeleteModelFromStepik}
              deletingItems={page.deletingItems}
              onUpdateTitle={page.handleUpdateModelTitle}
              sharedDnd
              dropHighlight={draggingType === 'lesson'}
            />
          </StaggerItem>
          <StaggerItem className="flex-shrink-0 w-80 min-w-[280px]">
            <LessonsColumn
              lessons={page.lessons}
              selectedLesson={page.selectedLesson}
              hasSelectedModel={!!page.selectedModel}
              onSelectLesson={page.setSelectedLesson}
              onAddClick={() => page.setIsLessonModalOpen(true)}
              onReorder={page.handleReorderLessons}
              isUnsynced={page.isLessonUnsynced}
              onSync={page.handleSyncLesson}
              onDeleteLocal={page.handleDeleteLessonLocal}
              onDeleteFromStepik={page.handleDeleteLessonFromStepik}
              deletingItems={page.deletingItems}
              syncingItems={page.syncingItems}
              onUpdateTitle={page.handleUpdateLessonTitle}
              sharedDnd
              dropHighlight={draggingType === 'step'}
            />
          </StaggerItem>
          <StaggerItem className="flex-shrink-0 w-96 min-w-[320px]">
            <StepsColumn
              steps={page.steps}
              selectedLesson={page.selectedLesson}
              onStepClick={(step) => {
                page.setSelectedStep(step);
                page.setIsStepViewModalOpen(true);
              }}
              onAddClick={() => {
                page.setFormData({ title: '', description: '', type: 'TEXT' });
                page.setIsStepModalOpen(true);
              }}
              onGenerateClick={() => {
                if (page.selectedLesson) {
                  page.setSelectedLessonId(page.selectedLesson.id);
                  page.setMode('generate');
                  navigate('/ai-generator');
                }
              }}
              onReorder={page.handleReorderSteps}
              isUnsynced={page.isStepUnsynced}
              stepsDiffersFromStepik={page.stepsDiffersFromStepik}
              stepsDiffDetails={page.stepsDiffDetails}
              stepsChecking={page.stepsChecking}
              onShowDiff={(step) => page.setDiffModalStepId(step.id)}
              onSync={page.handleSyncStep}
              onCheckStepik={page.handleCheckStepWithStepik}
              onDeleteLocal={page.handleDeleteStepLocal}
              onDeleteFromStepik={page.handleDeleteStepFromStepik}
              deletingItems={page.deletingItems}
              syncingItems={page.syncingItems}
              sharedDnd
            />
          </StaggerItem>
        </StaggerList>

        <DragOverlay>
          {activeDragLabel ? (
            <div className="rounded-lg border border-primary-500/40 bg-dark-850 px-3 py-2 text-xs text-dark-100 shadow-lg">
              {activeDragLabel}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <StructureMoveModal
        target={page.moveTarget}
        isMoving={page.isMoving}
        onClose={() => page.setMoveTarget(null)}
        onConfirm={() => void page.confirmMove()}
      />

      <CreateModelModal
        isOpen={page.isModelModalOpen}
        onClose={() => page.setIsModelModalOpen(false)}
        title={page.formData.title}
        description={page.formData.description}
        onTitleChange={(v) => page.setFormData((f) => ({ ...f, title: v }))}
        onDescriptionChange={(v) => page.setFormData((f) => ({ ...f, description: v }))}
        onSubmit={page.handleCreateModel}
        isSaving={page.isSaving}
      />
      <CreateLessonModal
        isOpen={page.isLessonModalOpen}
        onClose={() => page.setIsLessonModalOpen(false)}
        title={page.formData.title}
        onTitleChange={(v) => page.setFormData((f) => ({ ...f, title: v }))}
        onSubmit={page.handleCreateLesson}
        isSaving={page.isSaving}
      />
      <CreateStepModal
        isOpen={page.isStepModalOpen}
        onClose={() => page.setIsStepModalOpen(false)}
        type={page.formData.type}
        onTypeChange={(v) => page.setFormData((f) => ({ ...f, type: v }))}
        onContinue={page.handleContinueCreateStep}
      />
      <StepViewModal
        isOpen={page.isStepViewModalOpen}
        onClose={() => {
          page.setIsStepViewModalOpen(false);
          page.setSelectedStep(null);
        }}
        selectedStep={page.selectedStep}
        canChangeType={page.selectedStep ? getStepDisplayType(page.selectedStep) !== 'CODE' : false}
        canChangeStepType={page.canChangeStepType}
        canEditTask={
          page.selectedStep
            ? (EDIT_TASK_BLOCK_NAMES as readonly string[]).includes(getStepBlockName(page.selectedStep))
            : false
        }
        isCodeBlock={page.selectedStep ? getStepBlockName(page.selectedStep) === 'code' : false}
        onOpenStepTypeChange={() => {
          if (!page.selectedStep) return;
          page.handleOpenStepTypeChange(page.selectedStep);
          page.setIsStepViewModalOpen(false);
        }}
        onProStepTypeAttempt={() => toast.error(STEP_TYPE_CHANGE_PRO_MESSAGE)}
        onEditTask={() => {
          if (!page.selectedStep) return;
          page.openStepBlockEdit(page.selectedStep);
          page.setIsStepViewModalOpen(false);
        }}
        onOpenContentEdit={() => {
          if (!page.selectedStep) return;
          page.handleOpenContentEdit(page.selectedStep);
          page.setIsStepViewModalOpen(false);
        }}
      />

      <StepContentAiEditModal
        isOpen={page.isStepContentEditModalOpen}
        onClose={() => page.setIsStepContentEditModalOpen(false)}
        selectedStep={page.selectedStep}
        contentEditData={page.contentEditData}
        onContentEditDataChange={page.setContentEditData}
        selectedLlmModel={page.selectedLlmModel}
        onLlmModelChange={page.setSelectedLlmModel}
        canSelectModel={page.canSelectModel}
        isGeneratingContent={page.isGeneratingContent}
        isSaving={page.isSaving}
        onGenerate={() => void page.handleGenerateNewContent()}
        onSave={() => void page.handleSaveContentChanges()}
      />

      <StepTypeChangeModal
        isOpen={page.isStepTypeChangeModalOpen}
        onClose={() => {
          page.setIsStepTypeChangeModalOpen(false);
          page.setStepTypeChangeData({ newType: 'TEXT' });
        }}
        selectedStep={page.selectedStep}
        newType={page.stepTypeChangeData.newType}
        onNewTypeChange={(v) => page.setStepTypeChangeData({ newType: v })}
        onChangeType={page.handleChangeStepType}
        isSaving={page.isSaving}
      />
      <StepDiffModal
        isOpen={page.diffModalStepId != null}
        onClose={() => page.setDiffModalStepId(null)}
        step={page.steps.find((s) => s.id === page.diffModalStepId!) ?? null}
        diff={page.diffModalStepId != null ? page.stepsDiffDetails.get(page.diffModalStepId!) : undefined}
      />

      <StepikBlockEditModal
        isOpen={page.isBlockEditOpen}
        onClose={page.closeBlockEdit}
        block={page.editingBlock}
        title={page.blockEditTitle}
        onSave={page.handleSaveBlockEdit}
      />

      <DeleteCourseModals
        course={page.selectedCourse}
        isDeleteCourseModalOpen={page.isDeleteCourseModalOpen}
        onCloseDeleteCourseModal={() => page.setIsDeleteCourseModalOpen(false)}
        isDeleteResultModalOpen={page.isDeleteResultModalOpen}
        deleteResult={page.deleteResult}
        onCloseDeleteResultModal={() => {
          page.setIsDeleteResultModalOpen(false);
          page.setDeleteResult(null);
        }}
        deletingItems={page.deletingItems}
        setDeletingItems={page.setDeletingItems}
        setDeleteResult={page.setDeleteResult}
        setIsDeleteResultModalOpen={page.setIsDeleteResultModalOpen}
        onNeedsRefresh={() => page.setNeedsRefresh(true)}
      />
    </MainLayout>
  );
}

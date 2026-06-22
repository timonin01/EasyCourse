import { MainLayout } from '../../components/Layout';
import { StepikBlockEditModal } from '../../components/steps/StepikBlockEditModal';
import { BatchPlanModal } from './components/BatchPlanModal';
import { AIGeneratorHeader } from './components/AIGeneratorHeader';
import { ModeToggle } from './components/ModeToggle';
import { ChatPanel } from './components/ChatPanel';
import { BatchModePanel } from './components/BatchModePanel';
import { GeneratePreviewPanel } from './components/GeneratePreviewPanel';
import { BatchSettingsSidebar } from './components/BatchSettingsSidebar';
import { useAIGeneratorPage } from './hooks/useAIGeneratorPage';

export function AIGenerator() {
  const page = useAIGeneratorPage();

  return (
    <MainLayout>
      <div className="flex flex-col xl:flex-row gap-6 min-h-0 h-[calc(100dvh-7rem)] max-h-[calc(100dvh-7rem)] overflow-x-hidden">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AIGeneratorHeader
            mode={page.mode}
            generatedStepHistoryRefreshKey={page.generatedStepHistoryRefreshKey}
            onClear={() => void page.handleClear()}
            onOpenGeneratedStepFromHistory={page.handleOpenGeneratedStepFromHistory}
          />

          <ModeToggle mode={page.mode} onModeChange={page.handleModeChange} />

          {page.mode === 'batch' ? (
            <BatchModePanel
              batchUserInput={page.batchUserInput}
              onBatchUserInputChange={page.setBatchUserInput}
              batchExplicitSteps={page.batchExplicitSteps}
              onBatchExplicitStepsChange={page.setBatchExplicitSteps}
              isGeneratingBatch={page.isGeneratingBatch}
              batchResults={page.batchResults}
              batchPlanItems={page.batchPlanItems}
              batchStepStatuses={page.batchStepStatuses}
              batchProgressPercent={page.batchProgressPercent}
              isSavingBatch={page.isSavingBatch}
              selectedLessonId={page.selectedLessonId}
              batchHistoryRefreshKey={page.batchHistoryRefreshKey}
              onBatchAnalyze={() => void page.handleBatchAnalyze()}
              onSaveBatchSteps={(indices) => void page.handleSaveBatchSteps(indices)}
              onSaveAllBatchSteps={() => void page.handleSaveAllBatchSteps()}
              onEditBatchStep={page.openEditBatchStep}
              onViewBatchSteps={page.handleViewBatchSteps}
              onRerunBatchHistory={page.handleRerunBatchHistory}
            />
          ) : (
            <ChatPanel
              mode={page.mode}
              stepType={page.stepType}
              messages={page.messages}
              messagesEndRef={page.messagesEndRef}
              isLoading={page.isLoading}
              input={page.input}
              promptMaxLength={page.promptMaxLength}
              selectedLlmModel={page.selectedLlmModel}
              canSelectModel={page.canSelectModel}
              onStepTypeChange={page.handleStepTypeChange}
              onInputChange={page.setInput}
              onKeyPress={page.handleKeyPress}
              onSend={page.handleSend}
              onLlmModelChange={page.setSelectedLlmModel}
              onRestoreGeneratedStep={page.handleRestoreGeneratedStep}
            />
          )}
        </div>

        {page.mode === 'generate' && (
          <GeneratePreviewPanel
            previewStep={page.previewStep}
            isLoading={page.isLoading}
            lastGeneratePrompt={page.lastGeneratePrompt}
            groupedLessons={page.groupedLessons}
            allLessonsCount={page.allLessons.length}
            selectedLessonId={page.selectedLessonId}
            isLoadingLessons={page.isLoadingLessons}
            onEdit={page.openEditGeneratedStep}
            onRegenerate={() => void page.handleRegenerate()}
            onCopy={page.handleCopyContent}
            onRefreshLessons={page.handleRefreshLessons}
            onLessonChange={page.setSelectedLessonId}
            onSave={() => void page.handleSaveStep()}
          />
        )}

        {page.mode === 'batch' && (
          <BatchSettingsSidebar
            groupedLessons={page.groupedLessons}
            allLessonsCount={page.allLessons.length}
            selectedLessonId={page.selectedLessonId}
            batchHistoryRefreshKey={page.batchHistoryRefreshKey}
            onLessonChange={page.setSelectedLessonId}
            onViewBatchSteps={page.handleViewBatchSteps}
            onRerunBatchHistory={page.handleRerunBatchHistory}
          />
        )}
      </div>

      <BatchPlanModal
        isOpen={page.isPlanModalOpen}
        onClose={() => page.setIsPlanModalOpen(false)}
        plan={page.batchPlan}
        onPlanChange={page.setBatchPlan}
        onConfirm={(plan) => void page.handlePlanConfirm(plan)}
      />

      <StepikBlockEditModal
        isOpen={page.isEditModalOpen}
        onClose={page.closeEditModal}
        block={page.editingBlock}
        onSave={page.handleApplyEditedBlock}
      />
    </MainLayout>
  );
}

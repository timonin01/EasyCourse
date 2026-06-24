import { AnimatePresence, motion } from 'framer-motion';
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
import { easeOut, fadeInUp } from '../../components/ui/motion';

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

          <AnimatePresence mode="wait">
            <motion.div
              key={page.mode}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={fadeInUp}
              transition={{ duration: 0.22, ease: easeOut }}
            >
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
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
        {page.mode === 'generate' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="min-h-0"
          >
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
          </motion.div>
        )}

        {page.mode === 'batch' && (
          <motion.div
            key="batch-sidebar"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="min-h-0"
          >
          <BatchSettingsSidebar
            groupedLessons={page.groupedLessons}
            allLessonsCount={page.allLessons.length}
            selectedLessonId={page.selectedLessonId}
            batchHistoryRefreshKey={page.batchHistoryRefreshKey}
            onLessonChange={page.setSelectedLessonId}
            onViewBatchSteps={page.handleViewBatchSteps}
            onRerunBatchHistory={page.handleRerunBatchHistory}
          />
          </motion.div>
        )}
        </AnimatePresence>
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

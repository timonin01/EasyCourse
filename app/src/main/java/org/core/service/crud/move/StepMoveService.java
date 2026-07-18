package org.core.service.crud.move;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.domain.Lesson;
import org.core.domain.Step;
import org.core.dto.step.CopyStepDTO;
import org.core.dto.step.MoveStepDTO;
import org.core.dto.step.StepResponseDTO;
import org.core.service.crud.LessonService;
import org.core.service.crud.SectionService;
import org.core.service.crud.StepService;
import org.core.service.crud.copy.StepCopyService;
import org.core.service.stepik.step.StepikStepSyncService;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StepMoveService {

    private final StepService stepService;
    private final LessonService lessonService;
    private final SectionService sectionService;
    private final StepCopyService stepCopyService;
    private final StepikStepSyncService stepSyncService;

    private final UserAccessService userAccessService;
    private final UserContextBean userContextBean;

    @Transactional
    public StepResponseDTO moveStep(MoveStepDTO moveStepDTO) {
        if (moveStepDTO == null || moveStepDTO.getSourceStepId() == null || moveStepDTO.getTargetLessonId() == null) {
            throw new IllegalArgumentException("Нужны sourceStepId и targetLessonId для перемещения шага");
        }
        Long contextUserId = userContextBean.getUserId();
        Step sourceStep = userAccessService.findStepAndVerifyOwner(contextUserId, moveStepDTO.getSourceStepId());
        Lesson targetLesson = userAccessService.findLessonAndVerifyOwner(contextUserId, moveStepDTO.getTargetLessonId());

        if (sourceStep.getLesson().getId().equals(targetLesson.getId())) {
            throw new IllegalArgumentException("Нельзя переместить шаг в тот же урок — используйте изменение позиции");
        }
        StepResponseDTO targetStepResponseDTO = stepCopyService.createStepCopy(new CopyStepDTO(
                moveStepDTO.getSourceStepId(),
                targetLesson.getId()));

        try {
            if (sourceStep.getStepikStepId() != null) {
                stepSyncService.deleteStepFromStepik(moveStepDTO.getSourceStepId());
            }
            stepService.deleteStep(moveStepDTO.getSourceStepId());
        } catch (RuntimeException ex) {
            log.error("Move failed after copy: sourceStepId={}, createdStepId={}. Rolling back copy.",
                    moveStepDTO.getSourceStepId(), targetStepResponseDTO.getId(), ex);
            try {
                stepService.deleteStep(targetStepResponseDTO.getId());
            } catch (RuntimeException rollbackEx) {
                log.error("Failed to roll back copied step {}", targetStepResponseDTO.getId(), rollbackEx);
            }
            throw ex;
        }

        lessonService.markNeedsStepikSyncIfSynced(sourceStep.getLesson().getId());
        lessonService.markNeedsStepikSyncIfSynced(targetLesson.getId());
        sectionService.markNeedsStepikSyncIfSynced(sourceStep.getLesson().getSection().getId());
        sectionService.markNeedsStepikSyncIfSynced(targetLesson.getSection().getId());

        log.info("Moved step {} -> {} from lesson {} to lesson {}",
                moveStepDTO.getSourceStepId(), targetStepResponseDTO.getId(), sourceStep.getLesson().getId(), targetLesson.getId());
        return targetStepResponseDTO;
    }
}

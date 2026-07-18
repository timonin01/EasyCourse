package org.core.service.crud.move;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.domain.Lesson;
import org.core.domain.Step;
import org.core.dto.lesson.CopyLessonDTO;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.lesson.MoveLessonDTO;
import org.core.repository.StepRepository;
import org.core.service.crud.LessonService;
import org.core.service.crud.SectionService;
import org.core.service.crud.copy.LessonCopyService;
import org.core.service.stepik.StepikCascadeDeleteService;
import org.core.service.stepik.step.StepikStepSyncService;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LessonMoveService {

    private final LessonService lessonService;
    private final SectionService sectionService;
    private final LessonCopyService lessonCopyService;
    private final StepikCascadeDeleteService cascadeDeleteService;
    private final StepikStepSyncService stepSyncService;
    private final StepRepository stepRepository;

    private final UserAccessService userAccessService;
    private final UserContextBean userContextBean;

    @Transactional
    public LessonResponseDTO moveLesson(MoveLessonDTO moveLessonDTO) {
        if (moveLessonDTO == null || moveLessonDTO.getSourceLessonId() == null || moveLessonDTO.getTargetSectionId() == null) {
            throw new IllegalArgumentException("Нужны sourceLessonId и targetSectionId для перемещения урока");
        }
        Long userId = userContextBean.getUserId();
        Lesson sourceLesson = userAccessService.findLessonAndVerifyOwner(userId, moveLessonDTO.getSourceLessonId());
        userAccessService.findSectionAndVerifyOwner(userId, moveLessonDTO.getTargetSectionId());

        if (sourceLesson.getSection().getId().equals(moveLessonDTO.getTargetSectionId())) {
            throw new IllegalArgumentException("Нельзя переместить урок в ту же секцию — используйте изменение позиции");
        }
        LessonResponseDTO targetLessonResponseDTO = lessonCopyService.createLessonCopy(new CopyLessonDTO(
                moveLessonDTO.getSourceLessonId(),
                moveLessonDTO.getTargetSectionId()
        ));

        try {
            deleteSourceFromStepik(userId, sourceLesson);
            lessonService.deleteLesson(moveLessonDTO.getSourceLessonId());
        } catch (RuntimeException ex) {
            log.error("Move failed after copy: sourceLessonId={}, createdLessonId={}. Rolling back copy.",
                    moveLessonDTO.getSourceLessonId(), targetLessonResponseDTO.getId(), ex);
            try {
                lessonService.deleteLesson(targetLessonResponseDTO.getId());
            } catch (RuntimeException rollbackEx) {
                log.error("Failed to roll back copied lesson {}", targetLessonResponseDTO.getId(), rollbackEx);
            }
            throw ex;
        }

        sectionService.markNeedsStepikSyncIfSynced(sourceLesson.getSection().getId());
        sectionService.markNeedsStepikSyncIfSynced(moveLessonDTO.getTargetSectionId());

        log.info("Moved lesson {} -> {} from section {} to section {}",
                moveLessonDTO.getSourceLessonId(), targetLessonResponseDTO.getId(), sourceLesson.getSection().getId(), moveLessonDTO.getTargetSectionId());
        return targetLessonResponseDTO;
    }

    private void deleteSourceFromStepik(Long userId, Lesson sourceLesson) {
        if (sourceLesson.getStepikLessonId() != null) {
            cascadeDeleteService.deleteFullLessonFromStepikById(sourceLesson.getId(), userId);
            return;
        }

        List<Step> steps = stepRepository.findByLessonIdOrderByPositionAsc(sourceLesson.getId());
        steps.stream()
                .filter(step -> step.getStepikStepId() != null)
                .sorted(Comparator.comparing(Step::getPosition))
                .forEach(step -> stepSyncService.deleteStepFromStepik(step.getId()));
    }
}

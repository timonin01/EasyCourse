package org.core.service.crud.copy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.dto.lesson.CopyLessonDTO;
import org.core.dto.lesson.CreateLessonDTO;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.step.CopyStepDTO;
import org.core.service.crud.LessonService;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LessonCopyService {

    private final LessonService lessonService;
    private final StepCopyService stepCopyService;
    private final UserContextBean userContextBean;
    private final UserAccessService userAccessService;

    @Transactional
    public LessonResponseDTO createLessonCopy(CopyLessonDTO copyLessonDTO) {
        if (copyLessonDTO == null || copyLessonDTO.getSourceLessonId() == null || copyLessonDTO.getTargetSectionId() == null) {
            throw new IllegalArgumentException("Нужны sourceLessonId и targetSectionId для копирования урока");
        }
        Long userId = userContextBean.getUserId();
        Lesson sourceLesson = userAccessService.findLessonAndVerifyOwner(userId, copyLessonDTO.getSourceLessonId());
        Section targetSection = userAccessService.findSectionAndVerifyOwner(userId, copyLessonDTO.getTargetSectionId());

        Long sourceCourseId = sourceLesson.getSection().getCourse().getId();
        Long targetCourseId = targetSection.getCourse().getId();
        if (!sourceCourseId.equals(targetCourseId)) {
            throw new IllegalArgumentException("Нельзя копировать урок в секцию другого курса");
        }

        LessonResponseDTO targetLesson = lessonService.createLesson(new CreateLessonDTO(
                copyLessonDTO.getTargetSectionId(),
                sourceLesson.getTitle()
        ));

        for (Step step : sourceLesson.getSteps()) {
            stepCopyService.createStepCopy(new CopyStepDTO(
                    step.getId(),
                    targetLesson.getId()
            ));
        }
        log.info("Copied lesson {} -> new lesson {} in section {}",
                sourceLesson.getId(), targetLesson.getId(), copyLessonDTO.getTargetSectionId());
        return targetLesson;
    }
}

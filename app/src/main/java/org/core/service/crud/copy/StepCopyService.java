package org.core.service.crud.copy;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.domain.Lesson;
import org.core.domain.Step;
import org.core.dto.step.CopyStepDTO;
import org.core.dto.step.CreateStepDTO;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.service.crud.StepService;
import org.core.service.stepik.step.StepikBlockJsonNormalizer;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StepCopyService {

    private final StepService stepService;
    private final UserContextBean userContextBean;
    private final UserAccessService userAccessService;
    private final StepikBlockJsonNormalizer stepikBlockJsonNormalizer;
    private final ObjectMapper objectMapper;

    @Transactional
    public StepResponseDTO createStepCopy(CopyStepDTO copyStepDTO) {
        if (copyStepDTO == null || copyStepDTO.getSourceStepId() == null || copyStepDTO.getTargetLessonId() == null) {
            throw new IllegalArgumentException("Нужны sourceStepId и targetLessonId для копирования шага");
        }
        Long contextUserId = userContextBean.getUserId();
        Lesson targetLesson = userAccessService.findLessonAndVerifyOwner(contextUserId, copyStepDTO.getTargetLessonId());
        Step sourceStep = userAccessService.findStepAndVerifyOwner(contextUserId, copyStepDTO.getSourceStepId());

        Long sourceCourseId = sourceStep.getLesson().getSection().getCourse().getId();
        Long targetCourseId = targetLesson.getSection().getCourse().getId();
        if (!sourceCourseId.equals(targetCourseId)) {
            throw new IllegalArgumentException("Нельзя копировать шаг в урок другого курса");
        }
        if (sourceStep.getStepikBlockData() == null || sourceStep.getStepikBlockData().isBlank()) {
            throw new IllegalArgumentException("У шага id=" + sourceStep.getId() + " нет содержимого (stepikBlockData) для копирования");
        }

        try {
            String normalized = stepikBlockJsonNormalizer.normalize(sourceStep.getStepikBlockData(), sourceStep.getType());
            StepikBlockRequest block = objectMapper.readValue(normalized, StepikBlockRequest.class);

            CreateStepDTO createStepDTO = CreateStepDTO.builder()
                    .lessonId(copyStepDTO.getTargetLessonId())
                    .type(sourceStep.getType())
                    .content(sourceStep.getContent())
                    .cost(sourceStep.getCost())
                    .stepikBlock(block)
                    .build();
            StepResponseDTO created = stepService.createStep(createStepDTO);
            log.info("Copied step {} -> new step {} in lesson {}", sourceStep.getId(), created.getId(), copyStepDTO.getTargetLessonId());
            return created;
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Не удалось разобрать содержимое шага id=" + sourceStep.getId() + ": " + ex.getMessage(), ex);
        }
    }
}

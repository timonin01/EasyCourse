package org.core.util.converterToDTO;

import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.stepik.lesson.StepikLessonResponseData;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class ConverterStepikLessonResponseDataToLessonResponseDTO {

    public LessonResponseDTO convert(StepikLessonResponseData stepikLesson, Long localLessonId, Long modelId, Long stepikSectionId, Integer position) {
        if (stepikLesson == null) {
            return null;
        }

        return LessonResponseDTO.builder()
                .id(localLessonId)
                .title(stepikLesson.getTitle())
                .position(position)
                .stepikLessonId(stepikLesson.getId())
                .modelId(modelId)
                .stepikSectionId(stepikSectionId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}


package org.core.util.converterToDTO;

import org.core.dto.model.ModelResponseDTO;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class ConverterStepikSectionResponseDataToModelResponseDTO {

    public ModelResponseDTO convert(StepikSectionResponseData stepikSection, Long localModelId) {
        if (stepikSection == null) {
            return null;
        }

        return ModelResponseDTO.builder()
                .id(localModelId)
                .title(stepikSection.getTitle())
                .description(stepikSection.getDescription() != null && !stepikSection.getDescription().trim().isEmpty()
                        ? stepikSection.getDescription()
                        : stepikSection.getTitle())
                .position(stepikSection.getPosition())
                .courseId(Long.valueOf(stepikSection.getCourse()))
                .stepikSectionId(stepikSection.getId())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}


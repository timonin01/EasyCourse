package org.core.util.converterToDTO;

import org.core.dto.section.SectionResponseDTO;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class ConverterStepikSectionResponseDataToModelResponseDTO {

    public SectionResponseDTO convert(StepikSectionResponseData stepikSection, Long localSectionId) {
        if (stepikSection == null) {
            return null;
        }

        return SectionResponseDTO.builder()
                .id(localSectionId)
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


package org.core.dto.step;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
import org.core.domain.StepType;
import org.core.dto.stepik.step.StepikBlockResponse;
import org.core.dto.stepik.step.test.choise.response.StepikBlockChoiceResponse;
import org.core.dto.stepik.step.test.matching.response.StepikBlockMatchingResponse;
import org.core.dto.stepik.step.test.sorting.response.StepikBlockSortingResponse;
import org.core.dto.stepik.step.test.table.response.StepikBlockTableResponse;
import org.core.dto.stepik.step.text.StepikBlockTextResponse;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StepResponseDTO {

    private Long id;
    private Long lessonId;
    private StepType type;
    private String content;
    private Integer position;
    private Long cost;
    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "name", include = JsonTypeInfo.As.PROPERTY)
    @JsonSubTypes({
        @JsonSubTypes.Type(value = StepikBlockTextResponse.class, name = "text"),
        @JsonSubTypes.Type(value = StepikBlockChoiceResponse.class, name = "choice"),
        @JsonSubTypes.Type(value = StepikBlockSortingResponse.class, name = "sorting"),
        @JsonSubTypes.Type(value = StepikBlockMatchingResponse.class, name = "matching"),
        @JsonSubTypes.Type(value = StepikBlockTableResponse.class, name = "table")
    })
    private StepikBlockResponse stepikBlock;
    private Long stepikStepId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String getStepikBlockJson() {
        if (stepikBlock == null) {
            return null;
        }
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            return objectMapper.writeValueAsString(stepikBlock);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert stepikBlock to JSON", e);
        }
    }

}

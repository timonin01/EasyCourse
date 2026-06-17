package org.core.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchGenerationHistoryDTO {

    private Long id;
    private String userInput;
    private BatchStepDTO plan;
    private String status;
    private Integer totalSteps;
    private Long lessonId;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}

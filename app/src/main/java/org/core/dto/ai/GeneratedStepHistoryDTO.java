package org.core.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.stepik.step.StepikBlockRequest;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedStepHistoryDTO {

    private Long id;
    private String sessionId;
    private String stepType;
    private String userPrompt;
    private String content;
    private StepikBlockRequest generatedStep;
    private LocalDateTime createdAt;
}

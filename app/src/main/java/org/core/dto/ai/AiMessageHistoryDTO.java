package org.core.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.stepik.step.StepikBlockRequest;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiMessageHistoryDTO {

    private String role;
    private String content;
    private String stepType;
    private StepikBlockRequest generatedStep;
}

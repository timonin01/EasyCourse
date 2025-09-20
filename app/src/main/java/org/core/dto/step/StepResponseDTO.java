package org.core.dto.step;

import lombok.*;
import org.core.domain.StepType;
import org.core.dto.stepik.step.StepikBlockResponse;

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
    private StepikBlockResponse stepikBlock;
    private Long stepikStepId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}

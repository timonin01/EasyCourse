package org.core.dto.step;

import lombok.*;
import org.core.domain.StepType;

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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}

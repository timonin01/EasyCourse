package org.core.dto.step;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.domain.StepType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateStepDTO {

    @NotNull(message = "LessonId is required")
    private Long lessonId;

    @NotBlank(message = "StepType is required")
    private StepType type;

    private String content;

    private Integer position;

}

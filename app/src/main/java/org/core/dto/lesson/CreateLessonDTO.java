package org.core.dto.lesson;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateLessonDTO {
    
    @NotNull(message = "Model ID is required")
    private Long modelId;
    
    @NotBlank(message = "Title is required")
    private String title;

    private Integer position;
}

package org.core.dto.lesson;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateLessonDTO {
    
    @NotNull(message = "Section ID is required")
    private Long sectionId;
    
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 64)
    private String title;
}

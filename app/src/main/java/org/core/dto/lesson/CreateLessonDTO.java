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
    
    @NotBlank(message = "Название урока не может быть пустым")
    @Size(min = 1, max = 64, message = "Название урока должно быть от 1 до 64 символов")
    private String title;
}

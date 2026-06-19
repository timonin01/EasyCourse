package org.core.dto.lesson;

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
public class UpdateLessonDTO {

    @NotNull(message = "ID урока обязателен")
    private Long lessonId;

    @Size(min = 1, max = 64, message = "Название урока должно быть от 1 до 64 символов")
    private String title;
    private Integer position;

}

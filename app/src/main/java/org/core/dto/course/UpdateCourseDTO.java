package org.core.dto.course;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCourseDTO {

    @NotNull(message = "ID курса обязателен")
    Long id;

    @Size(min = 1, max = 64, message = "Название курса должно быть от 1 до 64 символов")
    String title;

    String description;

}
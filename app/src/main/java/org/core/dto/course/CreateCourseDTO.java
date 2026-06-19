package org.core.dto.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateCourseDTO {

    @NotNull(message = "UserId is required")
    private Long userId;

    @NotBlank(message = "Название курса не может быть пустым")
    @Size(min = 1, max = 64, message = "Название курса должно быть от 1 до 64 символов")
    private String title;

    private String description;

}

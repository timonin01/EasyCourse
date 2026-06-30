package org.core.dto.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateCourseDTO {

    @NotBlank(message = "Название курса не может быть пустым")
    @Size(min = 1, max = 64, message = "Название курса должно быть от 1 до 64 символов")
    private String title;

    private String description;

}

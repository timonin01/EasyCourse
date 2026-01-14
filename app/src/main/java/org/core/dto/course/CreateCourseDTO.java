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

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 64)
    private String title;

    private String description;

}

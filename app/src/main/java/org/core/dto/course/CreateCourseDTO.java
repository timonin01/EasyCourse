package org.core.dto.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.core.domain.TargetPlatform;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateCourseDTO {

    @NotNull(message = "UserId is required")
    private Long userId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "TargetPlatform is required")
    private TargetPlatform targetPlatform;

}

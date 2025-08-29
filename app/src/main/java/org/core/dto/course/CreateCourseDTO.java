package org.core.dto.course;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.domain.TargetPlatform;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateCourseDTO {

    @NotBlank(message = "UserId is required")
    private Long userId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "TargetPlatform is required")
    private TargetPlatform targetPlatform;

}

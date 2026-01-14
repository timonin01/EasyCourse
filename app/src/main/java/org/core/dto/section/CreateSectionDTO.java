package org.core.dto.section;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateSectionDTO {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 64)
    private String title;

    private String description;

}

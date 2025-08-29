package org.core.dto.course;

import lombok.*;
import org.core.domain.TargetPlatform;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseResponseDTO {

    private Long id;
    private Long userId;
    private String title;
    private String description;
    private TargetPlatform targetPlatform;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}

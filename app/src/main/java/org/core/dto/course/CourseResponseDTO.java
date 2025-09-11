package org.core.dto.course;

import lombok.*;

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
    private Long stepikCourseId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}

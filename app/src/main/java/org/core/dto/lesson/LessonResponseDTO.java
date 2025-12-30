package org.core.dto.lesson;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonResponseDTO {

    private Long id;
    private String title;
    private String description;
    private Integer position;
    private Long stepikLessonId;
    private Long modelId;
    private Long stepikSectionId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
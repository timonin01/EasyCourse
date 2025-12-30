package org.core.dto.stepik;

import lombok.*;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.model.ModelResponseDTO;
import org.core.dto.step.StepResponseDTO;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FullCourseResponseDTO {
    private Long id;
    private Long userId;
    private String title;
    private String description;
    private Long stepikCourseId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<ModelResponseDTO> models;
    private List<LessonResponseDTO> lessons;
    private List<StepResponseDTO> steps;
}

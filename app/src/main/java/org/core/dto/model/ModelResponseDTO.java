package org.core.dto.model;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModelResponseDTO {

    private Long id;
    private String title;
    private String description;
    private Integer position;
    private Long courseId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}

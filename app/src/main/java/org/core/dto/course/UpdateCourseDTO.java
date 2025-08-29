package org.core.dto.course;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCourseDTO {

    Long id;
    String title;
    String description;

}
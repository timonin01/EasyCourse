package org.core.dto.stepik.section;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikSectionResponseData {

    private Long id;
    private String title;
    private String description;
    private String course;
    private Integer position;

}

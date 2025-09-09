package org.core.dto.stepik.section;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikSectionRequestData {

    private String title;
    private String description;
    private String course;
    private Integer position = 1;

    @JsonProperty("required_percent")
    private Integer requiredPercent = 100;

}

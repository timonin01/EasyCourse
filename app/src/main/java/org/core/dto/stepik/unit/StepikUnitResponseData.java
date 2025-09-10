package org.core.dto.stepik.unit;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikUnitResponseData {

    private Long id;

    @JsonProperty("lesson_id")
    private String lessonId;

    private String lesson;
    private String section;
    private Integer position;

}

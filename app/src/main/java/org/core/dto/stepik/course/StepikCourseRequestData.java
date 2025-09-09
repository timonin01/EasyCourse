package org.core.dto.stepik.course;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikCourseRequestData {

    private String title;
    private String description;
    private String language = "ru";

    @JsonProperty("is_public")
    private boolean isPublic = false;

    @JsonProperty("course_type")
    private String courseType = "basic";

}

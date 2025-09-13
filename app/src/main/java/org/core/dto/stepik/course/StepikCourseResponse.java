package org.core.dto.stepik.course;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikCourseResponse {

    @JsonProperty("courses")
    private List<StepikCourseResponseData> courses;

    public StepikCourseResponseData getCourse() {
        return courses != null && !courses.isEmpty() ? courses.get(0) : null;
    }

}

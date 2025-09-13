package org.core.dto.stepik.course;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // Не включаем null поля в JSON
public class StepikCourseRequestData {

    private String title;
    private String description;
    private String language;

    @JsonProperty("is_public")
    private Boolean isPublic;

    @JsonProperty("course_type")
    private String courseType;
    
    private String captcha;

}

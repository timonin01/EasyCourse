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
public class StepikCourseResponseData {

    private Long id;
    private String title;
    private String description;
    private String language;

    @JsonProperty("is_public")
    private boolean isPublic;

    @JsonProperty("owner_id")
    private Long ownerId;
    
    // Токен капчи для последующих операций с курсом
    private String captcha;

}

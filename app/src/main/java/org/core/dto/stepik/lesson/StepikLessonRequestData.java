package org.core.dto.stepik.lesson;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikLessonRequestData {

    private String title;
    private String language = "ru";

    @JsonProperty("is_public")
    private boolean isPublic = false;
    private String owner;

}

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
public class StepikLessonResponseData {

    private Long id;
    private String title;
    private String language;

    @JsonProperty("is_public")
    private boolean isPublic;

    private String owner;

}

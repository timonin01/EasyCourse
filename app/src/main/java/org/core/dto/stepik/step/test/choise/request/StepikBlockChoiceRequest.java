package org.core.dto.stepik.step.test.choise.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.stepik.step.StepikBlockRequest;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikBlockChoiceRequest implements StepikBlockRequest {

    private String text;
    private Object video = null;
    private Object options = null;

    private StepikChoiceSourceRequest source;

    @JsonProperty("is_deprecated")
    private Boolean isDeprecated = false;

    @JsonProperty("subtitle_files")
    private Object subtitleFiles = null;

    private Object subtitles = null;

    @JsonProperty("tests_archive")
    private Object testsArchive = null;

    @JsonProperty("feedback_correct")
    private String feedbackCorrect = "";

    @JsonProperty("feedback_wrong")
    private String feedbackWrong = "";

}

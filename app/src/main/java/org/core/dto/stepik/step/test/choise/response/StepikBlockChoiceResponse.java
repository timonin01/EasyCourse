package org.core.dto.stepik.step.test.choise.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.stepik.step.StepikBlockResponse;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class StepikBlockChoiceResponse implements StepikBlockResponse {

    private String name;
    private String text;
    private Object video;
    private Object options;

    private StepikChoiceSourceResponse source;

    @JsonProperty("is_deprecated")
    private Boolean isDeprecated;

    @JsonProperty("subtitle_files")
    private Object subtitleFiles;

    private Object subtitles;

    @JsonProperty("tests_archive")
    private Object testsArchive;

    @JsonProperty("feedback_correct")
    private String feedbackCorrect;

    @JsonProperty("feedback_wrong")
    private String feedbackWrong;

}

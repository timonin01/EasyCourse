package org.core.dto.stepik.step.choise.response;

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
public class StepikBlockChoiceResponse {

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

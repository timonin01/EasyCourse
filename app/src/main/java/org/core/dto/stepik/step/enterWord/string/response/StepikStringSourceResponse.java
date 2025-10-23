package org.core.dto.stepik.step.enterWord.string.response;

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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikStringSourceResponse {

    private String pattern;
    @JsonProperty("use_re")
    private Boolean useRe;
    @JsonProperty("match_substring")
    private Boolean matchSubstring;
    @JsonProperty("case_sensitive")
    private Boolean caseSensitive;
    private String code;
    @JsonProperty("is_text_disabled")
    private Boolean isTextDisabled;
    @JsonProperty("is_file_disabled")
    private Boolean isFileDisabled;

}



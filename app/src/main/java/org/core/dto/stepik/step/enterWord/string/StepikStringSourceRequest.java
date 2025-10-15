package org.core.dto.stepik.step.enterWord.string;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikStringSourceRequest {

    private String pattern;
    private Boolean use_re;
    private Boolean match_substring;
    private Boolean case_sensitive;
    private String code;
    private Boolean is_text_disabled;
    private Boolean is_file_disabled;

}



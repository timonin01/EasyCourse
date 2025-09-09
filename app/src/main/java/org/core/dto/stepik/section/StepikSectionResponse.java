package org.core.dto.stepik.section;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikSectionResponse {

    @JsonProperty("section")
    private StepikSectionResponseData section;

}

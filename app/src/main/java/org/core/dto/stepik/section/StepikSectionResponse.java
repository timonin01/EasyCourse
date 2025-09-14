package org.core.dto.stepik.section;

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
public class StepikSectionResponse {

    @JsonProperty("sections")
    private List<StepikSectionResponseData> sections;

    public StepikSectionResponseData getSection() {
        return sections != null && !sections.isEmpty() ? sections.get(0) : null;
    }

    public List<StepikSectionResponseData> getSections() {
        return sections;
    }

}

package org.core.dto.stepik.step.test.table.request;

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
public class StepikTableOptionsRequest {

    @JsonProperty("is_checkbox")
    private Boolean isCheckbox = false;

    @JsonProperty("is_randomize_rows")
    private Boolean isRandomizeRows = false;

    @JsonProperty("is_randomize_columns")
    private Boolean isRandomizeColumns = false;

    @JsonProperty("sample_size")
    private Integer sampleSize = -1;

}


package org.core.dto.stepik.step.test.table.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikTableOptionsResponse {

    @JsonProperty("is_checkbox")
    private Boolean isCheckbox;

    @JsonProperty("is_randomize_rows")
    private Boolean isRandomizeRows;

    @JsonProperty("is_randomize_columns")
    private Boolean isRandomizeColumns;

    @JsonProperty("sample_size")
    private Integer sampleSize;

}


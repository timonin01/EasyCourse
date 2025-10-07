package org.core.dto.stepik.step.test.table.response;

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
public class StepikTableSourceResponse {

    private List<StepikTableRowResponse> rows;

    private List<StepikTableColumnResponse> columns;

    private String description;

    @JsonProperty("is_always_correct")
    private Boolean isAlwaysCorrect;

    private StepikTableOptionsResponse options;

}


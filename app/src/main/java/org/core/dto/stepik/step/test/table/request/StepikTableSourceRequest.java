package org.core.dto.stepik.step.test.table.request;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikTableSourceRequest {

    private List<StepikTableRowRequest> rows;

    private List<StepikTableColumnRequest> columns;

    private String description;

    @JsonProperty("is_always_correct")
    private Boolean isAlwaysCorrect = false;

    private StepikTableOptionsRequest options;

}


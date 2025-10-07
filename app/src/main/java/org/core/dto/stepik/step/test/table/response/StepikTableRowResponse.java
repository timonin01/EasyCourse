package org.core.dto.stepik.step.test.table.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikTableRowResponse {

    private String name;

    private List<StepikTableCellResponse> columns;

}


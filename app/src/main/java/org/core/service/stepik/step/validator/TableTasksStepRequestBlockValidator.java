package org.core.service.stepik.step.validator;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.test.table.request.StepikBlockTableRequest;
import org.core.dto.stepik.step.test.table.request.StepikTableCellRequest;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class TableTasksStepRequestBlockValidator {

    public void validateAndFixTableBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (blockRequest instanceof StepikBlockTableRequest tableRequest) {
            if (tableRequest.getSource() != null && tableRequest.getSource().getRows() != null) {
                Boolean isCheckbox = tableRequest.getSource().getOptions() != null
                        ? tableRequest.getSource().getOptions().getIsCheckbox() : null;

                for (int rowIndex = 0; rowIndex < tableRequest.getSource().getRows().size(); rowIndex++) {
                    var row = tableRequest.getSource().getRows().get(rowIndex);
                    if (row.getColumns() == null || row.getColumns().isEmpty()) {
                        continue;
                    }

                    int correctInRow = 0;
                    int firstCorrectIndex = -1;
                    for (int colIndex = 0; colIndex < row.getColumns().size(); colIndex++) {
                        StepikTableCellRequest cell = row.getColumns().get(colIndex);
                        if (cell.getChoice() != null && cell.getChoice()) {
                            if (firstCorrectIndex == -1) {
                                firstCorrectIndex = colIndex;
                            }
                            correctInRow++;
                        }
                    }

                    if ((isCheckbox == null || !isCheckbox) && correctInRow > 1) {
                        log.warn("Step {} row {} has {} correct cells but is_checkbox is false. " +
                                "Keeping only the first correct cell.", stepId, rowIndex, correctInRow);
                        boolean firstFound = false;
                        for (StepikTableCellRequest cell : row.getColumns()) {
                            if (cell.getChoice() != null && cell.getChoice()) {
                                if (firstFound) {
                                    cell.setChoice(false);
                                } else {
                                    firstFound = true;
                                }
                            }
                        }
                    }

                    if (correctInRow == 0) {
                        log.error("Step {} row {} has no correct cells. " +
                                "Stepik API requires at least one correct answer per row. " +
                                "Setting first cell as correct.", stepId, rowIndex);
                        row.getColumns().get(0).setChoice(true);
                    }
                }
            }
        }
    }

}

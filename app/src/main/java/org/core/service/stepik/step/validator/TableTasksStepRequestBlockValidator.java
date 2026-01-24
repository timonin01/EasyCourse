package org.core.service.stepik.step.validator;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.test.table.request.StepikBlockTableRequest;
import org.core.dto.stepik.step.test.table.request.StepikTableCellRequest;
import org.core.dto.stepik.step.test.table.request.StepikTableColumnRequest;
import org.core.dto.stepik.step.test.table.request.StepikTableOptionsRequest;
import org.core.dto.stepik.step.test.table.request.StepikTableRowRequest;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class TableTasksStepRequestBlockValidator {

    public void validateAndFixTableBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (blockRequest instanceof StepikBlockTableRequest tableRequest) {
            if (tableRequest.getText() == null) {
                tableRequest.setText("");
            }
            if (tableRequest.getSource() == null) {
                return;
            }
            var source = tableRequest.getSource();
            if (source.getDescription() == null) {
                source.setDescription("");
            }
            if (source.getColumns() != null) {
                for (StepikTableColumnRequest col : source.getColumns()) {
                    if (col.getName() == null) {
                        col.setName("");
                    }
                }
            }
            if (source.getRows() != null) {
                for (StepikTableRowRequest r : source.getRows()) {
                    if (r.getName() == null) {
                        r.setName("");
                    }
                }
            }
            if (source.getRows() != null) {
                Boolean isCheckbox = source.getOptions() != null
                        ? source.getOptions().getIsCheckbox() : null;

                for (int rowIndex = 0; rowIndex < source.getRows().size(); rowIndex++) {
                    var row = source.getRows().get(rowIndex);
                    if (row.getColumns() == null || row.getColumns().isEmpty()) {
                        continue;
                    }

                    int correctInRow = 0;
                    for (StepikTableCellRequest cell : row.getColumns()) {
                        if (cell.getChoice() != null && cell.getChoice()) {
                            correctInRow++;
                        }
                    }

                    if (correctInRow > 1 && (isCheckbox == null || !isCheckbox)) {
                        log.warn("Step {} table: row {} has {} correct cells but is_checkbox is false. Setting is_checkbox=true.",
                                stepId, rowIndex, correctInRow);
                        if (source.getOptions() == null) {
                            source.setOptions(new StepikTableOptionsRequest());
                        }
                        source.getOptions().setIsCheckbox(true);
                    }

                    if (correctInRow == 0 && row.getColumns() != null && !row.getColumns().isEmpty()) {
                        log.error("Step {} row {} has no correct cells. " +
                                "Stepik API requires at least one correct answer per row. " +
                                "Setting first cell as correct.", stepId, rowIndex);
                        row.getColumns().get(0).setChoice(true);
                    }
                }

                var opts = source.getOptions();
                if (opts != null && opts.getSampleSize() != null && opts.getSampleSize() > 0) {
                    int rowCount = source.getRows().size();
                    if (opts.getSampleSize() > rowCount) {
                        log.warn("Step {} table: sample_size ({}) > rows count ({}). Setting sample_size to {}.",
                                stepId, opts.getSampleSize(), rowCount, rowCount);
                        opts.setSampleSize(rowCount);
                    }
                }
            }
        }
    }

}

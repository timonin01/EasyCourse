package org.core.service.stepik.step.convereter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.stepik.step.test.table.request.*;
import org.core.dto.stepik.step.test.table.response.*;
import org.core.util.CleanerHtmlTags;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class TableResponseToRequestConverter {

    private final CleanerHtmlTags cleanerTags;

    public StepikBlockTableRequest convertTableResponseToRequest(StepikBlockTableResponse response) {
        StepikBlockTableRequest request = new StepikBlockTableRequest();
        request.setText(cleanerTags.cleanHtmlTags(response.getText()));
        request.setVideo(response.getVideo());
        request.setOptions(response.getOptions());

        if (response.getSource() != null) {
            request.setSource(convertTableSourceResponseToRequest(response.getSource()));
        }
        return request;
    }

    private StepikTableSourceRequest convertTableSourceResponseToRequest(StepikTableSourceResponse response) {
        StepikTableSourceRequest request = new StepikTableSourceRequest();
        request.setDescription(response.getDescription());
        request.setIsAlwaysCorrect(response.getIsAlwaysCorrect());

        if (response.getRows() != null) {
            List<StepikTableRowRequest> rowRequests = response.getRows().stream()
                    .map(this::convertTableRowResponseToRequest)
                    .toList();
            request.setRows(rowRequests);
        }
        if (response.getColumns() != null) {
            List<StepikTableColumnRequest> columnRequests = response.getColumns().stream()
                    .map(this::convertTableColumnResponseToRequest)
                    .toList();
            request.setColumns(columnRequests);
        }

        if (response.getOptions() != null) {
            request.setOptions(convertTableOptionsResponseToRequest(response.getOptions()));
        } else {
            request.setOptions(new StepikTableOptionsRequest());
        }

        return request;
    }

    private StepikTableRowRequest convertTableRowResponseToRequest(StepikTableRowResponse response) {
        StepikTableRowRequest request = new StepikTableRowRequest();
        request.setName(cleanerTags.cleanHtmlTags(response.getName()));

        if (response.getColumns() != null) {
            List<StepikTableCellRequest> cellRequests = response.getColumns().stream()
                    .map(this::convertTableCellResponseToRequest)
                    .toList();
            request.setColumns(cellRequests);
        }

        return request;
    }

    private StepikTableCellRequest convertTableCellResponseToRequest(StepikTableCellResponse response) {
        StepikTableCellRequest request = new StepikTableCellRequest();
        request.setChoice(response.getChoice());
        return request;
    }

    private StepikTableColumnRequest convertTableColumnResponseToRequest(StepikTableColumnResponse response) {
        StepikTableColumnRequest request = new StepikTableColumnRequest();
        request.setName(cleanerTags.cleanHtmlTags(response.getName()));
        return request;
    }

    private StepikTableOptionsRequest convertTableOptionsResponseToRequest(StepikTableOptionsResponse response) {
        StepikTableOptionsRequest request = new StepikTableOptionsRequest();
        request.setIsCheckbox(response.getIsCheckbox());
        request.setIsRandomizeRows(response.getIsRandomizeRows());
        request.setIsRandomizeColumns(response.getIsRandomizeColumns());
        request.setSampleSize(response.getSampleSize());
        return request;
    }

}


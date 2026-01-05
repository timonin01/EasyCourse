package org.core.service.agent.stepikStepParcer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.test.table.request.StepikBlockTableRequest;
import org.core.dto.stepik.step.test.table.request.StepikTableRowRequest;
import org.core.dto.stepik.step.test.table.request.StepikTableColumnRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class TableStepParser {

    private final ObjectMapper objectMapper;

    public StepikBlockRequest parseTableRequest(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node.isObject()) {
                ObjectNode objectNode = (ObjectNode) node;
                if (!objectNode.has("name") || objectNode.get("name").isNull()) {
                    objectNode.put("name", "table");
                }
            }
            String jsonWithName = objectMapper.writeValueAsString(node);
            StepikBlockTableRequest request = objectMapper.readValue(jsonWithName, StepikBlockTableRequest.class);
            if (!validateTableRequest(request)) {
                throw new IllegalArgumentException("Invalid table request structure");
            }
            return request;
        } catch (Exception e) {
            log.error("Failed to parse table request: {}", e.getMessage(), e);
            throw new RuntimeException("Invalid table request format", e);
        }
    }

    private boolean validateTableRequest(StepikBlockTableRequest request) {
        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            log.warn("Table request validation failed: empty text");
            return false;
        }

        if (request.getSource() == null) {
            log.warn("Table request validation failed: missing source");
            return false;
        }

        List<StepikTableRowRequest> rows = request.getSource().getRows();
        List<StepikTableColumnRequest> columns = request.getSource().getColumns();
        if (rows == null || columns == null || rows.isEmpty() || columns.isEmpty()) {
            log.warn("Table request validation failed: rows/columns empty");
            return false;
        }

        // Проверка имен колонок
        boolean allColumnsNamed = columns.stream()
                .allMatch(c -> c.getName() != null && !c.getName().trim().isEmpty());
        if (!allColumnsNamed) {
            log.warn("Table request validation failed: some columns missing name");
            return false;
        }

        // Проверка строк: имя + количество ячеек соответствует колонкам, ячейки заданы
        boolean rowsValid = rows.stream().allMatch(r ->
                r.getName() != null && !r.getName().trim().isEmpty() &&
                r.getColumns() != null && r.getColumns().size() == columns.size() &&
                r.getColumns().stream().allMatch(cell -> cell.getChoice() != null)
        );
        if (!rowsValid) {
            log.warn("Table request validation failed: invalid rows or cells");
            return false;
        }

        return true;
    }
}



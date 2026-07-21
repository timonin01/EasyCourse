package org.core.dto.stepik;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StepikSyncFailure {

    private String entityType;
    private Long entityId;
    private String title;
    private String error;

    public static StepikSyncFailure of(String entityType, Long entityId, String title, Throwable error) {
        String message = error != null && error.getMessage() != null
                ? error.getMessage()
                : "Unknown error";
        return new StepikSyncFailure(entityType, entityId, title, message);
    }
}

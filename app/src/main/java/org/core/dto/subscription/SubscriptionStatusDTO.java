package org.core.dto.subscription;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.enums.UserRole;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionStatusDTO {

    private UserRole role;
    private boolean pro;
    private int aiUsed;
    private Integer aiLimit;
    private int maxBatchSteps;
    private boolean canChangeStepType;
    private boolean canSelectModel;
}

package org.core.dto.stepik.step;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikStepSourceRequestData {

    private String lesson;
    private Integer position;
    private Integer cost;
    private StepikBlockRequest block;

    @JsonProperty("is_enabled")
    private boolean isEnabled = true;

    private String status = "ready";

    @JsonProperty("reason_of_failure")
    private String reasonOfFailure;

    @JsonProperty("instruction_id")
    private Long instructionId;

    @JsonProperty("has_instruction")
    private Boolean hasInstruction = false;

    @JsonProperty("is_solutions_unlocked")
    private Boolean isSolutionsUnlocked = false;

    @JsonProperty("solutions_unlocked_attempts")
    private Integer solutionsUnlockedAttempts = 3;

    @JsonProperty("max_submissions_count")
    private Integer maxSubmissionsCount = 3;

    @JsonProperty("has_submissions_restrictions")
    private Boolean hasSubmissionsRestrictions = false;

    @JsonProperty("create_date")
    private String createDate;

    @JsonProperty("instruction_type")
    private String instructionType;

    @JsonProperty("lesson_id")
    private Long lessonId;

    @JsonProperty("needs_plan")
    private Boolean needsPlan;

    private String instruction;

}

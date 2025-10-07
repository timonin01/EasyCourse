package org.core.dto.stepik.step;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.stepik.step.test.choise.request.StepikBlockChoiceRequest;
import org.core.dto.stepik.step.test.matching.request.StepikBlockMatchingRequest;
import org.core.dto.stepik.step.test.sorting.request.StepikBlockSortingRequest;
import org.core.dto.stepik.step.test.table.request.StepikBlockTableRequest;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikStepSourceRequestData {

    private String lesson;
    private Integer position;
    private Integer cost;
    
    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "name", include = JsonTypeInfo.As.PROPERTY)
    @JsonSubTypes({
            @JsonSubTypes.Type(value = StepikBlockTextRequest.class, name = "text"),
            @JsonSubTypes.Type(value = StepikBlockChoiceRequest.class, name = "choice"),
            @JsonSubTypes.Type(value = StepikBlockSortingRequest.class, name = "sorting"),
            @JsonSubTypes.Type(value = StepikBlockMatchingRequest.class, name = "matching"),
            @JsonSubTypes.Type(value = StepikBlockTableRequest.class, name = "table")
    })
    private StepikBlockRequest block;

    @JsonProperty("is_enabled")
    private Boolean isEnabled = true;

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

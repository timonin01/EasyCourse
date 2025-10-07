package org.core.dto.stepik.step;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.stepik.step.test.choise.response.StepikBlockChoiceResponse;
import org.core.dto.stepik.step.test.sorting.response.StepikBlockSortingResponse;
import org.core.dto.stepik.step.text.StepikBlockTextResponse;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class StepikStepSourceResponseData {

    private Long id;
    private Long lesson;
    private Integer position;
    
    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "name", include = JsonTypeInfo.As.PROPERTY)
    @JsonSubTypes({
            @JsonSubTypes.Type(value = StepikBlockTextResponse.class, name = "text"),
            @JsonSubTypes.Type(value = StepikBlockChoiceResponse.class, name = "choice"),
            @JsonSubTypes.Type(value = StepikBlockSortingResponse.class, name = "sorting")
    })
    private StepikBlockResponse block;

    @JsonProperty("is_enabled")
    private boolean isEnabled;

    private String status;

    private Long cost;

    @JsonProperty("reason_of_failure")
    private String reasonOfFailure;

    @JsonProperty("create_date")
    private String createDate;

    @JsonProperty("update_date")
    private String updateDate;

    @JsonProperty("is_solutions_unlocked")
    private Boolean isSolutionsUnlocked;

    @JsonProperty("solutions_unlocked_attempts")
    private Integer solutionsUnlockedAttempts;

    @JsonProperty("max_submissions_count")
    private Integer maxSubmissionsCount;

    @JsonProperty("has_submissions_restrictions")
    private Boolean hasSubmissionsRestrictions;

    @JsonProperty("viewed_by")
    private Integer viewedBy;

    @JsonProperty("passed_by")
    private Integer passedBy;

    @JsonProperty("correct_ratio")
    private Double correctRatio;

    private Integer worth;

    private Integer variation;

    @JsonProperty("variations_count")
    private Integer variationsCount;

    @JsonProperty("discussions_count")
    private Integer discussionsCount;

    @JsonProperty("discussion_proxy")
    private String discussionProxy;

    private Object actions;
    private String progress;
    private Object subscriptions;
    private Object error;
    private Object warnings;

}

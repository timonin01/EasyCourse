package org.core.dto.stepik.step.code.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikCodeSourceRequest {

    @JsonProperty("are_all_tests_run")
    private Boolean areAllTestsRun;

    @JsonProperty("code")
    private String advancedCodeEditor;

    @JsonProperty("execution_memory_limit")
    private Integer executionMemoryLimit;

    @JsonProperty("execution_time_limit")
    private Integer executionTimeLimit;

    @JsonProperty("is_memory_limit_scaled")
    private Boolean isMemoryLimitScaled;

    @JsonProperty("is_run_user_code_allowed")
    private Boolean isRunUserCodeAllowed;

    @JsonProperty("is_time_limit_scaled")
    private Boolean isTimeLimitScaled;

    @JsonProperty("manual_memory_limits")
    private List<Integer> manualMemoryLimits;

    @JsonProperty("manual_time_limits")
    private List<Integer> manualTimeLimits;

    @JsonProperty("samples_count")
    private Integer samplesCount;

    @JsonProperty("templates_data")
    private String templatesData;

    @JsonProperty("test_archive")
    private List<Integer> testArchive;

    @JsonProperty("test_cases")
    private List<List<String>> testCases;
}

package org.core.dto.stepik.step.code.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class StepikCodeSourceResponse {

    private String code;

    @JsonProperty("execution_time_limit")
    private Integer executionTimeLimit;

    @JsonProperty("execution_memory_limit")
    private Integer executionMemoryLimit;

    @JsonProperty("samples_count")
    private Integer samplesCount;

    @JsonProperty("templates_data")
    private String templatesData;

    @JsonProperty("is_time_limit_scaled")
    private Boolean isTimeLimitScaled;

    @JsonProperty("is_memory_limit_scaled")
    private Boolean isMemoryLimitScaled;

    @JsonProperty("is_run_user_code_allowed")
    private Boolean isRunUserCodeAllowed;

    @JsonProperty("manual_time_limits")
    private List<Integer> manualTimeLimits;

    @JsonProperty("manual_memory_limits")
    private List<Integer> manualMemoryLimits;

    @JsonProperty("test_archive")
    private List<Integer> testArchive;

    @JsonProperty("test_cases")
    private List<List<String>> testCases;

    @JsonProperty("are_all_tests_run")
    private Boolean areAllTestsRun;

}

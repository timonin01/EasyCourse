package org.core.dto.stepik.step.enterWord.randomTasks.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikRandomTasksSourceResponse {

    private String task;
    private String solve;
    @JsonProperty("max_error")
    private String maxError;
    private Object ranges;
    private Integer combinations;

}

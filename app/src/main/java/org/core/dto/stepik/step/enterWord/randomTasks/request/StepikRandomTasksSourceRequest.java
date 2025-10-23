package org.core.dto.stepik.step.enterWord.randomTasks.request;

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
public class StepikRandomTasksSourceRequest {

    private String task;
    private String solve;
    @JsonProperty("max_error")
    private String maxError;
    private List<Object> ranges;
    private Integer combinations;

}

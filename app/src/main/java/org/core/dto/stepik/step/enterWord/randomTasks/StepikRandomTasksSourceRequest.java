package org.core.dto.stepik.step.enterWord.randomTasks;

import com.fasterxml.jackson.annotation.JsonInclude;
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
    private String max_error;
    private List<Object> ranges;
    private Integer combinations;

}

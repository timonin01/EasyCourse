package org.core.dto.agent.tools;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AgentStepResponse {

    private String thought;
    private List<CourseToolCall> toolCalls = new ArrayList<>();
    private String message;
}

package org.core.dto.agent.course;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.agent.ChatMessage;
import org.core.enums.CourseAgentMode;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class AgentResumeContext {

    private String pendingTool;
    @Builder.Default
    private Map<String, Object> pendingArgs = new HashMap<>();
    @Builder.Default
    private List<PlanActionDTO> collectedActions = new ArrayList<>();
    @Builder.Default
    private List<ChatMessage> loopMessages = new ArrayList<>();
    private String userInput;
    private String clarificationMessage;
    private CourseAgentMode agentMode;
}

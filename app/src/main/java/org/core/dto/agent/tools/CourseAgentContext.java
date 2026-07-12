package org.core.dto.agent.tools;

import lombok.Getter;
import lombok.Setter;
import org.core.domain.Course;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.course.PlanActionDTO;
import org.core.enums.LlmModel;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class CourseAgentContext {

    private final Course course;
    private final Long userId;
    private final String sessionId;
    private final String userInput;
    private final LlmModel llmModel;
    private final List<ChatMessage> history;
    private final List<PlanActionDTO> pendingActions = new ArrayList<>();
    private String courseSnapshot;

    public CourseAgentContext(Course course, Long userId, String sessionId, String userInput,
                              LlmModel llmModel, List<ChatMessage> history) {
        this.course = course;
        this.userId = userId;
        this.sessionId = sessionId;
        this.userInput = userInput;
        this.llmModel = llmModel;
        this.history = history == null ? List.of() : history;
    }
}

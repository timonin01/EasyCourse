package org.core.dto.agent.tools;

import lombok.Builder;
import lombok.Getter;
import org.core.dto.agent.course.CourseAgentResponse;
import org.core.dto.agent.course.EntityCandidateDTO;

import java.util.List;

@Getter
@Builder
public class CourseToolResult {

    private final boolean success;
    private final String payload;
    private final boolean immediateExit;
    private final CourseAgentResponse immediateResponse;
    private final boolean needsClarification;
    private final String clarificationMessage;
    private final List<EntityCandidateDTO> candidates;

    public static CourseToolResult ok(String payload) {
        return CourseToolResult.builder()
                .success(true)
                .payload(payload)
                .build();
    }

    public static CourseToolResult fail(String message) {
        return CourseToolResult.builder()
                .success(false)
                .payload(message)
                .build();
    }

    public static CourseToolResult immediate(CourseAgentResponse response) {
        return CourseToolResult.builder()
                .success(true)
                .immediateExit(true)
                .immediateResponse(response)
                .build();
    }

    public static CourseToolResult clarify(String message, List<EntityCandidateDTO> candidates) {
        return CourseToolResult.builder()
                .success(false)
                .needsClarification(true)
                .clarificationMessage(message)
                .candidates(candidates)
                .build();
    }
}

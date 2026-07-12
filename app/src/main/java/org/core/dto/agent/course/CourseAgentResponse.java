package org.core.dto.agent.course;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.step.StepResponseDTO;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseAgentResponse {

    private CourseAgentAction action;
    private String message;
    private CoursePlanDTO plan;

    private List<EntityCandidateDTO> candidates;
    private AgentResumeContext resumeContext;

    private List<Long> createdSectionIds;
    private List<Long> createdLessonIds;
    private List<Long> createdStepIds;

    private StepResponseDTO step;

    public static CourseAgentResponse error(String message) {
        return CourseAgentResponse.builder()
                .action(CourseAgentAction.ERROR)
                .message(message)
                .build();
    }

    public static CourseAgentResponse clarify(String message, List<EntityCandidateDTO> candidates,
                                              AgentResumeContext resumeContext) {
        return CourseAgentResponse.builder()
                .action(CourseAgentAction.NEED_CLARIFICATION)
                .message(message)
                .candidates(candidates)
                .resumeContext(resumeContext)
                .build();
    }
}

package org.core.dto.agent.course.sse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.domain.StepType;
import org.core.dto.agent.course.PlanActionType;

import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PlanExecutionEvent {

    private PlanExecutionEventType planExecutionEventType;
    private int currentCreatedSteps;
    private int totalSteps;

    private Long courseId;
    private Long userId;
    private String sessionId;

    private String sectionTitle;
    private String lessonTitle;

    private StepType stepType;
    private Integer sectionPosition;
    private Integer lessonPosition;
    private Integer stepPosition;

    private String message;

    private Long createdSectionId;
    private Long createdLessonId;
    private Long createdStepId;

    private List<Long> createdSectionIds;
    private List<Long> createdLessonIds;
    private List<Long> createdStepIds;

    private PlanActionType planActionType;
}

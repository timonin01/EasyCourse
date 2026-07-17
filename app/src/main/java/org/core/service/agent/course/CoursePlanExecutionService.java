package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import org.core.dto.agent.course.CoursePlanDTO;
import org.core.dto.agent.course.PlanActionDTO;
import org.core.enums.LlmModel;
import org.core.service.agent.course.sse.PlanExecutionProgress;
import org.core.service.agent.course.tools.util.CoursePlanHelper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CoursePlanExecutionService {

    private final CoursePlanValidator planValidator;
    private final CoursePlanHelper coursePlanHelper;
    private final CourseDraftGenerationService draftGenerationService;
    private final CourseAgentDeletionService deletionService;
    private final DeleteActionMetadataService deleteMetadataService;

    public ExecutionDraftResult executeCreateActions(Long courseId, Long userId, String sessionId,
                                                     List<PlanActionDTO> actions, LlmModel llmModel,
                                                     PlanExecutionProgress planExecutionProgress) {
        List<Long> sectionIds = new ArrayList<>();
        List<Long> lessonIds = new ArrayList<>();
        List<Long> stepIds = new ArrayList<>();

        for (PlanActionDTO action : actions) {
            if (action == null || !coursePlanHelper.isCreateAction(action.getType())) {
                continue;
            }
            CoursePlanDTO singlePlan = CoursePlanDTO.builder()
                    .actions(List.of(action))
                    .build();
            ExecutionDraftResult result = draftGenerationService.executePlan(
                    courseId, userId, sessionId, singlePlan, llmModel, planExecutionProgress);
            sectionIds.addAll(result.sectionIds());
            lessonIds.addAll(result.lessonIds());
            stepIds.addAll(result.stepIds());
        }
        return new ExecutionDraftResult(sectionIds, lessonIds, stepIds);
    }

    public void executeDeleteActions(Long courseId, Long userId, List<PlanActionDTO> actions) {
        List<PlanActionDTO> enriched = deleteMetadataService.prepareDeleteAction(userId, actions);
        for (PlanActionDTO action : enriched) {
            if (action == null || !coursePlanHelper.isDeleteAction(action.getType())) {
                continue;
            }
            CoursePlanDTO singlePlan = CoursePlanDTO.builder()
                    .actions(List.of(action))
                    .build();
            planValidator.validate(courseId, userId, singlePlan);
            deletionService.executeDelete(courseId, userId, singlePlan);
        }
    }
}

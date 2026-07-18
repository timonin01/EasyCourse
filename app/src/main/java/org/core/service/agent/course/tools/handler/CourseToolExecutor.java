package org.core.service.agent.course.tools.handler;

import lombok.RequiredArgsConstructor;
import org.core.dto.agent.tools.CourseAgentContext;
import org.core.dto.agent.tools.CourseToolCall;
import org.core.dto.agent.tools.CourseToolName;
import org.core.dto.agent.tools.CourseToolResult;
import org.core.service.agent.course.CourseSnapshotBuilder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CourseToolExecutor {

    private final CourseSnapshotBuilder courseSnapshotBuilder;
    private final ProposeCreateSectionHandler proposeCreateSectionHandler;
    private final ProposeCreateLessonsHandler proposeCreateLessonsHandler;
    private final ProposeCreateStepsHandler proposeCreateStepsHandler;
    private final ProposeDeleteSectionHandler proposeDeleteSectionHandler;
    private final ProposeDeleteLessonHandler proposeDeleteLessonHandler;
    private final ProposeDeleteStepHandler proposeDeleteStepHandler;
    private final ProposeCopyStepHandler proposeCopyStepHandler;
    private final ProposeMoveStepHandler proposeMoveStepHandler;
    private final ProposeMoveLessonHandler proposeMoveLessonHandler;
    private final ModifyStepHandler modifyStepHandler;
    private final AnswerQuestionHandler answerQuestionHandler;

    public CourseToolResult execute(CourseAgentContext courseAgentContext, CourseToolCall toolCall) {
        CourseToolName toolName = CourseToolName.parse(toolCall.getName());
        Map<String, Object> args = toolCall.getArgs() == null ? Map.of() : toolCall.getArgs();

        if (courseAgentContext.isAskMode()) {
            if (toolName.isMutationTool()) {
                return CourseToolResult.fail(
                        "В режиме «Спросить» изменения недоступны. Переключитесь в режим «Редактировать».");
            }
            if (toolName == CourseToolName.FINISH) {
                return CourseToolResult.ok("finish");
            }
        }

        return switch (toolName) {
            case GET_COURSE_STRUCTURE -> {
                ensureFullCourseSnapshot(courseAgentContext);
                yield CourseToolResult.ok(courseAgentContext.getCourseSnapshot());
            }
            case PROPOSE_CREATE_SECTION -> {
                ensureFullCourseSnapshot(courseAgentContext);
                yield proposeCreateSectionHandler.handleProposeCreateSection(courseAgentContext, args);
            }
            case PROPOSE_CREATE_LESSONS -> proposeCreateLessonsHandler.handleProposeCreateLessons(courseAgentContext, args);
            case PROPOSE_CREATE_STEPS -> proposeCreateStepsHandler.handleProposeCreateSteps(courseAgentContext, args);
            case PROPOSE_DELETE_SECTION -> proposeDeleteSectionHandler.handleProposeDeleteSection(courseAgentContext, args);
            case PROPOSE_DELETE_LESSON -> proposeDeleteLessonHandler.handleProposeDeleteLesson(courseAgentContext, args);
            case PROPOSE_DELETE_STEP -> proposeDeleteStepHandler.handleProposeDeleteStep(courseAgentContext, args);
            case PROPOSE_COPY_STEP -> proposeCopyStepHandler.handleProposeCopyStep(courseAgentContext, args);
            case PROPOSE_MOVE_STEP -> proposeMoveStepHandler.handleProposeMoveStep(courseAgentContext, args);
            case PROPOSE_MOVE_LESSON -> proposeMoveLessonHandler.handleProposeMoveLesson(courseAgentContext, args);
            case MODIFY_STEP -> modifyStepHandler.handleModifyStep(courseAgentContext, args);
            case ANSWER_QUESTION -> answerQuestionHandler.handleAnswerQuestion(courseAgentContext, args);
            case FINISH -> CourseToolResult.ok("finish");
        };
    }

    private void ensureFullCourseSnapshot(CourseAgentContext courseAgentContext) {
        if (courseAgentContext.getCourseSnapshot() == null) {
            courseAgentContext.setCourseSnapshot(courseSnapshotBuilder.buildCourseSnapshot(courseAgentContext.getCourse()));
        }
    }
}

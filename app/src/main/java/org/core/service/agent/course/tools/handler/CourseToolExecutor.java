package org.core.service.agent.course.tools.handler;

import lombok.RequiredArgsConstructor;
import org.core.config.LlmModelConfig;
import org.core.domain.Course;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.agent.course.*;
import org.core.dto.agent.tools.*;
import org.core.repository.StepRepository;
import org.core.service.agent.SystemPromptService;
import org.core.service.agent.analyzer.SectionAnalyzerService;
import org.core.service.agent.batch.BatchAnalyzerService;
import org.core.service.agent.course.*;
import org.core.service.agent.course.tools.util.ToolArgsHelper;
import org.core.service.agent.llmProvider.LlmProvider;
import org.core.dto.agent.tools.resolution.ResolvedLesson;
import org.core.dto.agent.tools.resolution.ResolvedSection;
import org.core.dto.agent.tools.resolution.ResolvedStep;
import org.core.util.UserAccessService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
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

        checkCourseSnapshot(courseAgentContext);

        return switch (toolName) {
            case GET_COURSE_STRUCTURE -> CourseToolResult.ok(courseAgentContext.getCourseSnapshot());
            case PROPOSE_CREATE_SECTION -> proposeCreateSectionHandler.handleProposeCreateSection(courseAgentContext, args);
            case PROPOSE_CREATE_LESSONS -> proposeCreateLessonsHandler.handleProposeCreateLessons(courseAgentContext, args);
            case PROPOSE_CREATE_STEPS -> proposeCreateStepsHandler.handleProposeCreateSteps(courseAgentContext, args);
            case PROPOSE_DELETE_SECTION -> proposeDeleteSectionHandler.handleProposeDeleteSection(courseAgentContext, args);
            case PROPOSE_DELETE_LESSON -> proposeDeleteLessonHandler.handleProposeDeleteLesson(courseAgentContext, args);
            case PROPOSE_DELETE_STEP -> proposeDeleteStepHandler.handleProposeDeleteStep(courseAgentContext, args);
            case MODIFY_STEP -> modifyStepHandler.handleModifyStep(courseAgentContext, args);
            case ANSWER_QUESTION -> answerQuestionHandler.handleAnswerQuestion(courseAgentContext, args);
            case FINISH -> CourseToolResult.ok("finish");
        };
    }


    private void checkCourseSnapshot(CourseAgentContext courseAgentContext) {
        if (courseAgentContext.getCourseSnapshot() == null) {
            courseAgentContext.setCourseSnapshot(courseSnapshotBuilder.buildCourseSnapshot(courseAgentContext.getCourse()));
        }
    }
}

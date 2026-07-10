package org.core.service.agent.course.router;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.course.CourseAgentIntent;
import org.core.service.agent.course.CourseIntentResult;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Primary
@RequiredArgsConstructor
@Slf4j
public class HybridCourseIntentRouter implements CourseIntentClassifier {

    private final CourseIntentRouter ruleRouter;
    private final LlmCourseIntentRouter llmRouter;

    @Override
    public CourseIntentResult classify(String userInput) {
        return classify(userInput, List.of());
    }

    @Override
    public CourseIntentResult classify(String userInput, List<ChatMessage> history) {
        CourseIntentResult ruleResult = ruleRouter.classify(userInput);
        boolean needsConversationContext =
                history != null && !history.isEmpty() && containsContextReference(userInput);
        if (ruleResult.intent() != CourseAgentIntent.UNKNOWN && !needsConversationContext) {
            return ruleResult;
        }
        log.info("Using LLM intent classifier with conversation context for '{}'", userInput);
        return llmRouter.classify(userInput, history);
    }

    private boolean containsContextReference(String userInput) {
        if (userInput == null) {
            return false;
        }
        String text = userInput.toLowerCase();
        return text.contains("туда")
                || text.contains("там")
                || text.contains("этот")
                || text.contains("эту")
                || text.contains("это ")
                || text.contains("него")
                || text.contains("неё")
                || text.contains("нее")
                || text.contains("ещё")
                || text.contains("еще")
                || text.contains("предыдущ");
    }
}

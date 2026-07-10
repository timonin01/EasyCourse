package org.core.service.agent.course.router;


import org.core.dto.agent.ChatMessage;
import org.core.service.agent.course.CourseIntentResult;

import java.util.List;

public interface CourseIntentClassifier {

    CourseIntentResult classify(String userInput);

    default CourseIntentResult classify(String userInput, List<ChatMessage> history) {
        return classify(userInput);
    }
}

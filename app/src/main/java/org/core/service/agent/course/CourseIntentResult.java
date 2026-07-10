package org.core.service.agent.course;

import org.core.dto.agent.course.CourseAgentIntent;

public record CourseIntentResult(
        CourseAgentIntent intent,
        String sectionHint,
        String lessonHint,
        String stepHint
) {
    public static CourseIntentResult of(CourseAgentIntent intent) {
        return new CourseIntentResult(intent, null, null, null);
    }
}

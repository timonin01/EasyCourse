package org.core.dto.agent.tools.resolution;

import org.core.domain.Lesson;
import org.core.dto.agent.course.EntityCandidateDTO;
import org.core.dto.agent.tools.CourseToolResult;

import java.util.List;

public record ResolvedLesson(Lesson lesson, CourseToolResult result) {

    public static ResolvedLesson found(Lesson lesson) {
        return new ResolvedLesson(lesson, null);
    }

    public static ResolvedLesson clarify(String message, List<EntityCandidateDTO> candidates) {
        return new ResolvedLesson(null, CourseToolResult.clarify(message, candidates));
    }

    public static ResolvedLesson notFound() {
        return new ResolvedLesson(null, null);
    }

    public boolean found() {
        return lesson != null;
    }

    public boolean needsClarification() {
        return result != null;
    }
}

package org.core.dto.agent.tools.resolution;

import org.core.domain.Step;
import org.core.dto.agent.course.EntityCandidateDTO;
import org.core.dto.agent.tools.CourseToolResult;

import java.util.List;

public record ResolvedStep(Step step, CourseToolResult result) {

    public static ResolvedStep found(Step step) {
        return new ResolvedStep(step, null);
    }

    public static ResolvedStep clarify(String message, List<EntityCandidateDTO> candidates) {
        return new ResolvedStep(null, CourseToolResult.clarify(message, candidates));
    }

    public static ResolvedStep notFound() {
        return new ResolvedStep(null, null);
    }

    public boolean found() {
        return step != null;
    }

    public boolean needsClarification() {
        return result != null;
    }
}

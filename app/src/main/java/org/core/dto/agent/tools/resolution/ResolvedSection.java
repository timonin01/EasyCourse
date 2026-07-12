package org.core.dto.agent.tools.resolution;

import org.core.domain.Section;
import org.core.dto.agent.course.EntityCandidateDTO;
import org.core.dto.agent.tools.CourseToolResult;

import java.util.List;

public record ResolvedSection(Section section, CourseToolResult result) {

    public static ResolvedSection found(Section section) {
        return new ResolvedSection(section, null);
    }

    public static ResolvedSection clarify(String message, List<EntityCandidateDTO> candidates) {
        return new ResolvedSection(null, CourseToolResult.clarify(message, candidates));
    }

    public static ResolvedSection notFound() {
        return new ResolvedSection(null, null);
    }

    public boolean found() {
        return section != null;
    }

    public boolean needsClarification() {
        return result != null;
    }
}

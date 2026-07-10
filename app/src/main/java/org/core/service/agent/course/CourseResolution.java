package org.core.service.agent.course;

import org.core.dto.agent.course.EntityCandidateDTO;

import java.util.Collections;
import java.util.List;

public record CourseResolution<T>(T value, List<EntityCandidateDTO> candidates) {

    public static <T> CourseResolution<T> found(T value) {
        return new CourseResolution<>(value, Collections.emptyList());
    }

    public static <T> CourseResolution<T> ambiguous(List<EntityCandidateDTO> candidates) {
        return new CourseResolution<>(null, candidates);
    }

    public static <T> CourseResolution<T> none() {
        return new CourseResolution<>(null, Collections.emptyList());
    }

    public boolean isFound() {
        return value != null;
    }

    public boolean isAmbiguous() {
        return value == null && candidates != null && !candidates.isEmpty();
    }
}

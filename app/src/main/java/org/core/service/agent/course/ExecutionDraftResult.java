package org.core.service.agent.course;

import java.util.List;

public record ExecutionDraftResult(
        List<Long> sectionIds,
        List<Long> lessonIds,
        List<Long> stepIds
) {}

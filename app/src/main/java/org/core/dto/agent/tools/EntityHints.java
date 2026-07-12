package org.core.dto.agent.tools;

import org.core.service.agent.course.tools.util.ToolArgsHelper;

import java.util.Map;

public record EntityHints(String sectionHint, String lessonHint, String stepHint) {

    public static EntityHints fromArgs(Map<String, Object> args) {
        return new EntityHints(
                ToolArgsHelper.stringArg(args, "sectionHint"),
                ToolArgsHelper.stringArg(args, "lessonHint"),
                ToolArgsHelper.stringArg(args, "stepHint"));
    }
}

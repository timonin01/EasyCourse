package org.core.service.agent.course.tools.util;

import java.util.Map;

public final class ToolArgsHelper {

    private ToolArgsHelper() {
    }

    public static String stringArg(Map<String, Object> args, String key) {
        if (args == null || !args.containsKey(key) || args.get(key) == null) {
            return null;
        }
        String value = String.valueOf(args.get(key)).trim();
        return value.isEmpty() ? null : value;
    }

    public static Long longArg(Map<String, Object> args, String key) {
        if (args == null || !args.containsKey(key) || args.get(key) == null) {
            return null;
        }
        Object raw = args.get(key);
        if (raw instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(raw).trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    public static String instruction(Map<String, Object> args, String fallback) {
        String value = stringArg(args, "userInstruction");
        if (value != null) {
            return value;
        }
        return fallback;
    }
}

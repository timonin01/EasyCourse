package org.core.service.agent.course;

import org.core.domain.Course;

public record CourseGenerationContext(String courseTitle, String courseDescription, String programmingLanguage) {

    public static CourseGenerationContext from(Course course) {
        String title = course.getTitle() == null ? "" : course.getTitle().trim();
        String description = course.getDescription() == null ? "" : course.getDescription().trim();
        return new CourseGenerationContext(title, description, detectProgrammingLanguage(title, description));
    }

    public String enrichStepInput(String specificInput, String moduleTitle, String lessonTitle) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("КОНТЕКСТ КУРСА: «").append(courseTitle.isBlank() ? "без названия" : courseTitle).append("»");
        if (!courseDescription.isBlank()) {
            prompt.append("\nОписание курса: ").append(courseDescription);
        }
        prompt.append("\nВсе материалы шага должны соответствовать теме и описанию курса. Не используй примеры, термины и задачи из других предметных областей.");
        if (programmingLanguage != null && !programmingLanguage.isBlank()) {
            prompt.append("\nЯзык программирования курса: ").append(programmingLanguage);
            prompt.append("\nВсе примеры кода, задачи code и формулировки — ТОЛЬКО на ").append(programmingLanguage).append('.');
        }
        if (moduleTitle != null && !moduleTitle.isBlank()) {
            prompt.append("\nМодуль: «").append(moduleTitle).append('»');
        }
        if (lessonTitle != null && !lessonTitle.isBlank()) {
            prompt.append("\nУрок: «").append(lessonTitle).append('»');
        }
        prompt.append("\n\nТема шага: ").append(specificInput == null || specificInput.isBlank() ? "по теме урока" : specificInput.trim());
        prompt.append("\n\nСложность заданий: средняя и выше. Избегай тривиальных задач (сложение двух чисел, hello world).");
        return prompt.toString();
    }

    private static String detectProgrammingLanguage(String title, String description) {
        String combined = (title + " " + description).toLowerCase();
        if (combined.contains("python") || combined.contains("питон")) {
            return "Python";
        }
        if (combined.contains("javascript") || combined.contains("typescript") || combined.contains(" node ")) {
            return "JavaScript";
        }
        if (combined.contains("java") || combined.contains("джава")) {
            return "Java";
        }
        if (combined.contains("golang") || combined.matches(".*\\bgo\\b.*")) {
            return "Go";
        }
        if (combined.contains("c++") || combined.contains("cpp")) {
            return "C++";
        }
        if (combined.contains("c#")) {
            return "C#";
        }
        return null;
    }
}

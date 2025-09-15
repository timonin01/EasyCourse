package org.core.dto.stepik.lesson;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikLessonResponse {

    private List<StepikLessonResponseData> lessons;

    public StepikLessonResponseData getLesson() {
        return lessons != null && !lessons.isEmpty() ? lessons.get(0) : null;
    }

}


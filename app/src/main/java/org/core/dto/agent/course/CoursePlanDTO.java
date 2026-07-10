package org.core.dto.agent.course;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.agent.batchAnalyzer.CountStepDTO;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CoursePlanDTO {

    private CourseAgentIntent intent;
    private String message;

    private Long targetSectionId;
    private String targetSectionTitle;

    private Long targetLessonId;
    private String targetLessonTitle;

    private Long targetStepId;
    private String targetStepTitle;

    private SectionPlanDTO section;

    private List<LessonPlanDTO> lessons;

    private List<CountStepDTO> steps;
}

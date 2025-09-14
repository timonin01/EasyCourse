package org.core.dto.stepik.section;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikSectionRequestData {

    @JsonProperty("id")
    private Long id;
    
    private String title;
    private String description = "";
    private String course;
    private Integer position = 1;

    @JsonProperty("schedule_type")
    private String scheduleType = null;

    @JsonProperty("begin_date")
    private String beginDate = null;

    @JsonProperty("end_date")
    private String endDate = null;

    @JsonProperty("grading_policy")
    private String gradingPolicy = "halved";

    @JsonProperty("grading_policy_source")
    private String gradingPolicySource = null;

    @JsonProperty("hard_deadline")
    private String hardDeadline = null;

    @JsonProperty("hard_deadline_source")
    private String hardDeadlineSource = null;

    @JsonProperty("soft_deadline")
    private String softDeadline = null;

    @JsonProperty("soft_deadline_source")
    private String softDeadlineSource = null;

    @JsonProperty("progress_id")
    private String progressId = null;

    @JsonProperty("actions")
    private Object actions = null;

    @JsonProperty("slug")
    private String slug = null;

    @JsonProperty("progress")
    private String progress = null;

    @JsonProperty("proctor_session")
    private String proctorSession = null;

    @JsonProperty("required_section")
    private String requiredSection = null;

    @JsonProperty("exam_session")
    private String examSession = null;

    @JsonProperty("random_exam_problems_course")
    private String randomExamProblemsCourse = null;

    @JsonProperty("exam_duration_minutes")
    private Integer examDurationMinutes = 120;

    @JsonProperty("begin_date_source")
    private String beginDateSource = "";

    @JsonProperty("random_exam_problems_count")
    private Integer randomExamProblemsCount = 20;

    @JsonProperty("required_percent")
    private Integer requiredPercent = 100;

    @JsonProperty("has_progress")
    private Boolean hasProgress = true;

    @JsonProperty("discounting_policy")
    private String discountingPolicy = "no_discount";

    @JsonProperty("is_exam")
    private Boolean isExam = false;

    @JsonProperty("is_exam_without_progress")
    private Boolean isExamWithoutProgress = false;

    @JsonProperty("is_random_exam")
    private Boolean isRandomExam = false;

    @JsonProperty("has_proctor_session")
    private Boolean hasProctorSession = false;

    @JsonProperty("is_requirement_satisfied")
    private Boolean isRequirementSatisfied = true;

    @JsonProperty("is_proctoring_can_be_scheduled")
    private Boolean isProctoringCanBeScheduled = false;

}

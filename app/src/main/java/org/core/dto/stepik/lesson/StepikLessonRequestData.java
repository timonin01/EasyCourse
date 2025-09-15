package org.core.dto.stepik.lesson;

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
public class StepikLessonRequestData {

    private Long id;
    private String title;
    private String language = "ru";

    @JsonProperty("is_public")
    private Boolean isPublic;

    @JsonProperty("is_comments_enabled")
    private Boolean isCommentsEnabled = true;

    @JsonProperty("is_featured")
    private Boolean isFeatured = false;

    @JsonProperty("is_blank")
    private Boolean isBlank = false;

    @JsonProperty("is_draft")
    private Boolean isDraft = false;

    @JsonProperty("is_orphaned")
    private Boolean isOrphaned = false;

    @JsonProperty("is_exam_without_progress")
    private Boolean isExamWithoutProgress = false;

    @JsonProperty("has_progress")
    private Boolean hasProgress = false;

    private String captcha;

    private String owner;

}

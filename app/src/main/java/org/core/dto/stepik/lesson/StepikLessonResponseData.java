package org.core.dto.stepik.lesson;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikLessonResponseData {

    private Long id;
    private String title;
    private String language;
    private Integer position;

    @JsonProperty("is_public")
    private Boolean isPublic;

    @JsonProperty("is_comments_enabled")
    private Boolean isCommentsEnabled;

    @JsonProperty("is_featured")
    private Boolean isFeatured;

    @JsonProperty("is_blank")
    private Boolean isBlank;

    @JsonProperty("is_draft")
    private Boolean isDraft;

    @JsonProperty("is_orphaned")
    private Boolean isOrphaned;

    @JsonProperty("is_exam_without_progress")
    private Boolean isExamWithoutProgress;

    @JsonProperty("has_progress")
    private Boolean hasProgress;

    @JsonProperty("progress_id")
    private String progressId;

    @JsonProperty("abuse_count")
    private Integer abuseCount;

    @JsonProperty("epic_count")
    private Integer epicCount;

    @JsonProperty("vote_delta")
    private Integer voteDelta;

    private String captcha;

    @JsonProperty("cover_url")
    private String coverUrl;

    @JsonProperty("create_date")
    private String createDate;

    @JsonProperty("passed_by")
    private Integer passedBy;

    @JsonProperty("reply_count")
    private Integer replyCount;

    private String slug;

    @JsonProperty("time_to_complete")
    private String timeToComplete;

    @JsonProperty("update_date")
    private String updateDate;

    @JsonProperty("viewed_by")
    private Integer viewedBy;

    @JsonProperty("canonical_url")
    private String canonicalUrl;

    private String progress;

    private String vote;

    private String owner;

    private Object actions;

    private Object subscriptions;

    @JsonProperty("courses")
    private Object courses;

    private Object units;

}

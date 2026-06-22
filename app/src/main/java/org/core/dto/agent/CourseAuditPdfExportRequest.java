package org.core.dto.agent;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseAuditPdfExportRequest {

    private Long courseId;
    private String courseTitle;
    private String summary;
    private String plan;
    private String improvements;
    private String newContent;
    private boolean includeReport;
    private boolean includeImprovements;
    private boolean includeNewContent;
}

package org.core.dto.stepik.unit;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StepikUnitResponseData {

    private Long id;
    private Long section;
    private Long lesson;
    private List<Long> assignments;
    private Integer position;
    private Object actions;
    private Object progress;
    private String beginDate;
    private String endDate;
    private String softDeadline;
    private String hardDeadline;
    private String gradingPolicy;
    private String beginDateSource;
    private String endDateSource;
    private String softDeadlineSource;
    private String hardDeadlineSource;
    private String gradingPolicySource;
    private Boolean isActive;
    private String createDate;
    private String updateDate;

}

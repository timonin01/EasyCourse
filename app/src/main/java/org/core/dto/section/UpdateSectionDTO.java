package org.core.dto.section;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSectionDTO {

    private Long sectionId;
    private String title;
    private String description;
    private Integer position;

}

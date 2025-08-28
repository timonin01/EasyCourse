package org.core.dto.model;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateModelDTO {

    private Long modelId;
    private String title;
    private String description;
    private Integer position;

}

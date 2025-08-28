package org.core.dto.model;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateModelDTO {

    private String title;
    private String description;
    private Integer position;

}

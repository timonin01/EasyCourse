package org.core.dto.agent.course;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EntityCandidateDTO {

    private String type;
    private Long id;
    private String label;

}

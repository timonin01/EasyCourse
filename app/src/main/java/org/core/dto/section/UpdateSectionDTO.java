package org.core.dto.section;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSectionDTO {

    @NotNull(message = "ID модуля обязателен")
    private Long sectionId;

    @Size(min = 1, max = 64, message = "Название модуля должно быть от 1 до 64 символов")
    private String title;

    private String description;
    private Integer position;

}

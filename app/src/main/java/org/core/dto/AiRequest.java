package org.core.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AiRequest {

    @NotBlank(message = "Ai name cannot be blank")
    private String aiName;

    @NotBlank(message = "Message cannot be blank")
    private String message;

}

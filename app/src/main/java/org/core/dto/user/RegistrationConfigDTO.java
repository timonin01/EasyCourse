package org.core.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RegistrationConfigDTO {

    @JsonProperty("enabled")
    private final boolean registrationEnabled;

    @JsonProperty("inviteRequired")
    private final boolean inviteRequired;
}

package org.core.service.registration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingRegistrationDTO {

    private String name;
    private String email;
    private String passwordHash;
    private String codeHash;
    private int failedAttempts;
}

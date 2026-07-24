package org.core.service.registration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

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
    private LocalDateTime privacyAcceptedAt;
    private String privacyConsentVersion;
    private String privacyAcceptedIp;
}

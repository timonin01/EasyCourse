package org.core.dto.resetPassword;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingPasswordResetDTO {

    private String email;
    private String codeHash;
    private int failedAttempts;

}

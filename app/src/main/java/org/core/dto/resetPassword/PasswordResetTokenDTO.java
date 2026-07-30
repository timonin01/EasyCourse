package org.core.dto.resetPassword;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PasswordResetTokenDTO {

    private final String resetToken;

}

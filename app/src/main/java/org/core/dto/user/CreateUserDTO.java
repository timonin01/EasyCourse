package org.core.dto.user;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserDTO {
    
    @NotBlank(message = "Имя не может быть пустым")
    @Size(min = 1, max = 100, message = "Имя должно быть от 1 до 100 символов")
    private String name;

    @NotBlank(message = "Email не может быть пустым")
    @Email(message = "Некорректный формат email")
    @Size(max = 100, message = "Email не должен превышать 100 символов")
    private String email;

    @NotBlank(message = "Пароль не может быть пустым")
    @Size(min = 6, max = 100, message = "Пароль должен быть не менее 6 символов")
    private String password;

    @Size(max = 100, message = "Код приглашения не должен превышать 100 символов")
    private String inviteCode;

    @NotNull(message = "Необходимо согласие на обработку персональных данных")
    private Boolean privacyAccepted;

    @NotBlank(message = "Не указана версия согласия на обработку персональных данных")
    @Size(max = 32, message = "Версия согласия не должна превышать 32 символа")
    private String privacyConsentVersion;
}

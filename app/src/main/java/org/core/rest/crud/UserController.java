package org.core.rest.crud;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.context.UserContextBean;
import org.core.dto.resetPassword.PasswordResetTokenDTO;
import org.core.dto.resetPassword.ResetPasswordDTO;
import org.core.dto.resetPassword.ResetPasswordMessageDTO;
import org.core.dto.user.*;
import org.core.service.crud.UserService;
import org.core.service.registration.RegistrationService;
import org.core.service.restPassword.ResetPasswordService;
import org.core.util.AuthUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class UserController {

    private final UserService userService;
    private final RegistrationService registrationService;
    private final ResetPasswordService resetPasswordService;
    private final UserContextBean userContextBean;

    @GetMapping("/registration-config")
    public RegistrationConfigDTO getRegistrationConfig() {
        return registrationService.getRegistrationConfig();
    }

    @GetMapping("/{userId}")
    public UserResponseDTO getUserByUserId(@PathVariable Long userId) {
        AuthUtils.requireSameUser(userContextBean, userId);
        return userService.getUserByUserId(userId);
    }
    
    @PostMapping("/forgot-password")
    public ResetPasswordMessageDTO forgotPassword(@Valid @RequestBody CheckUserEmailDTO checkUserEmailDTO) {
        return resetPasswordService.requestResetPassword(checkUserEmailDTO.getEmail());
    }

    @PostMapping("/verify-reset-code")
    public PasswordResetTokenDTO verifyResetCode(@Valid @RequestBody VerifyEmailDTO verifyEmailDTO) {
        return resetPasswordService.verifyEmail(verifyEmailDTO);
    }

    @PostMapping("/reset-password")
    public ResetPasswordMessageDTO resetPassword(@Valid @RequestBody ResetPasswordDTO resetPasswordDTO){
        return resetPasswordService.resetPassword(resetPasswordDTO);
    }

    @PostMapping
    public RegistrationMessageDTO requestRegistration(
            @Valid @RequestBody CreateUserDTO createUserDTO,
            HttpServletRequest request
    ) {
        return registrationService.requestRegistration(createUserDTO, resolveClientIp(request));
    }

    @PostMapping("/verify-email")
    public UserLoginResponseDTO verifyEmail(@Valid @RequestBody VerifyEmailDTO verifyEmailDTO) {
        return registrationService.verifyEmailAndRegister(verifyEmailDTO);
    }

    @PostMapping("/resend-verification")
    public RegistrationMessageDTO resendVerification(@Valid @RequestBody ResendVerificationDTO resendVerificationDTO) {
        return registrationService.resendVerificationCode(resendVerificationDTO.getEmail());
    }

    @PostMapping("/login")
    public UserLoginResponseDTO authenticateUser(@Valid @RequestBody UserLoginDTO userLoginDTO) {
        return userService.authenticateUser(userLoginDTO);
    }

    @PutMapping("/update")
    public UserResponseDTO updateUser(@Valid @RequestBody UpdateUserDTO updateUserDTO) {
        AuthUtils.requireSameUser(userContextBean, updateUserDTO.getUserId());
        return userService.updateUser(updateUserDTO);
    }

    @DeleteMapping("/delete/{userId}")
    public void deleteUser(@PathVariable Long userId) {
        AuthUtils.requireSameUser(userContextBean, userId);
        userService.deleteUser(userId);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}

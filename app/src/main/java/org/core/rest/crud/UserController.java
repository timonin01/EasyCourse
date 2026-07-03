package org.core.rest.crud;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.context.UserContextBean;
import org.core.dto.user.*;
import org.core.service.crud.UserService;
import org.core.service.registration.RegistrationService;
import org.core.util.AuthUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class UserController {

    private final UserService userService;
    private final RegistrationService registrationService;
    private final UserContextBean userContextBean;

    @GetMapping("/{userId}")
    public UserResponseDTO getUserByUserId(@PathVariable Long userId) {
        AuthUtils.requireSameUser(userContextBean, userId);
        return userService.getUserByUserId(userId);
    }

    @PostMapping
    public RegistrationMessageDTO requestRegistration(@Valid @RequestBody CreateUserDTO createUserDTO) {
        return registrationService.requestRegistration(createUserDTO);
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
}

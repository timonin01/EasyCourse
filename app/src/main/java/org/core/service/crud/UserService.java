package org.core.service.crud;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.User;
import org.core.dto.user.*;
import org.core.enums.UserRole;
import org.core.exception.exceptions.EmailNotVerifiedException;
import org.core.exception.exceptions.InvalidPasswordException;
import org.core.exception.exceptions.UserAlreadyExistsException;
import org.core.exception.exceptions.UserNotFoundException;
import org.core.repository.UserRepository;
import org.core.service.UserValidationService;
import org.core.service.registration.RegistrationService;
import org.core.service.security.JwtTokenService;
import org.core.util.EmailNormalizer;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class UserService {

    private final UserRepository userRepository;
    private final UserValidationService validationService;
    private final EmailNormalizer emailNormalizer;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    @Transactional(readOnly = true)
    public UserLoginResponseDTO authenticateUser(UserLoginDTO loginDto) {
        String email = emailNormalizer.normalizeEmail(loginDto.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User was not found"));

        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException(
                    "Email не подтверждён. Завершите регистрацию или обратитесь в поддержку."
            );
        }

        boolean isCorrectPassword = passwordEncoder.matches(loginDto.getPassword(), user.getPassword());

        if (!isCorrectPassword) {
            throw new InvalidPasswordException("Incorrect password");
        }

        String token = jwtTokenService.generateToken(user.getId());
        return new UserLoginResponseDTO(mapToResponseDto(user), token);
    }

    public UserResponseDTO getUserByUserId(Long userId) {
        User user = findUserBiUserId(userId);
        return mapToResponseDto(user);
    }

    public UserResponseDTO updateUser(UpdateUserDTO updateDTO) {
        User user = findUserBiUserId(updateDTO.getUserId());
        if (updateDTO.getName() != null && !updateDTO.getName().equals(user.getName())) {
            user.setName(updateDTO.getName());
        }
        if (updateDTO.getEmail() != null && !updateDTO.getEmail().equals(user.getEmail())) {
            String normalizedEmail = emailNormalizer.normalizeEmail(updateDTO.getEmail());
            if (validationService.checkUserInDBByEmail(normalizedEmail)) {
                throw new UserAlreadyExistsException("Пользователь с email " + normalizedEmail + " уже зарегистрирован");
            }
            user.setEmail(normalizedEmail);
            user.setEmailVerified(false);
        }
        if (updateDTO.getPassword() != null) {
            String hashPassword = passwordEncoder.encode(updateDTO.getPassword());
            user.setPassword(hashPassword);
        }
        log.info("User updated with ID: {}", updateDTO.getUserId());

        return mapToResponseDto(userRepository.save(user));
    }

    public void deleteUser(Long userId) {
        User user = findUserBiUserId(userId);

        userRepository.delete(user);
        log.info("Delete user with ID: {}", userId);
    }

    public UserLoginResponseDTO createVerifiedUserAndLogin(String name, String email, String passwordHash) {
        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordHash)
                //TODO В дальнейшем убрать PRO и вернуть DEFAULT
                .role(UserRole.PRO)
                .emailVerified(true)
                .build();

        log.info("Create verified user with name - {} and email - {}", user.getName(), user.getEmail());
        User saved = userRepository.save(user);
        String token = jwtTokenService.generateToken(saved.getId());
        return new UserLoginResponseDTO(mapToResponseDto(saved), token);
    }

    private User findUserBiUserId(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User was not found"));
    }

    private UserResponseDTO mapToResponseDto(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

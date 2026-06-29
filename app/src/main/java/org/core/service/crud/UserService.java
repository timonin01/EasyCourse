package org.core.service.crud;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.User;
import org.core.dto.user.*;
import org.core.exception.exceptions.InvalidPasswordException;
import org.core.exception.exceptions.UserAlreadyExistsException;
import org.core.exception.exceptions.UserNotFoundException;
import org.core.repository.UserRepository;
import org.core.service.UserValidationService;
import org.core.service.security.JwtTokenService;
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

    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;


    public UserResponseDTO createNewUser(CreateUserDTO createDto) {
        if (validationService.checkUserInDBByEmail(createDto.getEmail())) {
            throw new UserAlreadyExistsException("Пользователь с email " + createDto.getEmail() + " уже зарегистрирован");
        }

        String hashPassword = passwordEncoder.encode(createDto.getPassword());

        User user = new User();
        user.setName(createDto.getName());
        user.setEmail(createDto.getEmail());
        user.setPassword(hashPassword);
        user.setRole(org.core.enums.UserRole.DEFAULT);

        log.info("Create user with name - {} and email - {}", user.getName(),user.getEmail());
        return mapToResponseDto(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserLoginResponseDTO authenticateUser(UserLoginDTO loginDto){
        User user = userRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User was not found"));

        boolean isCorrectPassword = passwordEncoder.matches(loginDto.getPassword(), user.getPassword());

        if(!isCorrectPassword){
            throw new InvalidPasswordException("Incorrect password");
        }

        String token = jwtTokenService.generateToken(user.getId());
        return new UserLoginResponseDTO(mapToResponseDto(user), token);
    }

    public UserResponseDTO getUserByUserId(Long userId){
        User user = findUserBiUserId(userId);
        return mapToResponseDto(user);
    }

    public UserResponseDTO updateUser(UpdateUserDTO updateDTO){
        User user = findUserBiUserId(updateDTO.getUserId());
        if(updateDTO.getName() != null && !updateDTO.getName().equals(user.getName())){
            user.setName(updateDTO.getName());
        }
        if(updateDTO.getEmail() != null && !updateDTO.getEmail().equals(user.getEmail())){
            if(validationService.checkUserInDBByEmail(updateDTO.getEmail())){
                throw new UserAlreadyExistsException("Пользователь с email " + updateDTO.getEmail() + " уже зарегистрирован");
            }
            user.setEmail(updateDTO.getEmail());
        }
        if(updateDTO.getEmail() != null){
            user.setEmail(updateDTO.getEmail());
        }
        if(updateDTO.getPassword() != null && !passwordEncoder.matches(updateDTO.getPassword(), user.getPassword())){
            String hashPassword = passwordEncoder.encode(updateDTO.getPassword());
            user.setPassword(hashPassword);
        }
        log.info("User updated with ID: {}", updateDTO.getUserId());

        return mapToResponseDto(userRepository.save(user));
    }

    public void deleteUser(Long userId){
        User user = findUserBiUserId(userId);

        userRepository.delete(user);
        log.info("Delete user with ID: {}",userId);
    }

    private User findUserBiUserId(Long userId){
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

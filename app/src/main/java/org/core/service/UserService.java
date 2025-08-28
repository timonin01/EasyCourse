package org.core.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.User;
import org.core.dto.user.CreateUserDTO;
import org.core.dto.user.UserLoginDTO;
import org.core.dto.user.UserLoginResponseDTO;
import org.core.dto.user.UserResponseDTO;
import org.core.exception.InvalidPasswordException;
import org.core.exception.UserAlreadyExistsException;
import org.core.exception.UserNotFoundException;
import org.core.repository.UserRepository;
import org.core.util.JwtUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class UserService {

    private final UserRepository userRepository;
    private final UserValidationService validationService;
    private final JwtUtil jwtUtil;

    public UserResponseDTO createNewUser(CreateUserDTO createDto) {
        if (validationService.checkUserInDBByEmail(createDto.getEmail())) {
            throw new UserAlreadyExistsException("User with email " + createDto.getEmail() + " already exists");
        }
        User user = new User();
        user.setName(createDto.getName());
        user.setEmail(createDto.getEmail());
        user.setPassword(createDto.getPassword());

        log.info("Create user with name - {} and email - {}", user.getName(),user.getEmail());

        return mapToResponseDto(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserLoginResponseDTO authenticateUser(UserLoginDTO loginDto){
        User user = userRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User was not found"));

        if(!loginDto.getPassword().equals(user.getPassword())){
            throw new InvalidPasswordException("Incorrect password");
        }

        String token = jwtUtil.generateToken(user);

        return new UserLoginResponseDTO(mapToResponseDto(user), token);
    }

    public User changeUserName(Long id, String newName){
        User user = checkUserEmptyOrNot(id);
        if(newName.equals(user.getName())) return user;
        user.setName(newName);

        log.info("Change name by id - {}",id);

        return userRepository.save(user);
    }

    public User changeUserEmail(Long id, String newEmail){
        User user = checkUserEmptyOrNot(id);
        if(newEmail.equals(user.getEmail())) return user;
        user.setEmail(newEmail);

        log.info("Change email by id - {}",id);

        return userRepository.save(user);
    }

    public User changeUserPassword(Long id, String newPassword){
        User user = checkUserEmptyOrNot(id);
        if(newPassword.equals(user.getPassword())) return user;
        user.setPassword(newPassword);

        log.info("Change password by id - {}",id);

        return userRepository.save(user);
    }

    private User checkUserEmptyOrNot(Long id) throws UserNotFoundException{
        Optional<User> user = userRepository.findById(id);
        if(user.isEmpty()){
            log.warn("User with this {} was not found", id);
            throw new UserNotFoundException("User was not found");
        }
        return user.get();
    }

    private UserResponseDTO mapToResponseDto(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .build();
    }

}

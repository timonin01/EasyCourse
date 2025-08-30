package org.core.service;

import org.core.domain.User;
import org.core.dto.user.*;
import org.core.exception.InvalidPasswordException;
import org.core.exception.UserAlreadyExistsException;
import org.core.exception.UserNotFoundException;
import org.core.repository.UserRepository;
import org.core.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserValidationService validationService;
    @Mock
    private JwtUtil jwtUtil;
    
    @InjectMocks
    private UserService userService;

    @Test
    void createNewUserValidDataReturnsUserResponse() {
        CreateUserDTO createDto = new CreateUserDTO("Andrey", "atimonin2006@gmail.com", "password");
        User savedUser = User.builder()
                .id(1L)
                .name("Andrey")
                .email("atimonin2006@gmail.com")
                .password("password")
                .createdAt(LocalDateTime.now())
                .build();
        
        when(validationService.checkUserInDBByEmail("atimonin2006@gmail.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserResponseDTO result = userService.createNewUser(createDto);

        assertThat(result.getName()).isEqualTo("Andrey");
        assertThat(result.getEmail()).isEqualTo("atimonin2006@gmail.com");
        verify(validationService).checkUserInDBByEmail("atimonin2006@gmail.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createNewUserUserAlreadyExistsThrowsException() {
        CreateUserDTO createDto = new CreateUserDTO("Andrey", "atimonin2006@gmail.com", "password");
        when(validationService.checkUserInDBByEmail("atimonin2006@gmail.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.createNewUser(createDto))
            .isInstanceOf(UserAlreadyExistsException.class)
            .hasMessage("User with email atimonin2006@gmail.com already exists");
    }

    @Test
    void authenticateUserSuccessful() {
        UserLoginDTO loginDto = new UserLoginDTO("atimonin2006@gmail.com", "password");
        User user = User.builder()
                .id(1L)
                .email("atimonin2006@gmail.com")
                .password("password")
                .name("Andrey")
                .createdAt(LocalDateTime.now())
                .build();
        String token = "jwt.token.here";
        
        when(userRepository.findByEmail("atimonin2006@gmail.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(user)).thenReturn(token);

        UserLoginResponseDTO response = userService.authenticateUser(loginDto);

        assertThat(response.getToken()).isEqualTo(token);
        assertThat(response.getUser().getEmail()).isEqualTo("atimonin2006@gmail.com");
        verify(userRepository).findByEmail("atimonin2006@gmail.com");
        verify(jwtUtil).generateToken(user);
    }

    @Test
    void authenticateUserWrongPassword() {
        UserLoginDTO loginDto = new UserLoginDTO("atimonin2006@gmail.com", "wrongpassword");
        User user = User.builder()
                .id(1L)
                .email("atimonin2006@gmail.com")
                .password("password")
                .build();
        
        when(userRepository.findByEmail("atimonin2006@gmail.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.authenticateUser(loginDto))
                .isInstanceOf(InvalidPasswordException.class)
                .hasMessage("Incorrect password");
    }

    @Test
    void authenticateUserNotFound() {
        UserLoginDTO loginDto = new UserLoginDTO("nonexistent@gmail.com", "password");
        when(userRepository.findByEmail("nonexistent@gmail.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.authenticateUser(loginDto))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessage("User was not found");
    }

    @Test
    void getUserByUserIdSuccessful() {
        User user = User.builder()
                .id(1L)
                .name("Andrey")
                .email("atimonin2006@gmail.com")
                .createdAt(LocalDateTime.now())
                .build();
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        UserResponseDTO response = userService.getUserByUserId(1L);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Andrey");
        assertThat(response.getEmail()).isEqualTo("atimonin2006@gmail.com");
    }

    @Test
    void getUserByUserIdNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserByUserId(999L))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessage("User was not found");
    }

    @Test
    void updateUserSuccessful() {
        UpdateUserDTO updateDto = new UpdateUserDTO();
        updateDto.setUserId(1L);
        updateDto.setName("Updated Name");
        updateDto.setEmail("updated@gmail.com");
        
        User existingUser = User.builder()
                .id(1L)
                .name("Old Name")
                .email("old@gmail.com")
                .createdAt(LocalDateTime.now())
                .build();
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(validationService.checkUserInDBByEmail("updated@gmail.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(existingUser);

        UserResponseDTO response = userService.updateUser(updateDto);

        assertThat(response.getName()).isEqualTo("Updated Name");
        assertThat(response.getEmail()).isEqualTo("updated@gmail.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUserEmailAlreadyExists() {
        UpdateUserDTO updateDto = new UpdateUserDTO();
        updateDto.setUserId(1L);
        updateDto.setEmail("existing@gmail.com");
        
        User existingUser = User.builder()
                .id(1L)
                .email("old@gmail.com")
                .build();
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(validationService.checkUserInDBByEmail("existing@gmail.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.updateUser(updateDto))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessage("User with this email");
    }

    @Test
    void deleteUserSuccessful() {
        User user = User.builder()
                .id(1L)
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        userService.deleteUser(1L);
        verify(userRepository).delete(user);
    }

    @Test
    void deleteUserNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser(999L))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessage("User was not found");
    }
}

package org.core.rest;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.user.*;
import org.core.service.crud.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class UserController {

    private final UserService userService;

    @GetMapping("/{userId}")
    public UserResponseDTO getUserByUserId(@PathVariable Long userId){
        return userService.getUserByUserId(userId);
    }

    @PostMapping
    public UserResponseDTO createUser(@Valid @RequestBody CreateUserDTO createUserDTO){
        return userService.createNewUser(createUserDTO);
    }

    @PostMapping("/login")
    public UserLoginResponseDTO authenticateUser(@Valid @RequestBody UserLoginDTO userLoginDTO){
        return userService.authenticateUser(userLoginDTO);
    }

    @PutMapping("/update")
    public UserResponseDTO updateUser(@Valid @RequestBody UpdateUserDTO updateUserDTO){
        return userService.updateUser(updateUserDTO);
    }

    @DeleteMapping("/delete/{userId}")
    public void deleteUser(@PathVariable Long userId){
        userService.deleteUser(userId);
    }


}

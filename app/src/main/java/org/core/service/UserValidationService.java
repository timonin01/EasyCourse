package org.core.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.domain.User;
import org.core.exception.InvalidPasswordException;
import org.core.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class UserValidationService {

    private final UserRepository userRepository;

    public boolean checkUserInDBByEmail(String email){
        Optional<User> user = userRepository.findByEmail(email);
        if(user.isPresent()){
            return true;
        }
        return false;
    }

}

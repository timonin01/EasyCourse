package org.core.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.repository.UserRepository;
import org.core.util.EmailNormalizer;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class UserValidationService {

    private final UserRepository userRepository;
    private final EmailNormalizer emailNormalizer;

    public boolean checkUserInDBByEmail(String email) {
        return userRepository.findByEmail(emailNormalizer.normalizeEmail(email)).isPresent();
    }

}

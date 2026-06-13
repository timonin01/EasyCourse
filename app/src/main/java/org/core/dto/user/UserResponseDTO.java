package org.core.dto.user;

import lombok.*;
import org.core.enums.UserRole;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponseDTO {
    
    private Long id;

    private String name;

    private String email;

    private UserRole role;

    private LocalDateTime createdAt;
}

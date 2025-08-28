package org.core.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "platform_user")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PlatformUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "platform", nullable = false)
    private TargetPlatform platform;

    @Column(name = "platform_username",nullable = false)
    private String platformUsername;

    @Column(name = "platform_email", nullable = false)
    private String platformEmail;

    @Column(name = "platform_password", nullable = false, length = 100)
    private String platformPassword;

}

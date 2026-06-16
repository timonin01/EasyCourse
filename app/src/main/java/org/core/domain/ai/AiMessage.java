package org.core.domain.ai;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_message")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AiMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private AiSession aiSession;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_role", nullable = false)
    private AiMessageRole messageRole;

    @Column(name = "content", nullable = false)
    private String content;

    @Column(name = "step_type", length = 30)
    private String stepType;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}

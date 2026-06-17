package org.core.domain.ai;

import jakarta.persistence.*;
import lombok.*;
import org.core.domain.Lesson;
import org.core.domain.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "batch_generation")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BatchGeneration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "user_input", nullable = false)
    private String userInput;

    @Column(name = "plan_json", nullable = false)
    private String planJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BatchGenerationStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @Column(name = "total_steps", nullable = false)
    private Integer totalSteps;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}

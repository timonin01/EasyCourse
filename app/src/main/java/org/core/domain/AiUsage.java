package org.core.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ai_usage")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AiUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "usage_month", nullable = false, length = 7)
    private String usageMonth;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private int usedCount = 0;
}

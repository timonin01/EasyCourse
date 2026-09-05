package org.core.repository.telegram;

import org.core.domain.telegram.TelegramOutbox;
import org.core.domain.telegram.TelegramOutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TelegramOutboxRepository extends JpaRepository<TelegramOutbox, Long> {

    List<TelegramOutbox> findAllByStatusOrderByCreatedAtAsc(TelegramOutboxStatus status);
}

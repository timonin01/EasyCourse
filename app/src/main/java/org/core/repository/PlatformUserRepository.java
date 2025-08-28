package org.core.repository;

import org.core.domain.PlatformUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlatformUserRepository extends JpaRepository<PlatformUser, Long> {
}
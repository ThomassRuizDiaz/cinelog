package com.cinelog.rating;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RatingProfileRepository extends JpaRepository<RatingProfile, Long> {

    Optional<RatingProfile> findByVersion(int version);

    Optional<RatingProfile> findByActiveTrue();
}

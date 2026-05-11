package in.kramanik.repository;

import in.kramanik.model.PlanSubscription;
import in.kramanik.model.PlanSubscription.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PlanSubscriptionRepository extends JpaRepository<PlanSubscription, Long> {
    List<PlanSubscription> findByInstituteIdOrderByCreatedAtDesc(Long instituteId);
    Optional<PlanSubscription> findFirstByInstituteIdAndStatusOrderByCreatedAtDesc(
        Long instituteId, Status status);
}

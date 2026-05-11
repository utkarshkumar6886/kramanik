package in.kramanik.repository;

import in.kramanik.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByInstituteIdOrderByCreatedAtDesc(Long instituteId);
    List<Notification> findByInstituteIdAndStudentId(Long instituteId, Long studentId);
}

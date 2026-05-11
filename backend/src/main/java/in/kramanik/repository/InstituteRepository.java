package in.kramanik.repository;

import in.kramanik.model.Institute;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InstituteRepository extends JpaRepository<Institute, Long> {
    Optional<Institute> findByEmail(String email);
    boolean existsByEmail(String email);
}

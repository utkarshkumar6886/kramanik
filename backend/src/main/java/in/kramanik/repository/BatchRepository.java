package in.kramanik.repository;

import in.kramanik.model.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BatchRepository extends JpaRepository<Batch, Long> {
    List<Batch> findByInstituteIdAndIsActiveTrue(Long instituteId);
    List<Batch> findByInstituteId(Long instituteId);
}

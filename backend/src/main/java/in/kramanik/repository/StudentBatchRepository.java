package in.kramanik.repository;

import in.kramanik.model.StudentBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface StudentBatchRepository extends JpaRepository<StudentBatch, Long> {

    List<StudentBatch> findByBatchIdAndIsActiveTrue(Long batchId);

    List<StudentBatch> findByStudentIdAndIsActiveTrue(Long studentId);

    Optional<StudentBatch> findByStudentIdAndBatchId(Long studentId, Long batchId);

    @Query("SELECT sb FROM StudentBatch sb WHERE sb.batch.institute.id = :instituteId AND sb.isActive = true")
    List<StudentBatch> findAllActiveByInstituteId(@Param("instituteId") Long instituteId);
}

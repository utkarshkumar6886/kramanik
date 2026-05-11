package in.kramanik.repository;

import in.kramanik.model.FeeRecord;
import in.kramanik.model.FeeRecord.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface FeeRepository extends JpaRepository<FeeRecord, Long> {

    List<FeeRecord> findByStudentId(Long studentId);

    List<FeeRecord> findByStudentIdAndMonth(Long studentId, String month);

    Optional<FeeRecord> findByStudentIdAndBatchIdAndMonth(Long studentId, Long batchId, String month);

    List<FeeRecord> findByStatus(Status status);

    @Query("SELECT f FROM FeeRecord f WHERE f.student.institute.id = :instituteId AND f.status IN :statuses")
    List<FeeRecord> findByInstituteIdAndStatuses(@Param("instituteId") Long instituteId,
                                                  @Param("statuses") List<Status> statuses);

    @Query("SELECT COALESCE(SUM(f.amountPaid), 0) FROM FeeRecord f " +
           "WHERE f.student.institute.id = :instituteId AND f.month = :month")
    BigDecimal sumPaidByInstituteAndMonth(@Param("instituteId") Long instituteId,
                                          @Param("month") String month);

    @Query("SELECT COALESCE(SUM(f.amountDue - f.amountPaid), 0) FROM FeeRecord f " +
           "WHERE f.student.institute.id = :instituteId AND f.status != 'PAID'")
    BigDecimal totalOutstandingByInstitute(@Param("instituteId") Long instituteId);
}

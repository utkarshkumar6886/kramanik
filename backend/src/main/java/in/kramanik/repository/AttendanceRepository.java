package in.kramanik.repository;

import in.kramanik.model.Attendance;
import in.kramanik.model.Attendance.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByBatchIdAndDate(Long batchId, LocalDate date);

    List<Attendance> findByStudentIdAndBatchId(Long studentId, Long batchId);

    Optional<Attendance> findByStudentIdAndBatchIdAndDate(Long studentId, Long batchId, LocalDate date);

    // Monthly summary: count per student per status for a batch in a given month
    @Query("""
        SELECT a.student.id, a.student.name,
               SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS present,
               SUM(CASE WHEN a.status = 'ABSENT'  THEN 1 ELSE 0 END) AS absent,
               SUM(CASE WHEN a.status = 'LATE'    THEN 1 ELSE 0 END) AS late
        FROM Attendance a
        WHERE a.batch.id = :batchId
          AND FUNCTION('DATE_FORMAT', a.date, '%Y-%m') = :month
        GROUP BY a.student.id, a.student.name
        ORDER BY a.student.name
        """)
    List<Object[]> monthlySummary(@Param("batchId") Long batchId, @Param("month") String month);
}

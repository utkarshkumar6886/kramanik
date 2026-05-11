package in.kramanik.service;

import in.kramanik.model.Attendance;
import in.kramanik.model.Attendance.Status;
import in.kramanik.model.Batch;
import in.kramanik.model.Student;
import in.kramanik.repository.AttendanceRepository;
import in.kramanik.repository.StudentBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository    attendanceRepository;
    private final StudentBatchRepository  studentBatchRepository;

    public List<Attendance> getByBatchAndDate(Long batchId, LocalDate date) {
        return attendanceRepository.findByBatchIdAndDate(batchId, date);
    }

    public List<Attendance> getByStudentAndBatch(Long studentId, Long batchId) {
        return attendanceRepository.findByStudentIdAndBatchId(studentId, batchId);
    }

    /**
     * Returns enrolled students for a batch — used by frontend to
     * build the attendance marking sheet (only enrolled, not all students).
     */
    public List<Map<String, Object>> getEnrolledStudents(Long batchId) {
        return studentBatchRepository.findByBatchIdAndIsActiveTrue(batchId)
            .stream()
            .map(sb -> Map.<String, Object>of(
                "studentId",   sb.getStudent().getId(),
                "studentName", sb.getStudent().getName(),
                "phone",       sb.getStudent().getPhone() != null ? sb.getStudent().getPhone() : ""
            ))
            .toList();
    }

    @Transactional
    public List<Attendance> bulkMark(List<Map<String, Object>> records, Long markedByUserId) {
        List<Attendance> saved = new ArrayList<>();
        for (Map<String, Object> r : records) {
            Long      studentId = Long.parseLong(r.get("studentId").toString());
            Long      batchId   = Long.parseLong(r.get("batchId").toString());
            LocalDate date      = LocalDate.parse(r.get("date").toString());
            Status    status    = Status.valueOf(r.get("status").toString());

            Attendance record = attendanceRepository
                    .findByStudentIdAndBatchIdAndDate(studentId, batchId, date)
                    .orElse(Attendance.builder()
                            .student(Student.builder().id(studentId).build())
                            .batch(Batch.builder().id(batchId).build())
                            .date(date)
                            .build());

            record.setStatus(status);
            record.setMarkedBy(markedByUserId);
            saved.add(attendanceRepository.save(record));
        }
        return saved;
    }

    public List<Map<String, Object>> monthlySummary(Long batchId, String month) {
        List<Object[]> rows = attendanceRepository.monthlySummary(batchId, month);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            result.add(Map.of(
                "studentId",   row[0],
                "studentName", row[1],
                "present",     row[2],
                "absent",      row[3],
                "late",        row[4]
            ));
        }
        return result;
    }
}

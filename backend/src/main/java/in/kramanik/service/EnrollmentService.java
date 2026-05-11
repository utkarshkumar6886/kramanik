package in.kramanik.service;

import in.kramanik.model.Batch;
import in.kramanik.model.Student;
import in.kramanik.model.StudentBatch;
import in.kramanik.repository.StudentBatchRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final StudentBatchRepository studentBatchRepository;

    /** Get all students enrolled in a batch */
    public List<StudentBatch> getEnrollmentsByBatch(Long batchId) {
        return studentBatchRepository.findByBatchIdAndIsActiveTrue(batchId);
    }

    /** Get all batches a student is enrolled in */
    public List<StudentBatch> getEnrollmentsByStudent(Long studentId) {
        return studentBatchRepository.findByStudentIdAndIsActiveTrue(studentId);
    }

    /** Enroll a student in a batch */
    @Transactional
    public StudentBatch enroll(Long studentId, Long batchId) {
        // Check if already enrolled
        studentBatchRepository.findByStudentIdAndBatchId(studentId, batchId)
            .ifPresent(sb -> {
                if (sb.isActive()) throw new IllegalArgumentException("Student already enrolled in this batch.");
                // Re-activate if previously left
                sb.setActive(true);
                sb.setLeftOn(null);
                sb.setEnrolledOn(LocalDate.now());
                studentBatchRepository.save(sb);
            });

        // Check not already handled above
        if (studentBatchRepository.findByStudentIdAndBatchId(studentId, batchId)
                .filter(StudentBatch::isActive).isPresent()) {
            return studentBatchRepository.findByStudentIdAndBatchId(studentId, batchId).get();
        }

        StudentBatch sb = StudentBatch.builder()
                .student(Student.builder().id(studentId).build())
                .batch(Batch.builder().id(batchId).build())
                .enrolledOn(LocalDate.now())
                .isActive(true)
                .build();
        return studentBatchRepository.save(sb);
    }

    /** Remove a student from a batch (soft delete) */
    @Transactional
    public void unenroll(Long studentId, Long batchId) {
        StudentBatch sb = studentBatchRepository
                .findByStudentIdAndBatchId(studentId, batchId)
                .orElseThrow(() -> new EntityNotFoundException("Enrollment not found"));
        sb.setActive(false);
        sb.setLeftOn(LocalDate.now());
        studentBatchRepository.save(sb);
    }
}

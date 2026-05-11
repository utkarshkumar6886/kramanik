package in.kramanik.controller;

import in.kramanik.model.StudentBatch;
import in.kramanik.security.JwtUtil;
import in.kramanik.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final JwtUtil           jwtUtil;

    /**
     * GET /api/enrollments/batch/{batchId}
     * Returns all active students in a batch.
     */
    @GetMapping("/batch/{batchId}")
    public ResponseEntity<List<StudentBatch>> getByBatch(@PathVariable Long batchId,
            @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(enrollmentService.getEnrollmentsByBatch(batchId));
    }

    /**
     * GET /api/enrollments/student/{studentId}
     * Returns all active batches for a student.
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentBatch>> getByStudent(@PathVariable Long studentId,
            @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(enrollmentService.getEnrollmentsByStudent(studentId));
    }

    /**
     * POST /api/enrollments
     * Body: { studentId, batchId }
     * Enroll a student in a batch.
     */
    @PostMapping
    public ResponseEntity<StudentBatch> enroll(@RequestBody Map<String, Long> body,
            @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(
            enrollmentService.enroll(body.get("studentId"), body.get("batchId"))
        );
    }

    /**
     * DELETE /api/enrollments
     * Body: { studentId, batchId }
     * Remove a student from a batch.
     */
    @DeleteMapping
    public ResponseEntity<Void> unenroll(@RequestBody Map<String, Long> body,
            @RequestHeader("Authorization") String auth) {
        enrollmentService.unenroll(body.get("studentId"), body.get("batchId"));
        return ResponseEntity.noContent().build();
    }
}

package in.kramanik.controller;

import in.kramanik.model.Attendance;
import in.kramanik.security.JwtUtil;
import in.kramanik.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final JwtUtil jwtUtil;

    private Long instituteId(String authHeader) {
        return jwtUtil.extractInstituteId(authHeader.substring(7));
    }

    /**
     * GET /api/attendance?batchId=1&date=2024-04-15
     * Returns all attendance records for a batch on a date.
     */
    @GetMapping
    public ResponseEntity<List<Attendance>> getByBatchAndDate(
            @RequestParam Long batchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(attendanceService.getByBatchAndDate(batchId, date));
    }

    /**
     * GET /api/attendance/student/{studentId}?batchId=1
     * Returns full attendance history for a student in a batch.
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Attendance>> getByStudent(
            @PathVariable Long studentId,
            @RequestParam Long batchId,
            @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(attendanceService.getByStudentAndBatch(studentId, batchId));
    }

    /**
     * POST /api/attendance
     * Body: [ { studentId, batchId, date, status }, ... ]
     * Bulk upsert (mark or update) attendance records.
     */
    @PostMapping
    public ResponseEntity<List<Attendance>> bulkMark(
            @RequestBody List<Map<String, Object>> records,
            @RequestHeader("Authorization") String auth) {
        Long userId = jwtUtil.extractInstituteId(auth.substring(7)); // reuse as proxy for user
        return ResponseEntity.ok(attendanceService.bulkMark(records, userId));
    }

    /**
     * GET /api/attendance/summary?batchId=1&month=2024-04
     * Returns monthly attendance summary per student.
     */
    @GetMapping("/summary")
    public ResponseEntity<List<Map<String, Object>>> monthlySummary(
            @RequestParam Long batchId,
            @RequestParam String month,
            @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(attendanceService.monthlySummary(batchId, month));
    }


    /** GET /api/attendance/enrolled?batchId=1 — students enrolled in a batch */
    @GetMapping("/enrolled")
    public ResponseEntity<List<Map<String, Object>>> getEnrolled(
            @RequestParam Long batchId,
            @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(attendanceService.getEnrolledStudents(batchId));
    }
}
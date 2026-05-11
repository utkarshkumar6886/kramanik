package in.kramanik.controller;

import in.kramanik.model.FeeRecord;
import in.kramanik.security.JwtUtil;
import in.kramanik.service.FeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fees")
@RequiredArgsConstructor
public class FeeController {

    private final FeeService feeService;
    private final JwtUtil jwtUtil;

    private Long instituteId(String authHeader) {
        return jwtUtil.extractInstituteId(authHeader.substring(7));
    }

    /** GET /api/fees/student/{studentId} */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<FeeRecord>> getByStudent(@PathVariable Long studentId,
                                                         @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(feeService.getByStudent(studentId));
    }

    /** GET /api/fees/pending */
    @GetMapping("/pending")
    public ResponseEntity<List<FeeRecord>> getPending(@RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(feeService.getPendingAndOverdue(instituteId(auth)));
    }

    /** POST /api/fees
     *  body: { studentId, batchId, month, amountDue, dueDate }
     */
    @PostMapping
    public ResponseEntity<FeeRecord> create(@RequestBody Map<String, Object> body,
                                             @RequestHeader("Authorization") String auth) {
        FeeRecord record = feeService.createFeeRecord(
                Long.parseLong(body.get("studentId").toString()),
                Long.parseLong(body.get("batchId").toString()),
                body.get("month").toString(),
                new BigDecimal(body.get("amountDue").toString()),
                LocalDate.parse(body.get("dueDate").toString())
        );
        return ResponseEntity.ok(record);
    }

    /** POST /api/fees/{id}/pay
     *  body: { amount, paymentMode }
     */
    @PostMapping("/{id}/pay")
    public ResponseEntity<FeeRecord> recordPayment(@PathVariable Long id,
                                                    @RequestBody Map<String, Object> body,
                                                    @RequestHeader("Authorization") String auth) {
        FeeRecord.PaymentMode mode = FeeRecord.PaymentMode.valueOf(
                body.getOrDefault("paymentMode", "CASH").toString());
        FeeRecord updated = feeService.recordPayment(
                id, new BigDecimal(body.get("amount").toString()), mode, instituteId(auth));
        return ResponseEntity.ok(updated);
    }

    /** GET /api/fees/summary?month=2024-06 */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary(
            @RequestParam(required = false) String month,
            @RequestHeader("Authorization") String auth) {

        Long instId = instituteId(auth);
        String targetMonth = (month != null) ? month :
                LocalDate.now().getYear() + "-" + String.format("%02d", LocalDate.now().getMonthValue());

        return ResponseEntity.ok(Map.of(
                "month", targetMonth,
                "collected", feeService.getMonthlyCollection(instId, targetMonth),
                "outstanding", feeService.getTotalOutstanding(instId)
        ));
    }
}

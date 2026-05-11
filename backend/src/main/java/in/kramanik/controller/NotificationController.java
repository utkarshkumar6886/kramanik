package in.kramanik.controller;

import in.kramanik.model.Notification;
import in.kramanik.security.JwtUtil;
import in.kramanik.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;

    private Long instituteId(String authHeader) {
        return jwtUtil.extractInstituteId(authHeader.substring(7));
    }

    /**
     * GET /api/notifications
     * Returns all notification history for the institute.
     */
    @GetMapping
    public ResponseEntity<List<Notification>> getAll(
            @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(notificationService.getAll(instituteId(auth)));
    }

    /**
     * POST /api/notifications/fee-reminder
     * Body: [ { studentId, type, message }, ... ]
     * Sends fee reminder notifications (WhatsApp in production, logged in MVP).
     */
    @PostMapping("/fee-reminder")
    public ResponseEntity<List<Notification>> sendFeeReminders(
            @RequestBody List<Map<String, Object>> requests,
            @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(notificationService.send(requests, instituteId(auth)));
    }

    /**
     * POST /api/notifications/send
     * General-purpose send endpoint for any notification type.
     */
    @PostMapping("/send")
    public ResponseEntity<List<Notification>> send(
            @RequestBody List<Map<String, Object>> requests,
            @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(notificationService.send(requests, instituteId(auth)));
    }
}

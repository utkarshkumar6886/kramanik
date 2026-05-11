package in.kramanik.controller;

import in.kramanik.model.Institute.Plan;
import in.kramanik.model.PlanSubscription;
import in.kramanik.security.JwtUtil;
import in.kramanik.service.InstituteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class InstituteController {

    private final InstituteService instituteService;
    private final JwtUtil jwtUtil;

    private Long instituteId(String authHeader) {
        return jwtUtil.extractInstituteId(authHeader.substring(7));
    }

    // ── PUBLIC: Registration (no auth needed) ─────────────────
    /**
     * POST /api/public/register
     * Body: { instituteName, email, phone, address, adminName, password }
     */
    @PostMapping("/api/public/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> body) {
        Map<String, Object> result = instituteService.register(
            body.get("instituteName"),
            body.get("email"),
            body.get("phone"),
            body.get("address"),
            body.get("adminName"),
            body.get("password")
        );
        return ResponseEntity.ok(result);
    }

    // ── AUTHENTICATED: Institute profile ──────────────────────
    /**
     * GET /api/institute/me
     * Returns institute profile + plan info + usage counts.
     */
    @GetMapping("/api/institute/me")
    public ResponseEntity<Map<String, Object>> getProfile(
            @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(instituteService.getProfile(instituteId(auth)));
    }

    /**
     * PUT /api/institute/upgrade
     * Body: { plan: "BASIC"|"PRO", paymentReference: "txn_xxx" }
     */
    @PutMapping("/api/institute/upgrade")
    public ResponseEntity<Map<String, Object>> upgradePlan(
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String auth) {
        Plan plan = Plan.valueOf(body.get("plan").toUpperCase());
        return ResponseEntity.ok(
            instituteService.upgradePlan(instituteId(auth), plan, body.get("paymentReference"))
        );
    }

    /**
     * GET /api/institute/subscriptions
     * Returns full subscription/billing history.
     */
    @GetMapping("/api/institute/subscriptions")
    public ResponseEntity<List<PlanSubscription>> getSubscriptions(
            @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(
            instituteService.getSubscriptionHistory(instituteId(auth))
        );
    }
}

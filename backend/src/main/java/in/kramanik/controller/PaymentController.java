package in.kramanik.controller;

import in.kramanik.model.Institute.Plan;
import in.kramanik.security.JwtUtil;
import in.kramanik.service.InstituteService;
import in.kramanik.service.RazorpayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final RazorpayService   razorpayService;
    private final InstituteService  instituteService;
    private final JwtUtil           jwtUtil;

    private Long instituteId(String authHeader) {
        return jwtUtil.extractInstituteId(authHeader.substring(7));
    }

    /**
     * POST /api/payments/create-order
     * Body: { plan: "BASIC" | "PRO" }
     * Returns Razorpay order details to pass to the checkout widget.
     */
    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String auth) {

        Plan plan      = Plan.valueOf(body.get("plan").toUpperCase());
        Long instId    = instituteId(auth);
        Map<String, Object> order = razorpayService.createOrder(plan, instId);
        return ResponseEntity.ok(order);
    }

    /**
     * POST /api/payments/verify
     * Body: { orderId, paymentId, signature, plan }
     * Called by frontend after Razorpay checkout succeeds.
     * Verifies the payment signature and upgrades the plan.
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String auth) {

        String orderId   = body.get("orderId");
        String paymentId = body.get("paymentId");
        String signature = body.get("signature");
        Plan   plan      = Plan.valueOf(body.get("plan").toUpperCase());

        boolean valid = razorpayService.verifySignature(orderId, paymentId, signature);
        if (!valid) {
            log.warn("Invalid Razorpay signature for order {}", orderId);
            return ResponseEntity.badRequest().body(Map.of("error", "Payment verification failed."));
        }

        // Signature valid — activate the plan
        Long instId = instituteId(auth);
        Map<String, Object> result = instituteService.upgradePlan(instId, plan, paymentId);
        log.info("Plan upgraded for institute {} to {} via payment {}", instId, plan, paymentId);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "plan",    plan,
            "message", result.get("message")
        ));
    }

    /**
     * POST /api/payments/webhook
     * Called by Razorpay server after payment events (more reliable than client verify).
     * Handles: payment.captured event.
     * No auth header — verified via webhook signature instead.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {

        if (signature == null || !razorpayService.verifyWebhookSignature(payload, signature)) {
            log.warn("Invalid webhook signature received");
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        // Parse the event and upgrade plan if payment.captured
        try {
            org.json.JSONObject event = new org.json.JSONObject(payload);
            String eventType = event.getString("event");

            if ("payment.captured".equals(eventType)) {
                org.json.JSONObject payment = event
                    .getJSONObject("payload")
                    .getJSONObject("payment")
                    .getJSONObject("entity");

                String paymentId  = payment.getString("id");
                org.json.JSONObject notes = payment.getJSONObject("notes");
                Long   instituteId = notes.getLong("instituteId");
                Plan   plan        = Plan.valueOf(notes.getString("plan"));

                instituteService.upgradePlan(instituteId, plan, paymentId);
                log.info("Webhook: plan {} activated for institute {} via {}", plan, instituteId, paymentId);
            }
        } catch (Exception e) {
            log.error("Webhook processing error: {}", e.getMessage());
        }

        return ResponseEntity.ok("ok");
    }
}

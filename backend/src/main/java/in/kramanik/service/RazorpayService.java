package in.kramanik.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import in.kramanik.model.Institute.Plan;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

@Slf4j
@Service
public class RazorpayService {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    // Plan prices in paise (INR × 100)
    private static final Map<Plan, Integer> PLAN_PRICES = Map.of(
        Plan.BASIC, 49900,   // ₹499
        Plan.PRO,   99900    // ₹999
    );

    /**
     * Create a Razorpay order for plan upgrade.
     * Returns: { orderId, amount, currency, keyId }
     */
    public Map<String, Object> createOrder(Plan plan, Long instituteId) {
        int amountPaise = PLAN_PRICES.getOrDefault(plan, 0);
        if (amountPaise == 0) throw new IllegalArgumentException("FREE plan needs no payment.");

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);

            JSONObject orderReq = new JSONObject();
            orderReq.put("amount",   amountPaise);
            orderReq.put("currency", "INR");
            orderReq.put("receipt",  "kramanik_" + instituteId + "_" + System.currentTimeMillis());
            orderReq.put("notes",    new JSONObject()
                .put("instituteId", instituteId)
                .put("plan",        plan.name()));

            Order order = client.orders.create(orderReq);
            log.info("Razorpay order created: {} for institute {}", order.get("id"), instituteId);

            return Map.of(
                "orderId",  order.get("id"),
                "amount",   amountPaise,
                "currency", "INR",
                "keyId",    keyId
            );
        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed: {}", e.getMessage());
            throw new RuntimeException("Payment gateway error. Please try again.");
        }
    }

    /**
     * Verify Razorpay payment signature after client-side payment.
     * Razorpay signs: orderId + "|" + paymentId with the key secret.
     */
    public boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expected = HexFormat.of().formatHex(hash);
            return expected.equals(signature);
        } catch (Exception e) {
            log.error("Signature verification failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Verify Razorpay webhook signature.
     * Used for server-side payment confirmation (more reliable than client).
     */
    public boolean verifyWebhookSignature(String payload, String receivedSignature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expected = HexFormat.of().formatHex(hash);
            return expected.equals(receivedSignature);
        } catch (Exception e) {
            log.error("Webhook signature verification failed: {}", e.getMessage());
            return false;
        }
    }

    public int getPricePaise(Plan plan) {
        return PLAN_PRICES.getOrDefault(plan, 0);
    }
}

package in.kramanik.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * WhatsApp notification service via WATI (WhatsApp Business API provider).
 *
 * WATI setup:
 * 1. Sign up at https://wati.io (₹2,499/month for 1,000 conversations)
 * 2. Connect your WhatsApp Business number
 * 3. Create message templates and get them approved by Meta
 * 4. Set WATI_API_URL and WATI_API_TOKEN in env vars
 * 5. Set WATI_ENABLED=true
 *
 * When WATI_ENABLED=false (default), messages are logged only (MVP mode).
 */
@Slf4j
@Service
public class WhatsAppService {

    @Value("${wati.api.url}")
    private String watiUrl;

    @Value("${wati.api.token}")
    private String watiToken;

    @Value("${wati.enabled:false}")
    private boolean watiEnabled;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Send a WhatsApp message to a phone number.
     * Phone must be in international format without '+': e.g. "919876543210"
     */
    public boolean sendMessage(String phone, String message) {
        if (!watiEnabled) {
            log.info("[WhatsApp MOCK] To: {} | Message: {}", phone, message.substring(0, Math.min(80, message.length())));
            return true;  // Simulated success in MVP mode
        }

        String cleanPhone = phone.replaceAll("[^0-9]", "");
        if (!cleanPhone.startsWith("91")) cleanPhone = "91" + cleanPhone;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(watiToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of(
                "broadcast_name", "kramanik_notification",
                "receivers", new Object[]{ Map.of("whatsappNumber", cleanPhone) },
                "template_name", "kramanik_message",
                "template_language_code", "en",
                "template_parameters", new Object[]{ Map.of("name", "1", "value", message) }
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                watiUrl + "/sendTemplateMessages", request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("WhatsApp sent to {}", cleanPhone);
                return true;
            } else {
                log.warn("WhatsApp failed for {} — status {}", cleanPhone, response.getStatusCode());
                return false;
            }
        } catch (Exception e) {
            log.error("WhatsApp send error for {}: {}", cleanPhone, e.getMessage());
            return false;
        }
    }

    /**
     * Send a fee reminder to a parent.
     */
    public boolean sendFeeReminder(String parentName, String studentName,
                                    String parentPhone, String month,
                                    double amountDue, String dueDate) {
        String message = String.format(
            "Dear %s,\n\nThis is a reminder that fees for *%s* for *%s* are pending.\n\n" +
            "Amount Due: ₹%.0f\nDue Date: %s\n\nKindly clear dues at the earliest.\n\nKramanik Institute",
            parentName, studentName, month, amountDue, dueDate
        );
        return sendMessage(parentPhone, message);
    }

    /**
     * Send an attendance alert to a parent.
     */
    public boolean sendAttendanceAlert(String parentName, String studentName,
                                        String parentPhone, int absentDays) {
        String message = String.format(
            "Dear %s,\n\n*%s* has been absent for %d day(s) recently.\n\n" +
            "Regular attendance is important. Please ensure they attend regularly.\n\nKramanik Institute",
            parentName, studentName, absentDays
        );
        return sendMessage(parentPhone, message);
    }

    /**
     * Send a general announcement.
     */
    public boolean sendAnnouncement(String parentName, String studentName,
                                     String parentPhone, String announcementText) {
        String message = String.format(
            "Dear %s,\n\nAnnouncement for *%s*:\n\n%s\n\nKramanik Institute",
            parentName, studentName, announcementText
        );
        return sendMessage(parentPhone, message);
    }
}

package in.kramanik.service;

import in.kramanik.model.Institute;
import in.kramanik.model.Notification;
import in.kramanik.model.Notification.Channel;
import in.kramanik.model.Notification.Status;
import in.kramanik.model.Notification.Type;
import in.kramanik.model.Student;
import in.kramanik.repository.NotificationRepository;
import in.kramanik.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final StudentRepository      studentRepository;
    private final WhatsAppService        whatsAppService;

    public List<Notification> getAll(Long instituteId) {
        return notificationRepository.findByInstituteIdOrderByCreatedAtDesc(instituteId);
    }

    /**
     * Bulk send notifications with real WhatsApp delivery.
     */
    public List<Notification> send(List<Map<String, Object>> requests, Long instituteId) {
        return requests.stream().map(req -> {
            Long   studentId = Long.parseLong(req.get("studentId").toString());
            String typeStr   = req.get("type").toString().toUpperCase().replace("-", "_");
            String message   = req.get("message").toString();

            // Fetch student for WhatsApp number
            Student student = studentRepository.findById(studentId).orElse(null);
            Status  status  = Status.PENDING;

            if (student != null) {
                String phone = student.getParentWhatsapp() != null
                    ? student.getParentWhatsapp()
                    : student.getParentPhone();

                if (phone != null && !phone.isBlank()) {
                    boolean sent = whatsAppService.sendMessage(phone, message);
                    status = sent ? Status.SENT : Status.FAILED;
                } else {
                    log.warn("No WhatsApp/phone for student {} — skipping send", studentId);
                    status = Status.FAILED;
                }
            }

            Notification notif = Notification.builder()
                    .institute(Institute.builder().id(instituteId).build())
                    .student(Student.builder().id(studentId).build())
                    .type(Type.valueOf(typeStr))
                    .channel(Channel.WHATSAPP)
                    .message(message)
                    .status(status)
                    .sentAt(status == Status.SENT ? LocalDateTime.now() : null)
                    .build();

            return notificationRepository.save(notif);
        }).toList();
    }
}

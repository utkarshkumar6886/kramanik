package in.kramanik.service;

import in.kramanik.config.PlanLimits;
import in.kramanik.exception.PlanLimitExceededException;
import in.kramanik.model.Institute;
import in.kramanik.model.Institute.Plan;
import in.kramanik.model.PlanSubscription;
import in.kramanik.model.PlanSubscription.Status;
import in.kramanik.model.User;
import in.kramanik.repository.InstituteRepository;
import in.kramanik.repository.PlanSubscriptionRepository;
import in.kramanik.repository.StudentRepository;
import in.kramanik.repository.BatchRepository;
import in.kramanik.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class InstituteService {

    private final InstituteRepository      instituteRepository;
    private final UserRepository           userRepository;
    private final PlanSubscriptionRepository subscriptionRepository;
    private final StudentRepository        studentRepository;
    private final BatchRepository          batchRepository;
    private final PlanLimits              planLimits;
    private final PasswordEncoder          passwordEncoder;

    // ── REGISTRATION ─────────────────────────────────────────
    @Transactional
    public Map<String, Object> register(String instituteName, String email,
                                        String phone, String address,
                                        String adminName, String password) {

        if (instituteRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An institute with this email already exists.");
        }

        // 1. Create institute on FREE plan
        Institute institute = Institute.builder()
                .name(instituteName)
                .email(email)
                .phone(phone)
                .address(address)
                .plan(Plan.FREE)
                .build();
        institute = instituteRepository.save(institute);

        // 2. Create admin user
        User admin = User.builder()
                .institute(institute)
                .name(adminName)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .role(User.Role.ADMIN)
                .isActive(true)
                .build();
        userRepository.save(admin);

        // 3. Log FREE subscription
        PlanSubscription sub = PlanSubscription.builder()
                .institute(institute)
                .plan(Plan.FREE)
                .startedOn(LocalDate.now())
                .status(Status.ACTIVE)
                .build();
        subscriptionRepository.save(sub);

        log.info("New institute registered: {} ({})", instituteName, email);

        return Map.of(
            "instituteId",   institute.getId(),
            "instituteName", institute.getName(),
            "plan",          institute.getPlan(),
            "message",       "Registration successful. You can now log in."
        );
    }

    // ── GET PROFILE ───────────────────────────────────────────
    public Map<String, Object> getProfile(Long instituteId) {
        Institute inst = instituteRepository.findById(instituteId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Institute not found"));

        PlanLimits.Limits limits = planLimits.forPlan(inst.getPlan());
        long studentCount = studentRepository.countByInstituteIdAndIsActiveTrue(instituteId);
        long batchCount   = batchRepository.findByInstituteIdAndIsActiveTrue(instituteId).size();

        return Map.of(
            "id",              inst.getId(),
            "name",            inst.getName(),
            "email",           inst.getEmail(),
            "phone",           inst.getPhone(),
            "address",         inst.getAddress() != null ? inst.getAddress() : "",
            "plan",            inst.getPlan(),
            "studentCount",    studentCount,
            "batchCount",      batchCount,
            "maxStudents",     limits.maxStudents() == Integer.MAX_VALUE ? -1 : limits.maxStudents(),
            "maxBatches",      limits.maxBatches()  == Integer.MAX_VALUE ? -1 : limits.maxBatches(),
            "whatsapp",        limits.whatsappNotifications(),
            "reports",         limits.monthlyReports()
        );
    }

    // ── PLAN UPGRADE ──────────────────────────────────────────
    @Transactional
    public Map<String, Object> upgradePlan(Long instituteId, Plan newPlan,
                                            String paymentReference) {
        Institute inst = instituteRepository.findById(instituteId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Institute not found"));

        if (newPlan.ordinal() <= inst.getPlan().ordinal()) {
            throw new IllegalArgumentException("Cannot downgrade plan.");
        }

        // Expire old subscription
        subscriptionRepository.findFirstByInstituteIdAndStatusOrderByCreatedAtDesc(
            instituteId, Status.ACTIVE).ifPresent(sub -> {
                sub.setStatus(Status.EXPIRED);
                sub.setExpiresOn(LocalDate.now());
                subscriptionRepository.save(sub);
            });

        // Apply new plan to institute
        inst.setPlan(newPlan);
        instituteRepository.save(inst);

        // Log new subscription
        int amount = switch (newPlan) {
            case BASIC -> 49900;   // ₹499/month in paise? No — just INR
            case PRO   -> 99900;
            default    -> 0;
        };

        PlanSubscription newSub = PlanSubscription.builder()
                .institute(inst)
                .plan(newPlan)
                .startedOn(LocalDate.now())
                .expiresOn(LocalDate.now().plusMonths(1))
                .amountPaid(amount)
                .paymentReference(paymentReference)
                .status(Status.ACTIVE)
                .build();
        subscriptionRepository.save(newSub);

        log.info("Institute {} upgraded to plan {}", inst.getName(), newPlan);

        return Map.of(
            "plan",    newPlan,
            "message", "Plan upgraded to " + newPlan + " successfully!"
        );
    }

    // ── SUBSCRIPTION HISTORY ──────────────────────────────────
    public List<PlanSubscription> getSubscriptionHistory(Long instituteId) {
        return subscriptionRepository.findByInstituteIdOrderByCreatedAtDesc(instituteId);
    }

    // ── PLAN GUARD HELPERS ────────────────────────────────────
    public void assertCanAddStudent(Long instituteId) {
        Institute inst = instituteRepository.findById(instituteId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Institute not found"));
        long count = studentRepository.countByInstituteIdAndIsActiveTrue(instituteId);
        if (!planLimits.canAddStudent(inst.getPlan(), count)) {
            throw new PlanLimitExceededException(planLimits.studentLimitMessage(inst.getPlan()));
        }
    }

    public void assertCanAddBatch(Long instituteId) {
        Institute inst = instituteRepository.findById(instituteId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Institute not found"));
        long count = batchRepository.findByInstituteIdAndIsActiveTrue(instituteId).size();
        if (!planLimits.canAddBatch(inst.getPlan(), count)) {
            throw new PlanLimitExceededException(planLimits.batchLimitMessage(inst.getPlan()));
        }
    }
}

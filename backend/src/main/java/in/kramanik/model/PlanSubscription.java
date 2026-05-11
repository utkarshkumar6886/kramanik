package in.kramanik.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "plan_subscriptions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id", nullable = false)
    private Institute institute;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Institute.Plan plan;

    @Column(name = "started_on", nullable = false)
    private LocalDate startedOn;

    @Column(name = "expires_on")
    private LocalDate expiresOn;          // null = lifetime / until cancelled

    @Column(name = "amount_paid")
    private Integer amountPaid;           // in INR, null for FREE

    @Column(name = "payment_reference")
    private String paymentReference;      // UPI/Razorpay txn ID

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Status { ACTIVE, EXPIRED, CANCELLED }
}

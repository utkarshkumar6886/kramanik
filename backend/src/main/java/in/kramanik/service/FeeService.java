package in.kramanik.service;

import in.kramanik.model.Batch;
import in.kramanik.model.FeeRecord;
import in.kramanik.model.FeeRecord.Status;
import in.kramanik.model.Student;
import in.kramanik.repository.FeeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeeService {

    private final FeeRepository feeRepository;

    public List<FeeRecord> getByStudent(Long studentId) {
        return feeRepository.findByStudentId(studentId);
    }

    public List<FeeRecord> getPendingAndOverdue(Long instituteId) {
        return feeRepository.findByInstituteIdAndStatuses(
                instituteId, List.of(Status.PENDING, Status.OVERDUE, Status.PARTIAL));
    }

    public FeeRecord createFeeRecord(Long studentId, Long batchId, String month,
                                     BigDecimal amount, LocalDate dueDate) {
        FeeRecord record = FeeRecord.builder()
                .student(Student.builder().id(studentId).build())
                .batch(Batch.builder().id(batchId).build())
                .month(month)
                .amountDue(amount)
                .amountPaid(BigDecimal.ZERO)
                .dueDate(dueDate)
                .status(Status.PENDING)
                .build();
        return feeRepository.save(record);
    }

    public FeeRecord recordPayment(Long feeId, BigDecimal amount,
                                   FeeRecord.PaymentMode mode, Long instituteId) {
        FeeRecord record = feeRepository.findById(feeId)
                .orElseThrow(() -> new EntityNotFoundException("Fee record not found"));

        BigDecimal newPaid = record.getAmountPaid().add(amount);
        record.setAmountPaid(newPaid);
        record.setPaymentMode(mode);

        if (newPaid.compareTo(record.getAmountDue()) >= 0) {
            record.setStatus(Status.PAID);
            record.setPaidDate(LocalDate.now());
        } else {
            record.setStatus(Status.PARTIAL);
        }
        return feeRepository.save(record);
    }

    public BigDecimal getMonthlyCollection(Long instituteId, String month) {
        return feeRepository.sumPaidByInstituteAndMonth(instituteId, month);
    }

    public BigDecimal getTotalOutstanding(Long instituteId) {
        return feeRepository.totalOutstandingByInstitute(instituteId);
    }
}

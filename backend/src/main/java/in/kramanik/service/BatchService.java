package in.kramanik.service;

import in.kramanik.model.Batch;
import in.kramanik.model.Institute;
import in.kramanik.repository.BatchRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BatchService {

    private final BatchRepository   batchRepository;
    private final InstituteService  instituteService;

    public BatchService(BatchRepository batchRepository,
                        @Lazy InstituteService instituteService) {
        this.batchRepository  = batchRepository;
        this.instituteService = instituteService;
    }

    public List<Batch> getAll(Long instituteId) {
        return batchRepository.findByInstituteIdAndIsActiveTrue(instituteId);
    }

    public Batch getById(Long id, Long instituteId) {
        Batch b = batchRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Batch not found: " + id));
        if (!b.getInstitute().getId().equals(instituteId))
            throw new SecurityException("Access denied");
        return b;
    }

    public Batch create(Batch batch, Long instituteId) {
        // Plan limit check
        instituteService.assertCanAddBatch(instituteId);

        Institute inst = new Institute();
        inst.setId(instituteId);
        batch.setInstitute(inst);
        batch.setActive(true);
        return batchRepository.save(batch);
    }

    public Batch update(Long id, Batch updated, Long instituteId) {
        Batch existing = getById(id, instituteId);
        existing.setName(updated.getName());
        existing.setSubject(updated.getSubject());
        existing.setScheduleDays(updated.getScheduleDays());
        existing.setStartTime(updated.getStartTime());
        existing.setEndTime(updated.getEndTime());
        existing.setMonthlyFee(updated.getMonthlyFee());
        return batchRepository.save(existing);
    }

    public void deactivate(Long id, Long instituteId) {
        Batch b = getById(id, instituteId);
        b.setActive(false);
        batchRepository.save(b);
    }
}

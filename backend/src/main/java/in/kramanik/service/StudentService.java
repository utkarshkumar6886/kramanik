package in.kramanik.service;

import in.kramanik.model.Institute;
import in.kramanik.model.Student;
import in.kramanik.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final InstituteService  instituteService;

    public StudentService(StudentRepository studentRepository,
                          @Lazy InstituteService instituteService) {
        this.studentRepository = studentRepository;
        this.instituteService  = instituteService;
    }

    public List<Student> getAll(Long instituteId) {
        return studentRepository.findByInstituteIdAndIsActiveTrue(instituteId);
    }

    public Student getById(Long id, Long instituteId) {
        Student s = studentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + id));
        if (!s.getInstitute().getId().equals(instituteId))
            throw new SecurityException("Access denied");
        return s;
    }

    public Student create(Student student, Long instituteId) {
        // Plan limit check
        instituteService.assertCanAddStudent(instituteId);

        Institute inst = new Institute();
        inst.setId(instituteId);
        student.setInstitute(inst);
        student.setActive(true);
        return studentRepository.save(student);
    }

    public Student update(Long id, Student updated, Long instituteId) {
        Student existing = getById(id, instituteId);
        existing.setName(updated.getName());
        existing.setPhone(updated.getPhone());
        existing.setParentName(updated.getParentName());
        existing.setParentPhone(updated.getParentPhone());
        existing.setParentWhatsapp(updated.getParentWhatsapp());
        existing.setEmail(updated.getEmail());
        existing.setDateOfBirth(updated.getDateOfBirth());
        existing.setAddress(updated.getAddress());
        return studentRepository.save(existing);
    }

    public void deactivate(Long id, Long instituteId) {
        Student s = getById(id, instituteId);
        s.setActive(false);
        studentRepository.save(s);
    }

    public long countActive(Long instituteId) {
        return studentRepository.countByInstituteIdAndIsActiveTrue(instituteId);
    }
}

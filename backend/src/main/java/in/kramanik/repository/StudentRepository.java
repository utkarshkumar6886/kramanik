package in.kramanik.repository;

import in.kramanik.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByInstituteIdAndIsActiveTrue(Long instituteId);
    List<Student> findByInstituteId(Long instituteId);
    long countByInstituteIdAndIsActiveTrue(Long instituteId);
}

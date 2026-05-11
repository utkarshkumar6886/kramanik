package in.kramanik.controller;

import in.kramanik.model.Student;
import in.kramanik.security.JwtUtil;
import in.kramanik.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final JwtUtil jwtUtil;

    private Long instituteId(String authHeader) {
        return jwtUtil.extractInstituteId(authHeader.substring(7));
    }

    @GetMapping
    public ResponseEntity<List<Student>> getAll(@RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(studentService.getAll(instituteId(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getById(@PathVariable Long id,
                                           @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(studentService.getById(id, instituteId(auth)));
    }

    @PostMapping
    public ResponseEntity<Student> create(@RequestBody Student student,
                                          @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(studentService.create(student, instituteId(auth)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> update(@PathVariable Long id,
                                          @RequestBody Student student,
                                          @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(studentService.update(id, student, instituteId(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id,
                                           @RequestHeader("Authorization") String auth) {
        studentService.deactivate(id, instituteId(auth));
        return ResponseEntity.noContent().build();
    }
}

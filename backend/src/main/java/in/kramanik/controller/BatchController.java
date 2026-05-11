package in.kramanik.controller;

import in.kramanik.model.Batch;
import in.kramanik.security.JwtUtil;
import in.kramanik.service.BatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/batches")
@RequiredArgsConstructor
public class BatchController {

    private final BatchService batchService;
    private final JwtUtil jwtUtil;

    private Long instituteId(String authHeader) {
        return jwtUtil.extractInstituteId(authHeader.substring(7));
    }

    @GetMapping
    public ResponseEntity<List<Batch>> getAll(@RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(batchService.getAll(instituteId(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Batch> getById(@PathVariable Long id,
                                         @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(batchService.getById(id, instituteId(auth)));
    }

    @PostMapping
    public ResponseEntity<Batch> create(@RequestBody Batch batch,
                                        @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(batchService.create(batch, instituteId(auth)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Batch> update(@PathVariable Long id,
                                        @RequestBody Batch batch,
                                        @RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(batchService.update(id, batch, instituteId(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id,
                                           @RequestHeader("Authorization") String auth) {
        batchService.deactivate(id, instituteId(auth));
        return ResponseEntity.noContent().build();
    }
}

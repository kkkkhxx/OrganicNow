package com.organicnow.backend.controller;

<<<<<<< HEAD
import com.organicnow.backend.dto.CreateMaintainRequest;
import com.organicnow.backend.dto.MaintainDto;
import com.organicnow.backend.dto.UpdateMaintainRequest;
import com.organicnow.backend.service.MaintainService;
=======
import com.organicnow.backend.dto.RequestDto;
import com.organicnow.backend.dto.ApiResponse;
import com.organicnow.backend.dto.CreateMaintainRequest;
import com.organicnow.backend.dto.MaintainDto;
import com.organicnow.backend.dto.UpdateMaintainRequest;
import com.organicnow.backend.service.MaintainRoomService;  // ใช้ MaintainRoomService
import com.organicnow.backend.service.MaintainService;  // ใช้ MaintainService
>>>>>>> 478e58059c31d1d62ce26de367c7298f75c2c5f1
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/maintain")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:4173"}, allowCredentials = "true")
@RequiredArgsConstructor
public class MaintainController {

<<<<<<< HEAD
    private final MaintainService maintainService;

    @GetMapping("/list")
    public ResponseEntity<List<MaintainDto>> list() {
        return ResponseEntity.ok(maintainService.getAll());
=======
    private final MaintainRoomService maintainRoomService;  // ใช้ MaintainRoomService สำหรับ Room-related logic
    private final MaintainService maintainService;  // ใช้ MaintainService สำหรับ MaintainDto-related logic

    @GetMapping("/{roomId}/requests")
    public ApiResponse<List<RequestDto>> getRequestsByRoom(@PathVariable Long roomId) {
        List<RequestDto> requests = maintainRoomService.getRequestsByRoomId(roomId);  // เรียกใช้ MaintainRoomService
        return new ApiResponse<>("success", requests);
    }

    @GetMapping("/list")
    public ResponseEntity<List<MaintainDto>> list() {
        return ResponseEntity.ok(maintainService.getAll());  // ใช้ MaintainService
>>>>>>> 478e58059c31d1d62ce26de367c7298f75c2c5f1
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintainDto> get(@PathVariable Long id) {
        return maintainService.getById(id)
                .map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody CreateMaintainRequest req) {
        try {
<<<<<<< HEAD
            return ResponseEntity.ok(maintainService.create(req));
=======
            return ResponseEntity.ok(maintainService.create(req));  // ใช้ MaintainService
>>>>>>> 478e58059c31d1d62ce26de367c7298f75c2c5f1
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Create failed: " + e.getMessage());
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody UpdateMaintainRequest req) {
        try {
<<<<<<< HEAD
            return ResponseEntity.ok(maintainService.update(id, req));
=======
            return ResponseEntity.ok(maintainService.update(id, req));  // ใช้ MaintainService
>>>>>>> 478e58059c31d1d62ce26de367c7298f75c2c5f1
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Update failed: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
<<<<<<< HEAD
            maintainService.delete(id);
=======
            maintainService.delete(id);  // ใช้ MaintainService
>>>>>>> 478e58059c31d1d62ce26de367c7298f75c2c5f1
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Delete failed: " + e.getMessage());
        }
    }
}

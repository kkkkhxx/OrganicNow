package com.organicnow.backend.controller;


import com.organicnow.backend.dto.RequestDto;
import com.organicnow.backend.dto.ApiResponse;
import com.organicnow.backend.dto.CreateMaintainRequest;
import com.organicnow.backend.dto.MaintainDto;
import com.organicnow.backend.dto.UpdateMaintainRequest;
import com.organicnow.backend.service.MaintainService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/maintain")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:4173"}, allowCredentials = "true")
@RequiredArgsConstructor
public class MaintainController {

    private final MaintainService maintainService;


    @GetMapping("/{roomId}/requests")
    public ApiResponse<List<RequestDto>> getRequestsByRoom(@PathVariable Long roomId) {
        List<RequestDto> requests = maintainService.getRequestsByRoomId(roomId);
        return new ApiResponse<>("success", requests);
    @GetMapping("/list")
    public ResponseEntity<List<MaintainDto>> list() {
        return ResponseEntity.ok(maintainService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintainDto> get(@PathVariable Long id) {
        return maintainService.getById(id)
                .map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody CreateMaintainRequest req) {
        try {
            return ResponseEntity.ok(maintainService.create(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Create failed: " + e.getMessage());
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody UpdateMaintainRequest req) {
        try {
            return ResponseEntity.ok(maintainService.update(id, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Update failed: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            maintainService.delete(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Delete failed: " + e.getMessage());
        }

    }
}

package com.organicnow.backend.controller;

import com.organicnow.backend.dto.RoomDetailDto;
import com.organicnow.backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true") // อนุญาต frontend
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/{id}/detail")
    public ResponseEntity<RoomDetailDto> getRoomDetail(@PathVariable Long id) {
        RoomDetailDto dto = roomService.getRoomDetail(id);
        if (dto == null) {
            return ResponseEntity.notFound().build(); // ถ้าไม่พบข้อมูล
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    public ResponseEntity<List<RoomDetailDto>> getAllRooms() {
        List<RoomDetailDto> rooms = roomService.getAllRooms();
        if (rooms.isEmpty()) {
            return ResponseEntity.noContent().build(); // ถ้าไม่พบข้อมูล
        }
        return ResponseEntity.ok(rooms);
    }
}


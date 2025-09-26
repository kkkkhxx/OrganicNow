package com.organicnow.backend.controller;

import com.organicnow.backend.dto.RoomDetailDto;
import com.organicnow.backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true") // อนุญาต frontend
public class RoomController {

    private final RoomService roomService;

    // ✅ API สำหรับ frontend invoice management - GET /room/list
    @GetMapping("/room/list")
    public ResponseEntity<List<RoomDetailDto>> getRoomList() {
        List<RoomDetailDto> rooms = roomService.getAllRooms();
        return ResponseEntity.ok(rooms);
    }

    // ✅ API สำหรับหน้าอื่นๆ ที่ใช้ /rooms - รองรับ path เดิม
    @GetMapping("/rooms")
    public ResponseEntity<List<RoomDetailDto>> getRoomsLegacy() {
        List<RoomDetailDto> rooms = roomService.getAllRooms();
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/room/{id}/detail")
    public ResponseEntity<RoomDetailDto> getRoomDetail(@PathVariable Long id) {
        RoomDetailDto dto = roomService.getRoomDetail(id);
        if (dto == null) {
            return ResponseEntity.notFound().build(); // ถ้าไม่พบข้อมูล
        }
        return ResponseEntity.ok(dto);
    }

    // ✅ API สำหรับหน้า roomdetail.jsx ที่ใช้ /rooms/{id}/detail 
    @GetMapping("/rooms/{id}/detail")
    public ResponseEntity<RoomDetailDto> getRoomDetailLegacy(@PathVariable Long id) {
        RoomDetailDto dto = roomService.getRoomDetail(id);
        if (dto == null) {
            return ResponseEntity.notFound().build(); // ถ้าไม่พบข้อมูล
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/room")
    public ResponseEntity<List<RoomDetailDto>> getAllRooms() {
        List<RoomDetailDto> rooms = roomService.getAllRooms();
        if (rooms.isEmpty()) {
            return ResponseEntity.noContent().build(); // ถ้าไม่พบข้อมูล
        }
        return ResponseEntity.ok(rooms);
    }
}


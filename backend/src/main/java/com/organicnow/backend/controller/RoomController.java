package com.organicnow.backend.controller;

import com.organicnow.backend.dto.RoomDetailDto;
import com.organicnow.backend.dto.RoomUpdateDto;
import com.organicnow.backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:3000"},
        allowCredentials = "true",
        allowedHeaders = "*",
        methods = {
                RequestMethod.GET,
                RequestMethod.POST,
                RequestMethod.PUT,
                RequestMethod.DELETE,
                RequestMethod.OPTIONS
        }
)
public class RoomController {

    private final RoomService roomService;

    // ✅ ดึงข้อมูลห้องแบบละเอียด
    @GetMapping("/{id}/detail")
    public ResponseEntity<RoomDetailDto> getRoomDetail(@PathVariable Long id) {
        RoomDetailDto dto = roomService.getRoomDetail(id);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    // ✅ ดึงข้อมูลห้องทั้งหมด
    @GetMapping
    public ResponseEntity<List<RoomDetailDto>> getAllRooms() {
        List<RoomDetailDto> rooms = roomService.getAllRooms();
        if (rooms.isEmpty()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(rooms);
    }

    // ✅ เพิ่ม Asset เข้า Room
    @PostMapping("/{roomId}/assets/{assetId}")
    public ResponseEntity<?> addAssetToRoom(
            @PathVariable Long roomId,
            @PathVariable Long assetId
    ) {
        try {
            roomService.addAssetToRoom(roomId, assetId);
            return ResponseEntity.ok().body("Asset added successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ✅ ลบ Asset ออกจาก Room
    @DeleteMapping("/{roomId}/assets/{assetId}")
    public ResponseEntity<?> removeAssetFromRoom(
            @PathVariable Long roomId,
            @PathVariable Long assetId
    ) {
        try {
            roomService.removeAssetFromRoom(roomId, assetId);
            return ResponseEntity.ok().body("Asset removed successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ✅ อัปเดตรายการ Asset ทั้งหมดใน Room
    @PutMapping("/{roomId}/assets")
    public ResponseEntity<?> updateRoomAssets(
            @PathVariable Long roomId,
            @RequestBody List<Long> assetIds
    ) {
        try {
            roomService.updateRoomAssets(roomId, assetIds);
            return ResponseEntity.ok("Room assets updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ✅ อัปเดตข้อมูลพื้นฐานของห้อง (floor, number)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRoomInfo(
            @PathVariable Long id,
            @RequestBody RoomUpdateDto dto
    ) {
        try {
            roomService.updateRoom(id, dto);
            return ResponseEntity.ok("Room info updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
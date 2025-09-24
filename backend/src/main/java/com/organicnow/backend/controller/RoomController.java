package com.organicnow.backend.controller;

import com.organicnow.backend.dto.RoomDetailDto;
import com.organicnow.backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/{id}/detail")
    public ResponseEntity<?> getRoomDetail(@PathVariable Long id) {
        RoomDetailDto dto = roomService.getRoomDetail(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }
}

package com.organicnow.backend.controller;

import com.organicnow.backend.dto.RequestDto;
import com.organicnow.backend.dto.ApiResponse;
import com.organicnow.backend.service.MaintainService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class MaintainController {

    private final MaintainService maintainService;

    @GetMapping("/{roomId}/requests")
    public ApiResponse<List<RequestDto>> getRequestsByRoom(@PathVariable Long roomId) {
        List<RequestDto> requests = maintainService.getRequestsByRoomId(roomId);
        return new ApiResponse<>("success", requests);
    }
}

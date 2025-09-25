package com.organicnow.backend.service;

import com.organicnow.backend.dto.RequestDto;
import com.organicnow.backend.repository.MaintainRepository;
import lombok.RequiredArgsConstructor; import org.springframework.stereotype.Service;
import java.util.List;

@Service @RequiredArgsConstructor
public class MaintainRoomService {
    private final MaintainRepository maintainRepository;
    public List<RequestDto> getRequestsByRoomId(Long roomId) {
        return maintainRepository.findRequestsByRoomId(roomId);
    }}

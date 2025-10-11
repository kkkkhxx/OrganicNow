package com.organicnow.backend.service;

import com.organicnow.backend.dto.AssetDto;
import com.organicnow.backend.dto.RequestDto;
import com.organicnow.backend.dto.RoomDetailDto;
import com.organicnow.backend.repository.AssetRepository;
import com.organicnow.backend.repository.MaintainRepository;
import com.organicnow.backend.repository.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RoomServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private MaintainRepository maintainRepository;

    @InjectMocks
    private RoomService roomService;

    private RoomDetailDto roomDto;
    private AssetDto assetDto;
    private RequestDto requestDto;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        roomDto = new RoomDetailDto();
        try {
            roomDto.getClass().getMethod("setRoomId", Long.class).invoke(roomDto, 1L);
            roomDto.getClass().getMethod("setRoomNumber", String.class).invoke(roomDto, "101");
        } catch (Exception ignored) {}

        assetDto = new AssetDto();
        try {
            assetDto.getClass().getMethod("setId", Long.class).invoke(assetDto, 10L);
            assetDto.getClass().getMethod("setAssetName", String.class).invoke(assetDto, "Air Conditioner");
        } catch (Exception ignored) {}

        requestDto = new RequestDto();
        try {
            requestDto.getClass().getMethod("setRequestId", Long.class).invoke(requestDto, 20L);
            requestDto.getClass().getMethod("setRequestDetail", String.class).invoke(requestDto, "Fix light");
        } catch (Exception ignored) {}
    }

    // ✅ ทดสอบ getAllRooms()
    @Test
    void testGetAllRooms() {
        when(roomRepository.findAllRooms()).thenReturn(List.of(roomDto));

        List<RoomDetailDto> result = roomService.getAllRooms();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("101", result.get(0).getRoomNumber());
        verify(roomRepository, times(1)).findAllRooms();
    }

    // ✅ ทดสอบ getRoomDetail() กรณีพบห้อง
    @Test
    void testGetRoomDetail_Found() {
        when(roomRepository.findRoomDetail(1L)).thenReturn(roomDto);
        when(assetRepository.findAssetsByRoomId(1L)).thenReturn(List.of(assetDto));
        when(maintainRepository.findRequestsByRoomId(1L)).thenReturn(List.of(requestDto));

        RoomDetailDto result = roomService.getRoomDetail(1L);

        assertNotNull(result);
        assertEquals("101", result.getRoomNumber());
        assertEquals(1, result.getAssets().size());
        assertEquals(1, result.getRequests().size());
        verify(roomRepository, times(1)).findRoomDetail(1L);
        verify(assetRepository, times(1)).findAssetsByRoomId(1L);
        verify(maintainRepository, times(1)).findRequestsByRoomId(1L);
    }

    // ✅ ทดสอบ getRoomDetail() กรณีไม่พบห้อง
    @Test
    void testGetRoomDetail_NotFound() {
        when(roomRepository.findRoomDetail(99L)).thenReturn(null);

        RoomDetailDto result = roomService.getRoomDetail(99L);

        assertNull(result);
        verify(roomRepository, times(1)).findRoomDetail(99L);
        verify(assetRepository, never()).findAssetsByRoomId(any());
        verify(maintainRepository, never()).findRequestsByRoomId(any());
    }
}

package com.organicnow.backend.service;

import com.organicnow.backend.dto.MaintenanceScheduleCreateDto;
import com.organicnow.backend.dto.MaintenanceScheduleDto;
import com.organicnow.backend.model.MaintenanceSchedule;
import com.organicnow.backend.model.Room;
import com.organicnow.backend.model.RoomAsset;
import com.organicnow.backend.repository.MaintenanceScheduleRepository;
import com.organicnow.backend.repository.RoomAssetRepository;
import com.organicnow.backend.repository.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MaintenanceScheduleServiceTest {

    @Mock
    private MaintenanceScheduleRepository scheduleRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomAssetRepository roomAssetRepository;

    @InjectMocks
    private MaintenanceScheduleService scheduleService;

    private MaintenanceSchedule schedule;
    private MaintenanceScheduleCreateDto createDto;
    private Room room;
    private RoomAsset roomAsset;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        room = new Room();
        try {
            room.getClass().getMethod("setId", Long.class).invoke(room, 1L);
        } catch (Exception ignored) {}

        roomAsset = new RoomAsset();
        try {
            roomAsset.getClass().getMethod("setId", Long.class).invoke(roomAsset, 10L);
        } catch (Exception ignored) {}

        schedule = MaintenanceSchedule.builder()
                .id(100L)
                .scheduleScope(0) // ✅ Integer (0 = room)
                .room(room)
                .roomAsset(roomAsset)
                .cycleMonth(6)
                .scheduleTitle("AC Cleaning")
                .scheduleDescription("Clean air conditioner filters")
                .lastDoneDate(LocalDateTime.now().minusMonths(6))
                .nextDueDate(LocalDateTime.now().plusMonths(6))
                .notifyBeforeDate(3) // ✅ ใช้ Integer แทน LocalDateTime
                .build();

        createDto = new MaintenanceScheduleCreateDto();
        try {
            createDto.getClass().getMethod("setRoomId", Long.class).invoke(createDto, 1L);
            createDto.getClass().getMethod("setRoomAssetId", Long.class).invoke(createDto, 10L);
            createDto.getClass().getMethod("setScheduleScope", Integer.class).invoke(createDto, 0);
            createDto.getClass().getMethod("setCycleMonth", Integer.class).invoke(createDto, 6);
            createDto.getClass().getMethod("setScheduleTitle", String.class).invoke(createDto, "AC Cleaning");
            createDto.getClass().getMethod("setScheduleDescription", String.class).invoke(createDto, "Clean air conditioner filters");
            createDto.getClass().getMethod("setNotifyBeforeDate", Integer.class).invoke(createDto, 3); // ✅ Integer
        } catch (Exception ignored) {}
    }

    @Test
    void testCreateSchedule() {
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(roomAssetRepository.findById(10L)).thenReturn(Optional.of(roomAsset));
        when(scheduleRepository.save(any(MaintenanceSchedule.class))).thenReturn(schedule);

        MaintenanceScheduleDto result = scheduleService.createSchedule(createDto);

        assertNotNull(result);
        assertEquals("AC Cleaning", result.getScheduleTitle());
        verify(scheduleRepository, times(1)).save(any(MaintenanceSchedule.class));
    }

    @Test
    void testUpdateSchedule() {
        when(scheduleRepository.findById(100L)).thenReturn(Optional.of(schedule));
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(roomAssetRepository.findById(10L)).thenReturn(Optional.of(roomAsset));
        when(scheduleRepository.save(any(MaintenanceSchedule.class))).thenReturn(schedule);

        MaintenanceScheduleDto result = scheduleService.updateSchedule(100L, createDto);

        assertNotNull(result);
        assertEquals("AC Cleaning", result.getScheduleTitle());
        verify(scheduleRepository, times(1)).save(any(MaintenanceSchedule.class));
    }

    @Test
    void testUpdateSchedule_NotFound() {
        when(scheduleRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> scheduleService.updateSchedule(999L, createDto));
    }

    @Test
    void testGetAllSchedules() {
        when(scheduleRepository.findAll()).thenReturn(List.of(schedule));

        List<MaintenanceScheduleDto> result = scheduleService.getAllSchedules();

        assertEquals(1, result.size());
        assertEquals("AC Cleaning", result.get(0).getScheduleTitle());
        verify(scheduleRepository, times(1)).findAll();
    }

    @Test
    void testGetScheduleById() {
        when(scheduleRepository.findById(100L)).thenReturn(Optional.of(schedule));

        Optional<MaintenanceScheduleDto> result = scheduleService.getScheduleById(100L);

        assertTrue(result.isPresent());
        assertEquals("AC Cleaning", result.get().getScheduleTitle());
        verify(scheduleRepository, times(1)).findById(100L);
    }

    @Test
    void testDeleteSchedule() {
        doNothing().when(scheduleRepository).deleteById(100L);
        scheduleService.deleteSchedule(100L);
        verify(scheduleRepository, times(1)).deleteById(100L);
    }

    @Test
    void testMarkAsDone() {
        when(scheduleRepository.findById(100L)).thenReturn(Optional.of(schedule));
        when(scheduleRepository.save(any(MaintenanceSchedule.class))).thenReturn(schedule);

        MaintenanceScheduleDto result = scheduleService.markAsDone(100L);

        assertNotNull(result);
        assertNotNull(result.getLastDoneDate());
        assertNotNull(result.getNextDueDate());
        verify(scheduleRepository, times(1)).save(any(MaintenanceSchedule.class));
    }

    @Test
    void testMarkAsDone_NotFound() {
        when(scheduleRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> scheduleService.markAsDone(999L));
    }

    @Test
    void testGetUpcomingSchedules() {
        when(scheduleRepository.findByNextDueDateBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(schedule));

        List<MaintenanceScheduleDto> result = scheduleService.getUpcomingSchedules(7);

        assertEquals(1, result.size());
        verify(scheduleRepository, times(1))
                .findByNextDueDateBetween(any(LocalDateTime.class), any(LocalDateTime.class));
    }
}

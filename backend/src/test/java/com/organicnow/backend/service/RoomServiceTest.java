//package com.organicnow.backend.service;
//
//import com.organicnow.backend.model.Room;
//import com.organicnow.backend.repository.RoomRepository;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.MockitoAnnotations;
//
//import java.util.Arrays;
//import java.util.List;
//import java.util.Optional;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.Mockito.*;
//
//class RoomServiceTest {
//
//    @Mock
//    private RoomRepository roomRepository;
//
//    @InjectMocks
//    private RoomService roomService;
//
//    @BeforeEach
//    void setUp() {
//        MockitoAnnotations.openMocks(this);
//    }
//
//    @Test
//    void getAllRooms_shouldReturnAllRooms() {
//        Room room1 = new Room();
//        room1.setId(1L);
//        room1.setRoomNumber("101");
//
//        Room room2 = new Room();
//        room2.setId(2L);
//        room2.setRoomNumber("102");
//
//        when(roomRepository.findAll()).thenReturn(Arrays.asList(room1, room2));
//
//        List<Room> result = roomService.getAllRooms();
//
//        assertEquals(2, result.size());
//        assertEquals("101", result.get(0).getRoomNumber());
//        assertEquals("102", result.get(1).getRoomNumber());
//        verify(roomRepository, times(1)).findAll();
//    }
//
//    @Test
//    void getRoomById_shouldReturnRoomIfExists() {
//        Room room = new Room();
//        room.setId(1L);
//        room.setRoomNumber("101");
//
//        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
//
//        Room result = roomService.getRoomById(1L);
//
//        assertNotNull(result);
//        assertEquals("101", result.getRoomNumber());
//        verify(roomRepository, times(1)).findById(1L);
//    }
//
//    @Test
//    void getRoomById_shouldReturnNullIfNotFound() {
//        when(roomRepository.findById(99L)).thenReturn(Optional.empty());
//
//        Room result = roomService.getRoomById(99L);
//
//        assertNull(result);
//        verify(roomRepository, times(1)).findById(99L);
//    }
//
//    @Test
//    void saveRoom_shouldSaveAndReturnRoom() {
//        Room room = new Room();
//        room.setId(1L);
//        room.setRoomNumber("101");
//
//        when(roomRepository.save(any(Room.class))).thenReturn(room);
//
//        Room result = roomService.saveRoom(room);
//
//        assertNotNull(result);
//        assertEquals("101", result.getRoomNumber());
//        verify(roomRepository, times(1)).save(room);
//    }
//
//    @Test
//    void deleteRoom_shouldCallRepositoryDelete() {
//        doNothing().when(roomRepository).deleteById(1L);
//
//        roomService.deleteRoom(1L);
//
//        verify(roomRepository, times(1)).deleteById(1L);
//    }
//}

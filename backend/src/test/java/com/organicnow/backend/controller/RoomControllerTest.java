//package com.organicnow.backend.controller;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.organicnow.backend.model.Room;
//import com.organicnow.backend.service.RoomService;
//import org.junit.jupiter.api.Test;
//import org.mockito.Mockito;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
//import org.springframework.boot.test.mock.mockito.MockBean;
//import org.springframework.http.MediaType;
//import org.springframework.test.web.servlet.MockMvc;
//
//import java.util.List;
//
//import static org.mockito.ArgumentMatchers.any;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
//
//@WebMvcTest(RoomController.class)
//class RoomControllerTest {
//
//    @Autowired
//    private MockMvc mockMvc;
//
//    @MockBean
//    private RoomService roomService;
//
//    @Autowired
//    private ObjectMapper objectMapper;
//
//    @Test
//    void testGetAllRooms() throws Exception {
//        Room room1 = new Room();
//        room1.setId(1L);
//        room1.setRoomNumber("101");
//
//        Room room2 = new Room();
//        room2.setId(2L);
//        room2.setRoomNumber("102");
//
//        Mockito.when(roomService.getAllRooms()).thenReturn(List.of(room1, room2));
//
//        mockMvc.perform(get("/rooms"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.result[0].roomNumber").value("101"))
//                .andExpect(jsonPath("$.result[1].roomNumber").value("102"));
//    }
//
//    @Test
//    void testGetRoomById() throws Exception {
//        Room room = new Room();
//        room.setId(1L);
//        room.setRoomNumber("101");
//
//        Mockito.when(roomService.getRoomById(1L)).thenReturn(room);
//
//        mockMvc.perform(get("/rooms/1"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.result.roomNumber").value("101"));
//    }
//
//    @Test
//    void testCreateRoom() throws Exception {
//        Room room = new Room();
//        room.setId(1L);
//        room.setRoomNumber("101");
//
//        Mockito.when(roomService.saveRoom(any(Room.class))).thenReturn(room);
//
//        mockMvc.perform(post("/rooms")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(room)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.result.roomNumber").value("101"));
//    }
//
//    @Test
//    void testDeleteRoom() throws Exception {
//        Long roomId = 1L;
//
//        Mockito.doNothing().when(roomService).deleteRoom(roomId);
//
//        mockMvc.perform(delete("/rooms/{id}", roomId))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.result").value("Room with ID 1 deleted successfully"));
//    }
//}

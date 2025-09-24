package com.organicnow.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomDetailDto {
    private Long roomId;
    private String roomNumber;
    private int roomFloor;
    private String status;

    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String email;

    private String contractTypeName;
    private LocalDate signDate;
    private LocalDate startDate;
    private LocalDate endDate;

    // จะใช้ service เติมภายหลัง
    private Object assets;
    private Object requests;
}

package com.organicnow.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

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
    private LocalDateTime signDate;   // เปลี่ยนเป็น LocalDateTime ตาม database
    private LocalDateTime startDate;  // เปลี่ยนเป็น LocalDateTime ตาม database
    private LocalDateTime endDate;    // เปลี่ยนเป็น LocalDateTime ตาม database
    private List<AssetDto> assets;
    private List<RequestDto> requests;

    // Constructor สำหรับ JPQL query (ไม่รวม assets และ requests)
    public RoomDetailDto(Long roomId, String roomNumber, int roomFloor, String status,
                         String firstName, String lastName, String phoneNumber, String email,
                         String contractTypeName, LocalDateTime signDate, LocalDateTime startDate,
                         LocalDateTime endDate) {
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.roomFloor = roomFloor;
        this.status = status;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.contractTypeName = contractTypeName;
        this.signDate = signDate;
        this.startDate = startDate;
        this.endDate = endDate;
        this.assets = null;
        this.requests = null;
    }
}
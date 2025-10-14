package com.organicnow.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ApiResponse<T> {
    private String status;
    private T result;
    
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("success", data);
    }
    
    public static ApiResponse<String> error(String message) {
        return new ApiResponse<>("error", message);
    }
}

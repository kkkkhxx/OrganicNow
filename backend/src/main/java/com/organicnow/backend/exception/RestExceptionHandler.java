package com.organicnow.backend.exception;

import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class RestExceptionHandler {

    // ✅ Validation error → 400
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
        var errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        fe -> fe.getField(),
                        fe -> fe.getDefaultMessage(),
                        (a, b) -> a
                ));
        return ResponseEntity.badRequest().body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", 400,
                "message", "validation_error",
                "errors", errors
        ));
    }

    // ✅ Hibernate constraint → 409
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<?> handleHibernateConstraint(ConstraintViolationException ex) {
        String cause = ex.getSQLException() != null ? ex.getSQLException().getMessage() : "";
        String msg = resolveDuplicateMessage(cause);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", 409,
                "message", msg
        ));
    }

    // ✅ Spring DataIntegrityViolation → 409
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrity(DataIntegrityViolationException ex) {
        String cause = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : "";
        String msg = resolveDuplicateMessage(cause);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", 409,
                "message", msg
        ));
    }

    // ✅ Custom business exceptions
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleBusiness(RuntimeException ex) {
        String msg = ex.getMessage();

        if ("duplicate_group_name".equals(msg)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "timestamp", LocalDateTime.now().toString(),
                    "status", 409,
                    "message", "duplicate_group_name"
            ));
        }

        if ("tenant_already_has_active_contract".equals(msg)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "timestamp", LocalDateTime.now().toString(),
                    "status", 409,
                    "message", "duplicate_national_id"
            ));
        }

        // fallback → 500
        ex.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "timestamp", LocalDateTime.now().toString(),
                        "status", 500,
                        "message", "server_error",
                        "detail", msg
                ));
    }

    // Helper
    private String resolveDuplicateMessage(String cause) {
        if (cause == null) return "duplicate";
        String c = cause.toLowerCase();

        if (c.contains("uk_tenant_national_id") || c.contains("national_id")) {
            return "duplicate_national_id";
        }
        if (c.contains("uk_asset_group_name")) {
            return "duplicate_group_name";
        }
        return "duplicate";
    }
}
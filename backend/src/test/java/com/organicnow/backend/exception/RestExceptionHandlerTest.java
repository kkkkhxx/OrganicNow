package com.organicnow.backend.exception;

import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class RestExceptionHandlerTest {

    private RestExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new RestExceptionHandler();
    }

    // ✅ TEST 1: Validation Error
    @Test
    void handleValidation_shouldReturn400WithFieldErrors() {
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(
                new FieldError("obj", "username", "must not be blank"),
                new FieldError("obj", "email", "invalid format")
        ));

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<?> response = handler.handleValidation(ex);

        assertThat(response.getStatusCodeValue()).isEqualTo(400);
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body.get("message")).isEqualTo("validation_error");

        Map<String, String> errors = (Map<String, String>) body.get("errors");
        assertThat(errors).containsKeys("username", "email");
        assertThat(errors.get("username")).isEqualTo("must not be blank");
    }

    // ✅ TEST 2: Hibernate ConstraintViolation (duplicate national_id)
    @Test
    void handleHibernateConstraint_duplicateNationalId() {
        SQLException sql = new SQLException("UK_tenant_national_id constraint violated");
        ConstraintViolationException ex = new ConstraintViolationException("Duplicate", sql, "tenant");

        ResponseEntity<?> response = handler.handleHibernateConstraint(ex);
        Map<String, Object> body = (Map<String, Object>) response.getBody();

        assertThat(response.getStatusCodeValue()).isEqualTo(409);
        assertThat(body.get("message")).isEqualTo("duplicate_national_id");
    }

    // ✅ TEST 3: DataIntegrityViolationException (duplicate group name)
    @Test
    void handleDataIntegrity_duplicateGroupName() {
        Throwable cause = new Throwable("UK_asset_group_name constraint violated");
        DataIntegrityViolationException ex = new DataIntegrityViolationException("duplicate", cause);

        ResponseEntity<?> response = handler.handleDataIntegrity(ex);
        Map<String, Object> body = (Map<String, Object>) response.getBody();

        assertThat(response.getStatusCodeValue()).isEqualTo(409);
        assertThat(body.get("message")).isEqualTo("duplicate_group_name");
    }

    // ✅ TEST 4: Business Exception → duplicate_group_name
    @Test
    void handleBusiness_duplicateGroupName() {
        RuntimeException ex = new RuntimeException("duplicate_group_name");

        ResponseEntity<?> response = handler.handleBusiness(ex);
        Map<String, Object> body = (Map<String, Object>) response.getBody();

        assertThat(response.getStatusCodeValue()).isEqualTo(409);
        assertThat(body.get("message")).isEqualTo("duplicate_group_name");
    }

    // ✅ TEST 5: Business Exception → tenant_already_has_active_contract
    @Test
    void handleBusiness_duplicateNationalId() {
        RuntimeException ex = new RuntimeException("tenant_already_has_active_contract");

        ResponseEntity<?> response = handler.handleBusiness(ex);
        Map<String, Object> body = (Map<String, Object>) response.getBody();

        assertThat(response.getStatusCodeValue()).isEqualTo(409);
        assertThat(body.get("message")).isEqualTo("duplicate_national_id");
    }

    // ✅ TEST 6: Business Exception → Fallback (RuntimeException อื่น)
    @Test
    void handleBusiness_genericRuntime_shouldReturn500() {
        RuntimeException ex = new RuntimeException("unexpected_error");

        ResponseEntity<?> response = handler.handleBusiness(ex);
        Map<String, Object> body = (Map<String, Object>) response.getBody();

        assertThat(response.getStatusCodeValue()).isEqualTo(500);
        assertThat(body.get("message")).isEqualTo("server_error");
        assertThat(body.get("detail")).isEqualTo("unexpected_error");
    }
}

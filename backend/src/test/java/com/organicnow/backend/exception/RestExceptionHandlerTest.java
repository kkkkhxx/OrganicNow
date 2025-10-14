package com.organicnow.backend.exception;

import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.lang.reflect.Method;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
class RestExceptionHandlerTest {

    @Autowired
    private RestExceptionHandler restExceptionHandler;

    @Mock
    private MethodArgumentNotValidException methodArgumentNotValidException;

    @Mock
    private BindingResult bindingResult;

    @Mock
    private ConstraintViolationException constraintViolationException;

    @Mock
    private DataIntegrityViolationException dataIntegrityViolationException;

    @Mock
    private RuntimeException runtimeException;

    @BeforeEach
    void setUp() {
        // Initialize mocks if needed
    }

    // Test MethodArgumentNotValidException handling
    @Test
    void testHandleValidation() {
        // Create a mock FieldError
        FieldError fieldError = new FieldError("object", "field", "Field is required");

        // Mock the BindingResult to return a list with one field error
        when(methodArgumentNotValidException.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        // Act
        ResponseEntity<?> response = restExceptionHandler.handleValidation(methodArgumentNotValidException);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals(400, body.get("status"));
        assertEquals("validation_error", body.get("message"));
        assertTrue(((Map<?, ?>) body.get("errors")).containsKey("field"));
    }

    // Test ConstraintViolationException handling
    @Test
    void testHandleHibernateConstraint() {
        String causeMessage = "Duplicate entry for unique constraint uk_tenant_national_id";
        SQLException sqlException = mock(SQLException.class);
        when(sqlException.getMessage()).thenReturn(causeMessage);
        when(constraintViolationException.getSQLException()).thenReturn(sqlException);

        ResponseEntity<?> response = restExceptionHandler.handleHibernateConstraint(constraintViolationException);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals(409, body.get("status"));
        assertEquals("duplicate_national_id", body.get("message"));
    }

    // Test DataIntegrityViolationException handling
    @Test
    void testHandleDataIntegrityViolation() {
        String causeMessage = "Unique constraint violation: uk_asset_group_name";
        Throwable cause = mock(Throwable.class);
        when(cause.getMessage()).thenReturn(causeMessage);
        when(dataIntegrityViolationException.getMostSpecificCause()).thenReturn(cause);

        ResponseEntity<?> response = restExceptionHandler.handleDataIntegrity(dataIntegrityViolationException);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals(409, body.get("status"));
        assertEquals("duplicate_group_name", body.get("message"));
    }

    // Test RuntimeException handling for duplicate_group_name
    @Test
    void testHandleBusinessDuplicateGroupName() {
        when(runtimeException.getMessage()).thenReturn("duplicate_group_name");

        ResponseEntity<?> response = restExceptionHandler.handleBusiness(runtimeException);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals(409, body.get("status"));
        assertEquals("duplicate_group_name", body.get("message"));
    }

    // Test RuntimeException handling for tenant_already_has_active_contract
    @Test
    void testHandleBusinessTenantAlreadyHasActiveContract() {
        when(runtimeException.getMessage()).thenReturn("tenant_already_has_active_contract");

        ResponseEntity<?> response = restExceptionHandler.handleBusiness(runtimeException);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals(409, body.get("status"));
        assertEquals("duplicate_national_id", body.get("message"));
    }

    // Test RuntimeException handling with fallback for general error
    @Test
    void testHandleBusinessFallback() {
        when(runtimeException.getMessage()).thenReturn("Some unexpected error");

        ResponseEntity<?> response = restExceptionHandler.handleBusiness(runtimeException);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals(500, body.get("status"));
        assertEquals("server_error", body.get("message"));
        assertEquals("Some unexpected error", body.get("detail"));
    }

    // Test resolveDuplicateMessage helper method using reflection
    @Test
    void testResolveDuplicateMessage() throws Exception {
        // Access the private method using reflection
        Method method = RestExceptionHandler.class.getDeclaredMethod("resolveDuplicateMessage", String.class);
        method.setAccessible(true);

        // Test with various inputs
        assertEquals("duplicate_national_id", method.invoke(restExceptionHandler, "Duplicate entry for uk_tenant_national_id"));
        assertEquals("duplicate_group_name", method.invoke(restExceptionHandler, "uk_asset_group_name"));
        assertEquals("duplicate", method.invoke(restExceptionHandler, "Some other constraint violation"));
    }
}

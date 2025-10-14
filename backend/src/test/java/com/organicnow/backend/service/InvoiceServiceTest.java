package com.organicnow.backend.service;

import com.organicnow.backend.dto.*;
import com.organicnow.backend.model.*;
import com.organicnow.backend.repository.ContractRepository;
import com.organicnow.backend.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private ContractRepository contractRepository;

    @InjectMocks
    private InvoiceServiceImpl invoiceService;

    private Invoice invoice;
    private Contract contract;
    private Tenant tenant;
    private Room room;
    private PackagePlan packagePlan;
    private ContractType contractType;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Setup Tenant
        tenant = new Tenant();
        tenant.setId(1L);
        tenant.setFirstName("John");
        tenant.setLastName("Doe");
        tenant.setNationalId("1234567890123");
        tenant.setPhoneNumber("0812345678");
        tenant.setEmail("john@example.com");

        // Setup Room
        room = new Room();
        room.setId(1L);
        room.setRoomNumber("101");
        room.setRoomFloor(1);

        // Setup ContractType
        contractType = new ContractType();
        contractType.setId(1L);
        contractType.setName("Monthly");

        // Setup PackagePlan
        packagePlan = new PackagePlan();
        packagePlan.setId(1L);
        packagePlan.setContractType(contractType);

        // Setup Contract
        contract = new Contract();
        contract.setId(1L);
        contract.setTenant(tenant);
        contract.setRoom(room);
        contract.setPackagePlan(packagePlan);
        contract.setSignDate(LocalDateTime.now().minusDays(30));
        contract.setStartDate(LocalDateTime.now().minusDays(30));
        contract.setEndDate(LocalDateTime.now().plusDays(335));
        contract.setRentAmountSnapshot(BigDecimal.valueOf(5000.0));  // Correct way to set the BigDecimal


        // Setup Invoice
        invoice = new Invoice();
        invoice.setId(1L);
        invoice.setContact(contract);
        invoice.setCreateDate(LocalDateTime.now());
        invoice.setDueDate(LocalDateTime.now().plusDays(30));
        invoice.setInvoiceStatus(0);
        invoice.setSubTotal(6000);
        invoice.setPenaltyTotal(0);
        invoice.setNetAmount(6000);
    }

    // ===== Test getAllInvoices =====
    @Test
    void testGetAllInvoices() {
        // Arrange
        when(invoiceRepository.findAll()).thenReturn(Arrays.asList(invoice));

        // Act
        List<InvoiceDto> result = invoiceService.getAllInvoices();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals("John", result.get(0).getFirstName());
        verify(invoiceRepository, times(1)).findAll();
    }

    // ===== Test getInvoiceById =====
    @Test
    void testGetInvoiceById_Found() {
        // Arrange
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        // Act
        Optional<InvoiceDto> result = invoiceService.getInvoiceById(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
        assertEquals(6000, result.get().getNetAmount());
        verify(invoiceRepository, times(1)).findById(1L);
    }

    @Test
    void testGetInvoiceById_NotFound() {
        // Arrange
        when(invoiceRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        Optional<InvoiceDto> result = invoiceService.getInvoiceById(999L);

        // Assert
        assertFalse(result.isPresent());
        verify(invoiceRepository, times(1)).findById(999L);
    }

    // ===== Test createInvoice =====
    @Test
    void testCreateInvoice_WithMinimalData() {
        // Arrange
        CreateInvoiceRequest request = CreateInvoiceRequest.builder()
                .contractId(1L)
                .build();

        when(contractRepository.findById(1L)).thenReturn(Optional.of(contract));
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(invoice);

        // Act
        InvoiceDto result = invoiceService.createInvoice(request);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(contractRepository, times(1)).findById(1L);
        verify(invoiceRepository, times(1)).save(any(Invoice.class));
    }

    @Test
    void testCreateInvoice_WithFullData() {
        // Arrange
        LocalDateTime dueDate = LocalDateTime.now().plusDays(15);
        CreateInvoiceRequest request = CreateInvoiceRequest.builder()
                .contractId(1L)
                .createDate("2025-01-01")
                .dueDate(dueDate)
                .rentAmount(5000)
                .waterUnit(10)
                .waterRate(30)
                .electricityUnit(100)
                .electricityRate(8)
                .penaltyTotal(200)
                .invoiceStatus(0)
                .build();

        when(contractRepository.findById(1L)).thenReturn(Optional.of(contract));
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(invoice);

        // Act
        InvoiceDto result = invoiceService.createInvoice(request);

        // Assert
        assertNotNull(result);
        verify(contractRepository, times(1)).findById(1L);
        verify(invoiceRepository, times(1)).save(any(Invoice.class));
    }

    @Test
    void testCreateInvoice_WithoutContractId_ThrowsException() {
        // Arrange
        CreateInvoiceRequest request = CreateInvoiceRequest.builder().build();

        // Act & Assert
        assertThrows(RuntimeException.class, () -> invoiceService.createInvoice(request));
    }

    @Test
    void testCreateInvoice_ContractNotFound_ThrowsException() {
        // Arrange
        CreateInvoiceRequest request = CreateInvoiceRequest.builder()
                .contractId(999L)
                .build();

        when(contractRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> invoiceService.createInvoice(request));
        assertTrue(exception.getMessage().contains("Contract not found"));
    }

    // ===== Test updateInvoice =====
    @Test
    void testUpdateInvoice_UpdateDueDate() {
        // Arrange
        LocalDateTime newDueDate = LocalDateTime.now().plusDays(45);
        UpdateInvoiceRequest request = UpdateInvoiceRequest.builder()
                .dueDate(newDueDate)
                .build();

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        InvoiceDto result = invoiceService.updateInvoice(1L, request);

        // Assert
        assertNotNull(result);
        verify(invoiceRepository, times(1)).findById(1L);
        verify(invoiceRepository, times(1)).save(any(Invoice.class));
    }

    @Test
    void testUpdateInvoice_MarkAsPaid() {
        // Arrange
        UpdateInvoiceRequest request = UpdateInvoiceRequest.builder()
                .invoiceStatus(1)
                .build();

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> {
            Invoice inv = (Invoice) i.getArguments()[0];
            inv.setInvoiceStatus(1);
            return inv;
        });

        // Act
        InvoiceDto result = invoiceService.updateInvoice(1L, request);

        // Assert
        assertNotNull(result);
        verify(invoiceRepository, times(1)).save(any(Invoice.class));
    }

    @Test
    void testUpdateInvoice_UpdateAmounts() {
        // Arrange
        UpdateInvoiceRequest request = UpdateInvoiceRequest.builder()
                .subTotal(7000)
                .penaltyTotal(500)
                .netAmount(7500)
                .build();

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> {
            Invoice inv = (Invoice) i.getArguments()[0];
            inv.setSubTotal(7000);
            inv.setPenaltyTotal(500);
            inv.setNetAmount(7500);
            return inv;
        });

        // Act
        InvoiceDto result = invoiceService.updateInvoice(1L, request);

        // Assert
        assertNotNull(result);
        verify(invoiceRepository, times(1)).save(any(Invoice.class));
    }

    @Test
    void testUpdateInvoice_AutoCalculateNetAmount() {
        // Arrange
        UpdateInvoiceRequest request = UpdateInvoiceRequest.builder()
                .subTotal(6000)
                .penaltyTotal(300)
                .build();

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        InvoiceDto result = invoiceService.updateInvoice(1L, request);

        // Assert
        assertNotNull(result);
        verify(invoiceRepository, times(1)).save(any(Invoice.class));
    }

    @Test
    void testUpdateInvoice_NotFound_ThrowsException() {
        // Arrange
        UpdateInvoiceRequest request = UpdateInvoiceRequest.builder()
                .invoiceStatus(1)
                .build();

        when(invoiceRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> invoiceService.updateInvoice(999L, request));
    }

    // ===== Test deleteInvoice =====
    @Test
    void testDeleteInvoice_Success() {
        // Arrange
        when(invoiceRepository.existsById(1L)).thenReturn(true);
        doNothing().when(invoiceRepository).deleteById(1L);

        // Act
        invoiceService.deleteInvoice(1L);

        // Assert
        verify(invoiceRepository, times(1)).existsById(1L);
        verify(invoiceRepository, times(1)).deleteById(1L);
    }

    @Test
    void testDeleteInvoice_NotExists() {
        // Arrange
        when(invoiceRepository.existsById(999L)).thenReturn(false);

        // Act
        invoiceService.deleteInvoice(999L);

        // Assert
        verify(invoiceRepository, times(1)).existsById(999L);
        verify(invoiceRepository, never()).deleteById(any());
    }

    // ===== Test unimplemented methods (return empty list) =====
    @Test
    void testSearchInvoices_ReturnsEmptyList() {
        List<InvoiceDto> result = invoiceService.searchInvoices("test");
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetInvoicesByContractId_ReturnsEmptyList() {
        List<InvoiceDto> result = invoiceService.getInvoicesByContractId(1L);
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetInvoicesByRoomId_ReturnsEmptyList() {
        List<InvoiceDto> result = invoiceService.getInvoicesByRoomId(1L);
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetInvoicesByTenantId_ReturnsEmptyList() {
        List<InvoiceDto> result = invoiceService.getInvoicesByTenantId(1L);
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetInvoicesByStatus_ReturnsEmptyList() {
        List<InvoiceDto> result = invoiceService.getInvoicesByStatus(0);
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetUnpaidInvoices_ReturnsEmptyList() {
        List<InvoiceDto> result = invoiceService.getUnpaidInvoices();
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetPaidInvoices_ReturnsEmptyList() {
        List<InvoiceDto> result = invoiceService.getPaidInvoices();
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetOverdueInvoices_ReturnsEmptyList() {
        List<InvoiceDto> result = invoiceService.getOverdueInvoices();
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetInvoicesByDateRange_ReturnsEmptyList() {
        LocalDateTime start = LocalDateTime.now().minusDays(30);
        LocalDateTime end = LocalDateTime.now();
        List<InvoiceDto> result = invoiceService.getInvoicesByDateRange(start, end);
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetInvoicesByNetAmountRange_ReturnsEmptyList() {
        List<InvoiceDto> result = invoiceService.getInvoicesByNetAmountRange(1000, 5000);
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ===== Test unimplemented payment operations (throw exception) =====
    @Test
    void testMarkAsPaid_ThrowsException() {
        assertThrows(UnsupportedOperationException.class,
                () -> invoiceService.markAsPaid(1L));
    }

    @Test
    void testCancelInvoice_ThrowsException() {
        assertThrows(UnsupportedOperationException.class,
                () -> invoiceService.cancelInvoice(1L));
    }

    @Test
    void testAddPenalty_ThrowsException() {
        assertThrows(UnsupportedOperationException.class,
                () -> invoiceService.addPenalty(1L, 500));
    }

    // ===== Test convertToDto functionality =====
    @Test
    void testConvertToDto_WithCompleteData() {
        // Arrange
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        // Act
        Optional<InvoiceDto> result = invoiceService.getInvoiceById(1L);

        // Assert
        assertTrue(result.isPresent());
        InvoiceDto dto = result.get();

        // Test basic invoice data
        assertEquals(1L, dto.getId());
        assertEquals(1L, dto.getContractId());
        assertEquals(6000, dto.getNetAmount());
        assertEquals(0, dto.getInvoiceStatus());

        // Test tenant data
        assertEquals("John", dto.getFirstName());
        assertEquals("Doe", dto.getLastName());
        assertEquals("1234567890123", dto.getNationalId());
        assertEquals("0812345678", dto.getPhoneNumber());
        assertEquals("john@example.com", dto.getEmail());

        // Test room data
        assertEquals(1, dto.getFloor());
        assertEquals("101", dto.getRoom());
        assertEquals(5000, dto.getRent());

        // Test package data
        assertEquals("Monthly", dto.getPackageName());
    }

    @Test
    void testConvertToDto_WithNullTenant() {
        // Arrange
        contract.setTenant(null);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        // Act
        Optional<InvoiceDto> result = invoiceService.getInvoiceById(1L);

        // Assert
        assertTrue(result.isPresent());
        InvoiceDto dto = result.get();
        assertEquals("N/A", dto.getFirstName());
        assertEquals("", dto.getLastName());
    }

    @Test
    void testConvertToDto_WithNullRoom() {
        // Arrange
        contract.setRoom(null);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        // Act
        Optional<InvoiceDto> result = invoiceService.getInvoiceById(1L);

        // Assert
        assertTrue(result.isPresent());
        InvoiceDto dto = result.get();
        assertNull(dto.getFloor());
        assertEquals("N/A", dto.getRoom());
    }

    @Test
    void testConvertToDto_WithNullContract() {
        // Arrange
        invoice.setContact(null);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        // Act
        Optional<InvoiceDto> result = invoiceService.getInvoiceById(1L);

        // Assert
        assertTrue(result.isPresent());
        InvoiceDto dto = result.get();
        assertNull(dto.getContractId());
        assertEquals("N/A", dto.getFirstName());
    }
}
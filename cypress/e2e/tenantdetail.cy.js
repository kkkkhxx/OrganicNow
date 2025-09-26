// cypress/e2e/tenant-detail.cy.js

describe('E2E Test for Tenant Detail', () => {

    const mockTenantData = {
        contractId: 1,
        tenantId: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '0812345678',
        nationalId: '1234567890123',
        room: '101',
        floor: 1,
        packageName: '3 เดือน',
        packageId: 1,
        signDate: '2024-01-01T00:00:00',
        startDate: '2024-01-01T00:00:00',
        endDate: '2024-04-01T23:59:59',
        deposit: 5000,
        rentAmountSnapshot: 5000,
        invoices: [
            {
                invoiceId: 'INV001',
                dueDate: '2024-01-05T00:00:00',
                netAmount: 5000,
                invoiceStatus: 1, // Paid
                payDate: '2024-01-03T00:00:00',
                penaltyTotal: 0
            },
            {
                invoiceId: 'INV002',
                dueDate: '2024-02-05T00:00:00',
                netAmount: 5000,
                invoiceStatus: 0, // Unpaid
                payDate: null,
                penaltyTotal: 0
            },
            {
                invoiceId: 'INV003',
                dueDate: '2024-03-05T00:00:00',
                netAmount: 5200,
                invoiceStatus: 2, // Overdue
                payDate: null,
                penaltyTotal: 200
            }
        ]
    };

    beforeEach(() => {
        // Mock API for tenant detail
        cy.intercept('GET', '**/tenant/1', {
            statusCode: 200,
            body: mockTenantData
        }).as('getTenantDetail');

        // Mock API for tenant update
        cy.intercept('PUT', '**/tenant/update/1', {
            statusCode: 200,
            body: { message: 'Tenant updated successfully' }
        }).as('updateTenant');
    });

    // 1. ทดสอบการโหลดหน้า Tenant Detail
    it('should load tenant detail page successfully', () => {
        cy.visit('/tenantdetail/1');
        cy.wait('@getTenantDetail');

        // ตรวจสอบ title และ breadcrumb
        cy.contains('Tenant Management', { timeout: 10000 }).should('be.visible');
        cy.contains('John Doe', { timeout: 10000 }).should('be.visible');

        // ตรวจสอบ Edit button
        cy.get('[data-bs-toggle="modal"][data-bs-target="#exampleModal"]', { timeout: 10000 })
            .should('contain', 'Edit Tenant');
    });

    // 2. ทดสอบการแสดงข้อมูล Tenant Information
    it('should display tenant information correctly', () => {
        cy.visit('/tenantdetail/1');
        cy.wait('@getTenantDetail');

        // ตรวจสอบ Tenant Information card
        cy.contains('Tenant Information', { timeout: 10000 }).should('be.visible');

        // ตรวจสอบข้อมูลต่างๆ
        cy.contains('First Name:', { timeout: 10000 }).should('be.visible');
        cy.contains('John').should('be.visible');
        cy.contains('Last Name:').should('be.visible');
        cy.contains('Doe').should('be.visible');
        cy.contains('National ID:').should('be.visible');
        cy.contains('1234567890123').should('be.visible');
        cy.contains('Phone Number:').should('be.visible');
        cy.contains('0812345678').should('be.visible');
        cy.contains('Email:').should('be.visible');
        cy.contains('john@example.com').should('be.visible');
        cy.contains('Package:').should('be.visible');
        cy.contains('3 เดือน').should('be.visible');
    });

    // 3. ทดสอบการแสดงข้อมูล Room Information
    it('should display room information correctly', () => {
        cy.visit('/tenantdetail/1');
        cy.wait('@getTenantDetail');

        // ตรวจสอบ Room Information card
        cy.contains('Room Information', { timeout: 10000 }).should('be.visible');

        // ตรวจสอบข้อมูลห้อง
        cy.contains('Floor:', { timeout: 10000 }).should('be.visible');
        cy.contains('Room:').should('be.visible');
        cy.contains('101').should('be.visible');
    });

    // 4. ทดสอบการแสดง Payment History
    it('should display payment history correctly', () => {
        cy.visit('/tenantdetail/1');
        cy.wait('@getTenantDetail');

        // ตรวจสอบ Payment History tab
        cy.contains('Payment History', { timeout: 10000 }).should('be.visible');

        // ตรวจสอบว่ามี invoice cards
        cy.get('.status-card', { timeout: 10000 }).should('have.length', 3);

        // ตรวจสอบข้อมูลใน invoice แรก (Paid)
        cy.contains('INV001', { timeout: 10000 }).should('be.visible');
        cy.contains('5000 Baht').should('be.visible');
        cy.contains('Paid').should('be.visible');

        // ตรวจสอบข้อมูลใน invoice ที่สอง (Unpaid)
        cy.contains('INV002').should('be.visible');
        cy.contains('Unpaid').should('be.visible');

        // ตรวจสอบข้อมูลใน invoice ที่สาม (Overdue with penalty)
        cy.contains('INV003').should('be.visible');
        cy.contains('Overdue').should('be.visible');
        cy.contains('200').should('be.visible'); // penalty
    });

    // 5. ทดสอบการ navigate กลับไปหน้า Tenant Management
    it('should navigate back to tenant management when clicking breadcrumb', () => {
        cy.visit('/tenantdetail/1');
        cy.wait('@getTenantDetail');

        // คลิกที่ breadcrumb
        cy.get('.breadcrumb-link', { timeout: 10000 }).click();

        // ตรวจสอบว่า URL เปลี่ยนไป
        cy.url().should('include', '/tenantmanagement');
    });

    // 6. ทดสอบการแสดงวันที่
    it('should display dates in correct format', () => {
        cy.visit('/tenantdetail/1');
        cy.wait('@getTenantDetail');

        // ตรวจสอบรูปแบบวันที่
        cy.contains('2024-01-01', { timeout: 10000 }).should('be.visible'); // Sign Date
        cy.contains('2024-04-01').should('be.visible'); // End Date
    });

    // 7. ทดสอบ การ handle error เมื่อไม่พบ tenant
    it('should handle tenant not found error', () => {
        // Mock API to return 404
        cy.intercept('GET', '**/tenant/999', {
            statusCode: 404,
            body: { error: 'Tenant not found' }
        }).as('getTenantNotFound');

        cy.visit('/tenantdetail/999');
        cy.wait('@getTenantNotFound');

        // ตรวจสอบว่า redirect ไปหน้า tenant management
        cy.url({ timeout: 10000 }).should('include', '/tenantmanagement');
    });

    // 8. ทดสอบการแสดง empty state เมื่อไม่มี invoices
    it('should display no invoices message when tenant has no payment history', () => {
        // Mock tenant without invoices
        const tenantWithoutInvoices = {
            ...mockTenantData,
            invoices: []
        };

        cy.intercept('GET', '**/tenant/2', {
            statusCode: 200,
            body: tenantWithoutInvoices
        }).as('getTenantNoInvoices');

        cy.visit('/tenantdetail/2');
        cy.wait('@getTenantNoInvoices');

        // ตรวจสอบข้อความที่แสดงเมื่อไม่มี invoices
        cy.contains('No invoices found', { timeout: 10000 }).should('be.visible');
    });



    // 10. ทดสอบการแสดง alert message
    it('should display success message after successful update', () => {
        cy.visit('/tenantdetail/1');
        cy.wait('@getTenantDetail');

        // เปิด edit modal และแก้ไขข้อมูล
        cy.get('[data-bs-toggle="modal"][data-bs-target="#exampleModal"]', { timeout: 10000 }).click();
        cy.get('input[type="text"]', { timeout: 10000 }).first().clear().type('Updated Name');

        // Submit form
        cy.get('button[type="submit"]').click();

        cy.wait('@updateTenant');

        // ตรวจสอบ success alert
        cy.get('.custom-alert-overlay', { timeout: 10000 }).should('be.visible');
        cy.contains('Success').should('be.visible');
        cy.contains('อัปเดตข้อมูลสำเร็จ').should('be.visible');
    });

    // 11. ทดสอบ tabs navigation
    it('should navigate between tabs correctly', () => {
        cy.visit('/tenantdetail/1');
        cy.wait('@getTenantDetail');

        // ตรวจสอบ Payment History tab เป็น active
        cy.get('#payment-tab', { timeout: 10000 }).should('have.class', 'active');
        cy.get('#payment').should('have.class', 'show active');
    });

    // 12. ทดสอบการแสดงข้อมูลวันที่ในรูปแบบที่ถูกต้อง
    it('should format dates correctly in invoice history', () => {
        cy.visit('/tenantdetail/1');
        cy.wait('@getTenantDetail');

        // ตรวจสอบรูปแบบวันที่ใน invoice
        cy.contains('2024-01-05', { timeout: 10000 }).should('be.visible'); // Due date
        cy.contains('2024-01-03').should('be.visible'); // Pay date
    });

    // 13. ทดสอบการ scroll ใน payment history
    it('should allow scrolling in payment history section', () => {
        cy.visit('/tenantdetail/1');
        cy.wait('@getTenantDetail');

        // ตรวจสอบว่า payment history section มี overflow-auto
        cy.get('.tab-content', { timeout: 10000 }).should('have.css', 'overflow', 'auto');
    });

    // 14. ทดสอบการแสดงข้อมูล package badge
    it('should display package badge with correct styling', () => {
        cy.visit('/tenantdetail/1');
        cy.wait('@getTenantDetail');

        // ตรวจสอบ package badge
        cy.get('.package-badge', { timeout: 10000 }).should('be.visible');
        cy.get('.package-badge').should('contain', '3 เดือน');
        cy.get('.package-badge').should('have.class', 'badge');
    });

    // 15. ทดสอบการ handle network error
    it('should handle network errors gracefully', () => {
        // Mock network error
        cy.intercept('GET', '**/tenant/1', {
            statusCode: 500,
            body: { error: 'Internal Server Error' }
        }).as('getTenantError');

        cy.visit('/tenantdetail/1');
        cy.wait('@getTenantError');

        // ตรวจสอบว่า redirect ไปหน้า tenant management
        cy.url({ timeout: 10000 }).should('include', '/tenantmanagement');
    });
});
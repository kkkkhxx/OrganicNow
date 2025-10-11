// cypress/e2e/tenant-management.cy.js

describe('E2E Test for Tenant Management', () => {

    beforeEach(() => {
        // Mock APIs
        cy.intercept('GET', '**/packages', {
            statusCode: 200,
            body: [
                { id: 1, contract_name: '3 เดือน', duration: 3, price: 5000, is_active: 1 },
                { id: 2, contract_name: '6 เดือน', duration: 6, price: 4500, is_active: 1 },
                { id: 3, contract_name: '9 เดือน', duration: 9, price: 4000, is_active: 1 },
                { id: 4, contract_name: '1 ปี', duration: 12, price: 3500, is_active: 1 }
            ]
        }).as('getPackages');

        cy.intercept('GET', '**/rooms', {
            statusCode: 200,
            body: [
                { roomId: 1, roomNumber: '101', roomFloor: 1 },
                { roomId: 2, roomNumber: '102', roomFloor: 1 },
                { roomId: 3, roomNumber: '103', roomFloor: 1 },
                { roomId: 4, roomNumber: '201', roomFloor: 2 },
                { roomId: 5, roomNumber: '202', roomFloor: 2 },
                { roomId: 6, roomNumber: '203', roomFloor: 2 }
            ]
        }).as('getRooms');

        cy.intercept('GET', '**/tenant/list*', {
            statusCode: 200,
            body: {
                results: [
                    {
                        contractId: 1,
                        tenantId: 1,
                        firstName: 'John',
                        lastName: 'Doe',
                        email: 'john@example.com',
                        phoneNumber: '0812345678',
                        nationalId: '1234567890123',
                        room: '101',
                        floor: 1,
                        packageId: 1,
                        contractName: '3 เดือน',
                        startDate: '2024-01-01T00:00:00',
                        endDate: '2024-04-01T23:59:59',
                        status: 1
                    },
                    {
                        contractId: 2,
                        tenantId: 2,
                        firstName: 'Jane',
                        lastName: 'Smith',
                        email: 'jane@example.com',
                        phoneNumber: '0823456789',
                        nationalId: '1234567890124',
                        room: '102',
                        floor: 1,
                        packageId: 2,
                        contractName: '6 เดือน',
                        startDate: '2024-02-01T00:00:00',
                        endDate: '2024-08-01T23:59:59',
                        status: 0
                    }
                ],
                totalRecords: 2
            }
        }).as('getTenantList');

        cy.intercept('GET', '**/contracts/occupied-rooms', {
            statusCode: 200,
            body: [1, 2] // room IDs that are occupied
        }).as('getOccupiedRooms');

        cy.intercept('GET', '**/tenant/*/pdf', {
            statusCode: 200,
            headers: { 'content-type': 'application/pdf' },
            body: 'PDF content mock'
        }).as('downloadPdf');
    });

    // ทดสอบการโหลดหน้า Tenant Management
    it('should load tenant management page successfully', () => {
        cy.visit('/tenantmanagement');
        cy.wait(['@getPackages', '@getRooms', '@getTenantList', '@getOccupiedRooms']);

        // ตรวจสอบ title และ elements หลัก
        cy.contains('Tenant Management', { timeout: 10000 }).should('be.visible');
        cy.get('[data-bs-toggle="modal"][data-bs-target="#exampleModal"]', { timeout: 10000 })
            .should('contain', 'Create Tenant');
    });

    // ทดสอบการแสดงรายการ tenant
    it('should display tenant list correctly', () => {
        cy.visit('/tenantmanagement');
        cy.wait(['@getPackages', '@getRooms', '@getTenantList', '@getOccupiedRooms']);

        // ตรวจสอบ table headers
        cy.get('table thead tr th', { timeout: 10000 }).should('contain', 'First name');
        cy.get('table thead tr th').should('contain', 'Last name');
        cy.get('table thead tr th').should('contain', 'Room');
        cy.get('table thead tr th').should('contain', 'Package');

        // ตรวจสอบข้อมูล tenant
        cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
        cy.contains('John', { timeout: 10000 }).should('be.visible');
        cy.contains('Jane', { timeout: 10000 }).should('be.visible');
    });

    // ทดสอบการค้นหา tenant
    it('should filter tenants by search', () => {
        cy.visit('/tenantmanagement');
        cy.wait(['@getPackages', '@getRooms', '@getTenantList', '@getOccupiedRooms']);

        // ใช้ search box
        cy.get('input[placeholder="Search"]', { timeout: 10000 }).type('John');

        // ตรวจสอบผลลัพธ์
        cy.contains('John', { timeout: 10000 }).should('be.visible');
        cy.contains('Jane').should('not.exist');
    });

    // ทดสอบการ filter
    it('should open filter canvas and apply filters', () => {
        cy.visit('/tenantmanagement');
        cy.wait(['@getPackages', '@getRooms', '@getTenantList', '@getOccupiedRooms']);

        // เปิด filter canvas
        cy.get('[data-bs-target="#tenantFilterCanvas"]', { timeout: 10000 }).click();

        // ตรวจสอบ filter canvas เปิด
        cy.get('#tenantFilterCanvas', { timeout: 10000 }).should('be.visible');

        // ตรวจสอบ filter options
        cy.contains('Package').should('be.visible');
        cy.contains('Floor').should('be.visible');
        cy.contains('Room').should('be.visible');
    });

    // ทดสอบการ sort
    it('should sort tenant list when clicking sort button', () => {
        cy.visit('/tenantmanagement');
        cy.wait(['@getPackages', '@getRooms', '@getTenantList', '@getOccupiedRooms']);

        // คลิก sort button
        cy.contains('Sort', { timeout: 10000 }).click();

        // ตรวจสอบว่า tenant list ยังแสดงอยู่
        cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
    });

    // ทดสอบการ download PDF
    it('should download PDF when clicking PDF button', () => {
        cy.visit('/tenantmanagement');
        cy.wait(['@getPackages', '@getRooms', '@getTenantList', '@getOccupiedRooms']);

        // คลิก PDF button
        cy.get('.bi-file-earmark-pdf-fill', { timeout: 10000 }).first().click();

        // ตรวจสอบว่า API ถูกเรียก
        cy.wait('@downloadPdf');
    });

    // ทดสอบ pagination
    it('should display pagination controls', () => {
        cy.visit('/tenantmanagement');
        cy.wait(['@getPackages', '@getRooms', '@getTenantList', '@getOccupiedRooms']);

        // ตรวจสอบว่ามี pagination component
        cy.get('.pagination', { timeout: 10000 }).should('exist');
    });

    // ทดสอบ responsive design
    it('should display correctly on mobile viewport', () => {
        cy.viewport('iphone-6');
        cy.visit('/tenantmanagement');
        cy.wait(['@getPackages', '@getRooms', '@getTenantList', '@getOccupiedRooms']);

        // ตรวจสอบว่าเนื้อหาหลักยังแสดงได้
        cy.contains('Tenant Management', { timeout: 10000 }).should('be.visible');
        cy.get('table', { timeout: 10000 }).should('be.visible');
    });
});
// cypress/e2e/dashboard.cy.js

describe('E2E Test for Dashboard', () => {

    beforeEach(() => {
        // Mock API response เพื่อให้ test ทำงานได้โดยไม่ต้องพึ่ง backend
        cy.intercept('GET', 'http://localhost:8080/dashboard', {
            statusCode: 200,
            body: {
                rooms: [
                    { roomNumber: '101', status: 0 }, // available
                    { roomNumber: '102', status: 1 }, // unavailable
                    { roomNumber: '103', status: 2 }, // repair
                    { roomNumber: '104', status: 0 },
                    { roomNumber: '105', status: 1 },
                    { roomNumber: '106', status: 0 },
                    { roomNumber: '107', status: 2 },
                    { roomNumber: '108', status: 0 },
                    { roomNumber: '109', status: 1 },
                    { roomNumber: '110', status: 0 },
                    { roomNumber: '111', status: 0 },
                    { roomNumber: '112', status: 1 },
                    { roomNumber: '201', status: 0 },
                    { roomNumber: '202', status: 1 },
                    { roomNumber: '203', status: 0 },
                    { roomNumber: '204', status: 2 },
                    { roomNumber: '205', status: 0 },
                    { roomNumber: '206', status: 1 },
                    { roomNumber: '207', status: 0 },
                    { roomNumber: '208', status: 0 },
                    { roomNumber: '209', status: 2 },
                    { roomNumber: '210', status: 1 },
                    { roomNumber: '211', status: 0 },
                    { roomNumber: '212', status: 0 }
                ],
                maintains: [
                    { month: 'Jan 2024', total: 15 },
                    { month: 'Feb 2024', total: 22 },
                    { month: 'Mar 2024', total: 18 },
                    { month: 'Apr 2024', total: 25 },
                    { month: 'May 2024', total: 30 },
                    { month: 'Jun 2024', total: 20 }
                ],
                finances: [
                    { month: 'Jan 2024', onTime: 80, penalty: 15, overdue: 5 },
                    { month: 'Feb 2024', onTime: 85, penalty: 10, overdue: 5 },
                    { month: 'Mar 2024', onTime: 90, penalty: 8, overdue: 2 },
                    { month: 'Apr 2024', onTime: 75, penalty: 20, overdue: 5 },
                    { month: 'May 2024', onTime: 88, penalty: 10, overdue: 2 },
                    { month: 'Jun 2024', onTime: 92, penalty: 6, overdue: 2 }
                ]
            }
        }).as('getDashboard');
    });

    // ทดสอบหน้า Dashboard
    it('should load the dashboard page and display room overview', () => {
        cy.visit('/');
        cy.wait('@getDashboard'); // รอให้ API call เสร็จ

        // ตรวจสอบว่าหน้า Dashboard โหลดสำเร็จ
        cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');

        // ตรวจสอบการแสดงข้อมูลห้อง
        cy.contains('Room Overview', { timeout: 10000 }).should('be.visible');

        // ตรวจสอบ legend ของสถานะห้อง
        cy.contains('Available', { timeout: 10000 }).should('be.visible');
        cy.contains('Unavailable', { timeout: 10000 }).should('be.visible');
        cy.contains('Repair', { timeout: 10000 }).should('be.visible');
    });

    // ทดสอบการแสดงผลห้องในแต่ละชั้น
    it('should display rooms on Floor 1 and Floor 2', () => {
        cy.visit('/');
        cy.wait('@getDashboard');

        // ตรวจสอบว่ามี Floor 1 และ Floor 2
        cy.contains('Floor 1', { timeout: 10000 }).should('be.visible');
        cy.contains('Floor 2', { timeout: 10000 }).should('be.visible');

        // ตรวจสอบว่ามีห้องแสดงผล (ตัวอย่าง room 101, 201)
        cy.contains('101', { timeout: 10000 }).should('be.visible');
        cy.contains('201', { timeout: 10000 }).should('be.visible');
    });

    // ทดสอบกราฟ Maintain Requests
    it('should display maintain requests line chart correctly', () => {
        cy.visit('/');
        cy.wait('@getDashboard');

        // ตรวจสอบ title ของกราฟ
        cy.contains('Request Overview (Last 12 months)', { timeout: 10000 }).should('be.visible');

        // ตรวจสอบว่ามี canvas สำหรับแสดงกราฟ
        cy.get('canvas', { timeout: 10000 }).should('exist').and('be.visible');
    });

    // ทดสอบกราฟ Finance History
    it('should display finance history bar chart correctly', () => {
        cy.visit('/');
        cy.wait('@getDashboard');

        // ตรวจสอบ title ของกราฟ Finance
        cy.contains('Finance History (Last 12 months)', { timeout: 10000 }).should('be.visible');

        // ตรวจสอบว่ามี canvas สำหรับแสดงกราฟ (อาจมีหลาย canvas)
        cy.get('canvas', { timeout: 10000 }).should('have.length.at.least', 1);
    });

    // ทดสอบการแสดงผล Summary
    it('should display room status summary correctly', () => {
        cy.visit('/');
        cy.wait('@getDashboard');

        // ตรวจสอบ Summary section
        cy.contains('Summary', { timeout: 10000 }).should('be.visible');

        // ตรวจสอบว่ามีการแสดง summary ของแต่ละสถานะ
        cy.get('.list-unstyled', { timeout: 10000 }).should('be.visible');

        // ตรวจสอบว่ามีการแสดงจำนวนห้องแต่ละประเภท
        cy.get('.text-success', { timeout: 10000 }).should('exist'); // Available count
        cy.get('.text-danger', { timeout: 10000 }).should('exist');  // Unavailable count
        cy.get('.text-warning', { timeout: 10000 }).should('exist'); // Repair count
    });

    // ทดสอบการทำงานของ responsive design
    it('should display correctly on mobile viewport', () => {
        cy.viewport('iphone-6');
        cy.visit('/');
        cy.wait('@getDashboard');

        // ตรวจสอบว่าเนื้อหาหลักยังแสดงได้
        cy.contains('Room Overview', { timeout: 10000 }).should('be.visible');
        cy.contains('Summary', { timeout: 10000 }).should('be.visible');
    });

    // ทดสอบการ handle error กรณี API fail
    it('should handle API failure gracefully', () => {
        // Override intercept เพื่อส่ง error response
        cy.intercept('GET', 'http://localhost:8080/dashboard', {
            statusCode: 500,
            body: { error: 'Server Error' }
        }).as('getDashboardError');

        cy.visit('/');
        cy.wait('@getDashboardError');

        // ตรวจสอบว่าหน้ายังคงแสดงได้ (แม้จะไม่มีข้อมูล)
        cy.contains('Room Overview', { timeout: 10000 }).should('be.visible');
        cy.contains('Summary', { timeout: 10000 }).should('be.visible');
    });
});
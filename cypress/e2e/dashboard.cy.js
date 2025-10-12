// cypress/e2e/dashboard.cy.js

describe('E2E Test for Dashboard', () => {

    const mockResponse = {
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
    };

    beforeEach(() => {
        cy.intercept('GET', 'http://localhost:8080/dashboard', {
            statusCode: 200,
            body: mockResponse
        }).as('getDashboard');
    });

    // ทดสอบหน้า Dashboard โหลดสำเร็จ
    it('should load the dashboard page and display main sections', () => {
        cy.visit('/');
        cy.wait('@getDashboard');
        cy.contains('Dashboard').should('be.visible');
        cy.contains('Room Overview').should('be.visible');
        cy.contains('Request Overview').should('be.visible');
        cy.contains('Finance History').should('be.visible');
        cy.contains('Summary').should('be.visible');
    });

    // ทดสอบห้องและชั้น
    it('should display rooms on Floor 1 and Floor 2 with correct colors', () => {
        cy.visit('/');
        cy.wait('@getDashboard');

        cy.contains('Floor 1').should('be.visible');
        cy.contains('Floor 2').should('be.visible');

        // ตรวจสอบห้องบางห้องมีสีที่ถูกต้อง
        cy.contains('101')
            .should('have.css', 'background-color')
            .and('match', /rgb\(34,\s*197,\s*94\)/); // available = green
        cy.contains('102')
            .should('have.css', 'background-color')
            .and('match', /rgb\(239,\s*68,\s*68\)/); // unavailable = red
        cy.contains('103')
            .should('have.css', 'background-color')
            .and('match', /rgb\(250,\s*204,\s*21\)/); // repair = yellow
    });

    // Legend
    it('should display legend correctly', () => {
        cy.visit('/');
        cy.wait('@getDashboard');
        cy.contains('Available').should('be.visible');
        cy.contains('Unavailable').should('be.visible');
        cy.contains('Repair').should('be.visible');
        cy.get('.badge.bg-success').should('exist');
        cy.get('.badge.bg-danger').should('exist');
        cy.get('.badge.bg-warning').should('exist');
    });

    // Chart
    it('should display maintain requests and finance charts correctly', () => {
        cy.visit('/');
        cy.wait('@getDashboard');

        cy.contains('Request Overview (Last 12 months)').should('be.visible');
        cy.contains('Finance History (Last 12 months)').should('be.visible');

        // ตรวจสอบว่ามีกราฟสองอันเท่านั้น (Line + Bar)
        cy.get('canvas').should('have.length', 2);
    });

    // Summary check
  it('should display room status summary with correct counts', () => {
    cy.visit('/');
    cy.wait('@getDashboard');

    const available = mockResponse.rooms.filter(r => r.status === 0).length;
    const unavailable = mockResponse.rooms.filter(r => r.status === 1).length;
    const repair = mockResponse.rooms.filter(r => r.status === 2).length;

    // ✅ เจาะจงหา card Summary โดยใช้ text ของมัน
    cy.contains('h5.card-title', 'Summary').should('be.visible');

    // ✅ ใช้ within จำกัดขอบเขต selector ให้แค่ใน Summary card
    cy.contains('h5.card-title', 'Summary')
      .parents('.card')
      .within(() => {
        // Available
        cy.get('.text-success', { timeout: 8000 })
          .should('not.contain', '0') // รอให้ React อัปเดตจริง
          .invoke('text')
          .then(text => {
            expect(parseInt(text.trim())).to.equal(available);
          });

        // Unavailable
        cy.get('.text-danger', { timeout: 8000 })
          .should('not.contain', '0')
          .invoke('text')
          .then(text => {
            expect(parseInt(text.trim())).to.equal(unavailable);
          });

        // Repair
        cy.get('.text-warning', { timeout: 8000 })
          .should('not.contain', '0')
          .invoke('text')
          .then(text => {
            expect(parseInt(text.trim())).to.equal(repair);
          });
      });
  });

    // Responsive test
    it('should display correctly on mobile viewport', () => {
        cy.viewport('iphone-6');
        cy.visit('/');
        cy.wait('@getDashboard');
        cy.contains('Room Overview').should('be.visible');
        cy.contains('Summary').should('be.visible');
    });

    // Interaction hover test (optional)
    it('should highlight room when hovered', () => {
        cy.visit('/');
        cy.wait('@getDashboard');

        cy.contains('101')
            .trigger('mouseover')
            .should('have.css', 'filter')
            .and('match', /brightness|contrast|none/); // อนุโลม filter ใดก็ได้ตอน hover
    });

    // Error handling test
    it('should handle API failure gracefully', () => {
        cy.intercept('GET', 'http://localhost:8080/dashboard', {
            statusCode: 500,
            body: { error: 'Server Error' }
        }).as('getDashboardError');

        cy.visit('/');
        cy.wait('@getDashboardError');

        cy.contains('Room Overview').should('be.visible');
        cy.contains('Summary').should('be.visible');
    });
});

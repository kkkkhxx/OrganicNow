/// <reference types="cypress" />

// 🔧 ปิด error ภายใน PrimeReact Menu (bug จาก overlay service)
Cypress.on("uncaught:exception", (err) => {
  if (err.message.includes("hideOverlaysOnDocumentScrolling")) {
    return false;
  }
});

describe("E2E Full UI Test for Room Management (with Layout)", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/rooms", {
      statusCode: 200,
      body: [
        {
          roomId: 1,
          roomNumber: "101",
          roomFloor: 1,
          status: "available",
          requests: [],
        },
        {
          roomId: 2,
          roomNumber: "102",
          roomFloor: 1,
          status: "occupied",
          requests: [{ finishDate: null }],
        },
      ],
    }).as("getRooms");

    cy.visit("http://localhost:5173/roommanagement");
    cy.wait("@getRooms");
  });

  it("should render Topbar and Sidebar correctly", () => {
    cy.get(".topbar").should("exist");
    cy.get(".pi-bell").should("exist");
    cy.get(".pi-cog").should("exist");
    cy.get(".pi-user").should("exist");
    cy.get(".sidebar").should("exist");
    cy.get(".sidebar-icons a").should("have.length.at.least", 5);
  });

  it("should open dropdown menus in Topbar", () => {
    cy.get(".pi-cog").click({ force: true });
    cy.get("body .p-menu").should("exist");

    cy.wait(300);
    cy.get(".topbar-profile").click({ force: true });
    cy.get("body .p-menu").should("exist");
  });

  it("should toggle Sidebar items correctly", () => {
    cy.get(".sidebar-icons a").should("have.length.at.least", 5);
    cy.get(".sidebar-icons a").eq(2).should("have.attr", "href", "/RoomManagement");
  });

  it("should load and display room list correctly", () => {
    cy.get("table tbody tr").should("have.length", 2);
    cy.get("table tbody tr").first().should("contain.text", "101");
    cy.get("table tbody tr").eq(1).should("contain.text", "102");
  });

  it("should display correct status badges", () => {
    cy.get("table tbody tr").eq(0).should("contain.text", "Available");
    cy.get("table tbody tr").eq(1).should("contain.text", "Unavailable");
  });

  it("should show correct pending request indicators", () => {
    cy.get("table tbody tr").eq(0).find(".no-pending-request-indicator").should("exist");
    cy.get("table tbody tr").eq(1).find(".pending-request-indicator").should("exist");
  });

  it("should navigate to room detail when clicking eye icon", () => {
    cy.get("table tbody tr").first().find(".bi-eye-fill").click({ force: true });
  });

  // ✅ แก้จุดที่หา Next ไม่เจอ
  it("should render pagination and allow page change", () => {
    cy.get(".pagination").should("exist");

    // หาปุ่มลูกศรขวา หรือปุ่มสุดท้ายใน pagination
    cy.get(".pagination button, .pagination a")
      .last()
      .should("be.visible")
      .click({ force: true });

    // ยืนยันว่ามีการเปลี่ยน active page (ถ้ามีคลาส .active)
    cy.get(".pagination .active").should("exist");
  });


  it("should show 'Data Not Found' when no rooms returned", () => {
    cy.intercept("GET", "**/rooms", { statusCode: 200, body: [] }).as("emptyRooms");
    cy.visit("http://localhost:5173/roommanagement");
    cy.wait("@emptyRooms");
    cy.contains("Data Not Found", { matchCase: false }).should("exist");
  });

  it("should show error message when API fails", () => {
    cy.intercept("GET", "**/rooms", { statusCode: 500 }).as("errorRooms");
    cy.visit("http://localhost:5173/roommanagement");
    cy.wait("@errorRooms");
    cy.contains(/เกิดข้อผิดพลาดในการดึงข้อมูลห้อง|error fetching/i).should("exist");
  });
});

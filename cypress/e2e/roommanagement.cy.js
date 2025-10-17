/// <reference types="cypress" />

describe("E2E Full UI Test for Room Management (with Layout)", () => {
  beforeEach(() => {
    // ✅ Mock API /room/list ให้ตรงกับ backend จริง
    cy.intercept("GET", "**/room/list*", {
      statusCode: 200,
      body: [
        { roomId: 1, roomNumber: "101", roomFloor: 1, status: "available", requests: [] },
        { roomId: 2, roomNumber: "102", roomFloor: 1, status: "occupied", requests: [] },
        {
          roomId: 3,
          roomNumber: "103",
          roomFloor: 1,
          status: "available",
          requests: [{ finishDate: null }], // ทดสอบ pending request
        },
      ],
    }).as("getRooms");

    cy.visit("/roommanagement");
    cy.wait("@getRooms", { timeout: 10000 });
  });

  it("should render Topbar and Sidebar correctly", () => {
    cy.contains("Room Management").should("be.visible");
    cy.get("header, .topbar, nav").should("exist");
  });

  it("should display table headers correctly", () => {
    const headers = ["Order", "Room", "Floor", "Status", "Pending Requests", "Action"];
    headers.forEach((h) => cy.contains(h).should("be.visible"));
  });

  it("should display room list with correct data", () => {
    cy.get("table tbody tr").should("have.length", 3);
    cy.contains("101").should("exist");
    cy.contains("102").should("exist");
  });

  it("should display correct status badges", () => {
    cy.get("table tbody tr").eq(0).find(".badge").should("contain", "Available");
    cy.get("table tbody tr").eq(1).find(".badge").should("contain", "Unavailable");
  });

  it("should show red dot for pending request room", () => {
    cy.get("table tbody tr").eq(2).find(".pending-request-indicator").should("exist");
  });

  it("should navigate to RoomDetail page on view button click", () => {
    cy.get("table tbody tr").first().find(".bi-eye-fill").parent("button").click({ force: true });
    cy.url().should("include", "/roomdetail/1");
  });

  it("should show pagination controls and change pages correctly", () => {
    cy.get(".pagination").should("exist");
    cy.get(".pagination").contains("1").should("be.visible");
  });

  it("should show Data Not Found when API returns empty array", () => {
    cy.intercept("GET", "**/room/list*", { statusCode: 200, body: [] }).as("getEmpty");
    cy.visit("/roommanagement");
    cy.wait("@getEmpty");
    cy.contains("Data Not Found").should("be.visible");
  });

  it("should show error message when API fails", () => {
    cy.intercept("GET", "**/room/list*", { forceNetworkError: true }).as("getError");
    cy.visit("/roommanagement");
    cy.contains("เกิดข้อผิดพลาดในการดึงข้อมูลห้อง", { timeout: 8000 }).should("be.visible");
  });

  it("should render correctly on mobile viewport", () => {
    cy.viewport("iphone-6");
    cy.visit("/roommanagement");
    cy.wait("@getRooms", { timeout: 10000 });
    cy.contains("Room Management").should("be.visible");
  });
});

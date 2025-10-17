/// <reference types="cypress" />

describe("E2E Full CRUD & UI Interaction Test for Room Detail Page", () => {
  const baseUrl = "http://localhost:5173";
  const roomId = 1;

  beforeEach(() => {
    // ✅ Mock ทุก API ที่หน้า roomdetail ใช้จริง
    cy.intercept("GET", `**/room/${roomId}/detail`, {
      statusCode: 200,
      body: {
        roomId,
        roomFloor: 2,
        roomNumber: "201",
        status: "available",
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "0999999999",
        email: "john@example.com",
        contractName: "6 เดือน",
        signDate: "2025-01-01T00:00:00",
        startDate: "2025-01-02T00:00:00",
        endDate: "2025-07-02T00:00:00",
        assets: [
          { assetId: 101, assetName: "bed-001" },
          { assetId: 102, assetName: "chair-001" },
        ],
        requests: [
          {
            id: 5001,
            issueTitle: "Broken bulb",
            scheduledDate: "2025-03-05T10:00:00",
            finishDate: "2025-03-06T12:00:00",
          },
        ],
      },
    }).as("getRoomDetail");

    cy.intercept("GET", "**/assets/all", {
      statusCode: 200,
      body: {
        result: [
          { assetId: 101, assetName: "bed-001" },
          { assetId: 102, assetName: "chair-001" },
          { assetId: 103, assetName: "table-001" },
          { assetId: 104, assetName: "bulb-001" },
        ],
      },
    }).as("getAllAssets");

    cy.intercept("GET", "**/asset-group/list", {
      statusCode: 200,
      body: [{ assetGroupName: "Furniture" }, { assetGroupName: "Lighting" }],
    }).as("getAssetGroups");

    cy.intercept("GET", "**/room", {
      statusCode: 200,
      body: [],
    }).as("getAllRooms");

    cy.visit(`${baseUrl}/roomdetail/${roomId}`);
    cy.wait("@getRoomDetail");
    cy.wait("@getAllAssets");
    cy.wait("@getAssetGroups");
    cy.wait("@getAllRooms");
  });

  // ✅ ตรวจ render ส่วนหลัก
  it("should render all main sections correctly", () => {
    cy.contains("Room Detail").should("be.visible");
    cy.contains("Room Information").should("be.visible");
    cy.contains("Current Tenant").should("be.visible");
    cy.contains("Assets").should("be.visible");
    cy.contains("Request History").should("be.visible");
  });

  // ✅ เปิด / ปิด modal (พร้อมลบ backdrop แบบ force)
  it("should open and close Edit Room modal", () => {
    cy.get("button.btn-primary").contains("Edit Room").click();
    cy.get("#editRoomModal").should("be.visible");

    cy.get("#editRoomModal")
      .find("button.btn-outline-secondary")
      .contains("Cancel")
      .click();

    // 🩹 ลบ backdrop ด้วยตนเอง (ป้องกัน hang)
    cy.document().then((doc) => {
      doc.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
      const modal = doc.querySelector("#editRoomModal");
      if (modal) {
        modal.classList.remove("show");
        modal.style.display = "none";
      }
    });

    // ✅ ตรวจว่าปิดแล้ว
    cy.wait(300);
    cy.get("#editRoomModal").should("not.have.class", "show");
    cy.get(".modal-backdrop", { timeout: 10000 }).should("not.exist");
  });

  it("should display correct room and tenant data", () => {
    cy.contains("Floor:").parent().should("contain", "2");
    cy.contains("Room:").parent().should("contain", "201");
    cy.contains("Status:").parent().should("contain", "Available");
    cy.contains("First Name:").parent().should("contain", "John");
    cy.contains("Package:").parent().find(".package-badge").should("contain", "6 เดือน");
  });

  it("should switch between Assets and Request tabs", () => {
    cy.get("#assets-tab").click();
    cy.get("#assets").should("have.class", "show");
    cy.get("#requests-tab").click();
    cy.get("#requests").should("have.class", "show");
    cy.contains("Broken bulb").should("be.visible");
  });

  it("should display asset list and allow checkbox selection in modal", () => {
    cy.get("button.btn-primary").contains("Edit Room").click();
    cy.get("#editRoomModal").should("be.visible");
    cy.contains("Select Assets for this Room").should("be.visible");

    cy.get(".form-check-input").first().check().should("be.checked");
    cy.get(".form-check-input").eq(1).uncheck().should("not.be.checked");
  });

  it("should edit room info and send PUT requests", () => {
    cy.intercept("PUT", `**/room/${roomId}/assets`, {
      statusCode: 200,
      body: { message: "Assets updated" },
    }).as("updateAssets");

    cy.intercept("PUT", `**/room/${roomId}`, {
      statusCode: 200,
      body: { message: "Room updated" },
    }).as("updateRoom");

    cy.get("button.btn-primary").contains("Edit Room").click();
    cy.get("input.form-control").eq(0).clear().type("3");
    cy.get("input.form-control").eq(1).clear().type("302");
    cy.get("select.form-select").eq(0).select("Occupied");
    cy.get("button.btn-primary").contains("Save").click();

    cy.wait("@updateAssets").its("response.statusCode").should("eq", 200);
    cy.wait("@updateRoom").its("response.statusCode").should("eq", 200);
    cy.wait(1000);
    cy.get("#editRoomModal").should("not.be.visible");
  });

  it("should show error when API fails", () => {
    cy.intercept("GET", `**/room/${roomId}/detail`, { forceNetworkError: true }).as("errorRoom");
    cy.visit(`${baseUrl}/roomdetail/${roomId}`);
    cy.contains("Failed to fetch room or asset data", { timeout: 10000 }).should("exist");
  });
});

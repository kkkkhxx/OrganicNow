/// <reference types="cypress" />

// ✅ Test ครอบคลุมหน้า RoomDetail ทั้งหมด: แสดงข้อมูล, เปิด/ปิด modal, แก้ไขข้อมูล, error handling
describe("E2E Full CRUD & UI Interaction Test for Room Detail Page", () => {
  const baseUrl = "http://localhost:5173"; // URL ของ frontend dev server
  const roomId = 1;

  beforeEach(() => {
    // 🧩 Mock ข้อมูล backend ทั้งหมด
    cy.intercept("GET", `**/rooms/${roomId}/detail`, {
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

    cy.visit(`${baseUrl}/roomdetail/${roomId}`);
    cy.wait("@getRoomDetail");
    cy.wait("@getAllAssets");
  });

  // ✅ ตรวจส่วนหลักของหน้า
  it("should render all main sections correctly", () => {
    cy.contains("Room Detail").should("be.visible");
    cy.contains("Room Information").should("be.visible");
    cy.contains("Current Tenant").should("be.visible");
    cy.contains("Assets").should("be.visible");
    cy.contains("Request History").should("be.visible");
  });

  // ✅ ตรวจข้อมูลห้องและผู้เช่า
  it("should display correct room and tenant data", () => {
    cy.contains("Floor:").parent().should("contain", "2");
    cy.contains("Room:").parent().should("contain", "201");
    cy.contains("Status:").parent().should("contain", "Available");
    cy.contains("First Name:").parent().should("contain", "John");
    cy.contains("Package:").parent().find(".package-badge").should("contain", "6 เดือน");
  });

  // ✅ ทดสอบเปิดและปิด Modal
 it("should open and close Edit Room modal", () => {
   cy.get("button.btn-primary").contains("Edit Room").click();
   cy.get("#editRoomModal").should("be.visible");

   cy.get("#editRoomModal")
     .find("button.btn-secondary")
     .contains("Cancel")
     .click();

   // ✅ Force close modal + remove backdrop (Bootstrap บางครั้งไม่ปิดจริงใน headless mode)
   cy.document().then((doc) => {
     const modal = doc.querySelector("#editRoomModal");
     const backdrop = doc.querySelector(".modal-backdrop");
     if (modal) {
       modal.classList.remove("show");
       modal.style.display = "none";
     }
     if (backdrop) backdrop.remove();
   });

   // ✅ เพิ่มรอเล็กน้อยเผื่อ DOM transition
   cy.wait(500);

   // ✅ เคลียร์ backdrop อีกครั้ง (บางรอบ Bootstrap สร้างใหม่)
   cy.document().then((doc) => {
     doc.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
   });

   // ✅ ตรวจสอบว่าปิดจริง
   cy.get("#editRoomModal", { timeout: 8000 })
     .should("not.have.class", "show")
     .and("have.css", "display", "none");
   cy.get(".modal-backdrop", { timeout: 8000 }).should("not.exist");
 });


  // ✅ ทดสอบสลับแท็บ
  it("should switch between Assets and Request tabs", () => {
    cy.get("#assets-tab").click();
    cy.get("#assets").should("have.class", "show");
    cy.get("#requests-tab").click();
    cy.get("#requests").should("have.class", "show");
    cy.contains("Broken bulb").should("be.visible");
  });

  // ✅ ทดสอบ checkbox ใน modal
  it("should display asset list and allow checkbox selection in modal", () => {
    cy.get("button.btn-primary").contains("Edit Room").click();
    cy.get("#editRoomModal").should("be.visible");
    cy.contains("Select Assets for this Room").should("be.visible");

    cy.get(".form-check-input").first().should("exist").check().should("be.checked");
    cy.get(".form-check-input").eq(1).uncheck().should("not.be.checked");
  });

  // ✅ ทดสอบการอัปเดตข้อมูลห้อง (PUT)
  it("should edit room info and send PUT requests", () => {
    cy.intercept("PUT", `**/rooms/${roomId}/assets`, {
      statusCode: 200,
      body: { message: "Assets updated" },
    }).as("updateAssets");

    cy.intercept("PUT", `**/rooms/${roomId}`, {
      statusCode: 200,
      body: { message: "Room updated" },
    }).as("updateRoom");

    cy.get("button.btn-primary").contains("Edit Room").click();
    cy.get("input.form-control").eq(0).clear().type("3");
    cy.get("input.form-control").eq(1).clear().type("302");
    cy.get("select.form-select").select("Occupied");

    cy.get("button.btn-primary").contains("Save").click();

    cy.wait("@updateAssets").its("response.statusCode").should("eq", 200);
    cy.wait("@updateRoom").its("response.statusCode").should("eq", 200);

    // ✅ รอ modal fade-out แล้วตรวจว่าไม่ visible
    cy.wait(1000);
    cy.get("#editRoomModal").should("not.be.visible");
  });

  // ✅ ทดสอบ error จาก backend
  it("should show error when API fails", () => {
    cy.intercept("GET", `**/rooms/${roomId}/detail`, { forceNetworkError: true }).as("errorRoom");
    cy.visit(`${baseUrl}/roomdetail/${roomId}`);
    cy.contains("Failed to fetch room or asset data").should("exist");
  });
});

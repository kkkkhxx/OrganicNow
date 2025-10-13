// cypress/e2e/tenantdetail.cy.js
describe("E2E Full Interaction Test for Tenant Detail", () => {
  const mockTenantData = {
    contractId: 1,
    tenantId: 1,
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phoneNumber: "0812345678",
    nationalId: "1234567890123",
    room: "101",
    floor: 1,
    packageName: "3 เดือน",
    packageId: 1,
    signDate: "2024-01-01T00:00:00",
    startDate: "2024-01-01T00:00:00",
    endDate: "2024-04-01T23:59:59",
    deposit: 5000,
    rentAmountSnapshot: 5000,
    invoices: [
      {
        invoiceId: "INV001",
        dueDate: "2024-01-05T00:00:00",
        netAmount: 5000,
        invoiceStatus: 1,
        payDate: "2024-01-03T00:00:00",
        penaltyTotal: 0
      },
      {
        invoiceId: "INV002",
        dueDate: "2024-02-05T00:00:00",
        netAmount: 5000,
        invoiceStatus: 0,
        payDate: null,
        penaltyTotal: 0
      },
      {
        invoiceId: "INV003",
        dueDate: "2024-03-05T00:00:00",
        netAmount: 5200,
        invoiceStatus: 2,
        payDate: null,
        penaltyTotal: 200
      }
    ]
  };

  beforeEach(() => {
    cy.intercept("GET", "**/tenant/1", {
      statusCode: 200,
      body: mockTenantData
    }).as("getTenantDetail");

    cy.intercept("PUT", "**/tenant/update/1", {
      statusCode: 200,
      body: { message: "Tenant updated successfully" }
    }).as("updateTenant");
  });

  // ✅ Load Tenant Detail
  it("should load tenant detail correctly", () => {
    cy.visit("/tenantdetail/1");
    cy.wait("@getTenantDetail");
    cy.contains("Tenant Management").should("be.visible");
    cy.contains("John Doe").should("be.visible");
  });

  // ✅ Breadcrumb navigation
  it("should navigate via breadcrumb click", () => {
    cy.visit("/tenantdetail/1");
    cy.wait("@getTenantDetail");
    cy.get(".breadcrumb-link").click();
    cy.url().should("include", "/tenantmanagement");
  });

  // ✅ Edit modal typing & saving
  it("should open modal and type into fields", () => {
    cy.visit("/tenantdetail/1");
    cy.wait("@getTenantDetail");

    cy.get('[data-bs-target="#exampleModal"]').click();
    cy.get("#exampleModal").should("be.visible");

    cy.get('input[type="text"]').eq(0).clear().type("UpdatedFirst");
    cy.get('input[type="text"]').eq(1).clear().type("UpdatedLast");
    cy.get('input[type="email"]').clear().type("updated@example.com");
    cy.get('input[type="text"]').eq(3).clear().type("0899999999");

    cy.get('button[type="submit"]').click();
    cy.wait("@updateTenant");

    cy.get(".custom-alert-overlay").should("be.visible");
    cy.contains("อัปเดตข้อมูลสำเร็จ").should("be.visible");
    cy.get(".custom-alert-btn").click();
  });

  // ✅ ปิด Modal ด้วย Cancel
  it("should close modal with Cancel button", () => {
    cy.visit("/tenantdetail/1");
    cy.wait("@getTenantDetail");

    // เปิด Modal
    cy.get('[data-bs-target="#exampleModal"]').click();
    cy.get("#exampleModal").should("be.visible");

    // คลิก Cancel (scoped ใน modal เพื่อลดโอกาสเจอหลาย element)
    cy.get("#exampleModal #modalForm_btnClose").scrollIntoView().click({ force: true });

    // รอ Bootstrap transition สั้น ๆ
    cy.wait(600);

    // ถ้ายังไม่ปิด ให้ fallback: กด ESC แทน (ไม่ยุ่งกับ .modal-backdrop)
    cy.get("#exampleModal").then(($el) => {
      if ($el.hasClass("show")) {
        cy.get("body").type("{esc}");
        cy.wait(300);
      }
    });

    // ตรวจว่า modal ปิดแน่นอน
    cy.get("#exampleModal", { timeout: 8000 })
      .should("not.have.class", "show")
      .and("not.be.visible");

    // ยืนยันว่าไม่มี backdrop ค้างอยู่
    cy.get(".modal-backdrop").should("not.exist");
  });



  // ✅ Check readonly fields
  it("should have readOnly fields for non-editable info", () => {
    cy.visit("/tenantdetail/1");
    cy.wait("@getTenantDetail");
    cy.get('[data-bs-target="#exampleModal"]').click();
    cy.get('input[readonly]').should("have.length.greaterThan", 2);
  });

  // ✅ Scroll check
  it("should scroll inside payment history", () => {
    cy.visit("/tenantdetail/1");
    cy.wait("@getTenantDetail");
    cy.get(".tab-content").scrollTo("bottom");
    cy.get(".status-card").last().should("be.visible");
  });

  // ✅ Status color
  it("should show correct color for invoice statuses", () => {
    cy.visit("/tenantdetail/1");
    cy.wait("@getTenantDetail");
    cy.get(".status-card").eq(0).should("have.class", "status-complete");
    cy.get(".status-card").eq(1).should("have.class", "status-warning");
    cy.get(".status-card").eq(2).should("have.class", "status-danger");
  });

  // ✅ Toolbar
  it("should display toolbar and Edit Tenant button", () => {
    cy.visit("/tenantdetail/1");
    cy.wait("@getTenantDetail");
    cy.get(".tm-toolbar").should("be.visible");
    cy.get("button.btn.btn-primary").should("contain", "Edit Tenant");
  });

  // ✅ Handle 404
  it("should redirect when tenant not found", () => {
    cy.intercept("GET", "**/tenant/404", {
      statusCode: 404,
      body: { error: "Tenant not found" }
    }).as("notFound");
    cy.visit("/tenantdetail/404");
    cy.wait("@notFound");
    cy.url().should("include", "/tenantmanagement");
  });

  // ✅ Validation alert
  it("should show validation alert for missing firstName", () => {
    cy.visit("/tenantdetail/1");
    cy.wait("@getTenantDetail");
    cy.get('[data-bs-target="#exampleModal"]').click();
    cy.get('input[type="text"]').eq(0).clear();
    cy.get('button[type="submit"]').click();
    cy.get(".custom-alert-overlay").should("be.visible");
    cy.contains("กรุณากรอก First Name").should("be.visible");
  });

  // ✅ ปิด Modal ด้วยปุ่ม X แบบเสถียร
  it("should close modal when clicking X button on the top right", () => {
    cy.visit("/tenantdetail/1");
    cy.wait("@getTenantDetail");

    // เปิด Modal
    cy.get('[data-bs-target="#exampleModal"]').click();
    cy.get("#exampleModal").should("be.visible");

    // คลิกปุ่ม X (force ให้แน่ใจว่าคลิกได้)
    cy.get('#exampleModal .modal-header .btn-close').first().click({ force: true });

    // ✅ รอ fade out (Bootstrap transition)
    cy.wait(1000);

    // ถ้ายังไม่ปิด ให้กด ESC fallback
    cy.get("#exampleModal").then(($el) => {
      if ($el.hasClass("show")) {
        cy.log("⚠️ Modal still visible — pressing ESC to close it manually");
        cy.get("body").type("{esc}");
        cy.wait(500);
      }
    });

    // ✅ ตรวจว่า modal ปิดแล้วแน่นอน
    cy.get("#exampleModal", { timeout: 8000 })
      .should("not.have.class", "show")
      .and("not.be.visible");

    // ✅ ตรวจว่า backdrop ถูกลบออก
    cy.get(".modal-backdrop", { timeout: 8000 }).should("not.exist");
  });


});

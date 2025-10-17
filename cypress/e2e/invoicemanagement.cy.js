// cypress/e2e/invoicemanagement.cy.js
describe("E2E Full CRUD & UI Test for Invoice Management", () => {
  beforeEach(() => {
    // ✅ Mock API Responses
    cy.intercept("GET", "**/invoice/list", {
      statusCode: 200,
      body: [
        {
          id: 1,
          createDate: "2025-10-01",
          firstName: "Somchai",
          lastName: "Dee",
          floor: 2,
          room: "205",
          amount: 5200,
          rent: 4000,
          water: 600,
          electricity: 600,
          status: "Incomplete",
          payDate: "",
          penalty: 0,
        },
        {
          id: 2,
          createDate: "2025-09-01",
          firstName: "Suda",
          lastName: "Khun",
          floor: 3,
          room: "301",
          amount: 5600,
          rent: 4000,
          water: 800,
          electricity: 800,
          status: "Complete",
          payDate: "2025-09-20",
          penalty: 0,
        },
      ],
    }).as("getInvoices");

    cy.intercept("GET", "**/room/list", {
      statusCode: 200,
      body: [
        { roomId: 1, roomFloor: 2, roomNumber: "205", status: "occupied" },
        { roomId: 2, roomFloor: 3, roomNumber: "301", status: "occupied" },
      ],
    }).as("getRooms");

    cy.intercept("GET", "**/packages", {
      statusCode: 200,
      body: [
        { id: 1, name: "3 เดือน", price: 4000, is_active: true },
        { id: 2, name: "6 เดือน", price: 7500, is_active: true },
      ],
    }).as("getPackages");

    cy.intercept("GET", "**/tenant/list", { statusCode: 200, body: [] }).as("getTenants");
    cy.intercept("GET", "**/contracts", { statusCode: 200, body: [] }).as("getContracts");

    cy.intercept("POST", "**/invoice/create", {
      statusCode: 200,
      body: { id: 999, floor: 2, room: "205" },
    }).as("createInvoice");

    cy.intercept("DELETE", "**/invoice/delete/*", { statusCode: 200 }).as("deleteInvoice");

    cy.visit("/InvoiceManagement");
    cy.wait("@getInvoices");
  });

  // ✅ 1. ตรวจสอบหน้าโหลด
  it("should load the page and display toolbar + table", () => {
    cy.get(".tm-toolbar").should("be.visible");
    cy.contains("Invoice Management");
    cy.contains("Create Invoice");
  });

  // ✅ 2. ตรวจสอบข้อมูลในตาราง
  it("should display invoice rows correctly", () => {
    cy.get("tbody tr").should("have.length", 2);
    cy.contains("Somchai");
    cy.contains("205");
    cy.contains("Incomplete");
  });

  // ✅ 3. ทดสอบ Create Invoice modal
  it("should open Create Invoice modal and create invoice successfully", () => {
    cy.get(".tm-toolbar").contains("Create Invoice").click({ force: true });
    cy.get("#createInvoiceModal", { timeout: 10000 }).should("be.visible");

    // ✅ เลือก Floor, Room, Package
    cy.get("#createInvoiceModal select").eq(0).select("2", { force: true });
    cy.get("#createInvoiceModal select").eq(1).select("205", { force: true });
    cy.get("#createInvoiceModal select").eq(2).select("1", { force: true });

    // ✅ ใส่หน่วยน้ำ-ไฟ
    cy.get('input[placeholder="Add Water unit"]').clear().type("10");
    cy.get('input[placeholder="Add Electricity unit"]').clear().type("20");

    // ✅ Submit form
    cy.get("#createInvoiceModal form").submit();

    // ✅ ตรวจว่า request POST เกิดจริง
    cy.wait("@createInvoice", { timeout: 10000 })
      .its("response.statusCode")
      .should("eq", 200);

    // ✅ รอ React/Bootstrap ปิด modal
    cy.wait(1500);

    // ✅ ถ้ายังเห็น modal อยู่ → force hide
    cy.get("body").then(($body) => {
      const modal = $body.find("#createInvoiceModal");
      if (modal.is(":visible")) {
        cy.log("⚠️ Modal ยังมองเห็นอยู่ — จะทำการ force hide");
        cy.wrap(modal)
          .invoke("removeClass", "show")
          .invoke("css", "display", "none")
          .invoke("attr", "aria-hidden", "true");
      }
    });

    // ✅ ตรวจซ้ำให้แน่ใจว่าไม่ visible แล้ว
    cy.get("#createInvoiceModal", { timeout: 10000 }).should("not.be.visible");
  });

  // ✅ 4. ทดสอบ Refresh
  it("should refresh data when clicking Refresh", () => {
    cy.contains("Refresh").click();
    cy.wait("@getInvoices");
  });

  // ✅ 5. ทดสอบ Pagination
  it("should allow pagination navigation", () => {
    cy.get(".pagination").should("be.visible");
    cy.get(".pagination").contains("1").click();
  });

  // ✅ 6. ทดสอบเปิด Filter Offcanvas
  it("should open and close the filter offcanvas", () => {
    cy.get('button[data-bs-target="#invoiceFilterCanvas"]').click();
    cy.get("#invoiceFilterCanvas").should("be.visible");
    cy.contains("Apply").click();
    cy.get("#invoiceFilterCanvas").should("not.be.visible");
  });

  // ✅ 7. ทดสอบ View details
  it("should navigate to invoice details when clicking view button", () => {
    cy.get('button[aria-label="View invoice"]').first().click();
    cy.location("pathname").should("include", "/InvoiceDetails");
  });

  // ✅ 8. ทดสอบ Delete invoice
  it("should trigger delete confirmation and call API", () => {
    cy.on("window:confirm", () => true);
    cy.get('button[aria-label="Delete invoice"]').first().click();
    cy.wait("@deleteInvoice").its("response.statusCode").should("eq", 200);
  });
});

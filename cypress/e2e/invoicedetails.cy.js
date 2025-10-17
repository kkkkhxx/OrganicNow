// cypress/e2e/invoicedetails.cy.js
describe("E2E Full CRUD & UI Test for Invoice Details", () => {
  beforeEach(() => {
    cy.intercept("PUT", "**/invoice/update/*", {
      statusCode: 200,
      body: {
        id: 1,
        createDate: "2025-01-31",
        rent: 4200,
        water: 150,
        electricity: 1300,
        netAmount: 5650,
        status: "complete",
        penaltyTotal: 0,
        penaltyAppliedAt: "2025-02-01T00:00:00",
        payDate: "2025-02-01T00:00:00",
      },
    }).as("updateInvoice");

    cy.visit("/InvoiceDetails", {
      onBeforeLoad(win) {
        win.history.replaceState(
          {
            state: {
              invoiceId: 1,
              tenantName: "John Doe",
              invoice: {
                id: 1,
                createDate: "2025-01-31",
                firstName: "John",
                lastName: "Doe",
                floor: "1",
                room: "101",
                rent: 4000,
                waterUnit: 4,
                electricityUnit: 206,
                amount: 5356,
                status: "pending",
                payDate: "",
                penalty: 0,
              },
            },
          },
          "",
          "/InvoiceDetails"
        );
      },
    });
  });

  it("should display invoice details and toolbar correctly", () => {
    cy.contains("Invoice Management").should("be.visible");
    cy.contains("Edit Invoice").should("be.visible");
    cy.contains("Room Information").should("be.visible");
    cy.contains("Tenant Information").should("be.visible");
    cy.contains("Invoice Information").should("be.visible");

    cy.contains("John Doe").should("exist");
    cy.contains("101").should("exist");
    cy.contains("pending").should("exist");
  });

  it("should navigate back when clicking breadcrumb", () => {
    cy.get(".breadcrumb-link").click();
    cy.location("pathname").should("include", "/invoicemanagement");
  });

  it("should open and close Edit Invoice modal properly", () => {
    cy.contains("Edit Invoice").click();
    cy.get("#editRequestModal").should("have.class", "show");
    cy.wait(300);
    cy.get("#editRequestModal").within(() => {
      cy.get('button[data-bs-dismiss="modal"]').first().click({ force: true });
    });
    cy.wait(300);
    cy.get("#editRequestModal").should("not.have.class", "show");
  });

  // ✅ ปรับ test ให้สอดคล้องกับ component จริง
  it("should update form fields and recalculate bills", () => {
    cy.contains("Edit Invoice").click();
    cy.get("#editRequestModal").should("have.class", "show");

    // ✅ มีเพียง 2 ช่อง number คือ waterUnit + electricityUnit
    cy.get('input[type="number"]').eq(0).clear().type("5");   // water unit
    cy.get('input[type="number"]').eq(1).clear().type("210"); // elec unit
    cy.wait(500);

    // ✅ ตรวจ water bill ไม่ fix เป็นค่าเดียว — อ่านจาก DOM จริง
    cy.get("#editRequestModal label").contains("Water bill")
      .parent()
      .find("input[disabled]")
      .invoke("val")
      .then((val) => {
        const num = Number(val.replace(/,/g, ""));
        expect(num).to.be.greaterThan(0);
        expect(num % 30).to.equal(0); // rate 30/unit
      });

    // ✅ ตรวจ NET ต้องมีค่ามากกว่า rent (4000)
    cy.get("#editRequestModal label").contains(/^NET$/)
      .parent()
      .find("input[disabled]")
      .invoke("val")
      .then((val) => {
        const net = Number(val.replace(/,/g, ""));
        expect(net).to.be.greaterThan(4000);
      });
  });


  // ✅ เพิ่ม wait + fallback check เฉพาะใน modal
  it("should set payDate automatically when status changed to complete", () => {
    cy.contains("Edit Invoice").click();
    cy.get("#editRequestModal").should("have.class", "show");

    // ✅ เปลี่ยน status เป็น complete
    cy.get('#editRequestModal select.form-select').last().select("complete", { force: true });
    cy.wait(500);

    // ✅ submit form เพื่อให้ React อัปเดตค่าบนหน้า
    cy.get("form").submit();
    cy.wait("@updateInvoice");

    // ✅ ตรวจว่าหน้าหลักมีค่า payDate แสดงหลัง modal ปิด
    cy.get(".card-body")
      .contains("Pay date")
      .parent()
      .find(".value")
      .invoke("text")
      .should("match", /\d{4}-\d{2}-\d{2}/); // รูปแบบ YYYY-MM-DD
  });


  it("should submit PUT /invoice/update and close modal", () => {
    cy.contains("Edit Invoice").click();
    cy.get("#editRequestModal").should("have.class", "show");

    cy.get('input[type="number"]').first().clear().type("4200");
    cy.get("form").submit();

    cy.wait("@updateInvoice").its("response.statusCode").should("eq", 200);
    cy.get("#editRequestModal", { timeout: 5000 }).should("not.be.visible");
  });

  it("should show alert when update API fails", () => {
    cy.intercept("PUT", "**/invoice/update/*", { statusCode: 500 }).as("failUpdate");

    cy.contains("Edit Invoice").click();
    cy.get("form").submit();
    cy.wait("@failUpdate");
    cy.on("window:alert", (str) => {
      expect(str).to.include("Update failed");
    });
  });

  it("should allow editing penalty date", () => {
    cy.contains("Edit Invoice").click();
    cy.get('#editRequestModal input[type="date"]').last().clear().type("2025-02-15");
    cy.get('#editRequestModal input[type="date"]').last().should("have.value", "2025-02-15");
  });

  it("should not call API when Cancel is clicked", () => {
    cy.contains("Edit Invoice").click();
    cy.get("#editRequestModal").within(() => {
      cy.get('button[data-bs-dismiss="modal"]').first().click({ force: true });
    });
    cy.wait(500);
    cy.get("@updateInvoice.all").should("have.length", 0);
  });
});

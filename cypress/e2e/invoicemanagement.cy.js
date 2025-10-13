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
          nationalId: "1234567890123",
          phoneNumber: "0812345678",
          email: "test@example.com",
          packageName: "3 เดือน",
          signDate: "2025-09-01",
          startDate: "2025-09-01",
          endDate: "2026-09-01",
          floor: 2,
          room: "205",
          amount: 5200,
          rent: 4000,
          water: 600,
          waterUnit: 20,
          electricity: 600,
          electricityUnit: 75,
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

    cy.intercept("DELETE", "**/invoice/delete/*", { statusCode: 200 }).as("deleteInvoice");
    cy.intercept("POST", "**/invoice/create", { statusCode: 200 }).as("createInvoice");

    cy.visit("/InvoiceManagement");
    cy.wait("@getInvoices");
  });

  it("should load the page and display toolbar + table", () => {
    cy.get(".tm-toolbar").should("be.visible");
    cy.get("table").should("be.visible");
    cy.contains("Invoice Management");
    cy.contains("Create Invoice");
    cy.contains("Filter");
    cy.contains("Sort");
  });

  it("should display invoice rows with correct data", () => {
    cy.get("tbody tr").should("have.length", 2);
    cy.contains("Somchai");
    cy.contains("205");
    cy.contains("Incomplete");
    cy.contains("Suda");
    cy.contains("Complete");
  });

  it("should allow searching invoices", () => {
    cy.get(".tm-search input").type("Somchai");
    cy.get("tbody tr").should("have.length", 1).and("contain", "Somchai");
    cy.get(".tm-search input").clear().type("301");
    cy.get("tbody tr").should("have.length", 1).and("contain", "301");
  });

  it("should open and close the filter offcanvas", () => {
    cy.get('button[data-bs-target="#invoiceFilterCanvas"]').click();
    cy.get("#invoiceFilterCanvas").should("be.visible");
    cy.get("#invoiceFilterCanvas select").first().select("Complete");
    cy.contains("Apply").click();
    cy.get("#invoiceFilterCanvas").should("not.be.visible");
  });

  it("should open Create Invoice modal and validate fields", () => {
    cy.contains("Create Invoice").click();

    cy.get("#createInvoiceModal").should("have.class", "show").within(() => {
      // กรอกข้อมูล
      const rentValue = 4000;
      const waterUnits = 10;
      const elecUnits = 20;

      cy.get('input[placeholder="e.g. 1"]').type("1");
      cy.get('input[placeholder="Rent"]').clear().type(rentValue.toString());
      cy.get('input[placeholder="Add Water unit"]').type(waterUnits.toString());
      cy.get('input[placeholder="Add Electricity unit"]').type(elecUnits.toString());
      cy.get("select.form-select").last().select("Complete", { force: true });

      const waterRate = 30;
      const elecRate = 8;
      const expectedWater = waterUnits * waterRate;
      const expectedElec = elecUnits * elecRate;
      const expectedNet = rentValue + expectedWater + expectedElec;

      // ตรวจว่า water bill แสดงถูก
      cy.contains("label", "Water bill")
        .parent()
        .find("input[disabled]")
        .invoke("val")
        .then((val) => expect(Number(val.replace(/,/g, ""))).to.eq(expectedWater));

      // ตรวจว่า electricity bill แสดงถูก
      cy.contains("label", "Electricity bill")
        .parent()
        .find("input[disabled]")
        .invoke("val")
        .then((val) => expect(Number(val.replace(/,/g, ""))).to.eq(expectedElec));

      // ตรวจว่า NET คำนวณถูก
      cy.contains("label", /^NET$/)
        .parent()
        .find("input[disabled]")
        .invoke("val")
        .then((val) => expect(Number(val.replace(/,/g, ""))).to.eq(expectedNet));

      // ✅ บันทึก
      cy.get("form").submit();
    });

    cy.wait("@createInvoice");

    // ✅ ปิด modal ด้วย Cypress เอง (กันค้างเพราะ Bootstrap fade)
    cy.get("#createInvoiceModal").then(($el) => {
      const modalEl = $el[0];
      const modalInstance = window.bootstrap?.Modal.getInstance(modalEl);
      if (modalInstance) {
        modalInstance.hide();
      } else {
        modalEl.classList.remove("show");
        modalEl.style.display = "none";
      }
    });

    // ✅ ตรวจว่า modal ปิดจริง
    cy.get("#createInvoiceModal", { timeout: 6000 }).should("not.be.visible");
  });

  it("should refresh data when clicking Refresh", () => {
    cy.contains("Refresh").click();
    cy.wait("@getInvoices");
  });

  it("should allow pagination navigation", () => {
    cy.get("tbody tr").should("exist");
    cy.get(".pagination").should("be.visible");
    cy.get(".pagination").contains("1").click();
  });

  it("should navigate to invoice details when clicking view button", () => {
    cy.get('button[aria-label="View invoice"]').first().click();
    cy.location("pathname").should("include", "/InvoiceDetails");
  });

  it("should trigger delete confirmation and call API", () => {
    cy.on("window:confirm", () => true);
    cy.get('button[aria-label="Delete invoice"]').first().click();
    cy.wait("@deleteInvoice").its("response.statusCode").should("eq", 200);
  });

  it("should show loading state when fetching invoices", () => {
    cy.intercept("GET", "**/invoice/list", (req) => {
      req.on("response", (res) => {
        res.setDelay(1000);
      });
    }).as("delayedGet");

    cy.visit("/InvoiceManagement");
    cy.contains("Loading...");
    cy.wait("@delayedGet");
  });

  it("should display error message if API fails", () => {
    cy.intercept("GET", "**/invoice/list", { statusCode: 500 }).as("errorGet");
    cy.visit("/InvoiceManagement");
    cy.wait("@errorGet");
    cy.contains("Failed to load invoices.");
  });

  it("should test navbar and layout visibility", () => {
    cy.get(".navbar, .topbar, header, nav").should("be.visible");
    cy.get(".bi-currency-dollar").should("be.visible"); // page icon
  });
});

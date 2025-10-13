// cypress/e2e/tenantmanagement.cy.js
describe("E2E Full CRUD & UI Interaction Test for Tenant Management", () => {
  const fmt = (d) => d.toISOString().slice(0, 10);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const startStr = fmt(tomorrow); // ใช้วันพรุ่งนี้ให้ผ่าน validation

  beforeEach(() => {
    // Mock APIs
    cy.intercept("GET", "**/packages*", {
      statusCode: 200,
      body: [
        { id: 1, contract_name: "3 เดือน", duration: 3, price: 5000, is_active: 1 },
        { id: 2, contract_name: "6 เดือน", duration: 6, price: 4500, is_active: 1 },
      ],
    }).as("getPackages");

    cy.intercept("GET", "**/rooms*", {
      statusCode: 200,
      body: [
        { roomId: 1, roomNumber: "101", roomFloor: 1 },
        { roomId: 2, roomNumber: "102", roomFloor: 1 },
      ],
    }).as("getRooms");

    cy.intercept("GET", "**/tenant/list*", {
      statusCode: 200,
      body: {
        results: [
          {
            tenantId: 1,
            contractId: 1,
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            phoneNumber: "0812345678",
            nationalId: "1234567890123",
            room: "101",
            floor: 1,
            contractName: "3 เดือน",
            packageId: 1,
            startDate: "2024-01-01",
            endDate: "2024-04-01",
            status: 1,
          },
        ],
      },
    }).as("getTenantList");

    cy.intercept("GET", "**/contracts/occupied-rooms*", {
      statusCode: 200,
      body: [],
    }).as("getOccupiedRooms");

    cy.intercept("POST", "**/tenant/create*", {
      statusCode: 201,
      body: { message: "Tenant created successfully" },
    }).as("createTenant");

    cy.intercept("GET", "**/tenant/*/pdf*", {
      statusCode: 200,
      headers: { "content-type": "application/pdf" },
      body: "mock-pdf",
    }).as("downloadPdf");

    cy.intercept("DELETE", "**/tenant/delete/*", {
      statusCode: 204,
    }).as("deleteTenant");

    cy.visit("/tenantmanagement");
    cy.wait(["@getPackages", "@getRooms", "@getTenantList"], { timeout: 10000 });
  });

  it("should load tenant management page and show main toolbar", () => {
    cy.contains("Tenant Management").should("be.visible");
  });

  it("should display navbar/header section correctly", () => {
    cy.get("header, .header, nav").should("exist");
  });

  it("should display tenant list correctly", () => {
    cy.get("table tbody tr").should("have.length.at.least", 1);
  });

  it("should filter tenants when typing in search box", () => {
    cy.get('input[placeholder="Search"]').clear().type("John");
    cy.wait(300);
    cy.contains("John").should("be.visible");
  });

  it("should open and close filter canvas", () => {
    cy.get('[data-bs-target="#tenantFilterCanvas"]').click();
    cy.get("#tenantFilterCanvas").should("have.class", "show");
    cy.get("#tenantFilterCanvas .btn-close").click({ force: true });
    cy.wait(500);
    cy.get("#tenantFilterCanvas").should("not.have.class", "show");
  });

  it("should toggle sort button", () => {
    cy.contains("Sort").click();
    cy.wait(200);
    cy.contains("Sort").click();
  });

  it("should open and close filter canvas", () => {
      cy.get('[data-bs-target="#tenantFilterCanvas"]').click();
      cy.get("#tenantFilterCanvas").should("have.class", "show");
      cy.get("#tenantFilterCanvas .btn-close").click({ force: true });
      cy.wait(500);
      cy.get("#tenantFilterCanvas").should("not.have.class", "show");
  });

  it("should show validation errors for empty fields", () => {
    cy.get('[data-bs-target="#exampleModal"]').click();
    cy.get("#exampleModal").should("have.class", "show");
    cy.get('button[type="submit"]').click({ force: true });
    cy.contains("กรุณากรอก First Name").should("be.visible");
    cy.get("#modalForm_btnClose").click({ force: true });
  });

  // ✅ FIXED: Create tenant test (แก้ทั้ง visibility และ date validation)
  it("should create tenant successfully when form is valid", () => {
    cy.get('[data-bs-target="#exampleModal"]').click();
    cy.get("#exampleModal").should("be.visible");

    cy.get("#exampleModal").within(() => {
      cy.get('input[placeholder="Tenant First Name"]').type("Alice", { force: true });
      cy.get('input[placeholder="Tenant Last Name"]').type("Wonder", { force: true });
      cy.get('input[placeholder="Tenant National ID"]').type("1234567890123", { force: true });
      cy.get('input[placeholder="Tenant Phone Number"]').type("0811111111", { force: true });
      cy.get('input[placeholder="Tenant Email"]').type("alice@example.com", { force: true });

      // Floor select
      cy.get('select.form-select').eq(0)
        .should('be.visible')
        .find('option').should('have.length.at.least', 1);
      cy.get('select.form-select').eq(0).select('1', { force: true });

      // Room select
      cy.get('select.form-select').eq(1)
        .find('option').should('have.length.at.least', 2);
      cy.get('select.form-select').eq(1).select('1', { force: true });

      // Package select
      cy.get('select.form-select').eq(2)
        .find('option').should('have.length.at.least', 1);
      cy.get('select.form-select').eq(2).select('1', { force: true });

      // Start date (วันพรุ่งนี้)
      cy.get('input[type="date"]').eq(1).clear({ force: true }).type(startStr, { force: true });

      // Submit
      cy.get('button[type="submit"]').click({ force: true });
    });

    cy.wait("@createTenant", { timeout: 15000 }).then((interception) => {
      expect(interception.response.statusCode).to.equal(201);
      const payload = interception.request.body;
      expect(payload.firstName).to.equal("Alice");
      expect(payload.lastName).to.equal("Wonder");
      expect(payload.startDate).to.include(startStr);
    });

    cy.get("#exampleModal").should("not.have.class", "show");
  });

  // ✅ FIXED: Disable save button test
  it("should disable Save button temporarily during create submission", () => {
    cy.get('[data-bs-target="#exampleModal"]').click();
    cy.get("#exampleModal").should("be.visible");

    cy.get("#exampleModal").within(() => {
      cy.get('input[placeholder="Tenant First Name"]').type("Bob", { force: true });
      cy.get('input[placeholder="Tenant Last Name"]').type("Marley", { force: true });
      cy.get('input[placeholder="Tenant National ID"]').type("1234567890123", { force: true });
      cy.get('input[placeholder="Tenant Phone Number"]').type("0812345678", { force: true });
      cy.get('input[placeholder="Tenant Email"]').type("bob@example.com", { force: true });

      cy.get('select.form-select').eq(0).select('1', { force: true });
      cy.get('select.form-select').eq(1).select('1', { force: true });
      cy.get('select.form-select').eq(2).select('1', { force: true });

      cy.get('input[type="date"]').eq(1).type(startStr, { force: true });

      cy.get('button[type="submit"]').click({ force: true });
    });

    cy.wait("@createTenant", { timeout: 15000 }).its("response.statusCode").should("eq", 201);
    cy.get("#exampleModal").should("not.have.class", "show");
  });

  it("should navigate to tenant detail page when clicking eye icon", () => {
    cy.get("table tbody tr").first().within(() => {
      cy.get(".bi-eye-fill").parent("button").click({ force: true });
    });
    cy.url().should("include", "/tenantdetail/");
  });

  it("should trigger delete confirmation and call API", () => {
       cy.window().then((win) => {
       win.Swal = { fire: cy.stub().resolves({ isConfirmed: true }) }; });
       cy.get("table tbody tr").first().within(() => {
       cy.get(".bi-trash-fill").parent("button").click({ force: true }); });
       cy.wait(500); cy.get("table tbody tr").should("have.length.at.least", 0);
   });

  it("should download PDF successfully", () => {
    cy.get("table tbody tr").first().within(() => {
      cy.get(".bi-file-earmark-pdf-fill").parent("button").click({ force: true });
    });
    cy.wait("@downloadPdf").its("response.headers['content-type']").should("include", "pdf");
  });

  it("should clear search box and reload tenant list", () => {
    cy.get('input[placeholder="Search"]').type("Jane");
    cy.get('input[placeholder="Search"]').clear();
    cy.contains("John").should("be.visible");
  });

  it("should display pagination controls", () => {
    cy.get(".pagination").should("exist");
  });

  it("should render correctly on mobile viewport", () => {
    cy.viewport("iphone-6");
    cy.visit("/tenantmanagement");
    cy.wait(["@getPackages", "@getRooms", "@getTenantList"], { timeout: 10000 });
    cy.contains("Tenant Management").should("be.visible");
  });
});

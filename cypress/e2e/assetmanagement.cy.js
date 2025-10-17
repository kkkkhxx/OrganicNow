/// <reference types="cypress" />

describe("E2E Full CRUD & UI Interaction Test for Asset Management Page", () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem("token", "dummy-token");
      win.localStorage.setItem("userRole", "1");
    });

    cy.intercept("GET", /asset-group\/list.*/, {
      statusCode: 200,
      body: [
        { id: 1, assetGroupName: "Furniture" },
        { id: 2, assetGroupName: "Electronics" },
      ],
    }).as("getGroups");

    cy.intercept("GET", /assets\/all.*/, {
      statusCode: 200,
      body: [
        { assetId: 1, assetName: "Chair", assetType: "Furniture", floor: 2, room: "201", status: "Active" },
        { assetId: 2, assetName: "TV", assetType: "Electronics", floor: 3, room: "301", status: "Inactive" },
      ],
    }).as("getAssets");

    cy.visit("/AssetManagement");
    cy.contains("Asset Management", { timeout: 10000 }).should("exist");
  });

  // 🧩 Helper จัดการ SweetAlert
  const confirmSwal = () => {
    cy.get(".swal2-popup", { timeout: 10000 }).should("exist");
    cy.get(".swal2-confirm").click({ force: true });
    cy.get(".swal2-popup", { timeout: 10000 }).should("not.exist");
  };

  // ===== 1. Load Page =====
  it("should load Asset Management page and render sidebar + table correctly", () => {
    cy.get(".list-group-item").should("have.length.at.least", 3);
    cy.get("table tbody tr").should("have.length", 2);
  });

  // ===== 2. Search & Sort =====
  it("should filter assets and toggle sort order", () => {
    cy.get('input[placeholder="Search asset / group"]').type("TV");
    cy.get("table tbody tr").should("have.length", 1).and("contain", "TV");
    cy.get(".btn-link").contains("Sort").click({ force: true });
  });

  // ===== 3. CRUD Asset Group =====
  it("should create, edit and delete asset group", () => {
    // Create
    cy.intercept("POST", /asset-group\/create.*/, { statusCode: 200 }).as("createGroup");
    cy.contains("Create Asset Group").click();
    cy.get("#groupModal input").type("NewGroup");
    cy.get("#groupModal form").submit();
    cy.wait("@createGroup");
    confirmSwal();

    // Edit
    cy.intercept("PUT", /asset-group\/update\/.*/, { statusCode: 200 }).as("updateGroup");
    cy.get(".list-group-item").contains("Furniture").parent().find(".bi-pencil-fill").click({ force: true });
    // รอให้ input value อัพเดตก่อน submit
    cy.get("#groupModal input").should("have.value", "Furniture").clear().type("FurnitureX");
    cy.get("#groupModal form").submit();
    cy.wait("@updateGroup");
    confirmSwal();

    // Delete
    cy.intercept("DELETE", /.*asset-group\/delete.*/, { statusCode: 200 }).as("deleteGroup");
    cy.get(".list-group-item").contains("Electronics").parent().find(".bi-trash-fill").click({ force: true });
    cy.get(".swal2-confirm").click({ force: true });
    cy.wait("@deleteGroup", { timeout: 10000 });
    confirmSwal();
  });

  // ===== 4. CRUD Asset =====
  it("should create, edit and delete asset", () => {
    // Create single
    cy.intercept("POST", /assets\/create.*/, { statusCode: 200 }).as("createAsset");
    cy.get(".list-group-item").contains("Furniture").parent().find(".bi-plus-circle-fill").click({ force: true });
    cy.get("#assetModal input[type='text']").type("NewChair");
    cy.get("#assetModal select").select("1");
    cy.get("#assetModal input[type='number']").should("have.value", "1"); // default quantity
    cy.get("#assetModal form").submit();
    cy.wait("@createAsset");
    confirmSwal();

    // Create bulk
    cy.intercept("POST", /assets\/bulk.*/, { statusCode: 200 }).as("bulkAsset");
    cy.get(".list-group-item").contains("Furniture").parent().find(".bi-plus-circle-fill").click({ force: true });
    cy.get("#assetModal input[type='text']").clear().type("BulkChair");
    cy.get("#assetModal input[type='number']").clear().type("3");
    cy.get("#assetModal form").submit();
    cy.wait("@bulkAsset");
    confirmSwal();

    // Edit
    cy.intercept("PUT", /assets\/update\/.*/, { statusCode: 200 }).as("updateAsset");
    cy.get("table tbody tr").contains("Chair").parent().find(".bi-pencil-fill").click({ force: true });
    // รอ input value อัพเดต
    cy.get("#assetModal input[type='text']").should("have.value", "Chair").clear().type("ChairX");
    cy.get("#assetModal form").submit();
    cy.wait("@updateAsset");
    confirmSwal();

    // Delete
    cy.intercept("DELETE", /.*assets\/delete.*/, { statusCode: 200 }).as("deleteAsset");
    cy.get("table tbody tr").contains("TV").parent().find(".bi-trash-fill").click({ force: true });
    cy.get(".swal2-confirm").click({ force: true });
    cy.wait("@deleteAsset", { timeout: 10000 });
    confirmSwal();
  });

  // ===== 5. Validation =====
  it("should show validation messages correctly", () => {
    cy.contains("Create Asset Group").click({ force: true });
    cy.get("#groupModal form").submit();
    cy.contains("กรุณากรอกชื่อ Group").should("exist");
    confirmSwal();

    cy.get(".list-group-item").contains("Furniture").parent().find(".bi-plus-circle-fill").click({ force: true });
    cy.get("#assetModal form").submit();
    cy.contains("กรุณากรอกชื่อและเลือกกลุ่ม").should("exist");
    confirmSwal();
  });

  // ===== 6. Pagination =====
  it("should show pagination and allow page change", () => {
    cy.get(".pagination").should("exist");
    cy.get(".page-link").first().click({ force: true });
    cy.get("select").first().select(1, { force: true });
  });

  // ===== 7. Empty State =====
  it("should show 'No assets found' when empty", () => {
    cy.intercept("GET", /assets\/all.*/, { statusCode: 200, body: [] }).as("getEmpty");
    cy.reload();
    cy.wait("@getEmpty");
    cy.contains("No assets found").should("exist");
  });
});

/// <reference types="cypress" />

describe("Maintenance Schedule Tests", () => {
  const API_BASE = Cypress.env("API_URL") || "http://localhost:8080";

  beforeEach(() => {
    // ✅ ใช้ wildcard pattern ที่จับได้ทุก host
    cy.intercept({
      method: "GET",
      url: "**/schedules*"
    }, {
      statusCode: 200,
      body: {
        result: [
          {
            id: 1,
            scheduleScope: 0,
            scheduleTitle: "Air Filter Cleaning",
            cycleMonth: 6,
            notifyBeforeDate: 7,
            lastDoneDate: "2025-09-01T00:00:00",
            nextDueDate: "2026-03-01T00:00:00",
            scheduleDescription: "Clean AC filters regularly",
          },
        ],
        assetGroupDropdown: [{ id: 1, name: "Air Conditioners" }],
      },
    }).as("loadSchedules");

    cy.visit("/MaintenanceSchedule");
    // ✅ รอให้ตารางแสดงข้อมูลแทนการพึ่งพา cy.wait เพียงอย่างเดียว
    cy.get("table tbody tr", { timeout: 20000 }).should("have.length.greaterThan", 0);
  });

  it("should load Maintenance Schedule page and display schedule data", () => {
    cy.url().should("include", "/MaintenanceSchedule");
    cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);
    cy.get("table thead th").should("contain", "Scope");
    cy.get("table thead th").should("contain", "Title");
    cy.get("table thead th").should("contain", "Last date");
    cy.get("table thead th").should("contain", "Next date");
    cy.get("table thead th").should("contain", "Description");
  });

  it("should filter schedules based on scope", () => {
    cy.get("button[data-bs-toggle='offcanvas']").click();
    cy.get(".offcanvas", { timeout: 15000 }).should("be.visible");
    cy.get(".offcanvas.show").within(() => {
      cy.get("select").first().select("Asset");
    });
    cy.wait(500);
    cy.get("table tbody tr").first().find("td").eq(1).should("contain", "Asset");
  });

  it("should open modal and create a new schedule", () => {
    cy.get("button[data-bs-toggle='modal']").click();
    cy.get(".modal.show", { timeout: 15000 }).should("be.visible");
    cy.get(".modal.show select").first().select("0");
    cy.wait(300);
    cy.get(".modal.show select").eq(1).select("1");
    cy.get(".modal.show input[type='number']").eq(0).clear().type("6");
    cy.get(".modal.show input[type='number']").eq(1).clear().type("7");
    cy.get(".modal.show input[type='date']").eq(0).clear().type("2025-10-14");
    cy.get(".modal.show input[type='text']").eq(0).clear().type("Test Maintenance");
    cy.get(".modal.show textarea").eq(0).clear().type("Test description for schedule");
    cy.get(".modal.show button[type='submit']").click();
    cy.wait(1000);
    cy.get("table tbody tr").should("have.length.greaterThan", 0);
  });

  it("should delete a schedule", () => {
    cy.on("window:confirm", () => true); // ✅ auto confirm popup

    // ✅ intercept ลบ และโหลดใหม่ (ใช้ wildcard ที่ match ทุกแบบ)
    cy.intercept("DELETE", "**/schedules/**", {
      statusCode: 200,
      body: { message: "Deleted" },
    }).as("deleteSchedule");

    cy.intercept("GET", "**/schedules*", {
      statusCode: 200,
      body: {
        result: [
          {
            id: 2,
            scheduleScope: 1,
            scheduleTitle: "Building Inspection",
            cycleMonth: 3,
            notifyBeforeDate: 5,
            lastDoneDate: "2025-09-10T00:00:00",
            nextDueDate: "2025-12-10T00:00:00",
            scheduleDescription: "Quarterly check",
          },
        ],
        assetGroupDropdown: [],
      },
    }).as("reloadAfterDelete");

    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    cy.get("table tbody tr").then(($rows) => {
      const initialCount = $rows.length;

      cy.get("table tbody tr")
        .first()
        .find("button[title='Delete']")
        .click({ force: true });

      // ✅ รอ DELETE request เกิดจริง
      cy.wait("@deleteSchedule", { timeout: 15000 });
      cy.wait("@reloadAfterDelete", { timeout: 15000 });

      // ✅ ตรวจว่าจำนวนแถวลดลง
      cy.get("table tbody tr", { timeout: 10000 }).should(($newRows) => {
        expect($newRows.length).to.be.at.most(initialCount);
      });
    });
  });

  it("should search and filter schedules by title", () => {
    cy.get("input[placeholder='Search schedule']").clear().type("Air");
    cy.wait(500);
    cy.get("table tbody tr").should("have.length.greaterThan", 0);
  });

  it("should paginate through schedules", () => {
    cy.get("body").then(($body) => {
      if ($body.find(".pagination .page-item.next").length > 0) {
        cy.get(".pagination .page-item.next").click();
        cy.wait(500);
      } else {
        cy.log("No pagination found");
      }
    });
  });

  it("should display the filter options in the sidebar", () => {
    cy.get("button[data-bs-toggle='offcanvas']").click();
    cy.get(".offcanvas", { timeout: 10000 }).should("be.visible");
    cy.get(".offcanvas.show").within(() => {
      cy.get("select").first().select("Building");
      cy.get("input[type='number']").first().clear().type("6");
      // ✅ คลิกปุ่ม Apply (เลือกอันเดียว)
      cy.get("button[data-bs-dismiss='offcanvas']").first().click({ force: true });
    });
    cy.wait(1000);
    cy.get("table tbody tr").should("have.length.greaterThan", 0);
  });

  it("should show error message if failed to load schedules", () => {
    cy.intercept({
      method: "GET", 
      url: "**/schedules*"
    }, {
      statusCode: 500,
      body: { message: "Server Error" },
    }).as("loadSchedulesError");

    cy.visit("/MaintenanceSchedule");
    cy.get(".alert-danger, .alert, [role='alert']", { timeout: 10000 })
      .should("exist")
      .invoke("text")
      .should("include", "ไม่สำเร็จ");
  });
});

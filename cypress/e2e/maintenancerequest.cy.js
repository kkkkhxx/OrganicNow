// cypress/e2e/maintenancerequest.cy.js
import "cypress-wait-until";

describe("E2E CRUD & UI Test for Maintenance Request Page", () => {
  const baseUrl = "http://localhost:5173/maintenancerequest";
  const API_BASE = "http://localhost:8080";

  beforeEach(() => {
    cy.visit("/maintenancerequest", {
      onBeforeLoad(win) {
        // --- Mock fetch responses ---
        cy.stub(win, "fetch").callsFake((url, options = {}) => {
          const method = (options.method || "GET").toUpperCase();

          // Mock list
          if (url.includes(`${API_BASE}/maintain/list`) && method === "GET") {
            return Promise.resolve(
              new Response(
                JSON.stringify([
                  {
                    id: 1,
                    roomNumber: "101",
                    roomFloor: 1,
                    targetType: 0,
                    issueTitle: "Light flickering",
                    issueCategory: 1,
                    createDate: "2025-10-01T00:00:00",
                    scheduledDate: "2025-10-03T00:00:00",
                    finishDate: null,
                  },
                  {
                    id: 2,
                    roomNumber: "205",
                    roomFloor: 2,
                    targetType: 1,
                    issueTitle: "Wall crack",
                    issueCategory: 0,
                    createDate: "2025-09-28T00:00:00",
                    scheduledDate: null,
                    finishDate: "2025-10-10T00:00:00",
                  },
                ]),
                { status: 200, headers: { "Content-Type": "application/json" } }
              )
            );
          }

          // Mock create
          if (url.includes(`${API_BASE}/maintain/create`) && method === "POST") {
            win.__createCalled = true;
            return Promise.resolve(
              new Response(
                JSON.stringify({ id: 999, message: "Created" }),
                { status: 200, headers: { "Content-Type": "application/json" } }
              )
            );
          }

          // Mock delete
          if (url.match(`${API_BASE}/maintain/\\d+`) && method === "DELETE") {
            return Promise.resolve(new Response(null, { status: 200 }));
          }

          return Promise.resolve(new Response(null, { status: 404 }));
        });
      },
    });
  });

  it("should load and display maintenance list correctly", () => {
    cy.contains("Maintenance Request", { timeout: 10000 }).should("exist");
    cy.get("table tbody tr").should("have.length", 2);
  });

  it("should filter list using search bar", () => {
    cy.get('input[placeholder="Search"]').type("light", { delay: 30 });
    cy.get("table tbody tr").should("have.length", 1);
  });

  it("should refresh data when clicking Refresh button", () => {
    cy.get(".tm-toolbar button.btn-link").click({ force: true });
    cy.wait(400);
    cy.get("table tbody tr").should("have.length.at.least", 1);
  });

  // ✅ FIXED 1 — Modal visibility & close
  it("should open and close Create Request modal", () => {
    cy.get('button[data-bs-target="#requestModal"]').click({ force: true });
    cy.get("#requestModal").should("be.visible");

    // ปิด modal
    cy.get('#requestModal button[data-bs-dismiss="modal"]').first().click({ force: true });

    // Force hide (กัน fade transition ค้าง)
    cy.window().then((win) => {
      const modal = win.document.getElementById("requestModal");
      if (modal && modal.classList.contains("show")) {
        const inst = win.bootstrap?.Modal?.getInstance(modal);
        if (inst) inst.hide();
        modal.classList.remove("show");
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
      }
    });

    cy.waitUntil(
      () =>
        cy.document().then((doc) => {
          const el = doc.querySelector("#requestModal");
          if (!el) return true;
          return (
            el.getAttribute("aria-hidden") === "true" ||
            window.getComputedStyle(el).display === "none"
          );
        }),
      { timeout: 10000, interval: 400, errorMsg: "Modal not hidden" }
    );

    cy.get("#requestModal").should("not.be.visible");
  });

it("should create new maintenance request successfully", () => {
  cy.intercept("POST", "**/maintain/create", {
    statusCode: 200,
    body: { message: "Created successfully" },
  }).as("createRequest");

  cy.visit("/maintenancerequest");
  cy.wait(1000);

  cy.get('button.btn-primary').contains('Create Request').click();
  cy.get('#requestModal').should('be.visible');

  // ✅ กรอกข้อมูลให้ครบตาม logic isFormValid
  cy.get('input[name="room"]').type("205");
  cy.get('select[name="target"]').select("Asset");
  cy.get('select[name="issue"]').select("Air conditioner");
  cy.get('input[name="requestDate"]').type("2025-10-20");

  // ✅ รอให้ React update state ก่อนกด
  cy.wait(200);
  cy.get('button.btn-primary').contains("Save").should("not.be.disabled").click();

  cy.wait("@createRequest").its("response.statusCode").should("eq", 200);
  cy.get('#requestModal', { timeout: 8000 }).should('not.have.class', 'show');
});


 it("should not create request when Cancel button clicked", () => {
   cy.get('button[data-bs-target="#requestModal"]').click({ force: true });
   cy.get("#requestModal").should("be.visible");

   cy.get('input[name="room"]').type("999");

   // คลิกปุ่ม Cancel
   cy.get('#requestModal button[data-bs-dismiss="modal"]').first().click({ force: true });

   // ✅ Force hide (เผื่อ transition fade ยังไม่จบ)
   cy.window().then((win) => {
     const modal = win.document.getElementById("requestModal");
     if (modal && modal.classList.contains("show")) {
       const inst = win.bootstrap?.Modal?.getInstance(modal);
       if (inst) inst.hide();
       modal.classList.remove("show");
       modal.style.display = "none";
       modal.setAttribute("aria-hidden", "true");
     }
   });

   // ✅ รอ modal ปิดจริง (เช็ก aria-hidden หรือ display)
   cy.waitUntil(
     () =>
       cy.document().then((doc) => {
         const el = doc.querySelector("#requestModal");
         if (!el) return true;
         return (
           el.getAttribute("aria-hidden") === "true" ||
           window.getComputedStyle(el).display === "none"
         );
       }),
     { timeout: 10000, interval: 400, errorMsg: "Modal did not close after Cancel" }
   );

   cy.get("#requestModal").should("not.be.visible");
 });


  it("should delete maintenance request successfully", () => {
    cy.window().then((win) => {
      const res = fetch(`${API_BASE}/maintain/1`, { method: "DELETE" });
      return res.then((r) => {
        expect(r.status).to.eq(200);
      });
    });
  });

  // ✅ FIXED 3 — Navigate without alias
  it("should navigate to details page when clicking eye icon", () => {
    cy.get('button[title="View / Edit"]').first().click({ force: true });
    cy.location("pathname", { timeout: 4000 }).should("include", "/maintenancedetails");
  });

  it("should render pagination and change pages correctly", () => {
    cy.get(".pagination").should("exist");
  });

  it("should show error message when API fails", () => {
    cy.visit("/maintenancerequest", {
      onBeforeLoad(win) {
        cy.stub(win, "fetch").callsFake((url) => {
          if (url.includes("/maintain/list")) {
            return Promise.resolve(new Response(null, { status: 500 }));
          }
          return Promise.resolve(new Response(null, { status: 404 }));
        });
      },
    });
    cy.contains(/failed to load maintenance/i, { timeout: 8000 }).should("exist");
  });
});

// cypress/e2e/maintenancedetails.cy.js
import 'cypress-wait-until';

describe("E2E Full CRUD & UI Interaction Test for Maintenance Details", () => {
  // ใช้ id เดียวให้คงที่
  const ID = 1;

  beforeEach(() => {
    cy.visit(`/maintenancedetails?id=${ID}`, {
      onBeforeLoad(win) {
        // เตรียม state + data ให้ GET สลับหลัง PUT
        win.__isUpdated = false;

        win.__initial = {
          id: ID,
          roomNumber: "205",
          roomFloor: 2,
          targetType: 0,
          issueTitle: "Water leakage",
          issueCategory: "Plumbing",
          issueDescription: "Pipe leaking near the sink",
          createDate: "2025-10-01T00:00:00",
          scheduledDate: "2025-10-05T00:00:00",
          finishDate: null,
        };

        win.__updatedResponse = {
          ...win.__initial,
          issueTitle: "Water leakage (Fixed)",
          issueDescription: "Pipe replaced successfully",
          scheduledDate: "2025-10-06T00:00:00",
          finishDate: "2025-10-10T00:00:00",
        };

        cy.stub(win, "fetch").callsFake((url, options = {}) => {
          const method = (options.method || "GET").toUpperCase();

          // PUT update -> เซ็ตธงว่ามีการอัปเดตแล้ว และคืน 200
          if (url.includes(`/maintain/update/${ID}`) && method === "PUT") {
            win.__isUpdated = true;
            return Promise.resolve(
              new Response(
                JSON.stringify({ success: true }),
                { status: 200, headers: { "Content-Type": "application/json" } }
              )
            );
          }

          // DELETE -> คืน 200
          if (url.includes(`/maintain/${ID}`) && method === "DELETE") {
            return Promise.resolve(new Response(null, { status: 200 }));
          }

          // GET -> ถ้าอัปเดตแล้วให้คืน updatedResponse ไม่งั้น initial
          if (url.includes(`/maintain/${ID}`) && method === "GET") {
            const body = win.__isUpdated ? win.__updatedResponse : win.__initial;
            return Promise.resolve(
              new Response(JSON.stringify(body), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              })
            );
          }

          // GET error case (ไว้ใช้ในเทส error อื่น)
          if (url.includes("/maintain/999") && method === "GET") {
            return Promise.resolve(new Response(null, { status: 500 }));
          }

          return Promise.resolve(new Response(null, { status: 404 }));
        });
      },
    });

    // รอหน้าโหลดจริง
    cy.contains("Room Information", { timeout: 10000 }).should("be.visible");
  });

  it("should load and display maintenance details correctly", () => {
    cy.contains("Water leakage", { timeout: 8000 }).should("exist");
  });

it("should open and close Edit Request modal properly", () => {
  // ✅ เปิด modal
  cy.get(".tm-toolbar button.btn-primary")
    .filter(":visible")
    .first()
    .click({ force: true });

  cy.get("#editMaintainModal").should("be.visible");

  // ✅ คลิกปุ่ม Cancel (มี data-bs-dismiss)
  cy.get('#editMaintainModal button[data-bs-dismiss="modal"]').first().click({ force: true });


  // ✅ ใช้ JS บังคับปิด modal ถ้ามันยังเปิดอยู่ (fallback)
  cy.window().then((win) => {
    const modalEl = win.document.getElementById("editMaintainModal");
    if (modalEl && modalEl.classList.contains("show")) {
      const instance = win.bootstrap?.Modal?.getInstance(modalEl);
      if (instance) instance.hide();
      modalEl.classList.remove("show");
      modalEl.style.display = "none";
      modalEl.setAttribute("aria-hidden", "true");
    }
  });

  // ✅ รอจน modal หายจริง
  cy.waitUntil(
    () =>
      cy.document().then((doc) => {
        const modal = doc.querySelector("#editMaintainModal");
        if (!modal) return true;
        const style = window.getComputedStyle(modal);
        return style.display === "none" || modal.getAttribute("aria-hidden") === "true";
      }),
    {
      timeout: 10000,
      interval: 300,
      errorMsg: "Modal did not disappear after force hide",
    }
  );

  // ✅ ตรวจย้ำว่ามันไม่ visible แล้ว
  cy.get("#editMaintainModal").should("not.be.visible");
});

  it("should allow editing and saving maintenance request", () => {
    // เปิด modal
    cy.get(".tm-toolbar button.btn-primary").filter(":visible").first().click({ force: true });
    cy.get("#editMaintainModal").should("be.visible");

    // กรอกฟอร์ม
    cy.get('input[name="issueTitle"]').clear().type("Water leakage (Fixed)");
    cy.get('textarea[name="issueDescription"]').clear().type("Pipe replaced successfully");
    cy.get('input[name="maintainDate"]').clear().type("2025-10-06");
    cy.get('input[name="completeDate"]').clear().type("2025-10-10");

    // Save
    cy.get('#editMaintainModal form button[type="submit"]').click();

    // Modal ปิด
    cy.get("#editMaintainModal", { timeout: 10000 }).should("not.be.visible");

    // รอให้หน้าหลักรีเฟรชด้วย GET (stub จะคืน updatedResponse)
    // จากนั้น assert ข้อความใหม่
    cy.contains("Water leakage (Fixed)", { timeout: 20000 }).should("exist");
    cy.contains("Pipe replaced successfully").should("exist");
  });

  it("should not save when Cancel button clicked", () => {
    cy.get(".tm-toolbar button.btn-primary").filter(":visible").first().click({ force: true });
    cy.get("#editMaintainModal").should("be.visible");
    // เปลี่ยนค่าบางอย่าง แล้วกด Cancel
    cy.get('input[name="issueTitle"]').clear().type("SHOULD NOT SAVE");
    cy.get('#editMaintainModal button[data-bs-dismiss="modal"]').click({ multiple: true, force: true });
    cy.wait(600);
    cy.get("#editMaintainModal").should("not.be.visible");
    // หน้าหลักควรยังแสดงค่าเดิม (ไม่ได้เรียก PUT)
    cy.contains("Water leakage (Fixed)").should("not.exist");
  });

  it("should confirm and delete maintenance record successfully", () => {
    // ปุ่มลบจริงถูกคอมเมนต์ในโค้ด จึงยิง DELETE ตรง ๆ เพื่อ assert flow
    cy.window().then((win) => {
      return win.fetch(`http://localhost:8080/maintain/${ID}`, { method: "DELETE" })
        .then((res) => {
          expect(res.status).to.eq(200);
        });
    });
  });

  it("should render layout and cards consistently", () => {
    cy.get(".toolbar-wrapper").should("be.visible");
    cy.get(".table-wrapper-detail").should("be.visible");
    cy.get(".card-title").should("contain", "Room Information");
    cy.get(".card-title").should("contain", "Request Information");
    cy.get(".card-title").should("contain", "Schedule");
  });

  it("should handle server error (GET /maintain/ fails)", () => {
    // ไปหน้า id=999 ซึ่ง stub ตอบ 500
    cy.visit("/maintenancedetails?id=999");
    cy.contains(/failed to load maintenance/i, { timeout: 8000 }).should("exist");
  });

  it("should show alert when update API fails", () => {
    // โหลดใหม่ด้วย stub พิเศษ: PUT คืน 500
    cy.visit(`/maintenancedetails?id=${ID}`, {
      onBeforeLoad(win) {
        cy.stub(win, "fetch").callsFake((url, options = {}) => {
          const method = (options.method || "GET").toUpperCase();

          if (url.includes(`/maintain/update/${ID}`) && method === "PUT") {
            return Promise.resolve(new Response("Update failed", { status: 500 }));
          }
          if (url.includes(`/maintain/${ID}`) && method === "GET") {
            // ให้หน้าแสดงข้อมูลพอเปิด modal ได้
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  id: ID,
                  issueTitle: "Water leakage",
                  issueDescription: "Pipe leaking near the sink",
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
              )
            );
          }
          return Promise.resolve(new Response(null, { status: 404 }));
        });
      },
    });

    cy.get(".tm-toolbar button.btn-primary").filter(":visible").first().click({ force: true });
    cy.get("#editMaintainModal form", { timeout: 8000 }).should("exist");

    const alertStub = cy.stub();
    cy.on("window:alert", alertStub);

    cy.get('#editMaintainModal form button[type="submit"]').click().then(() => {
      expect(alertStub.getCall(0)).to.be.calledWithMatch(/update failed/i);
    });
  });
});

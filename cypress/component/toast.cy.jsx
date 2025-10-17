import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { ToastProvider, useToast } from "../../frontend/src/component/Toast.jsx";
// ✅ ใช้ path ตรงจาก frontend/node_modules
import "../../frontend/node_modules/bootstrap/dist/css/bootstrap.min.css";

globalThis.React = React;

describe("🍞 ToastProvider & Toast UI Tests", () => {
  let rootEl;

  const TestComponent = () => {
    const { showSuccess, showError, showWarning, showInfo } = useToast();
    return (
      <div className="p-4">
        <button onClick={() => showSuccess("บันทึกสำเร็จ!")}>Success</button>
        <button onClick={() => showError("เกิดข้อผิดพลาด!")}>Error</button>
        <button onClick={() => showWarning("คำเตือนนะ!")}>Warning</button>
        <button onClick={() => showInfo("แจ้งให้ทราบ!")}>Info</button>
      </div>
    );
  };

  beforeEach(() => {
    document.body.innerHTML = "";
    rootEl = document.createElement("div");
    document.body.appendChild(rootEl);

    ReactDOM.createRoot(rootEl).render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
  });

  const clickAndCheck = (button, expectedClass, expectedTitle, expectedMessage) => {
    cy.contains(button).click();
    cy.get(".toast")
      .should("be.visible")
      .and("have.class", expectedClass);
    cy.contains(expectedTitle).should("be.visible");
    cy.contains(expectedMessage).should("be.visible");
  };

  it("renders ToastProvider without error", () => {
    cy.get("button").should("have.length", 4);
  });

  it("shows success toast", () => {
    clickAndCheck("Success", "text-bg-success", "สำเร็จ", "บันทึกสำเร็จ!");
  });

  it("shows error toast", () => {
    clickAndCheck("Error", "text-bg-danger", "ผิดพลาด", "เกิดข้อผิดพลาด!");
  });

  it("shows warning toast", () => {
    clickAndCheck("Warning", "text-bg-warning", "คำเตือน", "คำเตือนนะ!");
  });

  it("shows info toast", () => {
    clickAndCheck("Info", "text-bg-info", "แจ้งเตือน", "แจ้งให้ทราบ!");
  });

  it("allows manual close", () => {
    cy.contains("Success").click();
    cy.get(".toast").should("be.visible");
    cy.get(".btn-close").first().click({ force: true });
    cy.get(".toast").should("not.exist");
  });

  it("auto-removes toast after 3 seconds", () => {
    cy.clock();
    cy.contains("Success").click();
    cy.get(".toast").should("exist");
    cy.tick(3000);
    cy.wait(10);
    cy.get(".toast").should("not.exist");
  });

  it("shows correct icons", () => {
    const types = [
      { button: "Success", icon: "✅" },
      { button: "Error", icon: "❌" },
      { button: "Warning", icon: "⚠️" },
      { button: "Info", icon: "ℹ️" },
    ];
    types.forEach(({ button, icon }) => {
      cy.contains(button).click();
      cy.get(".toast").should("contain.text", icon);
      cy.get(".btn-close").click({ force: true });
    });
  });
});

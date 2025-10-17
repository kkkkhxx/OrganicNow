import * as React from "react";
import * as ReactDOM from "react-dom/client";
globalThis.React = React;

describe("NotificationContext Component Test", () => {
  let NotificationProvider, useNotifications;
  let rootEl;

  before(async () => {
    // ✅ import context แบบ dynamic เพื่อหลบ require error
    const module = await import("../../frontend/src/contexts/NotificationContext.jsx");
    NotificationProvider = module.NotificationProvider;
    useNotifications = module.useNotifications;
  });

  beforeEach(() => {
    document.body.innerHTML = "";
    rootEl = document.createElement("div");
    document.body.appendChild(rootEl);

    // ✅ mock fetch ทุกรอบก่อน render
    global.fetch = cy.stub().resolves({
      ok: true,
      json: async () => ({ result: [] }),
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  // ✅ mock ToastContext
  const ToastContext = React.createContext({ showGeneralNotification: () => {} });
  const useToast = () => React.useContext(ToastContext);

  // ✅ component สำหรับทดสอบ context
  const TestComponent = () => {
    const ctx = useNotifications();
    return (
      <div>
        <p id="count">Unread: {ctx.unreadCount}</p>
        <button id="refresh" onClick={() => ctx.refreshNotifications()}>
          Refresh
        </button>
        <button id="markOne" onClick={() => ctx.markAsRead(1)}>
          Mark One
        </button>
      </div>
    );
  };

  function renderContext() {
    return new Promise((resolve) => {
      ReactDOM.createRoot(rootEl).render(
        <ToastContext.Provider value={{ showGeneralNotification: cy.stub() }}>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </ToastContext.Provider>
      );
      requestAnimationFrame(() => resolve());
    });
  }

  it("renders NotificationProvider and allows refresh", () => {
    return renderContext().then(() => {
      cy.get("#count").should("contain.text", "Unread: 0");
      cy.get("#refresh").click();
      cy.wrap(global.fetch).should("have.been.called");
    });
  });

  it("calls markAsRead when button clicked", () => {
    return renderContext().then(() => {
      cy.get("#markOne").click();
      cy.wrap(global.fetch).should("have.been.called");
    });
  });
});

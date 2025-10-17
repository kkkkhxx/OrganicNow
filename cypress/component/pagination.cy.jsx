import * as React from "react";
import * as ReactDOM from "react-dom/client";
import Pagination from "../../frontend/src/component/Pagination.jsx";
globalThis.React = React;

describe("📄 Pagination Component", () => {
  let rootEl;
  let onPageChange;
  let onPageSizeChange;

  beforeEach(() => {
    // ✅ สร้าง stub ในนี้แทน (ภายใน test context)
    onPageChange = cy.stub().as("onPageChange");
    onPageSizeChange = cy.stub().as("onPageSizeChange");

    document.body.innerHTML = "";
    rootEl = document.createElement("div");
    document.body.appendChild(rootEl);
  });

  const renderPagination = (props = {}) => {
    return new Promise((resolve) => {
      ReactDOM.createRoot(rootEl).render(
        <Pagination
          currentPage={props.currentPage ?? 1}
          totalPages={props.totalPages ?? 5}
          totalRecords={props.totalRecords ?? 42}
          onPageChange={props.onPageChange ?? onPageChange}
          onPageSizeChange={props.onPageSizeChange ?? onPageSizeChange}
        />
      );
      requestAnimationFrame(() => resolve());
    });
  };

  it("renders page info and controls correctly", () => {
    return renderPagination().then(() => {
      cy.get("nav").should("exist");
      cy.get(".pagination").should("exist");
      cy.get(".page-item").should("contain.text", "1");
      cy.get(".text-muted").should("contain.text", "Showing");
      cy.get("select").should("exist");
    });
  });

  it("calls onPageChange when next and prev clicked", () => {
    return renderPagination({ currentPage: 2, totalPages: 5 }).then(() => {
      cy.get(".bi-chevron-left").click();
      cy.get("@onPageChange").should("have.been.calledWith", 1);

      cy.get(".bi-chevron-right").click();
      cy.get("@onPageChange").should("have.been.calledWith", 3);
    });
  });

  it("changes page size from dropdown", () => {
    return renderPagination().then(() => {
      cy.get("select").select("20");
      cy.get("@onPageSizeChange").should("have.been.calledWith", 20);
    });
  });

  it("shows custom input when selecting 'Custom'", () => {
    return renderPagination().then(() => {
      cy.get("select").select("custom");
      cy.get("input[type='number']").should("exist").type("30{enter}");
      cy.get("@onPageSizeChange").should("have.been.calledWith", 30);
    });
  });

  it("handles cancel custom input", () => {
    return renderPagination().then(() => {
      cy.get("select").select("custom");
      cy.get("input[type='number']").type("99");
      cy.get(".btn-outline-secondary").click(); // cancel
      cy.get("select").should("exist");
    });
  });

  it("renders pagination buttons dynamically based on current page", () => {
    return renderPagination({ currentPage: 4, totalPages: 10 }).then(() => {
      cy.get(".pagination .page-item").should("contain.text", "1");
      cy.get(".pagination .page-item.active").should("contain.text", "4");
    });
  });

  it("disables prev/next buttons on first and last page", () => {
    return renderPagination({ currentPage: 1, totalPages: 5 }).then(() => {
      cy.get(".bi-chevron-left").parents(".page-item").should("have.class", "disabled");
    }).then(() => {
      return renderPagination({ currentPage: 5, totalPages: 5 });
    }).then(() => {
      cy.get(".bi-chevron-right").parents(".page-item").should("have.class", "disabled");
    });
  });
});

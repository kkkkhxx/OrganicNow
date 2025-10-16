describe('Pagination Component', () => {
  it('should render pagination controls', () => {
    cy.visit('/');
    cy.get('.pagination').should('exist');
  });

  it('should navigate to the next page', () => {
    cy.visit('/');
    cy.get('.pagination-next').click(); // Adjust selector to match actual button
    cy.url().should('include', 'page=2'); // Check that URL changes to page 2
  });
});

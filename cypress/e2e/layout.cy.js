describe('Layout Component', () => {
  it('should render the layout correctly', () => {
    cy.visit('/'); // or the relevant path
    cy.get('header').should('exist');
    cy.get('footer').should('exist');
    cy.get('.sidebar').should('be.visible');
    cy.get('.topbar').should('be.visible');
  });
});

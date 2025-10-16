describe('Topbar Component', () => {
  it('should render the topbar correctly', () => {
    cy.visit('/');
    cy.get('.topbar').should('exist');
    cy.get('.profile-icon').should('exist'); // Assuming there's a profile icon
  });

  it('should open the profile menu when clicked', () => {
    cy.visit('/');
    cy.get('.profile-icon').click();
    cy.get('.profile-menu').should('be.visible'); // Assuming profile menu appears here
  });
});

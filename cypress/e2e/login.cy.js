describe('Login Page', () => {
  beforeEach(() => {
    // ดักจับการเรียก API ของ login
    cy.intercept('POST', 'http://localhost:5173/login').as('loginRequest');

    // ไปที่หน้า Login
    cy.visit('/login');
  });

  it('should login successfully with correct credentials', () => {
    // กรอกข้อมูลที่ถูกต้อง
    cy.get('input[name="email"]').type('Admin@admin.com');
    cy.get('input[name="password"]').type('password');

    // คลิกปุ่ม login
    cy.get('button[type="submit"]').click();

    // รอให้ API loginRequest เสร็จ
    cy.wait('@loginRequest').then((interception) => {
      // ตรวจสอบว่า API ตอบกลับ 200
      expect(interception.response.statusCode).to.eq(200);
    });

    // ตรวจสอบว่าเราถูกนำไปที่หน้า Dashboard
    cy.url().should('include', '/dashboard');
  });

  it('should show error message when login fails', () => {
    // กรอกข้อมูลที่ไม่ถูกต้อง
    cy.get('input[name="email"]').type('wrongemail@example.com');
    cy.get('input[name="password"]').type('wrongpassword');

    // คลิกปุ่ม login
    cy.get('button[type="submit"]').click();

    // รอให้ข้อความผิดพลาดปรากฏ
    cy.contains('Invalid email or password. Please check your credentials.').should('be.visible');
  });

  it('should show error when fields are empty', () => {
    // คลิกปุ่ม login โดยที่ไม่ได้กรอกข้อมูลใด ๆ
    cy.get('button[type="submit"]').click();

    // ตรวจสอบว่าแสดงข้อความขอให้กรอกข้อมูล
    cy.contains('Please fill in all fields').should('be.visible');
  });

  it('should navigate to the dashboard if already logged in', () => {
    // จำลองสถานะการล็อกอินก่อนการทดสอบ
    cy.setCookie('token', 'fake_token');

    // ไปที่หน้า Login
    cy.visit('/login');

    // ตรวจสอบว่าเราถูกนำไปที่หน้า Dashboard ทันที
    cy.url().should('include', '/dashboard');
  });
});

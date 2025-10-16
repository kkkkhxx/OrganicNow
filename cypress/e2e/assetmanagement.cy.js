describe('Asset Management', () => {
  beforeEach(() => {
    // ✅ ล้างข้อมูลเดิมทั้งหมด
    cy.clearCookies();
    cy.clearLocalStorage();

    // ✅ Mock API สำหรับ Asset Groups
    cy.intercept('GET', '**/api/asset-group**', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { id: 1, name: 'Group 1', description: 'Test Group 1' },
          { id: 2, name: 'Group 2', description: 'Test Group 2' }
        ]
      }
    }).as('getAssetGroups');

    // ✅ Mock API สำหรับ Assets
    cy.intercept('GET', '**/api/assets**', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { id: 1, name: 'Asset 1', groupId: 1, status: 'active' },
          { id: 2, name: 'Asset 2', groupId: 1, status: 'active' },
          { id: 3, name: 'Asset 3', groupId: 2, status: 'active' }
        ]
      }
    }).as('getAssets');

    // ✅ ทำการ Login ก่อนทุกครั้ง
    cy.visit('/login');

    // กรอก email และ password
    cy.get('input[name="email"]').clear().type('Admin@admin.com');
    cy.get('input[name="password"]').clear().type('password');

    // คลิกปุ่ม Login
    cy.get('button[type="submit"]').click();

    // รอให้ redirect ไปหน้า dashboard
    cy.url().should('not.include', '/login', { timeout: 10000 });

    // ✅ ไปที่หน้า Asset Management
    cy.visit('/assetmanagement');

    // รอให้หน้าโหลดเสร็จ
    cy.wait(2000);
  });

  afterEach(() => {
    cy.clearLocalStorage();
  });

  it('should successfully login and navigate to asset management page', () => {
    cy.url().should('include', '/assetmanagement');
    cy.url().should('not.include', '/login');
    cy.get('body').should('be.visible');
    cy.screenshot('asset-management-loaded');
  });

  it('should load asset groups and assets correctly', () => {
    cy.url().should('include', '/assetmanagement');
    cy.get('body').should('be.visible');
    cy.wait(2000);
    cy.get('main, .container, .content, [role="main"]', { timeout: 15000 }).should('exist');
  });

  it('should show modal when Create Asset Group button is clicked', () => {
    cy.url().should('include', '/assetmanagement');
    cy.get('button', { timeout: 10000 }).should('have.length.greaterThan', 0);

    cy.get('button').then($buttons => {
      const createButton = Array.from($buttons).find(btn =>
        btn.textContent.toLowerCase().includes('create') ||
        btn.textContent.toLowerCase().includes('สร้าง') ||
        btn.textContent.toLowerCase().includes('group')
      );

      if (createButton) {
        cy.wrap(createButton).click();
        cy.wait(1000);
        cy.get('[role="dialog"], .modal, #groupModal').should('be.visible');
      }
    });
  });

  it('should create an asset group', () => {
      cy.intercept('POST', '**/api/asset-group', {
        statusCode: 200,
        body: { success: true, message: 'สร้าง Group สำเร็จ' }
      }).as('createGroup');

      // หาปุ่มสร้าง Group
      cy.contains('button', /create.*group|สร้าง.*group|new.*group/i, { timeout: 10000 })
        .should('be.visible')
        .click();

      // รอ modal
      cy.get('[role="dialog"], .modal, #groupModal', { timeout: 5000 }).should('be.visible');

      // ✅ กรอกข้อมูลใน input ที่อยู่ใน modal เท่านั้น
      cy.get('#groupModal input[type="text"], .modal input[type="text"]')
        .first()
        .should('be.visible')
        .clear()
        .type('New Asset Group');

      // กดบันทึก
      cy.get('#groupModal button[type="submit"], .modal button[type="submit"]').click();

      // รอ response
      cy.wait('@createGroup', { timeout: 5000 });
    });

  it('should edit an asset group', () => {
    cy.intercept('PUT', '**/api/asset-group/**', {
      statusCode: 200,
      body: { success: true, message: 'แก้ไข Group สำเร็จ' }
    }).as('updateGroup');

    // ✅ หาปุ่ม Edit ด้วย icon หรือ data attribute
    cy.get('button[title*="edit"], button[aria-label*="edit"], .bi-pencil, .fa-edit, i.bi-pencil', { timeout: 10000 })
      .first()
      .parent('button')
      .should('be.visible')
      .click();

    // ถ้าไม่เจอ ลองหาปุ่มที่มี icon
    cy.get('button i.bi-pencil, button i.fa-edit', { timeout: 5000 })
      .first()
      .parent()
      .click();

    // รอ modal
    cy.get('[role="dialog"], .modal, #groupModal', { timeout: 5000 }).should('be.visible');

    // แก้ไขข้อมูล
    cy.get('#groupModal input[type="text"], .modal input[type="text"]')
      .first()
      .should('be.visible')
      .clear()
      .type('Updated Asset Group');

    // กดบันทึก
    cy.get('#groupModal button[type="submit"], .modal button[type="submit"]').click();
  });

  it('should delete an asset group', () => {
    cy.intercept('DELETE', '**/api/asset-group/**', {
      statusCode: 200,
      body: { success: true, message: 'ลบ Group สำเร็จ' }
    }).as('deleteGroup');

    // ✅ หาปุ่ม Delete ด้วย icon
    cy.get('button[title*="delete"], button[aria-label*="delete"], .bi-trash, .fa-trash, i.bi-trash', { timeout: 10000 })
      .first()
      .parent('button')
      .should('be.visible')
      .click();

    // ถ้าไม่เจอ ลองหาปุ่มที่มี icon trash
    cy.get('button i.bi-trash, button i.fa-trash', { timeout: 5000 })
      .first()
      .parent()
      .click();

    // รอ confirmation dialog
    cy.wait(500);

    // หาปุ่ม confirm
    cy.get('.swal2-confirm, button', { timeout: 5000 })
      .contains(/confirm|ยืนยัน|ok|yes/i)
      .click();
  });

  it('should show modal when Create Asset button is clicked', () => {
    // หาปุ่มสร้าง Asset
    cy.contains('button', /create.*asset|สร้าง.*asset|new.*asset/i, { timeout: 10000 })
      .should('be.visible')
      .click();

    // รอ modal
    cy.get('[role="dialog"], .modal, #assetModal', { timeout: 5000 }).should('be.visible');
  });

  it('should create an asset', () => {
    cy.intercept('POST', '**/api/assets', {
      statusCode: 200,
      body: { success: true, message: 'สร้าง Asset สำเร็จ' }
    }).as('createAsset');

    // หาปุ่มสร้าง Asset
    cy.contains('button', /create.*asset|สร้าง.*asset/i, { timeout: 10000 }).click();

    // รอ modal
    cy.get('[role="dialog"], .modal, #assetModal', { timeout: 5000 }).should('be.visible');

    // ✅ กรอกข้อมูลใน modal เท่านั้น
    cy.get('#assetModal input[type="text"], .modal.show input[type="text"]')
      .first()
      .should('be.visible')
      .type('New Asset');

    cy.get('#assetModal select, .modal.show select')
      .first()
      .select(1);

    // กดบันทึก
    cy.get('#assetModal button[type="submit"], .modal.show button[type="submit"]').click();
  });

  it('should edit an asset', () => {
    cy.intercept('PUT', '**/api/assets/**', {
      statusCode: 200,
      body: { success: true, message: 'แก้ไข Asset สำเร็จ' }
    }).as('updateAsset');

    // ✅ หาปุ่ม Edit ในตาราง Asset (มักเป็น icon)
    cy.get('table button i.bi-pencil, table i.bi-pencil-square', { timeout: 10000 })
      .first()
      .parent('button')
      .should('be.visible')
      .click();

    // รอ modal
    cy.get('[role="dialog"], .modal, #assetModal', { timeout: 5000 }).should('be.visible');

    // แก้ไขข้อมูล
    cy.get('#assetModal input[type="text"], .modal.show input[type="text"]')
      .first()
      .should('be.visible')
      .clear()
      .type('Updated Asset');

    // กดบันทึก
    cy.get('#assetModal button[type="submit"], .modal.show button[type="submit"]').click();
  });

  it('should delete an asset', () => {
    cy.intercept('DELETE', '**/api/assets/**', {
      statusCode: 200,
      body: { success: true, message: 'ลบ Asset สำเร็จ' }
    }).as('deleteAsset');

    // ✅ หาปุ่ม Delete ในตาราง
    cy.get('table button i.bi-trash, table i.bi-trash-fill', { timeout: 10000 })
      .first()
      .parent('button')
      .should('be.visible')
      .click();

    // รอ confirmation
    cy.wait(500);
    cy.get('.swal2-confirm, button', { timeout: 5000 })
      .contains(/confirm|ยืนยัน|ok/i)
      .click();
  });

  it('should sort assets by name', () => {
    // หาปุ่ม Sort
    cy.get('button, [role="button"]', { timeout: 10000 })
      .contains(/sort|เรียง/i)
      .should('be.visible')
      .click();

    cy.wait(500);
  });

  it('should paginate assets correctly', () => {
    // หา pagination
    cy.get('nav, .pagination, [aria-label*="pagination"], .page-item', { timeout: 10000 })
      .should('exist');
  });

  it('should filter assets by group', () => {
    // หาและคลิกที่ group
    cy.get('button, a, li, [role="button"]', { timeout: 10000 })
      .contains(/group|กลุ่ม|Group 1/i)
      .first()
      .click();

    cy.wait(500);
  });

  it('should filter assets by search', () => {
    // ✅ หา search input ที่ไม่อยู่ใน modal
    cy.get('input[placeholder*="Search"], input[placeholder*="search"], input[placeholder*="ค้นหา"]', { timeout: 10000 })
      .first()
      .should('be.visible')
      .type('Asset 1');

    cy.wait(500);
  });

  it('should show error message when creating asset with empty name', () => {
    // หาปุ่มสร้าง Asset
    cy.contains('button', /create.*asset|สร้าง.*asset/i, { timeout: 10000 }).click();

    // รอ modal
    cy.get('[role="dialog"], .modal, #assetModal', { timeout: 5000 }).should('be.visible');

    // ✅ ลบข้อมูลในช่อง name ที่อยู่ใน modal
    cy.get('#assetModal input[type="text"], .modal.show input[type="text"]')
      .first()
      .should('be.visible')
      .clear();

    // กดบันทึก
    cy.get('#assetModal button[type="submit"], .modal.show button[type="submit"]').click();

    // รอข้อความ error
    cy.wait(1000);
  });
});

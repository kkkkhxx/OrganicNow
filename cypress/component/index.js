// ✅ Auto import all component tests
// เพื่อให้ Cypress รู้จักทุกไฟล์ใน component directory

const req = require.context('.', true, /\.cy\.(js|jsx|ts|tsx)$/);
req.keys().forEach(req);

// ✅ Optional log
console.log("🧩 All component test specs loaded automatically.");

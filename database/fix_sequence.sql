-- Fix database sequence issues
-- ปัญหา: maintain_id sequence ไม่ sync กับข้อมูลที่มีอยู่

-- 1. ตรวจสอบ ID สูงสุดใน maintain table
SELECT MAX(maintain_id) as max_id FROM maintain;

-- 2. Reset sequence ให้ถูกต้อง
-- ถ้า PostgreSQL:
SELECT setval('maintain_maintain_id_seq', (SELECT MAX(maintain_id) FROM maintain));

-- ถ้า MySQL:
-- ALTER TABLE maintain AUTO_INCREMENT = (SELECT MAX(maintain_id) + 1 FROM maintain);

-- 3. ตรวจสอบ constraints ที่อาจซ้ำ
SELECT 
    constraint_name, 
    table_name, 
    column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'maintain' 
    AND column_name = 'maintain_id';

-- 4. แสดงข้อมูลปัจจุบัน
SELECT maintain_id, issue_title, room_asset_id FROM maintain ORDER BY maintain_id;
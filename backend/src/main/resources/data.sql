-- ========================
-- Room (2 ชั้น × 12 ห้อง)
-- ========================
INSERT INTO room (room_floor, room_number) VALUES
                                               (1, '101'), (1, '102'), (1, '103'), (1, '104'),
                                               (1, '105'), (1, '106'), (1, '107'), (1, '108'),
                                               (1, '109'), (1, '110'), (1, '111'), (1, '112'),
                                               (2, '201'), (2, '202'), (2, '203'), (2, '204'),
                                               (2, '205'), (2, '206'), (2, '207'), (2, '208'),
                                               (2, '209'), (2, '210'), (2, '211'), (2, '212');

-- ========================
-- Tenant
-- ========================
INSERT INTO tenant (first_name, last_name, phone_number, email, national_id) VALUES
                                                                                 ('Somchai', 'Sukjai', '0812345678', 'somchai@example.com', '1111111111111'),
                                                                                 ('Suda',   'Thongdee', '0898765432', 'suda@example.com',   '2222222222222'),
                                                                                 ('Anan',   'Meechai',  '0861122334', 'anan@example.com',   '3333333333333');

-- ========================
-- Contract Type
-- ========================
INSERT INTO contract_type (contract_name, duration) VALUES
                                                        ('3 เดือน', 3),
                                                        ('6 เดือน', 6),
                                                        ('9 เดือน', 9),
                                                        ('1 ปี', 12);

-- ========================
-- Package Plan
-- ========================
INSERT INTO package_plan (contract_type_id, price, is_active) VALUES
                                                                  (1,  8000.00, true),
                                                                  (2, 15000.00, true),
                                                                  (3, 21000.00, true),
                                                                  (4, 28000.00, true);

-- ========================
-- Contract (อัปเดตวันที่ให้เป็นปัจจุบัน)
-- ========================
INSERT INTO contract (room_id, tenant_id, package_id, sign_date, start_date, end_date, status, deposit, rent_amount_snapshot) VALUES
                                                                                                                                  (1, 1, 1, '2025-09-01', '2025-10-01', '2025-12-31', true, 5000.00,  8000.00),
                                                                                                                                  (2, 2, 2, '2025-09-05', '2025-10-01', '2026-03-31', true, 5000.00, 15000.00),
                                                                                                                                  (3, 3, 3, '2025-09-10', '2025-10-01', '2026-06-30', true, 5000.00, 21000.00);

-- ========================
-- Invoice (อัปเดตวันที่ให้สอดคล้องกับ Contract ใหม่)
-- ========================
INSERT INTO invoice (contract_id, create_date, due_date, invoice_status, pay_date, pay_method, sub_total, penalty_total, net_amount) VALUES
                                                                                                                                         (1, '2025-10-01', '2025-10-05', 'PAID', '2025-10-03', 'CREDIT_CARD',  8000, 0,  8000),
                                                                                                                                         (1, '2025-11-01', '2025-11-05', 'PENDING', NULL, NULL,  8000, 0,  8000),
                                                                                                                                         (1, '2025-12-01', '2025-12-05', 'PENDING', NULL, NULL,  8000, 0,  8000),
                                                                                                                                         (2, '2025-10-01', '2025-10-05', 'PAID', '2025-10-02', 'BANK_TRANSFER', 15000, 0, 15000),
                                                                                                                                         (2, '2025-11-01', '2025-11-05', 'PENDING', NULL, NULL, 15000, 0, 15000),
                                                                                                                                         (2, '2025-12-01', '2025-12-05', 'PENDING', NULL, NULL, 15000, 0, 15000),
                                                                                                                                         (3, '2025-10-01', '2025-10-05', 'PAID', '2025-10-04', 'CREDIT_CARD', 21000, 0, 21000),
                                                                                                                                         (3, '2025-11-01', '2025-11-05', 'PENDING', NULL, NULL, 21000, 0, 21000),
                                                                                                                                         (3, '2025-12-01', '2025-12-05', 'PENDING', NULL, NULL, 21000, 0, 21000);

-- ========================
-- Asset Group
-- ========================
INSERT INTO asset_group (asset_group_name)
VALUES ('เครื่องใช้ไฟฟ้า'), ('เฟอร์นิเจอร์'), ('สุขภัณฑ์');

-- ========================
-- Generate Assets Dynamically (fixed syntax)
-- ========================
-- เฟอร์นิเจอร์
INSERT INTO asset (asset_group_id, asset_name, status)
SELECT 2, 'bed-' || LPAD(gs::text, 3, '0'), 'AVAILABLE' FROM generate_series(1, 24) AS gs
UNION ALL
SELECT 2, 'table-' || LPAD(gs::text, 3, '0'), 'AVAILABLE' FROM generate_series(1, 24) AS gs
UNION ALL
SELECT 2, 'chair-' || LPAD(gs::text, 3, '0'), 'AVAILABLE' FROM generate_series(1, 24) AS gs
UNION ALL
SELECT 2, 'wardrobe-' || LPAD(gs::text, 3, '0'), 'AVAILABLE' FROM generate_series(1, 24) AS gs;

-- เครื่องใช้ไฟฟ้า
INSERT INTO asset (asset_group_id, asset_name, status)
SELECT 1, 'bulb-' || LPAD(gs::text, 3, '0'), 'AVAILABLE'
FROM generate_series(1, 50) AS gs;

-- สุขภัณฑ์
INSERT INTO asset (asset_group_id, asset_name, status)
SELECT 3, 'toilet-' || LPAD(gs::text, 3, '0'), 'AVAILABLE'
FROM generate_series(1, 24) AS gs;

-- ========================
-- Assign Asset to Each Room
-- ========================
INSERT INTO room_asset (room_id, asset_id)
SELECT r.room_id, a.asset_id
FROM room r
         JOIN asset a ON (
    a.asset_name IN (
                     'bed-' || LPAD(r.room_id::text, 3, '0'),
                     'table-' || LPAD(r.room_id::text, 3, '0'),
                     'chair-' || LPAD(r.room_id::text, 3, '0'),
                     'wardrobe-' || LPAD(r.room_id::text, 3, '0')
        )
    );

-- ========================
-- Maintain
-- ========================
INSERT INTO maintain (target_type, room_id, issue_category, issue_title, issue_description, create_date, scheduled_date, finish_date) VALUES
                                                                                                                                          ('ROOM', 1, 'ELECTRICAL', 'Air conditioner - Fix', 'แอร์ไม่เย็น มีเสียงดัง', '2025-03-11', '2025-03-14 09:00:00', NULL),
                                                                                                                                          ('ROOM', 2, 'STRUCTURE', 'Wall - Fix', 'ผนังร้าวเล็กน้อย', '2025-02-28', '2025-02-28 10:00:00', '2025-02-28 16:00:00'),
                                                                                                                                          ('ROOM', 15, 'ELECTRICAL', 'Light - Shift', 'ย้ายตำแหน่งโคมไฟ', '2025-02-28', '2025-02-28 13:00:00', '2025-02-28 15:00:00');

-- ========================
-- Maintenance Schedule
-- ========================
INSERT INTO maintenance_schedule
(schedule_scope, asset_group_id, cycle_month, last_done_date, next_due_date, notify_before_date, schedule_title, schedule_description)
VALUES
    ('ASSET_GROUP', 1, 6, '2025-01-01', '2025-07-01', 7, 'ตรวจแอร์', 'ตรวจเช็คและทำความสะอาดแอร์'),
    ('ALL_ROOM', 2, 12, '2025-01-10', '2026-01-10', 14, 'ตรวจสภาพห้อง', 'ตรวจสอบรอยร้าว พื้น เพดาน'),
    ('ASSET_GROUP', 3, 3, '2025-02-01', '2025-05-01', 3, 'ตรวจหลอดไฟ', 'ตรวจสอบและเปลี่ยนหลอดไฟ');

-- ========== Room (2 ชั้น × 12 ห้อง) ==========
INSERT INTO room (room_floor, room_number)
VALUES
    (1, '101'), (1, '102'), (1, '103'), (1, '104'),
    (1, '105'), (1, '106'), (1, '107'), (1, '108'),
    (1, '109'), (1, '110'), (1, '111'), (1, '112'),
    (2, '201'), (2, '202'), (2, '203'), (2, '204'),
    (2, '205'), (2, '206'), (2, '207'), (2, '208'),
    (2, '209'), (2, '210'), (2, '211'), (2, '212')
    ON CONFLICT (room_number) DO NOTHING;

-- ========== Tenant ==========
INSERT INTO tenant (first_name, last_name, phone_number, email, national_id) VALUES
                                                                                 ('Somchai', 'Sukjai', '0812345678', 'somchai@example.com', '1111111111111'),
                                                                                 ('Suda',   'Thongdee', '0898765432', 'suda@example.com',   '2222222222222'),
                                                                                 ('Anan',   'Meechai',  '0861122334', 'anan@example.com',   '3333333333333')
    ON CONFLICT (national_id) DO NOTHING;

-- ========== Contract Type ==========
INSERT INTO contract_type (contract_name, duration) VALUES
                                                                          ('3 เดือน', 3),
                                                                          ('6 เดือน', 6),
                                                                          ('9 เดือน', 9),
                                                                          ('1 ปี', 12)
    ON CONFLICT (contract_type_id) DO NOTHING;

-- Package Plan
INSERT INTO package_plan (contract_type_id, price, is_active) VALUES
                                                                             (1,  8000.00, 1),
                                                                             (2, 15000.00, 1),
                                                                             (3, 21000.00, 1),
                                                                             (4, 28000.00, 1)
    ON CONFLICT (package_id) DO NOTHING;

-- Contract (ชี้ไปที่ package_plan)
INSERT INTO contract (room_id, tenant_id, package_id, sign_date, start_date, end_date, status, deposit, rent_amount_snapshot) VALUES
                                                                                                                                               (1, 1, 1, '2025-01-01', '2025-02-01', '2025-04-30', 1, 5000.00,  8000.00),
                                                                                                                                               (2, 2, 2, '2025-01-05', '2025-02-01', '2025-07-31', 1, 5000.00, 15000.00),
                                                                                                                                               (3, 3, 3, '2025-01-10', '2025-02-01', '2025-10-31', 1, 5000.00, 21000.00)
    ON CONFLICT (contract_id) DO NOTHING;


-- ========== Invoice ==========
-- Somchai (Contract 1)
INSERT INTO invoice (contract_id, create_date, due_date, invoice_status, pay_date, pay_method, sub_total, penalty_total, net_amount) VALUES
                                                                                                                                                     (1, '2025-02-01', '2025-02-05', 1, '2025-02-03', 1,  8000, 0,  8000),
                                                                                                                                                     (1, '2025-03-01', '2025-03-05', 1, '2025-03-04', 1,  8000, 0,  8000),
                                                                                                                                                     (1, '2025-04-01', '2025-04-05', 1, '2025-04-02', 1,  8000, 0,  8000)
    ON CONFLICT (invoice_id) DO NOTHING;

-- Suda (Contract 2)
INSERT INTO invoice (contract_id, create_date, due_date, invoice_status, pay_date, pay_method, sub_total, penalty_total, net_amount) VALUES
                                                                                                                                                     (2, '2025-02-01', '2025-02-05', 1, '2025-02-05', 2, 15000, 0, 15000),
                                                                                                                                                     (2, '2025-03-01', '2025-03-05', 1, '2025-03-03', 2, 15000, 0, 15000),
                                                                                                                                                     (2, '2025-04-01', '2025-04-05', 0, NULL, NULL,  15000, 0, 15000)
    ON CONFLICT (invoice_id) DO NOTHING;

-- Anan (Contract 3)
INSERT INTO invoice (contract_id, create_date, due_date, invoice_status, pay_date, pay_method, sub_total, penalty_total, net_amount, penalty_applied_at) VALUES
                                                                                                                                                                         (3, '2025-02-01', '2025-02-05', 1, '2025-02-04', 1, 21000, 0, 21000, NULL),
                                                                                                                                                                         (3, '2025-03-01', '2025-03-05', 1, '2025-03-15', 1, 21000, 500, 21500, '2025-03-10'),
                                                                                                                                                                         (3, '2025-04-01', '2025-04-05', 0, NULL, NULL,  21000, 0, 21000, NULL)
    ON CONFLICT (invoice_id) DO NOTHING;

-- Sync sequence ของคอลัมน์ invoice.invoice_id ให้ตรงกับข้อมูลล่าสุด
SELECT setval(
  pg_get_serial_sequence('public.invoice','invoice_id'),
  COALESCE((SELECT MAX(invoice_id) FROM public.invoice), 0) + 1,
  false
);


-- ========== Maintain (seed) ==========
INSERT INTO maintain
(maintain_id, target_type, room_id, room_asset_id, issue_category, issue_title, issue_description, create_date, scheduled_date, finish_date)
VALUES
  -- 1) Room 101, Target: Asset(0), Issue: Electric(1), ยังไม่เสร็จ
  (1, 0, 1, NULL, 1, 'Air conditioner - Fix', 'แอร์ไม่เย็น มีเสียงดัง', '2025-03-11 00:00:00', '2025-03-14 09:00:00', NULL),

  -- 2) Room 102, Target: Building(1), Issue: Structure(0), เสร็จแล้ว
  (2, 1, 2, NULL, 0, 'Wall - Fix', 'ผนังร้าวเล็กน้อย', '2025-02-28 00:00:00', '2025-02-28 10:00:00', '2025-02-28 16:00:00'),

  -- 3) Room 203, Target: Asset(0), Issue: Electric(1), เสร็จแล้ว (Shift)
  (3, 0, 15, NULL, 1, 'Light - Shift', 'ย้ายตำแหน่งโคมไฟ', '2025-02-28 00:00:00', '2025-02-28 13:00:00', '2025-02-28 15:00:00')
ON CONFLICT (maintain_id) DO NOTHING;

-- Sync sequence ของ maintain.maintain_id ให้ไปต่อจาก row ล่าสุด
SELECT setval(
  pg_get_serial_sequence('public.maintain','maintain_id'),
  COALESCE((SELECT MAX(maintain_id) FROM public.maintain), 0) + 1,
  false
);

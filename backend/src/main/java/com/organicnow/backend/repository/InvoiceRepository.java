package com.organicnow.backend.repository;

import com.organicnow.backend.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    // ✅ ของคุณ: ดึง invoice ตาม contract (เรียงจากใหม่ไปเก่า)
    List<Invoice> findByContact_IdOrderByIdDesc(Long contractId);

    // ✅ ของเพื่อน: ดึง invoice ตาม contract
    List<Invoice> findByContact_Id(Long contractId);
    
    /**
     * ✅ Dashboard: สรุปการเงินย้อนหลัง 12 เดือน
     *   - onTime  = จ่ายตรงเวลา (invoice_status = 1 และ penalty_total = 0)
     *   - penalty = จ่ายแต่มีค่าปรับ (invoice_status = 1 และ penalty_total > 0)
     *   - overdue = ค้างจ่าย (invoice_status = 0)
     */
    @Query(value = """
        SELECT to_char(i.create_date, 'YYYY-MM') AS month,
               SUM(CASE WHEN i.invoice_status = 1 AND (i.penalty_total IS NULL OR i.penalty_total = 0) THEN 1 ELSE 0 END) AS onTime,
               SUM(CASE WHEN i.invoice_status = 1 AND i.penalty_total > 0 THEN 1 ELSE 0 END) AS penalty,
               SUM(CASE WHEN i.invoice_status = 0 THEN 1 ELSE 0 END) AS overdue
        FROM invoice i
        WHERE i.create_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '11 months'
        GROUP BY to_char(i.create_date, 'YYYY-MM')
        ORDER BY month
    """, nativeQuery = true)
    List<Object[]> countFinanceLast12Months();
}
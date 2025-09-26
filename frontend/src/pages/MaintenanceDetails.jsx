// src/pages/MaintenanceDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../component/layout";
import Modal from "../component/modal";
import { useToast } from "../component/Toast.jsx";
import * as bootstrap from "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// ตั้งค่า API
const API_BASE = import.meta.env?.VITE_API_URL ?? "http://localhost:8080";

// helper: ดึง yyyy-mm-dd จาก LocalDateTime
const toDate = (s) => (s ? s.slice(0, 10) : "");
// helper: แปลง yyyy-mm-dd -> yyyy-mm-ddTHH:mm:ss
const toLdt = (d) => (d ? `${d}T00:00:00` : null);

function MaintenanceDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  // รองรับรับ id ได้ทั้งจาก state และ query (?id=1)
  const idFromState = location.state?.id;
  const idFromQuery = searchParams.get("id");
  const maintainId = idFromState ?? (idFromQuery ? Number(idFromQuery) : null);

  // โหลดข้อมูล
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fetchOne = async () => {
    if (!maintainId) {
      setErr("Missing maintenance id");
      return;
    }
    try {
      setLoading(true);
      setErr("");
      const res = await fetch(`${API_BASE}/maintain/${maintainId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setErr("Failed to load maintenance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOne();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maintainId]);

  // ✅ Enhanced status badge with more states
  const statusInfo = useMemo(() => {
    if (!data) return { badge: "bg-secondary", text: "Loading", icon: "bi-hourglass" };
    
    const hasScheduled = !!data.scheduledDate;
    const isComplete = !!data.finishDate;
    
    if (isComplete) {
      return { 
        badge: "bg-success", 
        text: "Complete", 
        icon: "bi-check-circle-fill" 
      };
    } else if (hasScheduled) {
      return { 
        badge: "bg-warning", 
        text: "In Progress", 
        icon: "bi-gear-fill" 
      };
    } else {
      return { 
        badge: "bg-secondary-subtle text-secondary", 
        text: "Not Started", 
        icon: "bi-circle" 
      };
    }
  }, [data]);

  // ------- ฟอร์มใน Modal (สไตล์เดิม) -------
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    target: "asset", // "asset" or "building"
    issueTitle: "",
    issueCategory: "",
    issueDescription: "",
    requestDate: "",
    maintainDate: "",
    completeDate: "",
  });

  // ✅ Issue options for Asset target
  const assetIssueOptions = [
    { value: "air", label: "แอร์" },
    { value: "light", label: "ไฟ" },
    { value: "plumbing", label: "ประปา" },
    { value: "electrical", label: "ไฟฟ้า" },
    { value: "other", label: "อื่นๆ" }
  ];

  useEffect(() => {
    if (!data) return;
    setForm({
      target: data.targetType === 0 ? "asset" : "building",
      issueTitle: data.issueTitle ?? "",
      issueCategory: data.issueCategory ?? "",
      issueDescription: data.issueDescription ?? "",
      requestDate: toDate(data.createDate) || "",
      maintainDate: toDate(data.scheduledDate) || "",
      completeDate: toDate(data.finishDate) || "",
    });
  }, [data]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => {
      const newForm = { ...s, [name]: value };
      
      // ✅ Reset issue fields when target changes
      if (name === "target") {
        newForm.issueTitle = "";
        newForm.issueCategory = "";
      }
      
      return newForm;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      // ✅ Check for status changes to show appropriate messages
      const previousStatus = data?.finishDate ? "Complete" : (data?.scheduledDate ? "In Progress" : "Not Started");
      const newStatus = form.completeDate ? "Complete" : (form.maintainDate ? "In Progress" : "Not Started");
      const statusChanged = previousStatus !== newStatus;

      const payload = {
        targetType: form.target === "asset" ? 0 : 1,
        issueTitle: form.issueTitle,
        issueCategory: form.target === "asset" ? form.issueCategory : form.issueTitle,
        issueDescription: form.issueDescription,
        scheduledDate: toLdt(form.maintainDate),
        finishDate: form.completeDate ? toLdt(form.completeDate) : null,
      };

      const res = await fetch(`${API_BASE}/maintain/update/${maintainId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      
      await fetchOne();

      // ✅ Enhanced success notifications based on changes
      if (statusChanged) {
        if (newStatus === "Complete") {
          showSuccess(`✅ Maintenance Request #${maintainId} marked as Complete!`);
        } else if (newStatus === "In Progress" && previousStatus === "Not Started") {
          showInfo(`🔄 Maintenance Request #${maintainId} started - Status: In Progress`);
        } else if (newStatus === "Not Started" && previousStatus === "Complete") {
          showWarning(`⚠️ Maintenance Request #${maintainId} reverted to Not Started`);
        } else {
          showSuccess(`✅ Maintenance Request #${maintainId} status updated to ${newStatus}`);
        }
      } else {
        showSuccess(`✅ Maintenance Request #${maintainId} updated successfully!`);
      }

      // ปิด modal
      const el = document.getElementById("editMaintainModal");
      if (el) bootstrap.Modal.getInstance(el)?.hide();
    } catch (e2) {
      showError(`❌ Update failed: ${e2.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete maintenance #${maintainId}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/maintain/${maintainId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      
      showSuccess(`✅ Maintenance Request #${maintainId} deleted successfully!`);
      navigate("/maintenancerequest");
    } catch (e) {
      showError(`❌ Delete failed: ${e.message}`);
    }
  };

  // ✅ Quick action handlers for status changes
  const handleMarkComplete = async () => {
    const today = new Date().toISOString().slice(0, 10);
    
    try {
      setSaving(true);

      const payload = {
        targetType: data.targetType, // Keep existing target type
        issueTitle: form.issueTitle || data.issueTitle,
        issueCategory: data.issueCategory,
        issueDescription: form.issueDescription || data.issueDescription,
        scheduledDate: toLdt(form.maintainDate || toDate(data.scheduledDate)),
        finishDate: toLdt(today), // Set completion date to today
      };

      const res = await fetch(`${API_BASE}/maintain/update/${maintainId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      
      await fetchOne(); // Refresh data
      showSuccess(`✅ Maintenance Request #${maintainId} marked as Complete!`);
      
    } catch (e2) {
      showError(`❌ Mark complete failed: ${e2.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleStartWork = async () => {
    const today = new Date().toISOString().slice(0, 10);
    
    try {
      setSaving(true);

      const payload = {
        targetType: data.targetType, // Keep existing target type
        issueTitle: form.issueTitle || data.issueTitle,
        issueCategory: data.issueCategory,
        issueDescription: form.issueDescription || data.issueDescription,
        scheduledDate: toLdt(today), // Set maintain date to today
        finishDate: null, // Clear completion to make it "In Progress"
      };

      const res = await fetch(`${API_BASE}/maintain/update/${maintainId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      
      await fetchOne(); // Refresh data
      showInfo(`🔄 Maintenance Request #${maintainId} started - Status: In Progress`);
      
    } catch (e2) {
      showError(`❌ Start work failed: ${e2.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Maintenance Request" icon="bi bi-wrench" notifications={0}>
      <div className="container-fluid">
        <div className="row min-vh-100">
          <div className="col-lg-11 p-4">
            {/* Toolbar (เหมือนหน้าเดิม/InvoiceDetails) */}
            <div className="toolbar-wrapper card border-0 bg-white">
              <div className="card-header bg-white border-0 rounded-2">
                <div className="tm-toolbar d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="breadcrumb-link text-primary"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate("/maintenancerequest")}
                    >
                      Maintenance Request
                    </span>
                    <span className="text-muted">›</span>
                    <span className="breadcrumb-current">
                      {data ? `#${data.id} - ${data.roomNumber || "-"}` : "-"}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {/* ✅ Smart action buttons based on status */}
                    {data && !data.finishDate && !data.scheduledDate && (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={handleStartWork}
                        disabled={saving}
                        title="Start maintenance work"
                      >
                        <i className={saving ? "bi bi-hourglass-split me-1" : "bi bi-play-fill me-1"}></i> 
                        {saving ? "Starting..." : "Start Work"}
                      </button>
                    )}
                    {data && data.scheduledDate && !data.finishDate && (
                      <button
                        type="button"
                        className="btn btn-warning btn-sm"
                        onClick={handleMarkComplete}
                        disabled={saving}
                        title="Mark as complete"
                      >
                        <i className={saving ? "bi bi-hourglass-split me-1" : "bi bi-check-circle me-1"}></i>
                        {saving ? "Completing..." : "Mark Complete"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary"
                      data-bs-toggle="modal"
                      data-bs-target="#editMaintainModal"
                      disabled={!data}
                    >
                      <i className="bi bi-pencil me-1"></i> Edit Request
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {err && <div className="alert alert-danger mt-3">{err}</div>}

            {/* Details (เลย์เอาต์ 2 คอลัมน์ + การ์ดเหมือนเดิม) */}
            <div className="table-wrapper-detail rounded-0 mt-3">
              <div className="row g-4">
                {/* Left column */}
                <div className="col-lg-6">
                  <div className="card border-0 shadow-sm mb-3 rounded-2">
                    <div className="card-body">
                      <h5 className="card-title">Room Information</h5>
                      {loading || !data ? (
                        <div>Loading...</div>
                      ) : (
                        <>
                          <p>
                            <span className="label">Room:</span>{" "}
                            <span className="value">{data.roomNumber || "-"}</span>
                          </p>
                          <p>
                            <span className="label">Floor:</span>{" "}
                            <span className="value">{data.roomFloor ?? "-"}</span>
                          </p>
                          <p>
                            <span className="label">Target:</span>{" "}
                            <span className="value">
                              <span className={`badge ${data.targetType === 0 ? 'bg-info' : 'bg-primary'}`}>
                                <i className={`bi ${data.targetType === 0 ? 'bi-gear' : 'bi-building'} me-1`}></i>
                                {data.targetType === 0 ? "Asset" : "Building"}
                              </span>
                            </span>
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="card border-0 shadow-sm rounded-2">
                    <div className="card-body">
                      <h5 className="card-title">Request Information</h5>
                      {loading || !data ? (
                        <div>Loading...</div>
                      ) : (
                        <>
                          <p>
                            <span className="label">Issue title:</span>{" "}
                            <span className="value">{data.issueTitle || "-"}</span>
                          </p>
                          <p>
                            <span className="label">Issue category:</span>{" "}
                            <span className="value">{data.issueCategory ?? "-"}</span>
                          </p>
                          <p>
                            <span className="label">Description:</span>{" "}
                            <span className="value">
                              {data.issueDescription || "-"}
                            </span>
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="col-lg-6">
                  <div className="card border-0 shadow-sm mb-3 rounded-2">
                    <div className="card-body">
                      <h5 className="card-title">Schedule</h5>
                      {loading || !data ? (
                        <div>Loading...</div>
                      ) : (
                        <div className="row">
                          <div className="col-6">
                            <p>
                              <span className="label">Create date:</span>{" "}
                              <span className="value">{toDate(data.createDate) || "-"}</span>
                            </p>
                            <p>
                              <span className="label">Maintain date:</span>{" "}
                              <span className="value">
                                {toDate(data.scheduledDate) || "-"}
                              </span>
                            </p>
                          </div>
                          <div className="col-6">
                            <p>
                              <span className="label">Complete date:</span>{" "}
                              <span className="value">
                                {toDate(data.finishDate) || "-"}
                              </span>
                            </p>
                            <p>
                              <span className="label">Status:</span>{" "}
                              <span className="value">
                                <span className={`badge ${statusInfo.badge}`}>
                                  <i className={`${statusInfo.icon} me-1`}></i>
                                  {statusInfo.text}
                                </span>
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* เผื่ออนาคต: Technician หรือ Cost ฯลฯ */}
                  {/* <div className="card border-0 shadow-sm rounded-2"> ... </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Modal Edit (คงรูปแบบเดียวกับหน้าที่คุณใช้) ===== */}
      <Modal
        id="editMaintainModal"
        title="Edit Request"
        icon="bi bi-pencil"
        size="modal-lg"
        scrollable="modal-dialog-scrollable"
      >
        {!data ? (
          <div className="p-3">Loading...</div>
        ) : (
          <form onSubmit={handleSave}>
            {/* Room (lock ไม่ให้แก้ เพื่อคง UX เดิม) */}
            <div className="row g-3 align-items-start">
              <div className="col-md-3"><strong>Room Information</strong></div>
              <div className="col-md-9">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Room</label>
                    <input type="text" className="form-control" value={data.roomNumber || ""} disabled />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Floor</label>
                    <input type="text" className="form-control" value={data.roomFloor ?? ""} disabled />
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-4" />

            {/* Request */}
            <div className="row g-3 align-items-start">
              <div className="col-md-3"><strong>Request Information</strong></div>
              <div className="col-md-9">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Target Type</label>
                    <select
                      className="form-select"
                      name="target"
                      value={form.target}
                      onChange={onChange}
                      required
                    >
                      <option value="asset">Asset</option>
                      <option value="building">Building</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Create date</label>
                    <input type="date" className="form-control" value={form.requestDate} disabled />
                  </div>
                  
                  {/* ✅ Conditional Issue Input based on Target */}
                  {form.target === "asset" ? (
                    <div className="col-md-6">
                      <label className="form-label">Issue Category</label>
                      <select
                        className="form-select"
                        name="issueCategory"
                        value={form.issueCategory}
                        onChange={onChange}
                        required
                      >
                        <option value="">เลือกประเภทปัญหา</option>
                        {assetIssueOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="col-md-6">
                      <label className="form-label">Issue Title (Building)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="issueTitle"
                        value={form.issueTitle}
                        onChange={onChange}
                        placeholder="ระบุปัญหาของอาคาร เช่น ลิฟต์เสีย, ระบบแอร์กลาง"
                        required
                      />
                    </div>
                  )}
                  
                  {form.target === "asset" && (
                    <div className="col-md-6">
                      <label className="form-label">Issue Title (Asset)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="issueTitle"
                        value={form.issueTitle}
                        onChange={onChange}
                        placeholder="ระบุรายละเอียดปัญหา"
                        required
                      />
                    </div>
                  )}
                  
                  <div className="col-md-12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      name="issueDescription"
                      value={form.issueDescription}
                      onChange={onChange}
                      placeholder={form.target === "asset" ? 
                        "อธิบายรายละเอียดปัญหาของอุปกรณ์" : 
                        "อธิบายรายละเอียดปัญหาของอาคาร"}
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-4" />

            {/* Schedule */}
            <div className="row g-3 align-items-start">
              <div className="col-md-3"><strong>Schedule & Status</strong></div>
              <div className="col-md-9">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      Maintain date 
                      <small className="text-muted">(sets status to "In Progress")</small>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      name="maintainDate"
                      value={form.maintainDate}
                      onChange={onChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">
                      Complete date 
                      <small className="text-muted">(sets status to "Complete")</small>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      name="completeDate"
                      value={form.completeDate}
                      onChange={onChange}
                    />
                  </div>
                  <div className="col-12">
                    <div className="alert alert-info py-2">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Status Logic:</strong>
                      <ul className="mb-0 mt-1">
                        <li><strong>Not Started:</strong> No dates set</li>
                        <li><strong>In Progress:</strong> Maintain date set, no complete date</li>
                        <li><strong>Complete:</strong> Complete date is set</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="d-flex justify-content-center gap-3 pt-4 pb-2">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </Layout>
  );
}

export default MaintenanceDetails;

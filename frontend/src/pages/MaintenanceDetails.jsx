// src/pages/MaintenanceDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../component/layout";
import Modal from "../component/modal";
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

  // badge สถานะ (คงสไตล์เดิม)
  const statusBadge = useMemo(() => {
    const complete = !!data?.finishDate;
    return complete ? "bg-success" : "bg-secondary-subtle text-secondary";
  }, [data]);

  // ------- ฟอร์มใน Modal (สไตล์เดิม) -------
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    issueTitle: "",
    issueDescription: "",
    requestDate: "",
    maintainDate: "",
    completeDate: "",
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      issueTitle: data.issueTitle ?? "",
      issueDescription: data.issueDescription ?? "",
      requestDate: toDate(data.createDate) || "",
      maintainDate: toDate(data.scheduledDate) || "",
      completeDate: toDate(data.finishDate) || "",
    });
  }, [data]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const payload = {
        issueTitle: form.issueTitle,
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

      // ปิด modal แบบเดียวกับหน้าเดิม
      const el = document.getElementById("editMaintainModal");
      if (el) bootstrap.Modal.getInstance(el)?.hide();
    } catch (e2) {
      alert(`Update failed: ${e2.message}`);
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
      navigate("/maintenancerequest");
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
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
                    {/* <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={handleDelete}
                    >
                      <i className="bi bi-trash me-1" /> Delete
                    </button> */}
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
                              {data.targetType === 0 ? "Asset" : "Building"}
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
                                <span className={`badge ${statusBadge}`}>
                                  <i className="bi bi-circle-fill me-1"></i>
                                  {data.finishDate ? "Complete" : "Not Started"}
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
                    <label className="form-label">Issue title</label>
                    <input
                      className="form-control"
                      name="issueTitle"
                      value={form.issueTitle}
                      onChange={onChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Create date</label>
                    <input type="date" className="form-control" value={form.requestDate} disabled />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      name="issueDescription"
                      value={form.issueDescription}
                      onChange={onChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-4" />

            {/* Schedule */}
            <div className="row g-3 align-items-start">
              <div className="col-md-3"><strong>Schedule</strong></div>
              <div className="col-md-9">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Maintain date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="maintainDate"
                      value={form.maintainDate}
                      onChange={onChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Complete date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="completeDate"
                      value={form.completeDate}
                      onChange={onChange}
                    />
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

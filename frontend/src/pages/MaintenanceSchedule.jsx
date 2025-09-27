// src/pages/MaintenanceSchedule.jsx
import React, { useMemo, useState, useEffect } from "react";
import Layout from "../component/layout";
import Modal from "../component/modal";
import Pagination from "../component/pagination";
import { pageSize as defaultPageSize } from "../config_variable";
import * as bootstrap from "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// ===== API config =====
const API_BASE = import.meta.env?.VITE_API_URL ?? "http://localhost:8080";
const SCHEDULE_API = {
  LIST: `${API_BASE}/maintain-schedule/list`,
  CREATE: `${API_BASE}/maintain-schedule/create`,
  DELETE: (id) => `${API_BASE}/maintain-schedule/${id}`,
};

// ===== Helper: บวกเดือนให้กับวันที่ (yyyy-mm-dd) =====
function addMonthsISO(isoDate, months) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setMonth(dt.getMonth() + Number(months || 0));
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ===== Helper: แปลงข้อมูลจาก API -> รูปแบบตารางหน้า UI นี้ =====
// ปรับ mapping ตรงนี้ให้ตรงกับ backend ของคุณได้
function fromApi(item) {
  // ตัวอย่างสมมติ: {id, scope(0=Asset,1=Building), assetName, cycleMonths, notifyDays, lastDate, nextDate}
  const scope = item.scope === 0 || item.scope === "ASSET" ? "Asset" : "Building";
  const lastDate = item.lastDate ? String(item.lastDate).slice(0, 10) : "";
  const cycle = Number(item.cycleMonths ?? item.cycle ?? 0);
  const nextDate =
    (item.nextDate && String(item.nextDate).slice(0, 10)) ||
    (lastDate && cycle ? addMonthsISO(lastDate, cycle) : "");
  return {
    id: item.id,
    scope,
    asset: item.assetName ?? item.asset ?? "-",
    cycle,
    notify: Number(item.notifyDays ?? item.notify ?? 0),
    lastDate,
    nextDate,
  };
}

// ===== Helper: สร้าง payload สำหรับ POST =====
function toCreatePayload(newSch) {
  return {
    // หาก backend ใช้ enum/ตัวเลข: 0=Asset, 1=Building
    scope: newSch.scope === "Asset" ? 0 : 1,
    assetName: newSch.asset,
    cycleMonths: Number(newSch.cycle),
    notifyDays: Number(newSch.notify),
    // ส่งเป็น LocalDateTime ถ้า backend ต้องการ
    lastDate: newSch.lastDate ? `${newSch.lastDate}T00:00:00` : null,
  };
}

function MaintenanceSchedule() {
  // --------- DATA (จาก backend) ----------
  const [schedules, setSchedules] = useState([]); // <— ไม่มี mock แล้ว
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(SCHEDULE_API.LIST, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      // json ควรเป็น array
      const rows = Array.isArray(json) ? json.map(fromApi) : [];
      setSchedules(rows);
    } catch (e) {
      console.error(e);
      setError("โหลดตาราง Maintenance Schedule ไม่สำเร็จ");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  // --------- TABLE CONTROLS ----------
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true); // sort ตาม lastDate

  const [filters, setFilters] = useState({
    scope: "ALL",
    cycleMin: "",
    cycleMax: "",
    notifyMin: "",
    notifyMax: "",
    dateFrom: "",
    dateTo: "",
  });

  // ---- สถานะกำลังบันทึก ----
  const [saving, setSaving] = useState(false);

  // (ออปชัน) validate เบื้องต้น
  const [newSch, setNewSch] = useState({
    scope: "",
    asset: "",
    cycle: "",
    notify: "",
    lastDate: new Date().toISOString().slice(0, 10),
  });

  const validateNewSch = () => {
    if (newSch.scope === "Asset") {
      if (!newSch.asset?.trim()) return "กรุณาเลือก Asset";
    } else {
      if (!newSch.asset?.trim()) return "กรุณากรอก Target";
    }
    if (!newSch.cycle || newSch.cycle < 1) return "Cycle ต้องเป็นตัวเลขตั้งแต่ 1 เดือนขึ้นไป";
    if (newSch.notify < 0) return "Notify ต้องไม่ติดลบ";
    return null;
  };

  // ---- CREATE (POST) -> reload ----
  const addSchedule = async () => {
    const payload = toCreatePayload(newSch);
    const res = await fetch(SCHEDULE_API.CREATE, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    await loadSchedules();
  };

  const clearFilters = () =>
    setFilters({
      scope: "ALL",
      cycleMin: "",
      cycleMax: "",
      notifyMin: "",
      notifyMax: "",
      dateFrom: "",
      dateTo: "",
    });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = [...schedules];

    rows = rows.filter((r) => {
      if (filters.scope !== "ALL" && r.scope !== filters.scope) return false;
      if (filters.cycleMin !== "" && r.cycle < Number(filters.cycleMin)) return false;
      if (filters.cycleMax !== "" && r.cycle > Number(filters.cycleMax)) return false;
      if (filters.notifyMin !== "" && r.notify < Number(filters.notifyMin)) return false;
      if (filters.notifyMax !== "" && r.notify > Number(filters.notifyMax)) return false;
      if (filters.dateFrom && r.lastDate < filters.dateFrom) return false;
      if (filters.dateTo && r.lastDate > filters.dateTo) return false;
      return true;
    });

    if (q) {
      rows = rows.filter(
        (r) =>
          r.scope.toLowerCase().includes(q) ||
          r.asset.toLowerCase().includes(q) ||
          String(r.cycle).includes(q) ||
          String(r.notify).includes(q) ||
          r.lastDate.includes(q) ||
          r.nextDate.includes(q)
      );
    }

    rows.sort((a, b) =>
      sortAsc ? a.lastDate.localeCompare(b.lastDate) : b.lastDate.localeCompare(a.lastDate)
    );
    return rows;
  }, [schedules, filters, search, sortAsc]);

  // --------- PAGINATION ----------
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize || 10);
  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (size) => {
    const newSize = Number(size) || 10;
    setPageSize(newSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortAsc, pageSize, filters]);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // --------- SELECTION (ถ้าต้องใช้เลือกหลายแถว) ----------
  const [selected, setSelected] = useState([]);
  const isAllSelected = pageRows.length > 0 && selected.length === pageRows.length;

  const toggleSelectRow = (rowId) => {
    setSelected((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };
  const toggleSelectAll = () => {
    if (isAllSelected) setSelected([]);
    else setSelected(pageRows.map((r) => r.id));
  };

  // --------- ACTIONS ----------
  const deleteRow = async (rowId) => {
    if (!confirm("ลบรายการนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(SCHEDULE_API.DELETE(rowId), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      await loadSchedules();
      setSelected((prev) => prev.filter((id) => id !== rowId));
    } catch (e) {
      console.error(e);
      alert("ลบไม่สำเร็จ");
    }
  };

  const deleteSelected = async () => {
    if (selected.length === 0) return;
    if (!confirm(`ลบ ${selected.length} รายการ?`)) return;
    try {
      // เรียกทีละตัว (หรือทำ batch ที่ backend ถ้าสะดวก)
      for (const id of selected) {
        const res = await fetch(SCHEDULE_API.DELETE(id), {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
      }
      await loadSchedules();
      setSelected([]);
    } catch (e) {
      console.error(e);
      alert("ลบบางรายการไม่สำเร็จ");
    }
  };

  // ---- Modal helpers ----
  const closeModalSafely = () => {
    const opened = document.querySelector(".modal.show");
    if (opened) {
      const inst = bootstrap.Modal.getInstance(opened) || new bootstrap.Modal(opened);
      inst.hide();
      inst.dispose();
    }
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("paddingRight");
  };

  // รายการ asset (mock loader — ถ้าพร้อม API จริงก็เปลี่ยน fetch ที่นี่ได้)
  const [assetOptions, setAssetOptions] = useState([]);
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetError, setAssetError] = useState(null);

  const loadAssets = async () => {
    try {
      setAssetError(null);
      setAssetLoading(true);
      // MOCK
      const mock = [
        { id: "AST-001", name: "Air Conditioner - Lobby" },
        { id: "AST-002", name: "Elevator - A" },
        { id: "AST-003", name: "Generator - West Wing" },
        { id: "AST-004", name: "Water Pump - B1" },
      ];
      await new Promise((r) => setTimeout(r, 300));
      setAssetOptions(mock);

      // ถ้าต้องการเชื่อมจริง:
      // const res = await fetch(`${API_BASE}/assets?active=true`, {credentials:'include'});
      // if (!res.ok) throw new Error(await res.text());
      // const data = await res.json(); // [{id, name}]
      // setAssetOptions(data);

    } catch (e) {
      console.error(e);
      setAssetError("โหลดรายการ Asset ไม่สำเร็จ");
    } finally {
      setAssetLoading(false);
    }
  };

  useEffect(() => {
    if (newSch.scope === "Asset") {
      loadAssets();
      setNewSch((p) => ({ ...p, asset: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSch.scope]);

  const hasAnyFilter =
    filters.scope !== "ALL" ||
    filters.cycleMin !== "" ||
    filters.cycleMax !== "" ||
    filters.notifyMin !== "" ||
    filters.notifyMax !== "" ||
    !!filters.dateFrom ||
    !!filters.dateTo;

  const filterSummary = [];
  if (filters.scope !== "ALL") filterSummary.push(`Scope: ${filters.scope}`);
  if (filters.cycleMin !== "") filterSummary.push(`Cycle ≥ ${filters.cycleMin}`);
  if (filters.cycleMax !== "") filterSummary.push(`Cycle ≤ ${filters.cycleMax}`);
  if (filters.notifyMin !== "") filterSummary.push(`Notify ≥ ${filters.notifyMin}`);
  if (filters.notifyMax !== "") filterSummary.push(`Notify ≤ ${filters.notifyMax}`);
  if (filters.dateFrom) filterSummary.push(`From ${filters.dateFrom}`);
  if (filters.dateTo) filterSummary.push(`To ${filters.dateTo}`);

  return (
    <Layout title="Maintenance Schedule" icon="bi bi-alarm" notifications={0}>
      <div className="container-fluid">
        <div className="row min-vh-100">
          <div className="col-lg-11 p-4">
            {/* Toolbar */}
            <div className="toolbar-wrapper card border-0 bg-white">
              <div className="card-header bg-white border-0 rounded-3">
                <div className="tm-toolbar d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <button
                      className="btn btn-link tm-link p-0"
                      data-bs-toggle="offcanvas"
                      data-bs-target="#scheduleFilterCanvas"
                    >
                      <i className="bi bi-filter me-1"></i> Filter
                      {hasAnyFilter && <span className="badge bg-primary ms-2">●</span>}
                    </button>

                    <button
                      className="btn btn-link tm-link p-0"
                      onClick={() => setSortAsc((s) => !s)}
                    >
                      <i className="bi bi-arrow-down-up me-1"></i>
                      Sort
                    </button>

                    <div className="input-group tm-search">
                      <span className="input-group-text bg-white border-end-0">
                        <i className="bi bi-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Search schedule"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={loadSchedules}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-clockwise me-1" />
                      Refresh
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      data-bs-toggle="modal"
                      data-bs-target="#createScheduleModal"
                    >
                      <i className="bi bi-plus-lg me-1"></i> Create Schedule
                    </button>
                  </div>
                </div>

                <div className={`collapse ${hasAnyFilter ? "show" : ""}`}>
                  <div className="pt-2 d-flex flex-wrap gap-2">
                    {filterSummary.map((txt, idx) => (
                      <span key={idx} className="badge bg-light text-dark border">
                        {txt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="table-wrapper mt-3">
              {error && <div className="alert alert-danger">{error}</div>}
              <table className="table text-nowrap">
                <thead>
                  <tr>
                    {/*<th className="text-center header-color checkbox-cell">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </th>*/}
                    <th className="text-start align-middle header-color">Order</th>
                    <th className="text-start align-middle header-color">Scope</th>
                    <th className="text-start align-middle header-color">Target</th>
                    <th className="text-start align-middle header-color">Cycle</th>
                    <th className="text-start align-middle header-color">Notify</th>
                    <th className="text-start align-middle header-color">Last date</th>
                    <th className="text-start align-middle header-color">Next date</th>
                    <th className="text-center align-middle header-color">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center">Loading...</td>
                    </tr>
                  ) : pageRows.length ? (
                    pageRows.map((item, idx) => (
                      <tr key={item.id}>
                        {/*<td className="align-middle text-center checkbox-cell">
                          <input
                            type="checkbox"
                            checked={selected.includes(item.id)}
                            onChange={() => toggleSelectRow(item.id)}
                            aria-label={`Select row ${item.id}`}
                          />
                        </td>*/}
                        <td className="align-middle">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="align-middle">{item.scope}</td>
                        <td className="align-middle">{item.asset}</td>
                        <td className="align-middle">{item.cycle}</td>
                        <td className="align-middle">{item.notify}</td>
                        <td className="align-middle">{item.lastDate}</td>
                        <td className="align-middle">{item.nextDate}</td>

                        <td className="align-middle text-center">
                          <button
                            className="btn btn-link text-dark p-0"
                            onClick={() => deleteRow(item.id)}
                            title="Delete"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center">
                        No schedules found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalRecords={totalRecords}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>
      </div>

      {/* Create Schedule Modal */}
      <Modal id="createScheduleModal" title="Create Schedule" icon="bi bi-alarm" size="modal-lg">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const err = validateNewSch();
            if (err) {
              alert(err);
              return;
            }
            try {
              setSaving(true);
              await addSchedule(); // POST ไป backend
              closeModalSafely();
              const modalEl = document.getElementById("createScheduleModal");
              if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
              setNewSch((p) => ({ ...p, asset: "" }));
            } catch (e2) {
              console.error(e2);
              alert("บันทึกไม่สำเร็จ");
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Scope</label>
              <select
                className="form-select"
                value={newSch.scope}
                onChange={(e) => setNewSch((p) => ({ ...p, scope: e.target.value }))}
                required
              >
                <option value="">{/* placeholder */}Select Scope</option>
                <option>Asset</option>
                <option>Building</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Target</label>
              {newSch.scope === "Asset" ? (
                <>
                  <select
                    className="form-select"
                    value={newSch.asset}
                    onChange={(e) => setNewSch((p) => ({ ...p, asset: e.target.value }))}
                    required
                    disabled={assetLoading}
                  >
                    <option value="">{assetLoading ? "Loading..." : "Select Asset"}</option>
                    {assetOptions.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {assetError && <div className="form-text text-danger">{assetError}</div>}
                </>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Plumbing, Water leak"
                  value={newSch.asset}
                  onChange={(e) => setNewSch((p) => ({ ...p, asset: e.target.value }))}
                  required
                />
              )}
            </div>

            <div className="col-md-4">
              <label className="form-label">Cycle (months)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 6"
                value={newSch.cycle}
                min={1}
                onChange={(e) => setNewSch((p) => ({ ...p, cycle: Number(e.target.value) }))}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Notify (days)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 7"
                value={newSch.notify}
                min={0}
                onChange={(e) => setNewSch((p) => ({ ...p, notify: Number(e.target.value) }))}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Last date</label>
              <input
                type="date"
                className="form-control"
                value={newSch.lastDate}
                onChange={(e) => setNewSch((p) => ({ ...p, lastDate: e.target.value }))}
                required
              />
            </div>

            <div className="col-12 d-flex justify-content-center gap-3 pt-3 pb-3">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Filters Offcanvas */}
      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id="scheduleFilterCanvas"
        aria-labelledby="scheduleFilterCanvasLabel"
      >
        <div className="offcanvas-header">
          <h5 id="scheduleFilterCanvasLabel" className="mb-0">
            <i className="bi bi-filter me-2"></i>Filters
          </h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>

        <div className="offcanvas-body">
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Scope</label>
              <select
                className="form-select"
                value={filters.scope}
                onChange={(e) => setFilters((f) => ({ ...f, scope: e.target.value }))}
              >
                <option value="ALL">All</option>
                <option value="Asset">Asset</option>
                <option value="Building">Building</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Cycle min</label>
              <input
                type="number"
                className="form-control"
                value={filters.cycleMin}
                onChange={(e) => setFilters((f) => ({ ...f, cycleMin: e.target.value }))}
                placeholder="e.g. 3"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Cycle max</label>
              <input
                type="number"
                className="form-control"
                value={filters.cycleMax}
                onChange={(e) => setFilters((f) => ({ ...f, cycleMax: e.target.value }))}
                placeholder="e.g. 12"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Notify min</label>
              <input
                type="number"
                className="form-control"
                value={filters.notifyMin}
                onChange={(e) => setFilters((f) => ({ ...f, notifyMin: e.target.value }))}
                placeholder="e.g. 3"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Notify max</label>
              <input
                type="number"
                className="form-control"
                value={filters.notifyMax}
                onChange={(e) => setFilters((f) => ({ ...f, notifyMax: e.target.value }))}
                placeholder="e.g. 14"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Last date from</label>
              <input
                type="date"
                className="form-control"
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Last date to</label>
              <input
                type="date"
                className="form-control"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
              />
            </div>

            <div className="col-12 d-flex justify-content-between mt-2">
              <button className="btn btn-outline-secondary" onClick={clearFilters}>
                Clear
              </button>
              <button className="btn btn-primary" data-bs-dismiss="offcanvas">
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MaintenanceSchedule;

// src/pages/MaintenanceSchedule.jsx
import React, { useMemo, useState, useEffect } from "react";
import Layout from "../component/layout";
import Modal from "../component/modal";
import Pagination from "../component/pagination";
import { pageSize as defaultPageSize } from "../config_variable";
import * as bootstrap from "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// ===== API base =====
const API_BASE = import.meta.env?.VITE_API_URL ?? "http://localhost:8080";

// ===== Helpers =====
const addMonthsISO = (isoDate, months) => {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setMonth(dt.getMonth() + Number(months || 0));
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

// yyyy-mm-dd -> yyyy-mm-ddTHH:MM:SS
const d2ldt = (d) => (d ? `${d}T00:00:00` : null);

// ===== Endpoints ตาม Controller: @RequestMapping("/schedules") =====
const SCHEDULE_API = {
    LIST: `${API_BASE}/schedules`,                 // GET -> { result, assetGroupDropdown }
    CREATE: `${API_BASE}/schedules`,               // POST
    DELETE: (id) => `${API_BASE}/schedules/${id}`, // DELETE
    DONE: (id) => `${API_BASE}/schedules/${id}/done`, // (ถ้าใช้)
};

// ===== Mapping: API -> แถวบนตาราง =====
function fromApi(item) {
    const rawScope = item.scope ?? item.scopeType ?? item.targetScope;
    const scope = rawScope === 0 || rawScope === "ASSET" || rawScope === "Asset" ? "Asset" : "Building";

    const lastDate =
        item.lastDate
            ? String(item.lastDate).slice(0, 10)
            : (item.lastMaintenanceDate ? String(item.lastMaintenanceDate).slice(0, 10) : "");

    const cycle = Number(item.cycleMonths ?? item.cycle ?? item.cycleMonth ?? 0);

    const nextFromApi =
        (item.nextDate && String(item.nextDate).slice(0, 10)) ||
        (item.nextMaintenanceDate && String(item.nextMaintenanceDate).slice(0, 10));

    const nextDate = nextFromApi || (lastDate && cycle ? addMonthsISO(lastDate, cycle) : "");

    const name = item.assetName ?? item.targetName ?? "-";

    return {
        id: item.id ?? item.scheduleId ?? item.maintenanceScheduleId,
        scope,
        target: name,   // ใช้ภายใน logic
        asset: name,    // <-- เพิ่มเพื่อให้ UI เดิมที่แสดง item.asset ทำงานได้เลย
        cycle,
        notify: Number(item.notifyDays ?? item.notify ?? item.notifyDay ?? 0),
        lastDate,
        nextDate,
    };
}

// ===== Mapping: ฟอร์ม -> payload สำหรับ POST =====
function toCreatePayload(f) {
    const targetName = f.target || f.asset || ""; // รองรับทั้งสองเคสโดยไม่ต้องเปลี่ยน UI
    return {
        scope: f.scope === "Asset" ? 0 : 1,
        assetName: targetName,
        cycleMonths: Number(f.cycle),
        notifyDays: Number(f.notify),
        lastDate: d2ldt(f.lastDate),
    };
}

// ดึง asset สำหรับ dropdown (เลือก source: 'available' | 'all' | 'room', ถ้า room ต้องส่ง roomId)
async function fetchAssetDropdown({ source = "available", roomId = null } = {}) {
    try {
        setAssetError(null);
        setAssetLoading(true);

        let url = "";
        if (source === "room" && roomId != null) {
            url = `${API_BASE}/assets/${roomId}`;
        } else if (source === "all") {
            url = `${API_BASE}/assets/all`;
        } else {
            url = `${API_BASE}/assets/available`;
        }

        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();

        // AssetController คืนเป็น ApiResponse<T>
        // โครงทั่วไป: { "message": "...", "data": [...] } หรือ { "status": "...", "data": [...] }
        const arr = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);

        const opts = arr.map((a) => ({
            id: a.id ?? a.assetId ?? a.code ?? String(Math.random()),
            name: a.name ?? a.assetName ?? a.displayName ?? `Asset #${a.id ?? ""}`,
        }));

        setAssetOptions(opts);
    } catch (e) {
        console.error(e);
        setAssetError("โหลดรายการ Asset ไม่สำเร็จ");
        setAssetOptions([]);
    } finally {
        setAssetLoading(false);
    }
}

function MaintenanceSchedule() {
    // --------- DATA (จาก backend) ----------
    const [schedules, setSchedules] = useState([]);   // ถ้าไฟล์เดิมใช้ชื่อ rows ให้คงชื่อ rows แล้ว map ให้ตรงใช้
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

// รายการ asset สำหรับ dropdown ใน Modal (ใช้จาก response เดียวกัน)
    const [assetOptions, setAssetOptions] = useState([]);
    const [assetLoading, setAssetLoading] = useState(false);
    const [assetError, setAssetError] = useState(null);

    // ===== โหลดตารางจาก /schedules (GET) =====
    const loadSchedules = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetch(SCHEDULE_API.LIST, { credentials: "include" });
            if (!res.ok) throw new Error(await res.text());

            // backend คืน MaintenanceScheduleResponse { result: [...], assetGroupDropdown: [...] }
            const json = await res.json();
            const list = Array.isArray(json?.result) ? json.result : [];
            const rows = list.map(fromApi);
            setSchedules(rows);

            // เติม asset dropdown จาก response เดียวกัน
            if (Array.isArray(json?.assetGroupDropdown)) {
                const opts = json.assetGroupDropdown.map((x) => ({
                    id: x.id ?? x.groupId ?? x.code ?? String(Math.random()),
                    name: x.name ?? x.groupName ?? x.displayName ?? "Unnamed",
                }));
                setAssetOptions(opts);
            }
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

// ===== สร้างรายการ (POST /schedules) =====
    const [saving, setSaving] = useState(false);
    const [newSch, setNewSch] = useState({
        scope: "",
        target: "",
        cycle: "",
        notify: "",
        lastDate: new Date().toISOString().slice(0, 10),
    });

    const validateNewSch = () => {
        if (!newSch.scope) return "กรุณาเลือก Scope";
        if (!newSch.target?.trim()) return "กรุณากรอก Target";
        if (!newSch.cycle || Number(newSch.cycle) < 1) return "Cycle ต้อง ≥ 1";
        if (newSch.notify === "" || Number(newSch.notify) < 0) return "Notify ต้อง ≥ 0";
        if (!newSch.lastDate) return "กรุณาเลือก Last date";
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

    // ===== ลบรายการ (DELETE /schedules/{id}) =====
    const deleteRow = async (rowId) => {
        if (!confirm("ลบรายการนี้ใช่หรือไม่?")) return;
        try {
            const res = await fetch(SCHEDULE_API.DELETE(rowId), {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) throw new Error(await res.text());
            await loadSchedules();
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

    const loadAssets = async () => {
        // ตอนนี้เราดึงจาก /schedules แล้ว ไม่มี endpoint แยก
        setAssetError(null);
        setAssetLoading(false);
    };

    // เดิมของคุณ
    useEffect(() => {
        if (newSch.scope === "Asset") {
            fetchAssetDropdown({ source: "available" });
            setNewSch((p) => ({ ...p, asset: "" }));
        }
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
              onPageChange={setCurrentPage}
              totalRecords={totalRecords}
              onPageSizeChange={setPageSize}
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

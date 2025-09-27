import React, { useEffect, useMemo, useState } from "react";
import Layout from "../component/layout";
import Modal from "../component/modal";
import Pagination from "../component/pagination";
import { pageSize as defaultPageSize } from "../config_variable";
import * as bootstrap from "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

/* ========= API via fetch ========= */
const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:8080";

async function getJSON(url, opts = {}) {
    const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/json", ...(opts.headers || {}) },
        ...opts,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    if (res.status === 204) return null;
    // ปลอดภัยเมื่อ body ว่าง (เช่น 200/201 but no content)
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

const API = {
    listPackages: () => getJSON(`${API_BASE}/packages`),
    listContractTypes: () => getJSON(`${API_BASE}/contract-types`),
    createPackage: (body) =>
        getJSON(`${API_BASE}/packages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }),
    /**
     * อัปเดตสถานะเปิด/ปิดแบบ fallback หลายรูปแบบ
     */
    updateActive: async (id, nextActive) => {
        const bool = !!nextActive;
        const num = bool ? 1 : 0;

        const attempts = [
            // 1) แยกเส้นทาง /active (PUT)
            {
                url: `${API_BASE}/packages/${id}/active`,
                opts: {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ active: bool }),
                },
            },
            // 2) PATCH ทั้งออบเจ็กต์ (active/isActive เป็น boolean)
            {
                url: `${API_BASE}/packages/${id}`,
                opts: {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ active: bool, isActive: bool }),
                },
            },
            // 3) PUT ทั้งออบเจ็กต์ (is_active เป็น 0/1)
            {
                url: `${API_BASE}/packages/${id}`,
                opts: {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_active: num }),
                },
            },
        ];

        let lastErr;
        for (const { url, opts } of attempts) {
            try {
                const res = await fetch(url, { credentials: "include", ...opts });
                if (res.ok) {
                    return res.status === 204 ? null : await res.json().catch(() => null);
                }
                lastErr = new Error(`HTTP ${res.status} for ${url}`);
            } catch (e) {
                lastErr = e;
            }
        }
        throw lastErr || new Error("Failed to update active status");
    },
    deletePackage: (id) =>
        getJSON(`${API_BASE}/packages/${id}`, { method: "DELETE" }),
};

/* ===================== สีตามเดือน + ยูทิลสี ===================== */
const COLOR_BY_MONTHS = { 3: "#FFC73B", 6: "#EF98C4", 9: "#87C6FF", 12: "#9691F9" };
const hashToColor = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h << 5) - h + str.charCodeAt(i);
        h |= 0;
    }
    const hue = Math.abs(h) % 360;
    return `hsl(${hue}, 70%, 70%)`;
};
const withColor = (pkg) => {
    if (pkg.color) return pkg;
    const key = String(pkg.contractTypeName || pkg.label || pkg.id || "");
    const derived = COLOR_BY_MONTHS[pkg.months] || hashToColor(key);
    return { ...pkg, color: derived };
};

/* ===================== ปิดโมดัลแบบชัวร์ ===================== */
const closeModalSafely = (id) => {
    const el = document.getElementById(id);
    const inst = el ? bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el) : null;
    if (inst) {
        inst.hide();
        inst.dispose();
    } else {
        const opened = document.querySelector(".modal.show");
        if (opened) bootstrap.Modal.getInstance(opened)?.hide();
    }
    document.querySelectorAll(".modal-backdrop").forEach((d) => d.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("paddingRight");
};

const hideOffcanvasSafely = (id) => {
    const el = document.getElementById(id);
    const inst = el ? (bootstrap.Offcanvas.getInstance(el) || new bootstrap.Offcanvas(el)) : null;
    if (inst) inst.hide();
};

/* ========= Helpers ========= */
const labelFromMonths = (m) => (m === 12 ? "1 Year" : `${m} Month`);

// รองรับ DTO หลายสไตล์: contractType หรือ contract_type
const mapDtoToRow = (dto) => {
    const ct = dto.contractType || dto.contract_type || {};
    const months = Number(ct.months ?? ct.duration ?? dto.duration ?? 0);
    const name = ct.name || dto.contract_name || labelFromMonths(months || 0);

    return withColor({
        id: dto.id,
        contractTypeId: ct.id ?? dto.contractTypeId ?? dto.contract_type_id ?? null,
        contractTypeName: name,
        label: name,
        months,
        rent: Number(dto.price),
        active: Number(dto.is_active) === 1 || dto.is_active === true,
        createDate: dto.createDate || "-",
    });
};

function PackageManagement() {
    const [packages, setPackages] = useState([]);
    const [contractTypes, setContractTypes] = useState([]); // [{id,name,months}]
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // ฟอร์มสร้างใหม่ (เลือกจาก contractType)
    const [newPkg, setNewPkg] = useState({
        contractTypeId: null,
        months: 0,
        rent: 5000,
        createDate: new Date().toISOString().slice(0, 10),
        active: true,
    });

    // ฟิลเตอร์/ค้นหา/เรียง
    const [filters, setFilters] = useState({
        contractTypeId: "ALL",
        active: "ALL",
        rentMin: "",
        rentMax: "",
        dateFrom: "",
        dateTo: "",
    });

    const openCreateModal = () => {
        hideOffcanvasSafely("packageFilterCanvas");

        // ค่า default ให้ newPkg ก่อนเปิด modal
        if (!newPkg.contractTypeId && contractTypes.length) {
            const first = contractTypes[0];
            setNewPkg((p) => ({ ...p, contractTypeId: String(first.id), months: first.months }));
        }

        const el = document.getElementById("createPackageModal");
        if (el) {
            const inst = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el, { backdrop: "static" });
            inst.show();
        }
    };

    const [search, setSearch] = useState("");
    const [sortAsc, setSortAsc] = useState(true);

    /* ===== Load ===== */
    const fetchContractTypes = async () => {
        try {
            const raw = await API.listContractTypes();
            const rows = (raw || []).map((r) => ({
                id: r.id ?? r.contractTypeId ?? r.contract_type_id,
                name: r.name ?? r.contract_name ?? labelFromMonths(Number(r.months ?? r.duration ?? 0)),
                months: Number(r.months ?? r.duration ?? 0),
            }));
            setContractTypes(rows);

            // default select
            setNewPkg((p) =>
                p.contractTypeId ? p : rows[0] ? { ...p, contractTypeId: rows[0].id, months: rows[0].months } : p
            );
        } catch (e) {
            console.error("fetchContractTypes error:", e);
        }
    };

    const fetchPackages = async () => {
        setLoading(true);
        setErr("");
        try {
            const data = await API.listPackages();
            setPackages((data || []).map(mapDtoToRow));
        } catch (e) {
            console.error("fetchPackages error:", e);
            setErr("Error fetching packages");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContractTypes();
        fetchPackages();
    }, []);

    /* ===== Actions: Toggle เปิดได้ทีละ 1 ต่อ months ===== */
    const toggleActive = async (row) => {
        const willActive = !row.active;

        if (willActive) {
            // เปิดอันนี้ และปิดตัวอื่นที่ months เดียวกัน
            const sameMonths = packages.filter((p) => p.months === row.months);
            const toDeactivate = sameMonths.filter((p) => p.id !== row.id && p.active);

            // Optimistic update
            setPackages((prev) =>
                prev.map((p) =>
                    p.id === row.id
                        ? { ...p, active: true }
                        : p.months === row.months
                            ? { ...p, active: false }
                            : p
                )
            );

            try {
                await Promise.allSettled([
                    API.updateActive(row.id, true),
                    ...toDeactivate.map((p) => API.updateActive(p.id, false)),
                ]);
            } catch (e) {
                console.error("updateActive (open-group) error:", e);
            } finally {
                // sync กับ server
                await fetchPackages();
            }
        } else {
            // ปิดเฉพาะอันนี้
            setPackages((prev) => prev.map((p) => (p.id === row.id ? { ...p, active: false } : p)));
            try {
                await API.updateActive(row.id, false);
            } catch (e) {
                console.error("updateActive (close-one) error:", e);
            } finally {
                await fetchPackages();
            }
        }
    };

    /* ===== Filter + Search + Sort ===== */
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        let rows = [...packages];

        rows = rows.filter((p) => {
            if (filters.contractTypeId !== "ALL" && String(p.contractTypeId) !== String(filters.contractTypeId)) return false;
            if (filters.active !== "ALL") {
                const want = filters.active === "TRUE";
                if (p.active !== want) return false;
            }
            if (filters.rentMin !== "" && p.rent < Number(filters.rentMin)) return false;
            if (filters.rentMax !== "" && p.rent > Number(filters.rentMax)) return false;
            if (filters.dateFrom && p.createDate && p.createDate !== "-" && p.createDate < filters.dateFrom) return false;
            if (filters.dateTo && p.createDate && p.createDate !== "-" && p.createDate > filters.dateTo) return false;
            return true;
        });

        if (q) {
            rows = rows.filter(
                (p) =>
                    (p.contractTypeName || "").toLowerCase().includes(q) ||
                    String(p.rent).includes(q) ||
                    (p.createDate && p.createDate.includes(q))
            );
        }

        const key = (x) => (x.createDate === "-" ? "" : x.createDate);
        rows.sort((a, b) => (sortAsc ? key(a).localeCompare(key(b)) : key(b).localeCompare(key(a))));
        return rows;
    }, [packages, filters, search, sortAsc]);

    /* ===== Pagination ===== */
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered, currentPage, pageSize]);

    /* ===== Create (ปิดโมดัลหลังเซฟ และไม่โชว์ "Error creating package") ===== */
    const [saving, setSaving] = useState(false);

// แทนที่ฟังก์ชันเดิมทั้งก้อนด้วยอันนี้
    const handleSaveCreate = async () => {
        if (!newPkg.contractTypeId) {
            setErr("Please select contract type");
            return;
        }

        setSaving(true); // กันกดซ้ำ
        try {
            const idNum = Number(newPkg.contractTypeId);
            const ct = contractTypes.find((c) => Number(c.id) === idNum);

            const payload = {
                price: Number(newPkg.rent),
                isActive: !!newPkg.active,
                is_active: newPkg.active ? 1 : 0,
                contractTypeId: idNum,
                contract_type_id: idNum,
                contractType: { id: idNum },
                duration: newPkg.months || ct?.months || 0,
            };

            await API.createPackage(payload);    // บันทึก
            await fetchPackages();               // ดึงข้อมูลใหม่ (ไม่ต้องรีเฟรชทั้งหน้า)
            closeModalSafely("createPackageModal"); // ปิดโมดัล
            // รีเซ็ตฟอร์มตามต้องการ
            setNewPkg((p) => ({ ...p, rent: 5000, active: true }));
        } catch (e) {
            console.error("createPackage error:", e);
            // ไม่ต้อง setErr("Error creating package") ตามที่สั่ง
        } finally {
            setSaving(false);
        }
    };

    const clearFilters = () =>
        setFilters({
            contractTypeId: "ALL",
            active: "ALL",
            rentMin: "",
            rentMax: "",
            dateFrom: "",
            dateTo: "",
        });

    const hasAnyFilter =
        filters.contractTypeId !== "ALL" ||
        filters.active !== "ALL" ||
        filters.rentMin !== "" ||
        filters.rentMax !== "" ||
        !!filters.dateFrom ||
        !!filters.dateTo;

    const filterSummary = [];
    if (filters.contractTypeId !== "ALL") {
        const ct = contractTypes.find((c) => String(c.id) === String(filters.contractTypeId));
        filterSummary.push(`Package: ${ct ? ct.name : filters.contractTypeId}`);
    }
    if (filters.active !== "ALL") filterSummary.push(`Status: ${filters.active === "TRUE" ? "Active" : "Inactive"}`);
    if (filters.rentMin !== "") filterSummary.push(`Rent ≥ ${filters.rentMin}`);
    if (filters.rentMax !== "") filterSummary.push(`Rent ≤ ${filters.rentMax}`);
    if (filters.dateFrom) filterSummary.push(`From ${filters.dateFrom}`);
    if (filters.dateTo) filterSummary.push(`To ${filters.dateTo}`);

    return (
        <Layout title="Package Management" icon="bi bi-sticky" notifications={0}>
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
                                            data-bs-target="#packageFilterCanvas"
                                        >
                                            <i className="bi bi-filter me-1"></i> Filter
                                            {hasAnyFilter && <span className="badge bg-primary ms-2">●</span>}
                                        </button>

                                        <button className="btn btn-link tm-link p-0" onClick={() => setSortAsc((s) => !s)}>
                                            <i className="bi bi-arrow-down-up me-1"></i> Sort
                                        </button>

                                        <div className="input-group tm-search">
                      <span className="input-group-text bg-white border-end-0">
                        <i className="bi bi-search"></i>
                      </span>
                                            <input
                                                type="text"
                                                className="form-control border-start-0"
                                                placeholder="Search package"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-2">
                                        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                                            <i className="bi bi-plus-lg me-1"></i> Create Package
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

                        {err && <div className="alert alert-danger mt-3">{err}</div>}
                        {loading && <div className="alert alert-info mt-3">Loading packages...</div>}

                        {/* Table */}
                        <div className="table-wrapper mt-3">
                            <table className="table text-nowrap">
                                <colgroup>
                                    <col style={{ width: 80 }} />
                                    <col style={{ width: 160 }} />
                                    <col />
                                    <col style={{ width: 120 }} />
                                </colgroup>

                                <thead>
                                <tr>
                                    <th className="text-start align-middle header-color">Order</th>
                                    <th className="text-start align-middle header-color">Package</th>
                                    <th className="text-start align-middle header-color">Rent</th>
                                    <th className="text-center align-middle header-color">Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {pageRows.length ? (
                                    pageRows.map((item, idx) => (
                                        <tr key={item.id}>
                                            <td className="align-middle">{(currentPage - 1) * pageSize + idx + 1}</td>
                                            <td className="align-middle">
                          <span
                              className="badge rounded-pill px-3 py-2"
                              style={{ backgroundColor: withColor(item).color }}
                          >
                            <i className="bi bi-circle-fill me-2"></i>
                              {item.contractTypeName}
                          </span>
                                            </td>
                                            <td className="align-middle">{item.rent.toLocaleString()}</td>
                                            <td className="align-middle text-center">
                                                <div className="form-check form-switch d-inline-flex">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        role="switch"
                                                        checked={item.active}
                                                        onChange={() => toggleActive(item)}
                                                        aria-label={`Toggle ${item.contractTypeName}`}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center">
                                            No packages found
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

            {/* Create Package Modal */}
            <Modal id="createPackageModal" title="Create Package" con="bi bi-sticky" size="modal-lg">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveCreate();
                    }}
                >
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Contract type</label>
                            <select
                                className="form-select"
                                value={newPkg.contractTypeId ?? ""}
                                onChange={(e) => {
                                    const id = e.target.value;
                                    const ct = contractTypes.find((c) => String(c.id) === String(id));
                                    setNewPkg((p) => ({ ...p, contractTypeId: id, months: ct?.months ?? p.months }));
                                }}
                                required
                            >
                                {contractTypes.length === 0 && <option value="">Loading...</option>}
                                {contractTypes.map((ct) => (
                                    <option key={ct.id} value={ct.id}>
                                        {ct.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Rent</label>
                            <input
                                type="number"
                                className="form-control"
                                value={newPkg.rent}
                                onChange={(e) => setNewPkg((p) => ({ ...p, rent: Number(e.target.value) }))}
                                required
                            />
                        </div>

                        <div className="col-md-6 d-flex align-items-end">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    checked={newPkg.active}
                                    onChange={(e) => setNewPkg((p) => ({ ...p, active: e.target.checked }))}
                                    id="newPkgActive"
                                />
                                <label className="form-check-label ms-2" htmlFor="newPkgActive">
                                    Active
                                </label>
                            </div>
                        </div>

                        <div className="col-12 d-flex justify-content-center gap-3 pt-3 pb-3">
                            <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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
                id="packageFilterCanvas"
                aria-labelledby="packageFilterCanvasLabel"
            >
                <div className="offcanvas-header">
                    <h5 id="packageFilterCanvasLabel" className="mb-0">
                        <i className="bi bi-filter me-2"></i>Filters
                    </h5>
                    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>

                <div className="offcanvas-body">
                    <div className="row g-3">
                        <div className="col-12">
                            <label className="form-label">Package</label>
                            <select
                                className="form-select"
                                value={filters.contractTypeId}
                                onChange={(e) => setFilters((f) => ({ ...f, contractTypeId: e.target.value }))}
                            >
                                <option value="ALL">All</option>
                                {contractTypes.map((ct) => (
                                    <option key={ct.id} value={ct.id}>
                                        {ct.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-12">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={filters.active}
                                onChange={(e) => setFilters((f) => ({ ...f, active: e.target.value }))}
                            >
                                <option value="ALL">All</option>
                                <option value="TRUE">Active</option>
                                <option value="FALSE">Inactive</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Rent min</label>
                            <input
                                type="number"
                                className="form-control"
                                value={filters.rentMin}
                                onChange={(e) => setFilters((f) => ({ ...f, rentMin: e.target.value }))}
                                placeholder="e.g. 4500"
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Rent max</label>
                            <input
                                type="number"
                                className="form-control"
                                value={filters.rentMax}
                                onChange={(e) => setFilters((f) => ({ ...f, rentMax: e.target.value }))}
                                placeholder="e.g. 6000"
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Create date from</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Create date to</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.dateTo}
                                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                            />
                        </div>

                        <div className="col-12 d-flex justify-content-between mt-2">
                            <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>
                                Clear
                            </button>
                            <button type="button" className="btn btn-primary" data-bs-dismiss="offcanvas">
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default PackageManagement;


// import React, { useEffect, useMemo, useState } from "react";
// import Layout from "../component/layout";
// import Modal from "../component/modal";
// import Pagination from "../component/pagination";
// import { pageSize as defaultPageSize } from "../config_variable";
// import * as bootstrap from "bootstrap";
// import "bootstrap/dist/css/bootstrap.min.css";
// import "bootstrap-icons/font/bootstrap-icons.css";
//
// /* ========= API via fetch ========= */
// const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:8080";
//
// async function getJSON(url, opts = {}) {
//     const res = await fetch(url, {
//         credentials: "include",
//         headers: { "Accept": "application/json", ...(opts.headers || {}) },
//         ...opts,
//     });
//     if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
//     return res.status === 204 ? null : res.json();
// }
//
// const API = {
//     listPackages: () => getJSON(`${API_BASE}/packages`),
//     listContractTypes: () => getJSON(`${API_BASE}/contract-types`),
//     createPackage: (body) =>
//         getJSON(`${API_BASE}/packages`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(body),
//         }),
//     updateActive: async (id, nextActive) => {
//         const bool = !!nextActive;
//         const num = bool ? 1 : 0;
//
//         const attempts = [
//             { url: `${API_BASE}/packages/${id}/active`, opts: { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: bool }) } },
//             { url: `${API_BASE}/packages/${id}`, opts: { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: bool, isActive: bool }) } },
//             { url: `${API_BASE}/packages/${id}`, opts: { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: num }) } },
//         ];
//
//         for (const { url, opts } of attempts) {
//             try {
//                 const res = await fetch(url, { credentials: "include", ...opts });
//                 if (res.ok) return res.status === 204 ? null : res.json().catch(() => null);
//             } catch (e) {}
//         }
//         throw new Error("Failed to update active status");
//     },
//     deletePackage: (id) => getJSON(`${API_BASE}/packages/${id}`, { method: "DELETE" }),
// };
//
// /* ===== Actions ===== */
// const toggleActive = async (row) => {
//     const willActive = !row.active;
//     setPackages((prev) => prev.map((p) => (p.id === row.id ? { ...p, active: willActive } : p)));
//     try {
//         await API.updateActive(row.id, willActive ? 1 : 0);
//     } catch (e) {
//         console.error("updateActive error:", e);
//         fetchPackages(); // revert by server truth
//     }
// };
//
// /* ===================== สีตามเดือน + ยูทิลสี ===================== */
// const COLOR_BY_MONTHS = { 3: "#FFC73B", 6: "#EF98C4", 9: "#87C6FF", 12: "#9691F9" };
// const hashToColor = (str) => {
//     let h = 0;
//     for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
//     const hue = Math.abs(h) % 360;
//     return `hsl(${hue}, 70%, 70%)`;
// };
// const withColor = (pkg) => {
//     if (pkg.color) return pkg;
//     const key = String(pkg.contractTypeName || pkg.label || pkg.id || "");
//     const derived = COLOR_BY_MONTHS[pkg.months] || hashToColor(key);
//     return { ...pkg, color: derived };
// };
//
// /* ===================== ปิดโมดัลแบบชัวร์ ===================== */
// const closeModalSafely = (id) => {
//     const el = document.getElementById(id);
//     const inst = el ? bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el) : null;
//     if (inst) { inst.hide(); inst.dispose(); }
//     else { const opened = document.querySelector(".modal.show"); if (opened) bootstrap.Modal.getInstance(opened)?.hide(); }
//     document.querySelectorAll(".modal-backdrop").forEach((d) => d.remove());
//     document.body.classList.remove("modal-open");
//     document.body.style.removeProperty("overflow");
//     document.body.style.removeProperty("paddingRight");
// };
//
// const hideOffcanvasSafely = (id) => {
//     const el = document.getElementById(id);
//     const inst = el ? (bootstrap.Offcanvas.getInstance(el) || new bootstrap.Offcanvas(el)) : null;
//     if (inst) inst.hide();
// };
//
//
// /* ========= Helpers ========= */
// const labelFromMonths = (m) => (m === 12 ? "1 Year" : `${m} Month`);
//
// // รองรับ DTO หลายสไตล์: contractType หรือ contract_type
// const mapDtoToRow = (dto) => {
//     const ct = dto.contractType || dto.contract_type || {};
//     const months = Number(ct.months ?? ct.duration ?? dto.duration ?? 0);
//     const name = ct.name || dto.contract_name || labelFromMonths(months || 0);
//
//     return withColor({
//         id: dto.id,
//         contractTypeId: ct.id ?? dto.contractTypeId ?? dto.contract_type_id ?? null,
//         contractTypeName: name,
//         label: name,
//         months,
//         rent: Number(dto.price),
//         active: Number(dto.is_active) === 1 || dto.is_active === true,
//         createDate: dto.createDate || "-",
//     });
// };
//
// function PackageManagement() {
//     const [packages, setPackages] = useState([]);
//     const [contractTypes, setContractTypes] = useState([]); // [{id,name,months}]
//     const [loading, setLoading] = useState(false);
//     const [err, setErr] = useState("");
//
//     // ฟอร์มสร้างใหม่ (เลือกจาก contractType)
//     const [newPkg, setNewPkg] = useState({
//         contractTypeId: null,
//         months: 0,
//         rent: 5000,
//         createDate: new Date().toISOString().slice(0, 10),
//         active: true,
//     });
//
//     // ฟิลเตอร์/ค้นหา/เรียง
//     const [filters, setFilters] = useState({
//         contractTypeId: "ALL",
//         active: "ALL",
//         rentMin: "",
//         rentMax: "",
//         dateFrom: "",
//         dateTo: "",
//     });
//
//     const openCreateModal = () => {
//         hideOffcanvasSafely("packageFilterCanvas");
//
//         // 👉 set ค่า default ให้ newPkg ก่อนเปิด modal
//         if (!newPkg.contractTypeId && contractTypes.length) {
//             const first = contractTypes[0];
//             setNewPkg((p) => ({ ...p, contractTypeId: String(first.id), months: first.months }));
//         }
//
//         const el = document.getElementById("createPackageModal");
//         if (el) {
//             const inst = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el, { backdrop: "static" });
//             inst.show();
//         }
//     };
//
//     const [search, setSearch] = useState("");
//     const [sortAsc, setSortAsc] = useState(true);
//
//     /* ===== Load ===== */
//     const fetchContractTypes = async () => {
//         try {
//             const raw = await API.listContractTypes();
//             const rows = (raw || []).map((r) => ({
//                 id: r.id ?? r.contractTypeId ?? r.contract_type_id,
//                 name: r.name ?? r.contract_name ?? labelFromMonths(Number(r.months ?? r.duration ?? 0)),
//                 months: Number(r.months ?? r.duration ?? 0),
//             }));
//             setContractTypes(rows);
//
//             // default select
//             setNewPkg((p) => (p.contractTypeId ? p : rows[0] ? { ...p, contractTypeId: rows[0].id, months: rows[0].months } : p));
//         } catch (e) {
//             console.error("fetchContractTypes error:", e);
//         }
//     };
//
//     const fetchPackages = async () => {
//         setLoading(true);
//         setErr("");
//         try {
//             const data = await API.listPackages();
//             setPackages((data || []).map(mapDtoToRow));
//         } catch (e) {
//             console.error("fetchPackages error:", e);
//             setErr("Error fetching packages");
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     useEffect(() => { fetchContractTypes(); fetchPackages(); }, []);
//
//     /* ===== Filter + Search + Sort ===== */
//     const filtered = useMemo(() => {
//         const q = search.trim().toLowerCase();
//         let rows = [...packages];
//
//         rows = rows.filter((p) => {
//             if (filters.contractTypeId !== "ALL" && String(p.contractTypeId) !== String(filters.contractTypeId)) return false;
//             if (filters.active !== "ALL") {
//                 const want = filters.active === "TRUE";
//                 if (p.active !== want) return false;
//             }
//             if (filters.rentMin !== "" && p.rent < Number(filters.rentMin)) return false;
//             if (filters.rentMax !== "" && p.rent > Number(filters.rentMax)) return false;
//             if (filters.dateFrom && p.createDate && p.createDate !== "-" && p.createDate < filters.dateFrom) return false;
//             if (filters.dateTo && p.createDate && p.createDate !== "-" && p.createDate > filters.dateTo) return false;
//             return true;
//         });
//
//         if (q) {
//             rows = rows.filter(
//                 (p) =>
//                     (p.contractTypeName || "").toLowerCase().includes(q) ||
//                     String(p.rent).includes(q) ||
//                     (p.createDate && p.createDate.includes(q))
//             );
//         }
//
//         const key = (x) => (x.createDate === "-" ? "" : x.createDate);
//         rows.sort((a, b) => (sortAsc ? key(a).localeCompare(key(b)) : key(b).localeCompare(key(a))));
//         return rows;
//     }, [packages, filters, search, sortAsc]);
//
//     /* ===== Pagination ===== */
//     const [currentPage, setCurrentPage] = useState(1);
//     const [pageSize, setPageSize] = useState(defaultPageSize || 10);
//     const totalRecords = filtered.length;
//     const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
//
//     useEffect(() => { setCurrentPage(1); }, [search, sortAsc, pageSize, filters]);
//
//     const pageRows = useMemo(() => {
//         const start = (currentPage - 1) * pageSize;
//         return filtered.slice(start, start + pageSize);
//     }, [filtered, currentPage, pageSize]);
//
//
//     const handleSaveCreate = async () => {
//         if (!newPkg.contractTypeId) {
//             setErr("Please select contract type");
//             return;
//         }
//         const idNum = Number(newPkg.contractTypeId);      // บังคับเป็นตัวเลข
//         const ct = contractTypes.find((c) => Number(c.id) === idNum);
//
//         const payload = {
//             price: Number(newPkg.rent),
//             // boolean และ snake_case ให้ทั้งคู่ (บาง DTO รับแบบใดแบบหนึ่ง)
//             isActive: !!newPkg.active,
//             is_active: newPkg.active ? 1 : 0,
//
//             // ให้ครบทั้ง 3 แบบที่ backend อาจแม็พ
//             contractTypeId: idNum,
//             contract_type_id: idNum,
//             contractType: { id: idNum },
//
//             // ถ้า duration อยู่ใน ContractType ฝั่ง server ไม่ต้องใช้ก็ได้ แต่ใส่ไว้ไม่เสียหาย
//             duration: newPkg.months || ct?.months || 0,
//         };
//
//         console.log("POST /packages payload =>", payload);
//
//         try {
//             const res = await API.createPackage(payload);
//             if (res) {
//                 await fetchPackages();
//                 closeModalSafely("createPackageModal");
//             }
//         } catch (e) {
//             console.error("createPackage error:", e);
//             setErr(e?.body || "Error creating package");
//         }
//     };
//
//     const clearFilters = () =>
//         setFilters({ contractTypeId: "ALL", active: "ALL", rentMin: "", rentMax: "", dateFrom: "", dateTo: "" });
//
//     const hasAnyFilter =
//         filters.contractTypeId !== "ALL" ||
//         filters.active !== "ALL" ||
//         filters.rentMin !== "" ||
//         filters.rentMax !== "" ||
//         !!filters.dateFrom ||
//         !!filters.dateTo;
//
//     const filterSummary = [];
//     if (filters.contractTypeId !== "ALL") {
//         const ct = contractTypes.find((c) => String(c.id) === String(filters.contractTypeId));
//         filterSummary.push(`Package: ${ct ? ct.name : filters.contractTypeId}`);
//     }
//     if (filters.active !== "ALL") filterSummary.push(`Status: ${filters.active === "TRUE" ? "Active" : "Inactive"}`);
//     if (filters.rentMin !== "") filterSummary.push(`Rent ≥ ${filters.rentMin}`);
//     if (filters.rentMax !== "") filterSummary.push(`Rent ≤ ${filters.rentMax}`);
//     if (filters.dateFrom) filterSummary.push(`From ${filters.dateFrom}`);
//     if (filters.dateTo) filterSummary.push(`To ${filters.dateTo}`);
//
//     return (
//         <Layout title="Package Management" icon="bi bi-sticky" notifications={0}>
//             <div className="container-fluid">
//                 <div className="row min-vh-100">
//                     <div className="col-lg-11 p-4">
//                         {/* Toolbar */}
//                         <div className="toolbar-wrapper card border-0 bg-white">
//                             <div className="card-header bg-white border-0 rounded-3">
//                                 <div className="tm-toolbar d-flex justify-content-between align-items-center">
//                                     <div className="d-flex align-items-center gap-3">
//                                         <button
//                                             className="btn btn-link tm-link p-0"
//                                             data-bs-toggle="offcanvas"
//                                             data-bs-target="#packageFilterCanvas"
//                                         >
//                                             <i className="bi bi-filter me-1"></i> Filter
//                                             {hasAnyFilter && <span className="badge bg-primary ms-2">●</span>}
//                                         </button>
//
//                                         <button className="btn btn-link tm-link p-0" onClick={() => setSortAsc((s) => !s)}>
//                                             <i className="bi bi-arrow-down-up me-1"></i> Sort
//                                         </button>
//
//                                         <div className="input-group tm-search">
//                       <span className="input-group-text bg-white border-end-0">
//                         <i className="bi bi-search"></i>
//                       </span>
//                                             <input
//                                                 type="text"
//                                                 className="form-control border-start-0"
//                                                 placeholder="Search package"
//                                                 value={search}
//                                                 onChange={(e) => setSearch(e.target.value)}
//                                             />
//                                         </div>
//                                     </div>
//
//                                     <div className="d-flex align-items-center gap-2">
//                                         <button
//                                             type="button"
//                                             className="btn btn-primary"
//                                             onClick={openCreateModal}   // ← ใช้อันนี้แทน data-bs-toggle/target
//                                         >
//                                             <i className="bi bi-plus-lg me-1"></i> Create Package
//                                         </button>
//                                     </div>
//                                 </div>
//
//                                 <div className={`collapse ${hasAnyFilter ? "show" : ""}`}>
//                                     <div className="pt-2 d-flex flex-wrap gap-2">
//                                         {filterSummary.map((txt, idx) => (
//                                             <span key={idx} className="badge bg-light text-dark border">{txt}</span>
//                                         ))}
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//
//                         {err && <div className="alert alert-danger mt-3">{err}</div>}
//                         {loading && <div className="alert alert-info mt-3">Loading packages...</div>}
//
//                         {/* Table */}
//                         <div className="table-wrapper mt-3">
//                             <table className="table text-nowrap">
//                                 <colgroup>
//                                     <col style={{ width: 80 }} />
//                                     <col style={{ width: 160 }} />
//                                     <col />
//                                     <col style={{ width: 120 }} />
//                                 </colgroup>
//
//                                 <thead>
//                                 <tr>
//                                     <th className="text-start align-middle header-color">Order</th>
//                                     <th className="text-start align-middle header-color">Package</th>
//                                     <th className="text-start align-middle header-color">Rent</th>
//                                     <th className="text-center align-middle header-color">Action</th>
//                                 </tr>
//                                 </thead>
//                                 <tbody>
//                                 {pageRows.length ? (
//                                     pageRows.map((item, idx) => (
//                                         <tr key={item.id}>
//                                             <td className="align-middle">{(currentPage - 1) * pageSize + idx + 1}</td>
//                                             <td className="align-middle">
//                           <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: withColor(item).color }}>
//                             <i className="bi bi-circle-fill me-2"></i>
//                               {item.contractTypeName}
//                           </span>
//                                             </td>
//                                             <td className="align-middle">{item.rent.toLocaleString()}</td>
//                                             <td className="align-middle text-center">
//                                                 <div className="form-check form-switch d-inline-flex">
//                                                     <input
//                                                         className="form-check-input"
//                                                         type="checkbox"
//                                                         role="switch"
//                                                         checked={item.active}
//                                                         onChange={() => toggleActive(item)}
//                                                         aria-label={`Toggle ${item.contractTypeName}`}
//                                                     />
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     ))
//                                 ) : (
//                                     <tr><td colSpan="5" className="text-center">No packages found</td></tr>
//                                 )}
//                                 </tbody>
//                             </table>
//                         </div>
//
//                         <Pagination
//                             currentPage={currentPage}
//                             totalPages={totalPages}
//                             onPageChange={setCurrentPage}
//                             totalRecords={totalRecords}
//                             onPageSizeChange={setPageSize}
//                         />
//                     </div>
//                 </div>
//             </div>
//
//             {/* Create Package Modal */}
//             <Modal id="createPackageModal" title="Create Package" con="bi bi-sticky" size="modal-lg">
//                 <form
//                     onSubmit={(e) => {
//                         e.preventDefault();
//                         handleSaveCreate();
//                     }}
//                 >
//                     <div className="row g-3">
//                         <div className="col-md-6">
//                             <label className="form-label">Contract type</label>
//                             <select
//                                 className="form-select"
//                                 value={newPkg.contractTypeId ?? ""}
//                                 onChange={(e) => {
//                                     const id = e.target.value;
//                                     const ct = contractTypes.find((c) => String(c.id) === String(id));
//                                     setNewPkg((p) => ({ ...p, contractTypeId: id, months: ct?.months ?? p.months }));
//                                 }}
//                                 required
//                             >
//                                 {contractTypes.length === 0 && <option value="">Loading...</option>}
//                                 {contractTypes.map((ct) => (
//                                     <option key={ct.id} value={ct.id}>{ct.name}</option>
//                                 ))}
//                             </select>
//                         </div>
//
//                         <div className="col-md-6">
//                             <label className="form-label">Rent</label>
//                             <input
//                                 type="number"
//                                 className="form-control"
//                                 value={newPkg.rent}
//                                 onChange={(e) => setNewPkg((p) => ({ ...p, rent: Number(e.target.value) }))}
//                                 required
//                             />
//                         </div>
//
//                         <div className="col-md-6 d-flex align-items-end">
//                             <div className="form-check form-switch">
//                                 <input
//                                     className="form-check-input"
//                                     type="checkbox"
//                                     role="switch"
//                                     checked={newPkg.active}
//                                     onChange={(e) => setNewPkg((p) => ({ ...p, active: e.target.checked }))}
//                                     id="newPkgActive"
//                                 />
//                                 <label className="form-check-label ms-2" htmlFor="newPkgActive">Active</label>
//                             </div>
//                         </div>
//
//                         <div className="col-12 d-flex justify-content-center gap-3 pt-3 pb-3">
//                             <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
//                             <button type="submit" className="btn btn-primary">Save</button>
//                         </div>
//                     </div>
//                 </form>
//             </Modal>
//
//             {/* Filters Offcanvas */}
//             <div className="offcanvas offcanvas-end" tabIndex="-1" id="packageFilterCanvas" aria-labelledby="packageFilterCanvasLabel">
//                 <div className="offcanvas-header">
//                     <h5 id="packageFilterCanvasLabel" className="mb-0">
//                         <i className="bi bi-filter me-2"></i>Filters
//                     </h5>
//                     <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
//                 </div>
//
//                 <div className="offcanvas-body">
//                     <div className="row g-3">
//                         <div className="col-12">
//                             <label className="form-label">Package</label>
//                             <select
//                                 className="form-select"
//                                 value={filters.contractTypeId}
//                                 onChange={(e) => setFilters((f) => ({ ...f, contractTypeId: e.target.value }))}
//                             >
//                                 <option value="ALL">All</option>
//                                 {contractTypes.map((ct) => (
//                                     <option key={ct.id} value={ct.id}>{ct.name}</option>
//                                 ))}
//                             </select>
//                         </div>
//
//                         <div className="col-12">
//                             <label className="form-label">Status</label>
//                             <select
//                                 className="form-select"
//                                 value={filters.active}
//                                 onChange={(e) => setFilters((f) => ({ ...f, active: e.target.value }))}
//                             >
//                                 <option value="ALL">All</option>
//                                 <option value="TRUE">Active</option>
//                                 <option value="FALSE">Inactive</option>
//                             </select>
//                         </div>
//
//                         <div className="col-md-6">
//                             <label className="form-label">Rent min</label>
//                             <input
//                                 type="number"
//                                 className="form-control"
//                                 value={filters.rentMin}
//                                 onChange={(e) => setFilters((f) => ({ ...f, rentMin: e.target.value }))}
//                                 placeholder="e.g. 4500"
//                             />
//                         </div>
//                         <div className="col-md-6">
//                             <label className="form-label">Rent max</label>
//                             <input
//                                 type="number"
//                                 className="form-control"
//                                 value={filters.rentMax}
//                                 onChange={(e) => setFilters((f) => ({ ...f, rentMax: e.target.value }))}
//                                 placeholder="e.g. 6000"
//                             />
//                         </div>
//
//                         <div className="col-md-6">
//                             <label className="form-label">Create date from</label>
//                             <input
//                                 type="date"
//                                 className="form-control"
//                                 value={filters.dateFrom}
//                                 onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
//                             />
//                         </div>
//                         <div className="col-md-6">
//                             <label className="form-label">Create date to</label>
//                             <input
//                                 type="date"
//                                 className="form-control"
//                                 value={filters.dateTo}
//                                 onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
//                             />
//                         </div>
//
//                         <div className="col-12 d-flex justify-content-between mt-2">
//                             <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>Clear</button>
//                             <button type="button" className="btn btn-primary" data-bs-dismiss="offcanvas">Apply</button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </Layout>
//     );
// }
//
// export default PackageManagement;
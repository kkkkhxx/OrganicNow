import React, { useMemo, useState, useEffect } from "react";
import Layout from "../component/layout";
import Modal from "../component/modal";
import Pagination from "../component/pagination";
import { pageSize as defaultPageSize } from "../config_variable";
import * as bootstrap from "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function AssetManagement() {
    // ====== DATA: เก็บเฉพาะชื่อ Asset ======
    const [packages, setPackages] = useState([
        { id: 1, name: "Refrigerator" },
        { id: 2, name: "Air conditioner" },
    ]);

    // ====== SEARCH / SORT / PAGINATION ======
    const [search, setSearch] = useState("");
    const [sortAsc, setSortAsc] = useState(true); // sort ตามชื่อ
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize || 10);

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

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        let rows = [...packages];

        if (q) {
            rows = rows.filter((r) => r.name.toLowerCase().includes(q));
        }

        rows.sort((a, b) =>
            sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        );

        return rows;
    }, [packages, search, sortAsc]);

    const totalRecords = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

    useEffect(() => {
        setCurrentPage(1);
    }, [search, sortAsc, pageSize]);

    const pageRows = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    // ====== MODAL STATE: ใช้ modal เดียว “สร้าง/แก้ไข” ======
    const [saving, setSaving] = useState(false);
    const [formName, setFormName] = useState("");
    const [editingId, setEditingId] = useState(null); // null = create, not null = edit

    const openCreate = () => {
        setEditingId(null);
        setFormName("");
        showModal();
    };

    const openEdit = (row) => {
        setEditingId(row.id);
        setFormName(row.name);
        showModal();
    };

    const showModal = () => {
        const el = document.getElementById("packageModal");
        if (!el) return;
        bootstrap.Modal.getOrCreateInstance(el).show();
    };

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

    // ====== CRUD ======
    const onSubmit = async (e) => {
        e.preventDefault();
        const name = formName.trim();
        if (!name) {
            alert("กรุณากรอกชื่อ asset");
            return;
        }

        try {
            setSaving(true);

            if (editingId == null) {
                // CREATE
                setAssets((prev) => [
                    ...prev,
                    {
                        id: prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1,
                        name,
                    },
                ]);
            } else {
                // UPDATE
                setAssets((prev) => prev.map((p) => (p.id === editingId ? { ...p, name } : p)));
            }

            closeModalSafely();
        } catch (err) {
            console.error(err);
            alert("บันทึกไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    };

    const onDelete = (row) => {
        if (!window.confirm(`ยืนยันลบ "${row.name}" ?`)) return;
        setPackages((prev) => prev.filter((p) => p.id !== row.id));
    };

    return (
        <Layout title="Asset Management" icon="bi bi-box" notifications={0}>
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
                                                placeholder="Search package"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={openCreate}
                                        >
                                            <i className="bi bi-plus-lg me-1"></i> Create Asset
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="table-wrapper mt-3">
                            <table className="table text-nowrap">
                                {/* กำหนดสัดส่วนคอลัมน์: Order แคบ, Name ยืดเต็ม, Action แคบ */}
                                <colgroup>
                                    <col style={{ width: 80 }} />   {/* Order */}
                                    <col />                         {/* Package Name (auto, กินพื้นที่ที่เหลือ) */}
                                    <col style={{ width: 120 }} />  {/* Action */}
                                </colgroup>

                                <thead>
                                <tr>
                                    <th className="text-start align-middle header-color">Order</th>
                                    <th className="text-start align-middle header-color">Package Name</th>
                                    <th className="text-center align-middle header-color">Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {pageRows.length ? (
                                    pageRows.map((item, idx) => (
                                        <tr key={item.id}>
                                            <td className="align-middle">
                                                {(currentPage - 1) * pageSize + idx + 1}
                                            </td>
                                            <td className="align-middle">{item.name}</td>
                                            <td className="align-middle text-center">
                                                <button
                                                    className="btn btn-link p-0 me-3 text-dark"
                                                    title="Edit"
                                                    onClick={() => openEdit(item)}
                                                >
                                                    <i className="bi bi-pencil-fill"></i>
                                                </button>
                                                <button
                                                    className="btn btn-link p-0 text-dark"
                                                    title="Delete"
                                                    onClick={() => onDelete(item)}
                                                >
                                                    <i className="bi bi-trash-fill"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="text-center">
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

            {/* Create / Edit Package Modal */}
            <Modal id="packageModal" title={editingId == null ? "Create Package" : "Edit Package"} icon="bi bi-box">
                <form onSubmit={onSubmit}>
                    <div className="row g-3">
                        <div className="col-12">
                            <label className="form-label">Package Name</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Premium Package"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="col-12 d-flex justify-content-center gap-3 pt-3 pb-2">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                data-bs-dismiss="modal"
                            >
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
        </Layout>
    );
}

export default AssetManagement;

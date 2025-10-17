import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import Layout from "../component/layout";
import Modal from "../component/modal";
import Pagination from "../component/pagination";
import useMessage from "../component/useMessage";
import { pageSize as defaultPageSize } from "../config_variable";
// import { pageSize as defaultPageSize, apiPath } from "../config_variable"; // เก่า
import { API_BASE_URL } from "../config/api.js"; // ใหม่
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../assets/css/tenantmanagement.css";
import "../assets/css/alert.css";

function AssetManagement() {
  // ====== Data State ======
  const [assets, setAssets] = useState([]);
  const [assetGroups, setAssetGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("ALL");

  // ====== Pagination State ======
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize || 10);

  // ====== Search/Sort State ======
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  // ====== Modal/Loading ======
  const [saving, setSaving] = useState(false);

  // ====== Asset Group form ======
  const [groupName, setGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);

  // ====== Asset form ======
  const [formName, setFormName] = useState("");
  const [formGroupId, setFormGroupId] = useState("");
  const [editingAssetId, setEditingAssetId] = useState(null);

  const [formQty, setFormQty] = useState(1);

  const {
    showMessagePermission,
    showMessageError,
    showMessageSave,
    showMessageConfirmDelete,
  } = useMessage();

  // ========= Fetch Asset Groups =========
  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/asset-group/list`, {
      // const res = await axios.get(`${apiPath}/asset-group/list`, { // เก่า
        withCredentials: true,
      });
      if (Array.isArray(res.data)) setAssetGroups(res.data);
      else setAssetGroups([]);
    } catch (err) {
      console.error("Error fetching asset groups:", err);
      setAssetGroups([]);
    }
  };

  // ========= Fetch Assets =========
  const fetchData = async (page = 1) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/assets/all`, {
      // const res = await axios.get(`${apiPath}/assets/all`, { // เก่า
        withCredentials: true,
      });

      let rows = [];
      if (res.data?.result) rows = res.data.result;
      else if (Array.isArray(res.data)) rows = res.data;

      setAssets(rows);

      setTotalRecords(rows.length);
      setTotalPages(Math.max(1, Math.ceil(rows.length / pageSize)));
      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching assets:", err);
      setAssets([]);
      setTotalRecords(0);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchData(1);
  }, [pageSize]);

  // ========= Filter Groups =========
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assetGroups;

    const groupMatches = assetGroups.filter((g) =>
      g.assetGroupName?.toLowerCase().includes(q)
    );

    const assetMatches = assets
      .filter(
        (a) =>
          a.assetName?.toLowerCase().includes(q) ||
          String(a.assetId).includes(q)
      )
      .map((a) => assetGroups.find((g) => g.assetGroupName === a.assetType))
      .filter(Boolean);

    const allMatches = [...groupMatches, ...assetMatches];
    return Array.from(new Map(allMatches.map((g) => [g.id, g])).values());
  }, [assetGroups, assets, search]);

  // ========= Filter & Sort Assets =========
  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = [...assets];

    // ✅ กรองตาม Group ที่เลือก
    if (selectedGroupId !== "ALL") {
      const group = assetGroups.find(
        (g) => String(g.id) === String(selectedGroupId)
      );

      if (group) {
        rows = rows.filter(
          (r) =>
            (r.assetType || "").trim().toLowerCase() ===
            (group.assetGroupName || "").trim().toLowerCase()
        );
      }
    }

    // ✅ กรองตามคำค้นหา (search)
    if (q) {
      rows = rows.filter(
        (r) =>
          r.assetName?.toLowerCase().includes(q) ||
          String(r.assetId).includes(q)
      );
    }

    // ✅ เรียงลำดับชื่อ (A-Z / Z-A)
    rows.sort((a, b) =>
      sortAsc
        ? a.assetName.localeCompare(b.assetName)
        : b.assetName.localeCompare(a.assetName)
    );

    return rows;
  }, [assets, search, sortAsc, selectedGroupId, assetGroups]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredAssets.length);
  const pageRows = filteredAssets.slice(startIndex, endIndex);

  // ========= Pagination Handlers =========
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // ========= Form Clear =========
  const clearFormGroup = () => {
    setEditingGroupId(null);
    setGroupName("");
  };

  const clearFormAsset = (groupId) => {
    setEditingAssetId(null);
    setFormName("");
    setFormGroupId(groupId || "");
  };

  // ========= Validation =========
  const checkValidationGroup = () => {
    if (!groupName.trim()) {
      showMessageError("กรุณากรอกชื่อ Group");
      return false;
    }
    if (groupName.trim().length < 2) {
      showMessageError("ชื่อ Group ต้องมีอย่างน้อย 2 ตัวอักษร");
      return false;
    }
    return true;
  };

  const checkValidationAsset = (payload) => {
    if (!payload.assetName || payload.assetName.trim() === "") {
      showMessageError("กรุณากรอกชื่อ Asset");
      return false;
    }
    if (payload.assetName.trim().length < 2) {
      showMessageError("ชื่อ Asset ต้องมีอย่างน้อย 2 ตัวอักษร");
      return false;
    }
    if (!payload.assetGroup?.id) {
      showMessageError("กรุณาเลือก Group");
      return false;
    }
    return true;
  };

  // ========= CRUD Asset Group =========
  const handleSaveGroup = async () => {
    if (!checkValidationGroup()) return;

    try {
      setSaving(true);
      if (editingGroupId == null) {
        await axios.post(
          `${API_BASE_URL}/asset-group/create`,
          // `${apiPath}/asset-group/create`, // เก่า
          { assetGroupName: groupName },
          { withCredentials: true }
        );
        showMessageSave("สร้าง Group สำเร็จ");
      } else {
        await axios.put(
          `${API_BASE_URL}/asset-group/update/${editingGroupId}`,
          // `${apiPath}/asset-group/update/${editingGroupId}`, // เก่า
          { assetGroupName: groupName },
          { withCredentials: true }
        );
        showMessageSave("แก้ไข Group สำเร็จ");
      }
      fetchGroups();
      document.getElementById("modalGroup_btnClose")?.click();
    } catch (err) {
      if (err.response?.status === 409) {
        showMessageError("ชื่อ Group ซ้ำ");
      } else if (err.response?.status === 401) {
        showMessagePermission();
      } else {
        showMessageError("บันทึก Group ไม่สำเร็จ");
      }
    } finally {
      setSaving(false);
    }
  };

  const onDeleteGroup = async (g) => {
    const groupAssets = assets.filter((a) => a.assetType === g.assetGroupName);
    let result;
    if (groupAssets.length > 0) {
      result = await showMessageConfirmDelete(
        `${g.assetGroupName}\n(มีอยู่ ${groupAssets.length} assets จะลบหรือไม่?)`
      );
    } else {
      result = await showMessageConfirmDelete(g.assetGroupName);
    }

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`\/asset-group/delete/${g.id}`, {
        withCredentials: true,
      });

      setAssetGroups((prev) => prev.filter((x) => x.id !== g.id));
      setAssets((prev) => prev.filter((x) => x.assetType !== g.assetGroupName));
      if (String(selectedGroupId) === String(g.id)) {
        setSelectedGroupId("ALL");
      }

      showMessageSave("ลบ Group สำเร็จ");
    } catch (err) {
      showMessageError("ลบ Group ไม่สำเร็จ");
    }
  };

  // ========= CRUD Asset =========
  const handleSaveAsset = async () => {
    if (!formName || !formGroupId) {
      showMessageError("กรุณากรอกชื่อและเลือกกลุ่ม");
      return;
    }

    try {
      setSaving(true);

      // ✅ ถ้ามีการกรอก quantity และมากกว่า 1 → ใช้ bulk
      if (editingAssetId == null && parseInt(formQty) > 1) {
        await axios.post(`\/assets/bulk`, null, {
          params: {
            assetGroupId: parseInt(formGroupId),
            name: formName.trim(),
            qty: parseInt(formQty),
          },
          withCredentials: true,
        });
        showMessageSave(`สร้าง ${formQty} ชิ้นสำเร็จ`);
      } 
      // ✅ ถ้าจำนวน = 1 → ใช้ create เดิม
      else if (editingAssetId == null) {
        await axios.post(`\/assets/create`, {
          assetName: formName.trim(),
          assetGroup: { id: parseInt(formGroupId) },
        }, { withCredentials: true });
        showMessageSave("สร้าง Asset สำเร็จ");
      } 
      // ✅ ถ้าเป็นการแก้ไข
      else {
        await axios.put(`\/assets/update/${editingAssetId}`, {
          assetName: formName.trim(),
          assetGroup: { id: parseInt(formGroupId) },
        }, { withCredentials: true });
        showMessageSave("แก้ไข Asset สำเร็จ");
      }

      fetchData(currentPage);
      document.getElementById("modalAsset_btnClose")?.click();

    } catch (err) {
      console.error("Error saving asset:", err);
      showMessageError("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteAsset = async (row) => {
    const result = await showMessageConfirmDelete(row.assetName);
    if (!result.isConfirmed) return;

    try {
      await axios.delete(`\/assets/delete/${row.assetId}`, {
        withCredentials: true,
      });
      fetchData(currentPage);
      showMessageSave("ลบ Asset สำเร็จ");
    } catch (err) {
      showMessageError("ลบ Asset ไม่สำเร็จ");
    }
  };

  // ========= UI Helper =========
  const badgeColor = (status) =>
    status === "Active" ? "bg-success" : "bg-secondary";

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
                      <i className="bi bi-arrow-down-up me-1"></i> Sort
                    </button>
                    <div className="input-group tm-search">
                      <span className="input-group-text bg-white border-end-0">
                        <i className="bi bi-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Search asset / group"
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
                      data-bs-target="#groupModal"
                      onClick={clearFormGroup}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Create Asset Group
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar + Table */}
            <div className="row g-4">
              {/* Sidebar */}
              <div className="col-lg-3">
                <div className="table-wrapper mt-3">
                  <ul className="list-group">
                    <li
                      className={`list-group-item ${
                        selectedGroupId === "ALL" ? "active" : ""
                      }`}
                      onClick={() => setSelectedGroupId("ALL")}
                      style={{ cursor: "pointer" }}
                    >
                      All
                    </li>
                    {filteredGroups.map((g) => (
                      <li
                        key={g.id}
                        className={`list-group-item d-flex justify-content-between align-items-center ${
                          String(selectedGroupId) === String(g.id)
                            ? "active"
                            : ""
                        }`}
                        onClick={() => setSelectedGroupId(g.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <span>{g.assetGroupName}</span>
                        <span className="btn-group btn-group-sm">
                          <button
                            className="btn btn-sm form-Button-Edit"
                            data-bs-toggle="modal"
                            data-bs-target="#assetModal"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearFormAsset(g.id);
                            }}
                          >
                            <i className="bi bi-plus-circle-fill"></i>
                          </button>
                          <button
                            className="btn btn-sm form-Button-Edit"
                            data-bs-toggle="modal"
                            data-bs-target="#groupModal"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingGroupId(g.id);
                              setGroupName(g.assetGroupName);
                            }}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            className="btn btn-sm form-Button-Del"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteGroup(g);
                            }}
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="col-lg-1"></div>

              {/* Table */}
              <div className="col-lg-8">
                <div className="table-wrapper mt-3">
                  <table className="table text-nowrap">
                    <thead>
                      <tr>
                        <th className="text-center header-color">Order</th>
                        <th className="text-start header-color">Asset Name</th>
                        <th className="text-start header-color">Floor</th>
                        <th className="text-start header-color">Room</th>
                        <th className="text-start header-color">Status</th>
                        <th className="text-center header-color">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.length ? (
                        pageRows.map((row, idx) => (
                          <tr key={row.assetId}>
                            <td className="text-center">
                              {startIndex + idx + 1}
                            </td>
                            <td>{row.assetName}</td>
                            <td>{row.floor || "-"}</td>
                            <td>{row.room || "-"}</td>
                            <td>
                              <span
                                className={`badge rounded-pill ${badgeColor(
                                  row.status || "Inactive"
                                )}`}
                              >
                                {row.status || "Inactive"}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm form-Button-Edit"
                                data-bs-toggle="modal"
                                data-bs-target="#assetModal"
                                onClick={() => {
                                  setEditingAssetId(row.assetId);
                                  setFormName(row.assetName);
                                  const group = assetGroups.find(
                                    (g) => g.assetGroupName === row.assetType
                                  );
                                  setFormGroupId(group?.id || "");
                                }}
                              >
                                <i className="bi bi-pencil-fill"></i>
                              </button>
                              <button
                                className="btn btn-sm form-Button-Del"
                                onClick={() => onDeleteAsset(row)}
                              >
                                <i className="bi bi-trash-fill"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">
                            No assets found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.max(
                    1,
                    Math.ceil(filteredAssets.length / pageSize)
                  )}
                  onPageChange={handlePageChange}
                  totalRecords={filteredAssets.length}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Group */}
      <Modal
        id="groupModal"
        title={
          editingGroupId == null ? "Create Asset Group" : "Edit Asset Group"
        }
        icon="bi bi-box"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveGroup();
          }}
        >
          <div className="mb-3">
            <label className="form-label">Group Name</label>
            <input
              type="text"
              className="form-control"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="d-flex justify-content-center gap-3 pt-3 pb-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              data-bs-dismiss="modal"
              id="modalGroup_btnClose"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Asset */}
      <Modal
        id="assetModal"
        title={editingAssetId == null ? "Create Asset" : "Edit Asset"}
        icon="bi bi-box"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveAsset();
          }}
        >
          <div className="mb-3">
            <label className="form-label">Asset Name</label>
            <input
              type="text"
              className="form-control"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Asset Group</label>
            <select
              className="form-select"
              value={formGroupId}
              onChange={(e) => setFormGroupId(e.target.value)}
              disabled={!!editingAssetId} // create เลือก group ได้, edit ล็อค
            >
              <option value="">Select Group</option>
              {assetGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.assetGroupName}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Quantity (optional)</label>
            <input
              type="number"
              className="form-control"
              min="1"
              value={formQty}
              onChange={(e) => setFormQty(e.target.value)}
              disabled={!!editingAssetId} // ใช้ได้เฉพาะตอนสร้างใหม่
            />
          </div>
          <div className="d-flex justify-content-center gap-3 pt-3 pb-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              data-bs-dismiss="modal"
              id="modalAsset_btnClose"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

export default AssetManagement;

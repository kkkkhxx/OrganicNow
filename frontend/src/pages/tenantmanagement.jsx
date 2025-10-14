import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Layout from "../component/layout";
import Modal from "../component/modal";
import useMessage from "../component/useMessage"; 
import { useToast } from "../component/Toast.jsx";
import Pagination from "../component/pagination";
import { pageSize as defaultPageSize, apiPath } from "../config_variable";
import "../assets/css/tenantmanagement.css";
import "../assets/css/alert.css"; 
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function TenantManagement() {
  const { showSuccess, showError, showWarning } = useToast();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const [data, setData] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [signDate, setSignDate] = useState(() => { return new Date().toISOString().split("T")[0];});
  const [endDate, setEndDate] = useState("");
  const [deposit, setDeposit] = useState(0);
  const [rentAmountSnapshot, setRentAmountSnapshot] = useState(0);
  const [packageId, setPackageId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [rooms, setRooms] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const [packages, setPackages] = useState([]);
  const [allPackages, setAllPackages] = useState([]);

  const navigate = useNavigate();
  const [occupiedRoomIds, setOccupiedRoomIds] = useState([]);
  const {
    showMessagePermission,
    showMessageError,
    showMessageSave,
    showMessageConfirmDelete,
    showMessageAdjust,
  } = useMessage();

  const formatDate = (v) => {
    if (!v) return "-"; 
    try {
      const d = new Date(v);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return v;
    }
  };

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await axios.get(`${apiPath}/packages`, {
          withCredentials: true,
        });

        if (Array.isArray(res.data)) {
          // เก็บทั้งหมด
          setAllPackages(res.data);

          // เก็บเฉพาะ active + เรียง
          const activeSorted = res.data
            .filter((p) => p.is_active === 1)
            .sort((a, b) => a.duration - b.duration);
          setPackages(activeSorted);
        } else {
          console.warn("Unexpected packages API format:", res.data);
          setAllPackages([]);
          setPackages([]);
        }
      } catch (err) {
        console.error("Error fetching packages:", err);
        setAllPackages([]);
        setPackages([]);
      }
    };

    fetchPackages();
  }, []);

  useEffect(() => {
    if (packageId) {
      const pkg = packages.find((p) => p.id === parseInt(packageId));
      if (pkg) {
        const price = pkg.price ?? 0;
        setRentAmountSnapshot(price);
        setDeposit(price);
      }
    }
  }, [packageId, packages]);

  const packageLabel = (pkgId) => {
    const pkg = allPackages.find((p) => p.id === pkgId);
    return pkg ? pkg.contract_name : "-";
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${apiPath}/room/list`, {
          withCredentials: true,
        });
        if (Array.isArray(res.data)) {
          setRooms(res.data);
        } else if (Array.isArray(res.data.result)) {
          setRooms(res.data.result);
        } else {
          console.warn("Unexpected rooms API format:", res.data);
          setRooms([]);
        }
      } catch (err) {
        console.error("Error fetching rooms:", err);
        setRooms([]);
      }
    };

    fetchRooms();
  }, []);


  const packageColor = (contractName) => {
    const map = {
      "3 เดือน": "#FFC73B",
      "6 เดือน": "#EF98C4",
      "9 เดือน": "#87C6FF",
      "1 ปี": "#9691F9",
    };
    return map[contractName] || "#D3D3D3";
  };

  const fetchData = async (page = 1) => {
    try {
      const res = await axios.get(`${apiPath}/tenant/list`, {
        withCredentials: true,
        params: { page, pageSize },
      });

      if (Array.isArray(res.data)) {
        // ✅ กรณี backend ส่งเป็น array ตรง ๆ
        const rows = res.data;
        setData(rows);

        setTotalRecords(rows.length);
        setTotalPages(Math.max(1, Math.ceil(rows.length / pageSize)));
      } else if (res.data && Array.isArray(res.data.results)) {
        // ✅ กรณี backend ส่งเป็น object { totalRecords, results }
        const rows = res.data.results;
        setData(rows);

        const total = Number(res.data.totalRecords ?? rows.length);
        setTotalRecords(total);
        setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
      } else {
        // ✅ กรณีไม่ใช่ format ที่คาดไว้
        setData([]);
        setTotalRecords(0);
        setTotalPages(1);
      }

      setCurrentPage(page);

      // ✅ refresh ห้องที่ไม่ว่างจาก backend โดยตรง
      await fetchOccupiedRooms();

    } catch (err) {
      console.error("Error fetching tenants:", err);
      setData([]);
      setTotalRecords(0);
      setTotalPages(1);

      // ✅ เคลียร์ occupied rooms ด้วย
      setOccupiedRoomIds([]);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [pageSize]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, data.length);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchData(page);
    }
  };
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    fetchData(1);
    setCurrentPage(1);
  };

  const handleSaveCreate = async () => {
    try {
      const payload = {
        firstName,
        lastName,
        email,
        phoneNumber,
        nationalId,
        roomId: selectedRoomId,
        packageId,
        startDate: startDate ? `${startDate}T00:00:00` : null,
        endDate: endDate ? `${endDate}T23:59:59` : null,
        deposit,
        rentAmountSnapshot,
        signDate: signDate ? `${signDate}T00:00:00` : null,
      };

      if (checkValidation(payload) === false) return false;

      const res = await axios.post(`${apiPath}/tenant/create`, payload, {
        withCredentials: true,
      });

      if (res.status === 200 || res.status === 201) {
        document.getElementById("modalForm_btnClose")?.click();
        fetchData(currentPage);
        showMessageSave();
        showSuccess("🎉 เพิ่มผู้เช่าใหม่สำเร็จแล้ว!");
      } else {
        showMessageError("Unexpected response: " + JSON.stringify(res.data));
        showError(`❌ เพิ่มผู้เช่าล้มเหลว: HTTP ${res.status}`);
      }
    } catch (e) {
      if (e.response) {
        console.error("🔴 Backend error response:", e.response);

        if (e.response.status === 409) {
          const msg = e.response.data?.message || "";

          switch (true) {
            case msg === "duplicate_national_id":
            case msg.includes("duplicate_national_id"):
              showMessageError("NationalID Already Exists");
              showWarning("⚠️ บัตรประชาชนนี้มีอยู่ในระบบแล้ว");
              return;

            default:
              showMessageError(msg || "Conflict error");
              showError(`❌ เพิ่มผู้เช่าล้มเหลว: ${msg || "ข้อมูลซ้ำ"}`);
              return;
          }
        }

        if (e.response.status === 401) {
          showMessagePermission?.();
          showWarning("⚠️ ไม่มีสิทธิ์ในการเพิ่มผู้เช่า");
          return;
        }

        showMessageError(
          e.response.data?.message || `Server error (${e.response.status})`
        );
        showError(`❌ เพิ่มผู้เช่าล้มเหลว: ${e.response.data?.message || "เกิดข้อผิดพลาด"}`);
      } else {
        showMessageError(e.message || "Unexpected error");
        showError(`❌ เพิ่มผู้เช่าล้มเหลว: ${e.message || "ไม่ทราบสาเหตุ"}`);
      }
    }
  };

  const checkValidation = (payload) => {
    if (!payload.firstName) {
      showMessageError("กรุณากรอก First Name");
      return false;
    }
    if (!payload.lastName) {
      showMessageError("กรุณากรอก Last Name");
      return false;
    }
    if (!payload.nationalId) {
      showMessageError("กรุณากรอก National ID");
      return false;
    }
    if (!/^\d{13}$/.test(payload.nationalId)) {
      showMessageError("National ID ต้องเป็นตัวเลข 13 หลัก");
      return false;
    }
    if (!payload.phoneNumber) {
      showMessageError("กรุณากรอก Phone Number");
      return false;
    }
    if (!/^\d{10}$/.test(payload.phoneNumber)) {
      showMessageError("Phone Number ต้องเป็นตัวเลข 10 หลัก");
      return false;
    }
    if (!payload.email) {
      showMessageError("กรุณากรอก Email");
      return false;
    }
    if (!payload.roomId) {
      showMessageError("กรุณาเลือกห้อง");
      return false;
    }
    if (!payload.packageId) {
      showMessageError("กรุณาเลือก Package");
      return false;
    }
    if (!payload.startDate) {
      showMessageError("กรุณาเลือก Start Date");
      return false;
    }
    if (!payload.signDate) {
      showMessageError("กรุณาเลือก Sign Date");
      return false;
    }

    const sign = new Date(payload.signDate);
    const start = new Date(payload.startDate);
    if (start < sign) {
      showMessageError("Start Date ต้องมากกว่าหรือเท่ากับ Sign Date");
      return false;
    }

    return true;
  };

  const handleDelete = async (contractId) => {
    if (!contractId) {
      showMessageError("❌ contractId is missing");
      return;
    }

    try {
      const res = await axios.delete(`${apiPath}/tenant/delete/${contractId}`, {
        withCredentials: true,
      });

      if (res.status === 204) {
        showMessageSave("ลบข้อมูลสำเร็จ");
        showSuccess("🗑️ ลบผู้เช่าสำเร็จแล้ว!");
        fetchData(currentPage);
      } else {
        showMessageError("Unexpected response: " + res.status);
        showError(`❌ ลบผู้เช่าล้มเหลว: HTTP ${res.status}`);
      }
    } catch (e) {
      if (e.response && e.response.status === 401) {
        showMessagePermission?.();
        showWarning("⚠️ ไม่มีสิทธิ์ในการลบข้อมูล");
      } else {
        showMessageError(e);
        showError(`❌ ลบผู้เช่าล้มเหลว: ${e.message}`);
      }
    }
  };

  const clearForm = () => {
    const today = new Date().toISOString().split("T")[0];
    setSignDate(today);
    setStartDate("");
    setEndDate("");
    setDeposit("");
    setRentAmountSnapshot("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setNationalId("");
    setSelectedFloor("");
    setSelectedRoomId("");
    setPackageId("");
    fetchOccupiedRooms();
  };

  useEffect(() => {
    if (startDate && packageId) {
      const pkg = packages.find((p) => p.id === parseInt(packageId));
      if (pkg && pkg.duration) {
        if (pkg.duration === 12) {
          
          setEndDate(null);
        } else {
          
          const start = new Date(startDate);
          const end = new Date(start);
          end.setMonth(end.getMonth() + pkg.duration);
          const yyyy = end.getFullYear();
          const mm = String(end.getMonth() + 1).padStart(2, "0");
          const dd = String(end.getDate()).padStart(2, "0");
          setEndDate(`${yyyy}-${mm}-${dd}`);
        }
      }
    }
  }, [startDate, packageId, packages]);

  const fetchOccupiedRooms = async () => {
    try {
      const res = await axios.get(`${apiPath}/contracts/occupied-rooms`, {
        withCredentials: true,
      });
      if (Array.isArray(res.data)) {
        setOccupiedRoomIds(res.data);
      } else {
        setOccupiedRoomIds([]);
      }
    } catch (err) {
      console.error("Error fetching occupied rooms:", err);
      setOccupiedRoomIds([]);
    }
  };

  useEffect(() => {
    fetchOccupiedRooms();   // ✅ refresh ตอน tenant list เปลี่ยน
  }, [data]);

  const handleViewTenant = (item) => {
    navigate(`/tenantdetail/${item.contractId}`);
  };

  const handleDownloadPdf = async (contractId) => {
    const res = await axios.get(`${apiPath}/tenant/${contractId}/pdf`, {
      responseType: "blob",
      withCredentials: true,
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tenant_${contractId}_contract.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const [filters, setFilters] = useState({
    contractName: "ALL",
    floor: "ALL",
    room: "ALL",
  });
  
  const [sortAsc, setSortAsc] = useState(false);  
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = [...data];

    if (filters.contractName !== "ALL") {
      rows = rows.filter((r) => r.contractName === filters.contractName);
    }
    if (filters.floor !== "ALL") {
      rows = rows.filter((r) => String(r.floor) === String(filters.floor));
    }
    if (filters.room !== "ALL") {
      rows = rows.filter((r) => r.room === filters.room);
    }

    if (q) {
      rows = rows.filter(
        (r) =>
          r.firstName?.toLowerCase().includes(q) ||
          r.lastName?.toLowerCase().includes(q) ||
          r.room?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q)
      );
    }

    rows.sort((a, b) => {
    // 1) เรียงให้ active (status != 0) อยู่ก่อน expired (status == 0)
    if (a.status === 0 && b.status !== 0) return 1;
    if (a.status !== 0 && b.status === 0) return -1;

    // 2) ถ้า status เท่ากัน → เรียงตาม startDate ตาม sortAsc
    const dateA = new Date(a.startDate || 0);
    const dateB = new Date(b.startDate || 0);

    return sortAsc ? dateA - dateB : dateB - dateA;
  });

    return rows;
  }, [data, filters, sortAsc, search]);
  
  const contractTypeOptions = useMemo(() => {
    if (!Array.isArray(allPackages)) return [];
    const map = new Map();

    for (const p of allPackages) {
      if (p.contract_name && !map.has(p.contract_name)) {
        map.set(p.contract_name, {
          id: p.contract_name,   // ใช้ชื่อเป็น id เลย
          name: p.contract_name,
          duration: p.duration,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.duration - b.duration);
  }, [allPackages]);
    
  return (
    <Layout title="Tenant Management" icon="pi pi-user" notifications={3}>
      <div className="container-fluid">
        <div className="row min-vh-100">
          {/* Main */}
          <div className="col-lg-11 p-4">
            {/* Toolbar Card */}
            <div className="toolbar-wrapper card border-0 bg-white">
              <div className="card-header bg-white border-0 rounded-3">
                <div className="tm-toolbar d-flex justify-content-between align-items-center">
                  {/* Left cluster */}
                  <div className="d-flex align-items-center gap-3">
                    <button
                      className="btn btn-link tm-link p-0"
                      data-bs-toggle="offcanvas"
                      data-bs-target="#tenantFilterCanvas"
                    >
                      <i className="bi bi-filter me-1"></i> Filter
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
                        placeholder="Search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Right cluster */}
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-primary"
                      data-bs-toggle="modal"
                      data-bs-target="#exampleModal"
                      onClick={clearForm}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Create Tenant
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="table-wrapper">
              <table className="table text-nowrap">
                <thead>
                  <tr>
                    <th className="text-center align-top header-color">
                      Order
                    </th>
                    <th className="align-top header-color">First name</th>
                    <th className="text-start align-top header-color">
                      Last name
                    </th>
                    <th className="text-center align-top header-color">
                      Floor
                    </th>
                    <th className="text-center align-top header-color">Room</th>
                    <th className="text-start align-top header-color">
                      Package
                    </th>
                    <th className="text-start align-top header-color">
                      Start date
                    </th>
                    <th className="text-start align-top header-color">
                      End date
                    </th>
                    <th className="text-start align-top header-color">
                      Phone Number
                    </th>
                    <th className="text-center align-top header-color">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.slice(startIndex, endIndex).map((item, idxInPage) => {
                      const globalIndex = startIndex + idxInPage;
                      const order = globalIndex + 1;
                      const rowKey =
                        item.tenantId ??
                        item.id ??
                        `${item.firstName}-${item.room}-${globalIndex}`;

                      return (
                        <tr key={rowKey}
                          className={item.status === 0 ? "table-secondary" : ""} // 👈 ถ้า status=0 แสดงสีเทาอ่อน
                        >
                          {/* Order */}
                          <td className="align-top text-center">{order}</td>
                          <td className="align-top text-center">
                            {item.firstName}
                          </td>
                          <td className="align-top text-start">
                            {item.lastName}
                          </td>
                          <td className="align-top text-center">
                            {item.floor ?? "-"}
                          </td>
                          <td className="align-top text-center">
                            {item.room ?? "-"}
                          </td>

                          <td className="align-top text-start">
                            <span
                              className="badge rounded-pill px-3"
                              style={{
                                backgroundColor: packageColor(
                                  packageLabel(item.packageId)
                                ),
                                color: "#fff",
                              }}
                            >
                              {packageLabel(item.packageId)}
                            </span>
                          </td>

                          <td className="align-top text-start">
                            {formatDate(item.startDate)}
                          </td>
                          <td className="align-top text-start">
                            {formatDate(item.endDate)}
                          </td>
                          <td className="align-top text-start">
                            {item.phoneNumber || "-"}
                          </td>

                          <td className="align-top text-center">
                            <button
                              className="btn btn-sm form-Button-Edit"
                              onClick={() => handleViewTenant(item)}
                              aria-label="View"
                            >
                              <i className="bi bi-eye-fill"></i>
                            </button>
                           <button
                              className="btn btn-sm form-Button-Edit"
                              onClick={() => handleDownloadPdf(item.contractId)}
                            >
                              <i className="bi bi-file-earmark-pdf-fill"></i>
                            </button>
                            <button
                              className="btn btn-sm form-Button-Del"
                              onClick={async () => {
                                const result = await showMessageConfirmDelete(item.firstName);
                                if (result.isConfirmed) {
                                  handleDelete(item.contractId);
                                }
                              }}
                              aria-label="Delete"
                            >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="12" className="text-center align-middle">
                        <div className="d-flex justify-content-center align-items-center" >
                          Data Not Found
                        </div>
                      </td>
                    </tr>
                  )}  
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={Math.max(1, Math.ceil(filteredData.length / pageSize))}
              onPageChange={handlePageChange}
              totalRecords={filteredData.length}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
          {/* /Main */}
        </div>
      </div>

      <Modal
        id="exampleModal"
        title="Add User"
        icon="bi bi-person-plus"
        size="modal-lg"
        scrollable="modal-dialog-scrollable"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveCreate();
          }}
        >
          {/* ---------- General Information ---------- */}
          <div className="mb-4">
            <div className="fw-semibold mb-2">General Information</div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tenant First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tenant Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">National ID</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tenant National ID"
                  value={nationalId}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ""); 
                    if (val.length <= 13) setNationalId(val);
                  }}
                  maxLength={13}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tenant Phone Number"
                  value={phoneNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ""); 
                    if (val.length <= 10) setPhoneNumber(val);     
                  }}
                  maxLength={10}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Tenant Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
          {/* ---------- Room Information ---------- */}
          <div className="mb-4">
            <div className="fw-semibold mb-2">Room Information</div>
            <div className="row g-3">
              {/* Floor Select */}
              <div className="col-md-6">
                <label className="form-label">Floor</label>
                <div className="position-relative">
                  <select
                    className="form-select"
                    value={selectedFloor}
                    onChange={(e) => {
                      setSelectedFloor(e.target.value);
                      setSelectedRoomId("");
                    }}
                  >
                    <option value="">Select Floor</option>
                    {[...new Set(rooms.map((r) => r.roomFloor))].map(
                      (floor) => (
                        <option key={floor} value={floor}>
                          {floor}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Room Select */}
              <div className="col-md-6">
                <label className="form-label">Room</label>
                <div className="position-relative">
                  <select
                    className="form-select"
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    readOnly={!selectedFloor}
                  >
                    <option value="">
                      {selectedFloor ? "Select Room" : "Choose floor first"}
                    </option>
                    {rooms
                      .filter((r) => String(r.roomFloor) === String(selectedFloor))
                      .filter((r) => !occupiedRoomIds.includes(r.roomId)) // ✅ ห้องหมดสัญญาจะกลับมาเลือกได้
                      .map((r) => (
                        <option key={r.roomId} value={r.roomId}>
                          {r.roomNumber}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Contract Information ---------- */}
          <div className="mb-4">
            <div className="fw-semibold mb-2">Contract Information</div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Package</label>
                <div className="position-relative">
                  <select
                    className="form-select"
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                  >
                    <option value="">Tenant Package</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.contract_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Rent Amount</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rent Amount"
                  value={rentAmountSnapshot}
                  readOnly
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Sign date</label>
                <input
                  type="date"
                  className="form-control"
                  value={signDate}
                  readOnly
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Start date</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">End date</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  readOnly
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Deposit</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Deposit"
                  value={deposit}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* ---------- Footer Buttons ---------- */}
          <div className="d-flex justify-content-center gap-3 pt-3 pb-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              data-bs-dismiss="modal"
              id="modalForm_btnClose"
            >
              Cancel
            </button>

            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>
      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id="tenantFilterCanvas"
        data-bs-backdrop="static"
      >
        <div className="offcanvas-header">
          <h5 className="mb-0"><i className="bi bi-filter me-2"></i>Filters</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body">
          <div className="mb-3">
            <label className="form-label">Package</label>
            <select
              className="form-select"
              value={filters.contractName}
              onChange={(e) =>
                setFilters((f) => ({ ...f, contractName: e.target.value }))
              }
            >
              <option value="ALL">All</option>
              {contractTypeOptions.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Floor</label>
            <select
              className="form-select"
              value={filters.floor}
              onChange={(e) => setFilters((f) => ({ ...f, floor: e.target.value }))}
            >
              <option value="ALL">All</option>
              {[...new Set(rooms.map((r) => r.roomFloor))].map((floor) => (
                <option key={floor} value={floor}>{floor}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Room</label>
            <select
              className="form-select"
              value={filters.room}
              onChange={(e) => setFilters((f) => ({ ...f, room: e.target.value }))}
            >
              <option value="ALL">All</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.roomNumber}>{r.roomNumber}</option>
              ))}
            </select>
          </div>

          <div className="d-flex justify-content-between">
            <button className="btn btn-outline-secondary" onClick={() => setFilters({ contractName: "ALL", floor: "ALL", room: "ALL" })}>Clear</button>
            <button className="btn btn-primary" data-bs-dismiss="offcanvas">Apply</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default TenantManagement;

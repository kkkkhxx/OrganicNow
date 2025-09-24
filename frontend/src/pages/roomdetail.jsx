import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../component/layout";
import axios from "axios";
import "../assets/css/roomdetail.css";

function RoomDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [roomData, setRoomData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({}); // 🟢 state ฟอร์ม

    useEffect(() => {
        const fetchRoomDetail = async () => {
            try {
                const res = await axios.get(
                    `http://localhost:8080/rooms/${id}/detail`,
                    { withCredentials: true }
                );
                setRoomData(res.data);
                setForm(res.data); // 🟢 preload form
            } catch (err) {
                console.error("Error fetching room detail:", err);
                setError("Failed to fetch room details");
            } finally {
                setLoading(false);
            }
        };
        fetchRoomDetail();
    }, [id]);

    if (loading) return <p className="text-center mt-5">Loading...</p>;
    if (error) return <p className="text-center mt-5">{error}</p>;
    if (!roomData) return <p className="text-center mt-5">No data found</p>;

    // 🟢 ฟังก์ชันเลือกสีของ Package
    const getPackageBadgeClass = (contractName) => {
        if (!contractName) return "bg-secondary";
        if (contractName.includes("3")) return "bg-warning text-dark";
        if (contractName.includes("6")) return "bg-pink text-white";
        if (contractName.includes("9")) return "bg-info text-white";
        if (contractName.includes("1")) return "bg-primary text-white";
        return "bg-secondary";
    };

    return (
        <Layout title="Room Detail" icon="bi bi-folder" notifications={3}>
            <div className="container-fluid">
                <div className="row min-vh-100">
                    <div className="col-lg-11 p-4 mx-auto">
                        {/* ===== Top Toolbar ===== */}
                        <div className="card border-0 shadow-sm bg-white rounded-3 mb-4">
                            <div className="card-body d-flex justify-content-between align-items-center">
                                {/* Breadcrumb */}
                                <div className="d-flex align-items-center gap-2">
                                    <span
                                        className="breadcrumb-link text-primary"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => navigate("/roommanagement")}
                                    >
                                        Room Management
                                    </span>
                                    <span className="text-muted">›</span>
                                    <span className="breadcrumb-current">
                                        {roomData.roomNumber}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        data-bs-toggle="modal"
                                        data-bs-target="#editRoomModal"
                                    >
                                        <i className="bi bi-pencil me-1" /> Edit Room
                                    </button>
                                </div>

                            </div>
                        </div>

                        {/* ===== Content Row ===== */}
                        <div className="row g-4">
                            {/* Left Column: Room Info + Tenant */}
                            <div className="col-lg-4 d-flex">
                                <div className="card border-0 shadow-sm rounded-3 flex-fill">
                                    <div className="card-body">
                                        <h5 className="card-title">Room Information</h5>
                                        <p>
                                            <strong>Floor:</strong> {roomData.roomFloor}
                                        </p>
                                        <p>
                                            <strong>Room:</strong> {roomData.roomNumber}
                                        </p>
                                        <p>
                                            <strong>Status:</strong>{" "}
                                            <span
                                                className={`badge rounded-pill px-3 py-2 ${
                                                    roomData.status === "occupied"
                                                        ? "bg-danger"
                                                        : "bg-success"
                                                }`}
                                            >
                                                {roomData.status === "occupied"
                                                    ? "Unavailable"
                                                    : "Available"}
                                            </span>
                                        </p>

                                        <hr />
                                        <h5 className="card-title">Current Tenant</h5>
                                        <p>
                                            <strong>First Name:</strong> {roomData.firstName}
                                        </p>
                                        <p>
                                            <strong>Last Name:</strong> {roomData.lastName}
                                        </p>
                                        <p>
                                            <strong>Phone Number:</strong> {roomData.phoneNumber}
                                        </p>
                                        <p>
                                            <strong>Email:</strong> {roomData.email}
                                        </p>
                                        <p>
                                            <strong>Package:</strong>{" "}
                                            <span
                                                className={`badge rounded-pill px-3 py-2 ${getPackageBadgeClass(
                                                    roomData.contractName
                                                )}`}
                                            >
                                                {roomData.contractName}
                                            </span>
                                        </p>
                                        <p>
                                            <strong>Sign Date:</strong>{" "}
                                            {roomData.signDate?.split("T")[0]}
                                        </p>
                                        <p>
                                            <strong>Start Date:</strong>{" "}
                                            {roomData.startDate?.split("T")[0]}
                                        </p>
                                        <p>
                                            <strong>End Date:</strong>{" "}
                                            {roomData.endDate?.split("T")[0]}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Assets + Requests */}
                            <div className="col-lg-8 d-flex">
                                <div className="card border-0 shadow-sm rounded-3 flex-fill">
                                    <div className="card-body">
                                        {/* Tabs */}
                                        <ul className="nav nav-tabs" id="detailTabs" role="tablist">
                                            <li className="nav-item" role="presentation">
                                                <button
                                                    className="nav-link active"
                                                    id="assets-tab"
                                                    data-bs-toggle="tab"
                                                    data-bs-target="#assets"
                                                    type="button"
                                                    role="tab"
                                                >
                                                    Assets
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button
                                                    className="nav-link"
                                                    id="requests-tab"
                                                    data-bs-toggle="tab"
                                                    data-bs-target="#requests"
                                                    type="button"
                                                    role="tab"
                                                >
                                                    Request History
                                                </button>
                                            </li>
                                        </ul>

                                        {/* Tab Content */}
                                        <div className="tab-content mt-3">
                                            {/* Assets */}
                                            <div
                                                className="tab-pane fade show active"
                                                id="assets"
                                                role="tabpanel"
                                            >
                                                {roomData.assets?.length > 0 ? (
                                                    <table className="table text-nowrap">
                                                        <thead>
                                                        <tr>
                                                            <th>RID</th>
                                                            <th>Asset</th>
                                                            <th>Status</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {roomData.assets.map((a, i) => (
                                                            <tr key={i}>
                                                                <td>R{i + 1}</td>
                                                                <td>{a.assetName}</td>
                                                                <td>{a.assetType}</td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <p className="text-muted">No assets found</p>
                                                )}
                                            </div>

                                            {/* Requests */}
                                            <div
                                                className="tab-pane fade"
                                                id="requests"
                                                role="tabpanel"
                                            >
                                                {roomData.requests?.length > 0 ? (
                                                    <table className="table text-nowrap">
                                                        <thead>
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>Issue</th>
                                                            <th>Scheduled</th>
                                                            <th>Finished</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {roomData.requests.map((r) => (
                                                            <tr key={r.id}>
                                                                <td>{r.id}</td>
                                                                <td>{r.issueTitle}</td>
                                                                <td>
                                                                    {r.scheduledDate?.replace("T", " ") || "-"}
                                                                </td>
                                                                <td>
                                                                    {r.finishDate?.replace("T", " ") || "-"}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <p className="text-muted">No requests found</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==== Modal: Edit Room ==== */}
            <div
                className="modal fade"
                id="editRoomModal"
                tabIndex="-1"
                aria-labelledby="editRoomModalLabel"
                aria-hidden="true"
            >
                <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="editRoomModalLabel">
                                <i className="bi bi-pencil-square me-2"></i>Edit Room
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            ></button>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                setRoomData((prev) => ({
                                    ...prev,
                                    ...form,
                                }));
                                const el = document.getElementById("editRoomModal");
                                if (window.bootstrap && el)
                                    window.bootstrap.Modal.getInstance(el)?.hide();
                            }}
                        >
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="form-label">Floor</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            defaultValue={roomData.roomFloor}
                                            onChange={(e) =>
                                                setForm((s) => ({ ...s, roomFloor: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Room</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            defaultValue={roomData.roomNumber}
                                            onChange={(e) =>
                                                setForm((s) => ({ ...s, roomNumber: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            defaultValue={roomData.status}
                                            onChange={(e) =>
                                                setForm((s) => ({ ...s, status: e.target.value }))
                                            }
                                        >
                                            <option value="available">Available</option>
                                            <option value="occupied">Occupied</option>
                                        </select>
                                    </div>

                                    {/* Asset Section */}
                                    <div className="col-md-12">
                                        <label className="form-label">Asset</label>
                                        <div className="d-flex flex-wrap gap-2">
                                            {["Mesh screen", "Light", "Plumbing", "Fridge", "Wardrobe", "Dining table", "Chair", "Bedside table"].map((asset) => (
                                                <div className="form-check" key={asset}>
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={asset}
                                                        checked={form.assets?.includes(asset)}
                                                        onChange={(e) => {
                                                            setForm((prev) => {
                                                                const newAssets = e.target.checked
                                                                    ? [...(prev.assets || []), asset]
                                                                    : prev.assets?.filter((a) => a !== asset);
                                                                return { ...prev, assets: newAssets };
                                                            });
                                                        }}
                                                    />
                                                    <label className="form-check-label" htmlFor={asset}>
                                                        {asset}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    data-bs-dismiss="modal"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default RoomDetail;

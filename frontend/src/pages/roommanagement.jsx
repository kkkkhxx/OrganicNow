import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../component/layout";
import Pagination from "../component/pagination";
import { pageSize as defaultPageSize, apiPath } from "../config_variable";
import "../assets/css/roommanagement.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function RoomManagement() {
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [data, setData] = useState([]);
    const [error, setError] = useState(""); // เพิ่ม state สำหรับจัดการ error

    // โหลดข้อมูลห้องจาก backend
    const fetchRooms = async () => {
        try {
            const res = await axios.get(`${apiPath}/rooms`, { withCredentials: true });
            if (Array.isArray(res.data)) {
                const sortedData = [...res.data].sort((a, b) => parseInt(a.roomNumber, 10) - parseInt(b.roomNumber, 10));
                setData(sortedData);  // ตั้งค่าข้อมูลห้องที่ดึงมา
            } else {
                setError("ข้อมูลที่ได้มาไม่ถูกต้อง");
            }
        } catch (err) {
            console.error("Error fetching rooms:", err);
            setError("เกิดข้อผิดพลาดในการดึงข้อมูลห้อง");
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    useEffect(() => {
        const total = data.length;
        const pages = Math.max(1, Math.ceil(total / pageSize));
        setTotalRecords(total);
        setTotalPages(pages);
        setCurrentPage((p) => Math.min(Math.max(1, p), pages));
    }, [data, pageSize]);

    const startIdx = (currentPage - 1) * pageSize;
    const pagedData = data.slice(startIdx, startIdx + pageSize);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const handlePageSizeChange = (size) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    const StatusPill = ({ status }) => (
        <span
            className={`badge rounded-pill ${status === "repair" ? "bg-warning" : status === "occupied" ? "bg-danger" : "bg-success"}`}
        >
            {status === "repair" ? "Repair" : status === "occupied" ? "Unavailable" : "Available"}
        </span>
    );

    // ฟังก์ชันตรวจสอบว่ามี request ที่ยังไม่เสร็จหรือไม่
    const hasPendingRequests = (requests) => {
        if (!requests || !Array.isArray(requests)) {
            return false;
        }
        return requests.some(request => !request.finishDate);
    };

    // ฟังก์ชันแสดงสถานะ Pending Requests
    const getPendingRequestIndicator = (requests) => {
        if (hasPendingRequests(requests)) {
            return <span className="pending-request-indicator">●</span>; // จุดสีแดง
        } else {
            return <span className="no-pending-request-indicator">●</span>; // จุดสีเทา
        }
    };

    // ฟังก์ชันกำหนดสถานะห้อง
    const getRoomStatus = (status, requests) => {
        // ถ้าสถานะเป็น available และมี request ที่ยังไม่เสร็จ ให้เปลี่ยนเป็น repair
        if (status === "available" && hasPendingRequests(requests)) {
            return "repair";
        }
        return status; // คืนค่าสถานะเดิม
    };

    return (
        <Layout title="Room Management" icon="bi bi-building" notifications={3}>
            <div className="container-fluid">
                <div className="row min-vh-100">
                    <div className="col-lg-11 p-4">
                        {error && <p className="text-danger">{error}</p>} {/* แสดง error ถ้ามี */}
                        <div className="table-wrapper">
                            <table className="table text-nowrap align-middle tm-left">
                                <thead className="header-color">
                                <tr>
                                    <th>Order</th>
                                    <th>Room</th>
                                    <th>Floor</th>
                                    <th>Status</th>
                                    <th>Pending Requests</th>
                                    <th>Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {pagedData.length > 0 ? (
                                    pagedData.map((item, idx) => {
                                        const order = startIdx + idx + 1;
                                        const roomStatus = getRoomStatus(item.status, item.requests);
                                        return (
                                            <tr key={item.roomId}>
                                                <td>{order}</td>
                                                <td>{item.roomNumber}</td>
                                                <td>{item.roomFloor}</td>
                                                <td>
                                                    <StatusPill status={roomStatus} />
                                                </td>
                                                <td className="text-center">
                                                    {getPendingRequestIndicator(item.requests)}
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm form-Button-Edit me-1"
                                                        onClick={() => navigate(`/roomdetail/${item.roomId}`)}
                                                        title="View"
                                                    >
                                                        <i className="bi bi-eye-fill" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6">Data Not Found</td>
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
        </Layout>
    );
}

export default RoomManagement;
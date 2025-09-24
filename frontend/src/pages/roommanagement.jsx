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

    // โหลดข้อมูลห้องจาก backend
    const fetchRooms = async () => {
        try {
            const res = await axios.get(`${apiPath}/rooms`, { withCredentials: true });
            console.log("Fetched Rooms:", res.data);

            // ✅ จัดเรียงห้องจากน้อยไปมาก
            const sortedData = [...res.data].sort((a, b) => {
                return parseInt(a.roomNumber, 10) - parseInt(b.roomNumber, 10);
            });

            setData(sortedData || []);
        } catch (err) {
            console.error("Error fetching rooms:", err);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    // pagination
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
            className={`badge rounded-pill ${
                status === "occupied" ? "bg-danger" : "bg-success"
            }`}
        >
      {status === "occupied" ? "Unavailable" : "Available"}
    </span>
    );

    return (
        <Layout title="Room Management" icon="bi bi-building" notifications={3}>
            <div className="container-fluid">
                <div className="row min-vh-100">
                    <div className="col-lg-11 p-4">
                        {/* Table */}
                        <div className="table-wrapper">
                            <table className="table text-nowrap align-middle tm-left">
                                <thead className="header-color">
                                <tr>
                                    <th>Order</th>
                                    <th>Room</th>
                                    <th>Floor</th>
                                    <th>Status</th>
                                    <th>Tenant</th>
                                    <th>Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {pagedData.length > 0 ? (
                                    pagedData.map((item, idx) => {
                                        const order = startIdx + idx + 1;
                                        return (
                                            <tr key={item.roomId}>
                                                <td>{order}</td>
                                                <td>{item.roomNumber}</td>
                                                <td>{item.roomFloor}</td>
                                                <td>
                                                    <StatusPill status={item.status} />
                                                </td>
                                                <td>
                                                    {item.firstName && item.lastName
                                                        ? `${item.firstName} ${item.lastName}`
                                                        : "-"}
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

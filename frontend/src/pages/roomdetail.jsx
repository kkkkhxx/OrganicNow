import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Layout from "../component/layout";
import Modal from "../component/modal";
import axios from "axios";
import "../assets/css/roomdetail.css";
import useMessage from "../component/useMessage";

function RoomDetail() {
  const { roomId: id } = useParams(); // เอา roomId มา rename เป็น id  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({});
  const { showMessageSave, showMessageError } = useMessage();
  const [assetGroups, setAssetGroups] = useState([]);
  const [assetsToShow, setAssetsToShow] = useState(10);
  const [selectedGroup, setSelectedGroup] = useState("all"); // for asset group filter

  useEffect(() => {
    const fetchRoomDetail = async () => {
      try {
        const [roomRes, assetRes, groupRes] = await Promise.all([
          axios.get(`http://localhost:8080/room/${id}/detail`, {
            withCredentials: true,
          }),
          axios.get("http://localhost:8080/assets/all", {
            withCredentials: true,
          }),
          axios.get("http://localhost:8080/asset-group/list", {
            withCredentials: true,
          }),
        ]);

        // Error handling if data is missing or invalid
        if (!roomRes.data || !assetRes.data || !groupRes.data) {
          throw new Error("Missing data from response.");
        }

        const roomData = roomRes.data;
        const allAssets = assetRes.data.result;
        const assetGroups = groupRes.data;

        // Get all assets already used in other rooms
        const allUsedAssetIds = new Set(); // to store assets used in any room
        const roomsRes = await axios.get("http://localhost:8080/room", {
          withCredentials: true,
        });
        roomsRes.data.forEach((room) => {
          if (room.assets) {
            room.assets.forEach((asset) => {
              allUsedAssetIds.add(asset.assetId); // Add asset to set if it's used in any room
            });
          }
        });

        // Filter out assets that are already used in other rooms
        const availableAssets = allAssets.filter(
          (asset) => !allUsedAssetIds.has(asset.assetId)
        );

        // Mark assets as checked if they are used in the current room
        const usedAssetIds = new Set(
          roomData.assets.map((asset) => asset.assetId)
        );
        let updatedAssets = availableAssets.map((asset) => ({
          ...asset,
          checked: usedAssetIds.has(asset.assetId), // Mark as checked if used in the current room
        }));

        // Add assets already in the room (always checked)
        const roomAssets = roomData.assets.map((asset) => ({
          ...asset,
          checked: true, // assets already in the room are checked
        }));

        updatedAssets = updatedAssets.concat(roomAssets);

        // Sort the assets by assetId or assetName (ascending)
        updatedAssets = updatedAssets.sort((a, b) => a.assetId - b.assetId);

        setRoomData(roomData);
        setAssetGroups(assetGroups);
        setForm((prevState) => ({
          ...prevState,
          allAssets: updatedAssets,
        }));
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to fetch room or asset data");
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchRoomDetail();
  }, [id]);

  const filterAssetsByGroup = (group) => {
    console.log("Filtering by group:", group); // Log selected group for debugging
    if (group === "all") {
      return form.allAssets; // Show all assets if "all" is selected
    }

    // Filter by assetType that matches the selected group
    return form.allAssets.filter((asset) => asset.assetType === group);
  };

  // Sync assets when modal opens
  useEffect(() => {
    const modalEl = document.getElementById("editRoomModal");
    modalEl?.addEventListener("show.bs.modal", () => {
      if (roomData) {
        setForm((s) => ({
          ...s,
          allAssets: s.allAssets, // Keep all assets as they are without filtering
        }));
      }
    });
  }, [roomData]);

  // Helper: Package color badge
  const getPackageBadgeClass = (contractName) => {
    if (!contractName) return "bg-secondary";
    if (contractName.includes("3")) return "bg-warning text-dark";
    if (contractName.includes("6")) return "bg-pink text-white";
    if (contractName.includes("9")) return "bg-info text-white";
    if (contractName.includes("1")) return "bg-primary text-white";
    return "bg-secondary";
  };

  if (loading) return <p className="text-center mt-5">Loading...</p>;
  if (error) return <p className="text-center mt-5">{error}</p>;
  if (!roomData) return <p className="text-center mt-5">No data found</p>;

  return (
    <Layout title="Room Detail" icon="bi bi-folder" notifications={3}>
      <div className="container-fluid">
        <div className="row min-vh-100">
          <div className="col-lg-11 p-4 mx-auto">
            {/* ===== Top Toolbar ===== */}
            <div className="card border-0 shadow-sm bg-white rounded-3 mb-4">
              <div className="card-body d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <Link
                    to="/roommanagement"
                    className="breadcrumb-link text-primary text-decoration-none"
                  >
                    Room Management
                  </Link>
                  <span className="text-muted">›</span>
                  <span className="breadcrumb-current">
                    {roomData.roomNumber}
                  </span>
                </div>

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

            {/* ===== Content ===== */}
            <div className="row g-4">
              {/* Left Column: Room Info */}
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
                      <strong>Package:</strong>
                      <span className="value">
                        <span
                          className={`package-badge badge ${getPackageBadgeClass(
                            roomData.contractName ||
                              roomData.contractTypeName ||
                              "-"
                          )}`}
                        >
                          {roomData.contractName ||
                            roomData.contractTypeName ||
                            "-"}
                        </span>
                      </span>
                    </p>
                    <p>
                      <strong>Sign Date:</strong>{" "}
                      {roomData.signDate
                        ? new Date(roomData.signDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Start Date:</strong>{" "}
                      {roomData.startDate
                        ? new Date(roomData.startDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p>
                      <strong>End Date:</strong>{" "}
                      {roomData.endDate
                        ? new Date(roomData.endDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Assets + Requests */}
              <div className="col-lg-8 d-flex">
                <div className="card border-0 shadow-sm rounded-3 flex-fill">
                  <div className="card-body">
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

                    <div className="tab-content mt-3">
                      {/* Assets Tab */}
                      <div
                        className="tab-pane fade show active"
                        id="assets"
                        role="tabpanel"
                      >
                        {roomData.assets?.length > 0 ? (
                          <ul className="list-group list-group-flush">
                            {roomData.assets.map((a) => (
                              <li key={a.assetId} className="list-group-item">
                                {a.assetName}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted">
                            No assets found for this room.
                          </p>
                        )}
                      </div>

                      {/* Requests Tab */}
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

      {/* Modal */}
      <Modal id="editRoomModal" title="Edit Room" icon="bi bi-pencil-square">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const selectedIds = form.allAssets
                .filter((a) => a.checked && !a.isMock)
                .map((a) => a.assetId);

              // Send the selected asset IDs to the server
              await axios.put(
                `http://localhost:8080/room/${id}/assets`,
                selectedIds,
                { withCredentials: true }
              );

              // Update room information
              await axios.put(
                `http://localhost:8080/room/${id}`,
                {
                  roomFloor: form.roomFloor,
                  roomNumber: form.roomNumber,
                  status: form.status,
                },
                { withCredentials: true }
              );

              // Refresh room data
              const refreshed = await axios.get(
                `http://localhost:8080/room/${id}/detail`,
                { withCredentials: true }
              );
              setRoomData(refreshed.data);

              // Show success message
              showMessageSave("Room updated successfully!");

              // Close the modal programmatically
              document.querySelector('[data-bs-dismiss="modal"]').click();
            } catch (err) {
              console.error("Error while updating room data", err);
              showMessageError("Error while updating room data");
            }
          }}
        >
          {/* Floor, Room, and Status Inputs */}
          <div className="mb-3">
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
            </div>
          </div>

          {/* Asset Group Dropdown */}
          <div className="mb-3">
            <label className="form-label">Select Asset Group</label>
            <select
              className="form-select"
              onChange={(e) => setSelectedGroup(e.target.value)} // update state with selected group
            >
              <option value="all">All Groups</option>
              {assetGroups.map((group) => (
                <option key={group.assetGroupName} value={group.assetGroupName}>
                  {group.assetGroupName}
                </option>
              ))}
            </select>
          </div>

          {/* Asset Section */}
          <div className="mb-3">
            <label className="form-label">Select Assets for this Room</label>
            <div className="d-flex flex-wrap gap-3">
              {filterAssetsByGroup(selectedGroup)?.length > 0 ? (
                filterAssetsByGroup(selectedGroup) // Filter assets based on selected group
                  .slice(0, assetsToShow) // Show assets according to pagination (10 at a time)
                  .map((a) => (
                    <div key={a.assetId} className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`asset-${a.assetId}`}
                        checked={a.checked || false}
                        onChange={(e) => {
                          const updated = form.allAssets.map((as) =>
                            as.assetId === a.assetId
                              ? { ...as, checked: e.target.checked }
                              : as
                          );
                          setForm((prev) => ({ ...prev, allAssets: updated }));
                        }}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`asset-${a.assetId}`}
                      >
                        {a.assetName}
                      </label>
                    </div>
                  ))
              ) : (
                <p className="text-muted">No assets found.</p>
              )}
            </div>

            {/* Show More Button */}
            {form.allAssets?.length > assetsToShow && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setAssetsToShow(assetsToShow + 10)}
                >
                  Show More
                </button>
              </div>
            )}
          </div>

          <div className="d-flex justify-content-center gap-3 pt-3 pb-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

export default RoomDetail;

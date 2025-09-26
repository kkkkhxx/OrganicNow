import React from "react";
import * as ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ToastProvider } from "./component/Toast.jsx";

import Dashboard from "./pages/dashboard";
import Test from "./pages/test";
import Test2 from "./pages/test2";
import TenantManagement from "./pages/tenantmanagement";
import TenantDetail from "./pages/tenantdetail";
import RoomDetail from "./pages/roomdetail";
import Invoicemanagement from "./pages/Invoicemanagement";
import InvoiceDetails from "./pages/Invoicedetails";
import PackageManagement from "./pages/PackageManagement";
import MaintenanceSchedule from "./pages/MaintenanceSchedule";
import RoomManagement from "./pages/roommanagement";
import MaintenanceRequest from "./pages/maintenancerequest";
import AssetManagement from "./pages/AssetManagement.jsx";
import MaintenanceDetails from  "./pages/MaintenanceDetails";

const router = createBrowserRouter([
  { path: "/", element: <Dashboard /> },
  { path: "/test", element: <Test /> },
  { path: "/test2", element: <Test2 /> },
  { path: "/TenantManagement", element: <TenantManagement /> },
  { path: "/Tenantdetail/:contractId", element: <TenantDetail /> },
    { path: "/roomdetail/:id", element: <RoomDetail /> },
    { path: "/Invoicemanagement", element: <Invoicemanagement /> },
  { path: "/InvoiceDetails", element: <InvoiceDetails /> },
  { path: "/PackageManagement", element: <PackageManagement /> },
  { path: "/MaintenanceSchedule", element: <MaintenanceSchedule /> },
  { path: "/roommanagement", element: <RoomManagement /> },
  { path: "/Maintenancerequest", element: <MaintenanceRequest /> },
  { path: "/MaintenanceDetails", element: <MaintenanceDetails /> },
  { path: "/AssetManagement", element: <AssetManagement /> },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ToastProvider>
    <RouterProvider router={router} />
  </ToastProvider>
);

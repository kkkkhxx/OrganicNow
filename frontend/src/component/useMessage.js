import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import config from "../config";
const useMessage = () => {
  const navigate = useNavigate();

  const showMessageAdjust = (e, icon = 'info') => {
    Swal.fire({
      title: "",
      text: e,
      icon: icon,
      showConfirmButton: true,
      buttonsStyling: false,
      confirmButtonText: "Close Window",
      customClass: {
        confirmButton: "btn form-Button-Swal me-3",
      },
    });
  };
  const showMessagePermission = (e) => {
    Swal.fire({
      title: "",
      text: "You not have permission, Please contact administrator",
      icon: "error",
      showConfirmButton: true,
      buttonsStyling: false,
      confirmButtonText: "Close Window",
      customClass: {
        confirmButton: "btn form-Button-Swal me-3",
      },
    });
    sessionStorage.clear();
		localStorage.clear();
    navigate(config.mainRoute+'/');
  };

  const showMessageError = (err) => {
    let title = "Error";
    let text = "Found error, Please contact administrator";

    if (typeof err === "string") {
      // ✅ เช็คเฉพาะ duplicate
      if (err.includes("duplicate_national_id")) {
        title = "Error";
        text = "NationalID Already Exists";
      } else {
        title = err;
        text = "";
      }
    } else if (err?.response) {
      // ✅ axios error
      const msg = err.response.data?.message || "";
      if (msg.includes("duplicate_national_id")) {
        title = "Error";
        text = "National ID already exists";
      } else {
        title = msg || title;
        text = err.response.data?.detail || text;
      }
    } else if (err?.message) {
      title = err.message;
    }

    Swal.fire({
      title,
      text,
      icon: "error",
      showConfirmButton: true,
      confirmButtonText: "Close Window",
      buttonsStyling: false,
      customClass: {
        confirmButton: "btn form-Button-Swal me-3",
      },
    });
  };

  const showMessageSave = () => {
    Swal.fire({
      text: "The process has been saved successfully.",
      icon: "success",
      showConfirmButton: true,
      buttonsStyling: false,
      confirmButtonText: "Close Window",
      customClass: {
        confirmButton: "btn form-Button-Swal me-3",
      },
    });
  };
  const showMessageSend = () => {
    Swal.fire({
      text: "The process has been sent successfully.",
      icon: "success",
      showConfirmButton: true,
      buttonsStyling: false,
      confirmButtonText: "Close Window",
      customClass: {
        confirmButton: "btn form-Button-Swal me-3",
      },
    });
  };
  // const showMessageLine = (e) => {
  //   Swal.fire({
  //     text: e,
  //     icon: "success",
  //     showConfirmButton: true,
  //     buttonsStyling: false,
  //     confirmButtonText: "Close Window",
  //     customClass: {
  //       confirmButton: "btn form-Button-Swal me-3",
  //     },
  //   });
  // };
  const showMessageConfirmDelete = async (text = 'data') => {
    const result = await Swal.fire({
      text: `Are you sure to delete "${text}"?`,
      icon: "error",
      showCancelButton: true,
      showConfirmButton: true,
      buttonsStyling: false,
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      customClass: {  
        confirmButton: "btn form-Button-Swal-Delete btn-confirm me-3",
        cancelButton: "btn form-Button-Swal-Delete btn-cancel",
      },
    });
    return result;
  };
  const showMessageConfirmCancel = async () => {
    const result = await Swal.fire({
      text: "Are you sure to cancel this data?",
      icon: "error",
      showCancelButton: true,
      showConfirmButton: true,
      buttonsStyling: false,
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      customClass: {
        confirmButton: "btn form-Button-Swal-Delete me-3",
        cancelButton: "btn form-Button-Swal-Delete me-3",
      },
    });
    return result;
  };
  const showMessageConfirmProcess = async (text = 'Are you sure to confirm this data?') => {
    const result = await Swal.fire({
      text: text,
      icon: "question",
      showCancelButton: true,
      showConfirmButton: true,
      buttonsStyling: false,
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      customClass: {
        confirmButton: "btn form-Button-Swal-Delete me-3",
        cancelButton: "btn form-Button-Swal-Delete me-3",
      },
    });
    return result;
  };

  return {
    showMessageAdjust,
    showMessagePermission,
    showMessageError,
    showMessageSave,
    showMessageSend,
    //showMessageLine,
    showMessageConfirmDelete,
    showMessageConfirmCancel,
    showMessageConfirmProcess,
  };
};

export default useMessage; // ส่งออกเป็น default

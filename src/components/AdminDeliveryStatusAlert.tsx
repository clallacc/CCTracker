import React, { useState } from "react";
import { IonAlert } from "@ionic/react";

// interface DeliveryStatusAlertProps {
//   showStatusAlert: boolean;
//   handleAlertDismiss: () => void;
//   selectedDelivery: { status?: string } | null;
//   handleStatusChange: (status: string) => void;
//   saveStatusChange: () => void;
//   setOption: (option: string) => void;
// }

interface DeliveryStatusAlertProps {
  showStatusAlert: boolean;
  handleAlertDismiss: () => void;
  selectedDelivery: {
    dateKey: string;
    groupId: string;
    deliveryId: string;
    status: string;
  } | null;
  handleStatusChange: (status: string) => void;
  saveStatusChange: () => void;
  setOption: (reason: string) => void;
}

const DeliveryStatusAlert: React.FC<DeliveryStatusAlertProps> = ({
  showStatusAlert,
  handleAlertDismiss,
  selectedDelivery,
  handleStatusChange,
  saveStatusChange,
  setOption,
}) => {
  const [showReturnReasonAlert, setShowReturnReasonAlert] = useState(false);

  const handleStatusSelect = (value: string) => {
    if (value === "return") {
      setShowReturnReasonAlert(true);
    } else {
      handleStatusChange(value);
      saveStatusChange();
    }
  };

  const handleReturnReasonSelect = (reason: string) => {
    setOption(reason);
    handleStatusChange("return");
    saveStatusChange();
    setShowReturnReasonAlert(false);
    handleAlertDismiss();
  };

  return (
    <>
      <IonAlert
        isOpen={showStatusAlert}
        header="Update Delivery Status"
        inputs={[
          {
            label: "Pending",
            type: "radio",
            value: "pending",
            checked: selectedDelivery?.status?.toLowerCase() === "pending",
          },
          {
            label: "Return",
            type: "radio",
            value: "return",
            checked: selectedDelivery?.status?.toLowerCase() === "return",
          },
          {
            label: "Delivered",
            type: "radio",
            value: "delivered",
            checked: selectedDelivery?.status?.toLowerCase() === "delivered",
          },
        ]}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            handler: handleAlertDismiss,
          },
          {
            text: "OK",
            handler: handleStatusSelect,
          },
        ]}
        onDidDismiss={handleAlertDismiss}
      />

      <IonAlert
        isOpen={showReturnReasonAlert}
        header="Select Return Reason"
        inputs={[
          { label: "Call No Answer", type: "radio", value: "cna" },
          { label: "Not At Home", type: "radio", value: "nah" },
          { label: "Not At Work", type: "radio", value: "naw" },
          { label: "Wrong Estate/House", type: "radio", value: "weh" },
          { label: "Bad/Incorrect Number", type: "radio", value: "bin" },
          { label: "On Vacation", type: "radio", value: "ovc" },
          { label: "Unavailable to Collect", type: "radio", value: "utc" },
        ]}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            handler: () => setShowReturnReasonAlert(false),
          },
          {
            text: "OK",
            handler: handleReturnReasonSelect,
          },
        ]}
        onDidDismiss={() => setShowReturnReasonAlert(false)}
      />
    </>
  );
};

export default DeliveryStatusAlert;

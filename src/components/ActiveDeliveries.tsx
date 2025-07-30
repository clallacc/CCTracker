import {
  IonAlert,
  IonBadge,
  IonCol,
  IonGrid,
  IonItem,
  IonRow,
} from "@ionic/react";
import { useEffect, useState } from "react";
import {
  deliveryCoodinatesStatus,
  getInFirebaseDelivery,
  updateDeliveryStatusInFirebase,
} from "../services/util";

interface MapMarkersProps {
  markerPositions: { id: string; coordinates: L.LatLngExpression }[];
  setMarkerPositions: (
    positions: { id: string; coordinates: L.LatLngExpression }[]
  ) => void;
  screen: string;
}

const ActiveDeliveries: React.FC<MapMarkersProps> = ({
  markerPositions,
  setMarkerPositions,
  screen,
}) => {
  const [firebaseDeliveries, setFirebaseDeliveries] = useState<any>({});
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    null
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [documentId, setDocumentId] = useState<string>("");
  const [selectedDelivery, setSelectedDelivery] = useState<{
    dateKey: string;
    groupId: string;
    deliveryId: string;
    status: string;
  } | null>(null);

  const getFirebaseDeliveries = async () => {
    const firedeliveries = await getInFirebaseDelivery();
    if (firedeliveries.length > 0) {
      const mergedData = firedeliveries.reduce((acc, curr) => {
        return { ...acc, ...curr.data };
      }, {});
      setDocumentId(firedeliveries[0].id);
      setFirebaseDeliveries(mergedData);
      // ...merge and set state...
      if (screen === "active") {
        const newMarkerPositions: { id: any; coordinates: any }[] = [];
        firedeliveries.forEach((item: any) => {
          // If your data is grouped by date, group, etc., flatten as needed
          if (item.data) {
            Object.values(item.data).forEach((groups: any) => {
              groups.forEach((group: any) => {
                group.deliveries.forEach((delivery: any) => {
                  if (delivery.coordinates) {
                    newMarkerPositions.push({
                      id: delivery.id,
                      coordinates: delivery.coordinates.coordinates, // or delivery.coordinates.coordinates
                    });
                  }
                });
              });
            });
          }
        });
        setMarkerPositions(newMarkerPositions);
      }
    }
  };

  useEffect(() => {
    getFirebaseDeliveries();
  }, [screen]);

  const updateStatusClicked = (
    dateKey: string,
    groupId: string,
    deliveryId: string,
    currentStatus: string
  ) => {
    setSelectedDelivery({
      dateKey,
      groupId,
      deliveryId,
      status: currentStatus,
    });
    setShowStatusAlert(true);
  };

  const handleStatusChange = (value: string) => {
    if (selectedDelivery) {
      selectedDelivery.status = value;
      setSelectedDelivery(selectedDelivery);
      // setSelectedDelivery({ ...selectedDelivery, status: value });
    }
  };

  const handleAlertDismiss = () => {
    setShowStatusAlert(false);
    setSelectedDeliveryId(null);
    setSelectedStatus("");
  };

  // Optional: Update the status in your firebaseDeliveries state (local update)
  const saveStatusChange = async () => {
    if (!selectedDelivery) return;
    // Update in Firebase

    await updateDeliveryStatusInFirebase(
      documentId,
      selectedDelivery.dateKey,
      selectedDelivery.groupId,
      selectedDelivery.deliveryId,
      selectedDelivery.status
    );
    // Optionally, refresh deliveries from Firebase here
    setShowStatusAlert(false);
    setSelectedDelivery(null);
    getFirebaseDeliveries();
  };

  const dateKeys = Object.keys(firebaseDeliveries);

  return (
    <IonGrid>
      <IonRow>
        <IonCol size="2">
          <IonItem>
            <h4>Order/Tracking No</h4>
          </IonItem>
        </IonCol>
        <IonCol size="2">
          <IonItem>
            <h4>Customer</h4>
          </IonItem>
        </IonCol>
        <IonCol size="5">
          <IonItem>
            <h4>Address</h4>
          </IonItem>
        </IonCol>
        <IonCol size="2">
          <IonItem>
            <h4>Phone</h4>
          </IonItem>
        </IonCol>
        <IonCol size="1">
          <IonItem>
            <h4>Status</h4>
          </IonItem>
        </IonCol>
      </IonRow>

      {dateKeys.length === 0 && (
        <p className="ion-paddind">No items saved in delivery</p>
      )}

      {dateKeys.map((dateKey) => {
        const deliveriesForDate = firebaseDeliveries[dateKey];
        if (!deliveriesForDate || deliveriesForDate.length === 0) return null;

        return (
          <div key={dateKey}>
            {deliveriesForDate.map((deliveryGroup: any) => (
              <div key={deliveryGroup.id}>
                <IonRow className="city-header-row">
                  <IonCol size="12">
                    <IonItem>
                      <h4
                        style={{
                          margin: "16px 0 8px 0",
                          fontWeight: "bold",
                          textTransform: "capitalize",
                        }}
                      >
                        {dateKey} - {deliveryGroup.area} -{" "}
                        {deliveryGroup.driver}
                      </h4>
                    </IonItem>
                  </IonCol>
                </IonRow>

                {deliveryGroup.deliveries.map(
                  (delivery: any, index: number) => (
                    <IonRow key={delivery.id}>
                      <IonCol size="2">
                        <IonItem lines="none">
                          <p>{delivery.tracking_code}</p>
                        </IonItem>
                      </IonCol>
                      <IonCol size="2">
                        <IonItem lines="none">
                          <p>{`${delivery.first_name} ${delivery.last_name}`}</p>
                        </IonItem>
                      </IonCol>
                      <IonCol style={{ fontWeight: "bold" }} size="5">
                        <IonItem
                          style={{ position: "relative", width: "100%" }}
                          lines="none"
                        >
                          <p>{`${delivery.address} ${delivery.city}`}</p>
                          <IonBadge
                            onClick={() =>
                              updateStatusClicked(
                                dateKey,
                                deliveryGroup.id,
                                delivery.id,
                                delivery.status
                              )
                            }
                            color={
                              delivery?.status === "delivered"
                                ? "success"
                                : delivery?.status === "return"
                                ? "warning"
                                : "primary"
                            }
                            slot="end"
                          >
                            {delivery.status}
                          </IonBadge>
                        </IonItem>
                      </IonCol>
                      <IonCol size="2">
                        <IonItem lines="none">
                          <p>{delivery.phone}</p>
                        </IonItem>
                      </IonCol>
                      <IonCol size="1">
                        <IonItem lines="none">
                          {deliveryCoodinatesStatus(delivery)}
                        </IonItem>
                      </IonCol>
                    </IonRow>
                  )
                )}
              </div>
            ))}
          </div>
        );
      })}

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
            handler: (value) => {
              handleStatusChange(value);
              saveStatusChange();
            },
          },
        ]}
        onDidDismiss={handleAlertDismiss}
      />
    </IonGrid>
  );
};

export default ActiveDeliveries;

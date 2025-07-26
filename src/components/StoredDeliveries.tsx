import {
  IonAlert,
  IonBadge,
  IonButton,
  IonCol,
  IonGrid,
  IonItem,
  IonRow,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { prefsGetDeliveries, prefsStoreDeliveries } from "../services/prefs";
import {
  createDeliveryInFirebase,
  deliveryCoodinatesStatus,
} from "../services/util";
import { useAdminOptions } from "../services/adminOptions";

const StoredDeliveries: React.FC = () => {
  const { options } = useAdminOptions();
  const [storedDeliveries, setStoredDeliveries] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [storedLoaded, setStoredLoaded] = useState(false);
  const [showStoreBtn, setShowStoreBtn] = useState(false);
  const [showSubmitRouteBtn, setShowSubmitRouteBtn] = useState(false);

  // Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [area, setArea] = useState("");
  const [driver, setDriver] = useState("");

  const getStoredDeliveries = async () => {
    const deliveries = await prefsGetDeliveries();
    console.log("deliveries", deliveries);
    if (deliveries && deliveries.length > 0) {
      setStoredDeliveries(deliveries);
    }
    setStoredLoaded(true);
  };

  useEffect(() => {
    getStoredDeliveries();
  }, []);

  const addDeliveryGroup = (route: any) => {
    setDeliveries((prevGroup) => {
      // Check if route already exists in storedDeliveryGroup by id
      const exists = prevGroup.some((item: any) => item.id === route.id);

      if (exists) {
        // Remove the route if it exists
        return prevGroup.filter((item: any) => item.id !== route.id);
      } else {
        // Add the route if it doesn't exist
        return [...prevGroup, route];
      }
    });
  };

  useEffect(() => {
    setShowStoreBtn(deliveries.length > 0);
  }, [deliveries]);

  // Show the alert when Save is clicked
  const handleSaveClick = () => {
    setShowAlert(true);
  };

  const savedata = async (area: string, driver: string) => {
    const deliveryObj = [
      {
        id: `${deliveries[0].reference_number}-${area}`,
        endpoint: options?.aeropost_endpoint,
        area: area,
        driver: driver,
        deliveries,
      },
    ];
    await prefsStoreDeliveries(deliveryObj);
    getStoredDeliveries();
    setShowAlert(false);
  };

  const submitRoute = async () => {
    try {
      const deliveries = await prefsGetDeliveries();
      await createDeliveryInFirebase(storedDeliveries).then(() => {});
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <IonGrid>
      {/* IonAlert for Save Prompt */}
      <IonAlert
        isOpen={showAlert}
        header="Save Delivery Group"
        inputs={[
          {
            name: "area",
            placeholder: "Delivery Area",
            value: area,
          },
          {
            name: "driver",
            placeholder: "Driver (max 25 characters)",
            attributes: { maxlength: 25 },
            value: driver,
          },
        ]}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            handler: () => setShowAlert(false),
          },
          {
            text: "OK",
            handler: (data) => {
              // data is an object: { area: string, driver: string }
              if (data.area && data.driver) {
                setArea(data.area);
                setDriver(data.driver);
                // Optionally, call savedata() here if you want to save immediately
                savedata(data.area, data.driver);
              }
              setShowAlert(false);
            },
          },
        ]}
        onDidDismiss={() => setShowAlert(false)}
      />

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

      {storedDeliveries.map((storedDelivery) =>
        storedDeliveries && storedDeliveries.length > 0 ? (
          <div key={storedDelivery.id}>
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
                    {storedDelivery.area}
                  </h4>
                  {showStoreBtn && (
                    <IonButton
                      onClick={() => handleSaveClick()}
                      expand="block"
                      fill="outline"
                      shape="round"
                      slot="end"
                    >
                      Save
                    </IonButton>
                  )}
                  {showSubmitRouteBtn && (
                    <IonButton
                      onClick={() => submitRoute()}
                      expand="block"
                      fill="outline"
                      shape="round"
                      slot="end"
                    >
                      Submit Route
                    </IonButton>
                  )}
                </IonItem>
              </IonCol>
            </IonRow>

            {storedDelivery?.deliveries?.map((delivery: any) => {
              const isSelected = deliveries.some(
                (item: any) => item.id === delivery.id
              );

              return (
                <IonRow
                  onClick={() => addDeliveryGroup(delivery)}
                  key={delivery.id}
                  className={`delivery-row${
                    isSelected ? " stored-groupitem-selected" : ""
                  }`}
                >
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
                      <IonBadge slot="end">{delivery?.status}</IonBadge>
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
              );
            })}
          </div>
        ) : (
          <p>No items saved in delivery</p>
        )
      )}
    </IonGrid>
  );
};

export default StoredDeliveries;

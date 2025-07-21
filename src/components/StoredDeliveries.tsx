import { IonBadge, IonCol, IonGrid, IonItem, IonRow } from "@ionic/react";
import { useEffect, useState } from "react";
import { prefsGetDeliveries } from "../services/prefs";
import { deliveryCoodinatesStatus } from "../services/util";

const StoredDeliveries: React.FC = () => {
  const [storedDeliveries, setStoredDeliveries] = useState<any[]>([]);
  const [storedLoaded, setStoredLoaded] = useState(false);

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
                    }}
                  >
                    {storedDelivery.area}
                  </h4>
                </IonItem>
              </IonCol>
            </IonRow>

            {storedDelivery.deliveries.map((delivery: any) => (
              <IonRow key={delivery.id} className="delivery-row">
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
            ))}
          </div>
        ) : (
          <p>No items saved in delivery</p>
        )
      )}
    </IonGrid>
  );
};

export default StoredDeliveries;

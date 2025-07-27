import { IonBadge, IonCol, IonGrid, IonItem, IonRow } from "@ionic/react";
import { useEffect, useState } from "react";
import {
  deliveryCoodinatesStatus,
  getInFirebaseDelivery,
} from "../services/util";

const ActiveDeliveries: React.FC = () => {
  const [firebaseDeliveries, setFirebaseDeliveries] = useState<any>({});

  useEffect(() => {
    const getFirebaseDeliveries = async () => {
      const firedeliveries = await getInFirebaseDelivery();
      if (firedeliveries.length > 0) {
        const mergedData = firedeliveries.reduce((acc, curr) => {
          return { ...acc, ...curr.data };
        }, {});
        setFirebaseDeliveries(mergedData);
      }
    };
    getFirebaseDeliveries();
  }, []);

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

      {dateKeys.length === 0 && <p>No items saved in delivery</p>}

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

                {deliveryGroup.deliveries.map((delivery: any) => (
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
                        <IonBadge slot="end">{delivery.status}</IonBadge>
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
            ))}
          </div>
        );
      })}
    </IonGrid>
  );
};

export default ActiveDeliveries;

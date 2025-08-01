import { useEffect, useState } from "react";
import { getInFirebaseDelivery } from "../services/util";
import {
  IonContent,
  IonHeader,
  IonImg,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonThumbnail,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { logoDropbox } from "ionicons/icons";

interface ContainerProps {
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
}

const DriverDelivered: React.FC<ContainerProps> = ({
  isModalOpen,
  setIsModalOpen,
}) => {
  const [firebaseDeliveries, setFirebaseDeliveries] = useState<any>({});

  useEffect(() => {
    const getFirebaseDeliveries = async () => {
      const firedeliveries = await getInFirebaseDelivery();
      if (firedeliveries.length > 0) {
        const mergedData = firedeliveries.reduce((acc, curr) => {
          return { ...acc, ...curr.data };
        }, {});

        // Filter each date's delivery groups and their deliveries by status "delivered"
        const filteredData = Object.entries(mergedData).reduce(
          (acc: Record<string, any[]>, [dateKey, deliveryGroups]) => {
            const filteredGroups = (deliveryGroups as any[])
              .map((group) => {
                const deliveredDeliveries = group.deliveries.filter(
                  (delivery: any) => delivery.status === "delivered"
                );
                if (deliveredDeliveries.length > 0) {
                  return { ...group, deliveries: deliveredDeliveries };
                }
                return null;
              })
              .filter(Boolean);

            if (filteredGroups.length > 0) {
              acc[dateKey] = filteredGroups;
            }
            return acc;
          },
          {} as Record<string, any[]>
        );

        setFirebaseDeliveries(filteredData);
      }
    };

    getFirebaseDeliveries();
  }, [firebaseDeliveries]);

  const formatToSentenceCase = (str: any) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <>
      <IonModal
        className="login-modal"
        isOpen={isModalOpen}
        onDidDismiss={() => setIsModalOpen(false)}
        initialBreakpoint={0.4}
        breakpoints={[0.4, 0.8, 0.9]}
      >
        <IonHeader className="modal-header">
          <IonToolbar>
            <IonTitle>Delivered</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="delivery-list">
            <IonList className="delivery-list--item">
              {firebaseDeliveries &&
              Object.keys(firebaseDeliveries).length > 0 ? (
                Object.keys(firebaseDeliveries).map((dateKey) =>
                  firebaseDeliveries[dateKey].map((deliveryGroup: any) => (
                    <div key={deliveryGroup.id}>
                      {/* Group header */}
                      <IonItem color="light">
                        <IonLabel>
                          <strong>
                            {deliveryGroup.delivery_date} - {deliveryGroup.area}{" "}
                            - {deliveryGroup.driver}
                          </strong>
                        </IonLabel>
                      </IonItem>
                      {/* Deliveries in this group */}
                      {deliveryGroup.deliveries.map((delivery: any) => (
                        <IonItem key={delivery.id}>
                          <IonThumbnail slot="start">
                            <IonImg src={logoDropbox}></IonImg>
                          </IonThumbnail>
                          <IonLabel>
                            <h2>
                              {formatToSentenceCase(`${delivery?.first_name}`)}{" "}
                              {formatToSentenceCase(`${delivery?.last_name}`)}
                            </h2>
                            <p>
                              {delivery?.address}
                              {delivery?.city ? `, ${delivery?.city}` : ""}
                            </p>
                          </IonLabel>
                        </IonItem>
                      ))}
                    </div>
                  ))
                )
              ) : (
                <p>No delivery details available for packages delivered!</p>
              )}
            </IonList>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};

export default DriverDelivered;

import { useEffect, useState } from "react";
import "./DriverContainer.css";
import {
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonThumbnail,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useAppContext } from "../services/appContext";
import { calculateDistance, getInFirebaseDelivery } from "../services/util";
import { create, peopleCircleOutline } from "ionicons/icons";

interface ContainerProps {
  name: string;
  position: any;
  driverSection: number;
  setDriverSection: (section: number) => void;
  endRoute: string;
  setEndRoute: (endRoute: string) => void;
  setDeliveryId: (deliveryId: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setDeliveryUpdateParams: (props: {
    documentId: string;
    dateKey: string;
    groupId: string;
  }) => void;
  setShowReturnOptions: (showReturnOptions: boolean) => void;
}

interface DeliveryGroup {
  delivery_date: string;
  area: string;
  driver: string;
  deliveries: any[]; // or more specific type
  id: string;
  // other fields...
}

const DriverContainer: React.FC<ContainerProps> = ({
  name,
  position,
  driverSection,
  setDriverSection,
  setEndRoute,
  setDeliveryId,
  isModalOpen,
  setIsModalOpen,
  setDeliveryUpdateParams,
  setShowReturnOptions,
}) => {
  const { appState, setAppState } = useAppContext();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [aeropostDeliveries, setAeropostDeliveries] = useState<any[]>([]);
  const [cityList, setCityList] = useState<any[]>([]);

  const [firebaseDeliveries, setFirebaseDeliveries] = useState<any>({});
  const [filteredFirebaseDeliveries, setFilteredFirebaseDeliveries] =
    useState<any>({});

  useEffect(() => {
    const getFirebaseDeliveries = async () => {
      console.log("filtered Method called.");
      try {
        const firedeliveries = await getInFirebaseDelivery();
        console.log("firedeliveries.", firedeliveries);
        if (firedeliveries.length > 0) {
          // Build mergedData with documentId inside each delivery group
          const mergedData = firedeliveries.reduce((acc, curr) => {
            // For each dateKey in curr.data
            Object.entries(curr.data).forEach(([dateKey, groups]) => {
              // Add documentId to each group
              const groupsWithId = (groups as any[]).map((group) => ({
                ...group,
                documentId: curr.id,
              }));
              // Assign to accumulator
              acc[dateKey] = (acc[dateKey] || []).concat(groupsWithId);
            });
            return acc;
          }, {} as Record<string, any[]>);

          // Filter each date's delivery groups and their deliveries by status "pending"
          const filteredData = Object.entries(mergedData).reduce(
            (acc: Record<string, any[]>, [dateKey, deliveryGroups]) => {
              const filteredGroups = (deliveryGroups as any[])
                .map((group) => {
                  const pendingDeliveries = group.deliveries.filter(
                    (delivery: any) => delivery.status === "pending"
                  );
                  if (pendingDeliveries.length > 0) {
                    return { ...group, deliveries: pendingDeliveries };
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
          setFilteredFirebaseDeliveries(filteredData);
          console.log("filteredData", filteredData);
        }
      } catch (error) {
        console.error("Firestore Error: ", error);
      }
    };
    getFirebaseDeliveries();
  }, []);

  const selectedCity = (city: string) => {
    const arimaOrders = aeropostDeliveries.filter(
      (orders: any) => orders.city == city
    );
    setDeliveries(arimaOrders);
    console.log("aeropostOrders", arimaOrders);
  };

  const loadDeliveries = (deliveries: any) => {
    setDeliveries(deliveries);
  };

  const formatToSentenceCase = (str: any) => {
    if (!str) return "";
    // Handle null or undefined
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const filterDeliveries = (selectedValue: string) => {
    if (selectedValue === "") {
      setFilteredFirebaseDeliveries(firebaseDeliveries);
      return;
    }
    console.log("Selected delivery group:", selectedValue);

    const [delivery_date, area, driver] = selectedValue.split(" - ");

    // Type assertion for Object.entries
    const filteredGroups = Object.entries(
      firebaseDeliveries as Record<string, DeliveryGroup[]>
    ).reduce(
      (acc: Record<string, DeliveryGroup[]>, [dateKey, deliveryGroups]) => {
        if (dateKey === delivery_date) {
          const matchedGroups = deliveryGroups.filter(
            (group) => group.area === area && group.driver === driver
          );
          if (matchedGroups.length > 0) {
            acc[dateKey] = matchedGroups;
          }
        }
        return acc;
      },
      {}
    );

    console.log("Filtered groups:", filteredGroups);
    setFilteredFirebaseDeliveries(filteredGroups);
  };

  // const setDeliveryUpdateParams = (
  //   documentId: string,
  //   dateKey: string,
  //   groupId: string
  // ) => {
  //   console.log("documentId", documentId);
  //   console.log("dateKey", dateKey);
  //   console.log("groupId", groupId);
  // };

  return (
    <>
      <IonModal
        className="login-modal"
        isOpen={isModalOpen}
        onDidDismiss={() => {
          // setLoginModelOpen(false);
          setIsModalOpen(false);
        }}
        initialBreakpoint={0.4}
        breakpoints={[0.4, 0.8, 0.9]}
      >
        <IonHeader className="modal-header">
          <IonToolbar>
            <IonTitle>Deliveries</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {driverSection === 0 && (
            <>
              <div className="delivery-list">
                <IonList>
                  <IonItem className="select-city--item">
                    <IonSelect
                      aria-label="city"
                      interface="action-sheet"
                      placeholder="Select delivery area..."
                      onIonChange={(e) => filterDeliveries(e.detail.value)}
                      style={{ width: "100%" }}
                    >
                      <IonSelectOption value={""} style={{ width: "100%" }}>
                        All
                      </IonSelectOption>
                      {Object.keys(firebaseDeliveries).map((dateKey) =>
                        firebaseDeliveries[dateKey].map(
                          (deliveryGroup: any) => {
                            const optionValue = `${deliveryGroup.delivery_date} - ${deliveryGroup.area} - ${deliveryGroup.driver}`;
                            return (
                              <IonSelectOption
                                key={deliveryGroup.id}
                                value={optionValue}
                                style={{ width: "100%" }}
                              >
                                {optionValue}
                              </IonSelectOption>
                            );
                          }
                        )
                      )}
                    </IonSelect>
                  </IonItem>
                </IonList>

                <IonList className="delivery-list--item">
                  {Object.keys(filteredFirebaseDeliveries).map((dateKey) =>
                    filteredFirebaseDeliveries[dateKey].map(
                      (deliveryGroup: any) => {
                        // Sort deliveries by distance to driver position
                        const sortedDeliveries = [
                          ...deliveryGroup.deliveries,
                        ].sort((a: any, b: any) => {
                          // Defensive: ensure coordinates exist
                          const aCoords = a.coordinates?.coordinates;
                          const bCoords = b.coordinates?.coordinates;
                          if (!aCoords || !bCoords) return 0;
                          const aDist = calculateDistance(
                            position.lat,
                            position.lng,
                            aCoords.lat,
                            aCoords.lng
                          );
                          const bDist = calculateDistance(
                            position.lat,
                            position.lng,
                            bCoords.lat,
                            bCoords.lng
                          );
                          return aDist - bDist;
                        });

                        return (
                          <div key={deliveryGroup.id}>
                            {/* Group header */}
                            <IonItem color="light">
                              <IonLabel>
                                <strong>
                                  {deliveryGroup.delivery_date} -{" "}
                                  {deliveryGroup.area} - {deliveryGroup.driver}
                                </strong>
                              </IonLabel>
                            </IonItem>
                            {/* Deliveries in this group */}
                            {sortedDeliveries.map((delivery: any) => (
                              <IonItemSliding>
                                <IonItem
                                  key={delivery.id}
                                  onClick={() => {
                                    setDriverSection(1);
                                    setEndRoute(
                                      `${delivery?.address}, ${delivery?.city} ${delivery?.country_code}`
                                    );
                                    setDeliveryId(delivery.id);
                                    setIsModalOpen(false);
                                    setDeliveryUpdateParams({
                                      documentId: deliveryGroup.documentId,
                                      dateKey: dateKey,
                                      groupId: deliveryGroup.id,
                                    });
                                  }}
                                >
                                  <IonThumbnail slot="start">
                                    <IonImg src={peopleCircleOutline}></IonImg>
                                  </IonThumbnail>
                                  <IonLabel>
                                    <h2>
                                      {formatToSentenceCase(
                                        `${delivery?.first_name}`
                                      )}{" "}
                                      {formatToSentenceCase(
                                        `${delivery?.last_name}`
                                      )}
                                    </h2>
                                    <p>
                                      {delivery?.address}
                                      {delivery?.city
                                        ? `, ${delivery?.city}`
                                        : ""}
                                    </p>
                                    {/* Optionally show distance */}
                                    {delivery.coordinates?.coordinates && (
                                      <IonBadge color={"light"} slot="end">
                                        <p
                                          style={{
                                            fontSize: "0.8em",
                                            color: "#888",
                                          }}
                                        >
                                          {calculateDistance(
                                            position.lat,
                                            position.lng,
                                            delivery.coordinates.coordinates
                                              .lat,
                                            delivery.coordinates.coordinates.lng
                                          ).toFixed(2)}{" "}
                                          km away
                                        </p>
                                      </IonBadge>
                                    )}
                                  </IonLabel>
                                </IonItem>
                                <IonItemOptions>
                                  <IonItemOption
                                    onClick={() => {
                                      setShowReturnOptions(true),
                                        setIsModalOpen(false);
                                    }}
                                  >
                                    Return
                                  </IonItemOption>
                                </IonItemOptions>
                              </IonItemSliding>
                            ))}
                          </div>
                        );
                      }
                    )
                  )}
                </IonList>
              </div>
            </>
          )}
        </IonContent>
      </IonModal>
    </>
  );
};

export default DriverContainer;

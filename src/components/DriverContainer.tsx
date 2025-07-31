import { useEffect, useState } from "react";
import "./DriverContainer.css";
import {
  IonContent,
  IonHeader,
  IonImg,
  IonItem,
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
import { getAeropostOrders } from "../services/httprequests";
import {
  fetchLatLon,
  getDeliveryInFirebase,
  getInFirebaseDelivery,
} from "../services/util";
import { prefsStoreDeliveries } from "../services/prefs";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import { peopleCircleOutline } from "ionicons/icons";

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
}) => {
  const { appState, setAppState } = useAppContext();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [aeropostDeliveries, setAeropostDeliveries] = useState<any[]>([]);
  const [cityList, setCityList] = useState<any[]>([]);

  const [firebaseDeliveries, setFirebaseDeliveries] = useState<any>({});

  useEffect(() => {
    const getFirebaseDeliveries = async () => {
      const firedeliveries = await getInFirebaseDelivery();
      if (firedeliveries.length > 0) {
        const mergedData = firedeliveries.reduce((acc, curr) => {
          return { ...acc, ...curr.data };
        }, {});

        // Filter each date's delivery groups and their deliveries by status "pending"
        const filteredData = Object.entries(mergedData).reduce(
          (acc: Record<string, any[]>, [dateKey, deliveryGroups]) => {
            // deliveryGroups is any[]
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
        console.log("filteredData", filteredData);
      }
    };
    getFirebaseDeliveries();
  }, []);

  const provider = new OpenStreetMapProvider();

  // useEffect(() => {
  //   const aeropostOrdersGet = async () => {
  //     try {
  //       // Fetch data from both sources
  //       const aeropostOrders = await getAeropostOrders("2025-06-26");
  //       setAeropostDeliveries(aeropostOrders);
  //       const citiesCategory = Array.from(
  //         new Set(aeropostOrders.map((item: any) => item.city))
  //       ).map((city) => ({ city }));
  //       setCityList(citiesCategory);

  //       const results = await provider.search({
  //         query:
  //           "2261, Mountain Road, Hildegarde, Moncton Parish, Moncton, Westmorland County, New Brunswick, E1G 1B4, Canada",
  //       });
  //     } catch (error) {
  //       console.error("Error fetching or processing deliveries:", error);
  //     }
  //   };

  //   aeropostOrdersGet();
  // }, []);

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
    if (!str) return ""; // Handle null or undefined
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

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
                      onIonChange={(e) => selectedCity(e.detail.value)}
                      style={{ width: "100%" }}
                    >
                      {cityList.map((city) => (
                        <IonSelectOption
                          key={city.city}
                          value={city.city}
                          style={{ width: "100%" }}
                        >
                          {city.city}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </IonList>

                <IonList className="delivery-list--item">
                  {Object.keys(firebaseDeliveries).map((dateKey) =>
                    firebaseDeliveries[dateKey].map((deliveryGroup: any) =>
                      deliveryGroup.deliveries.map((delivery: any) => (
                        <IonItem
                          key={delivery.id}
                          onClick={() => {
                            setDriverSection(1);
                            setEndRoute(
                              `${delivery?.address}, ${delivery?.city} ${delivery?.country_code}`
                            );
                            setDeliveryId(delivery.id);
                            setIsModalOpen(false);
                          }}
                        >
                          <IonThumbnail slot="start">
                            <IonImg src={peopleCircleOutline}></IonImg>
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
                      ))
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

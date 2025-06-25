import { useEffect, useState } from "react";
import "./DriverContainer.css";
import { IonItem, IonLabel, IonList } from "@ionic/react";
import { useAppContext } from "../services/appContext";
import { getAeropostOrders } from "../services/httprequests";
import { getDeliveryInFirebase } from "../services/util";
import { prefsStoreDeliveries } from "../services/prefs";

interface ContainerProps {
  name: string;
  position: any;
  driverSection: number;
  setDriverSection: (section: number) => void;
  endRoute: string;
  setEndRoute: (endRoute: string) => void;
  setDeliveryId: (deliveryId: string) => void;
}

const DriverContainer: React.FC<ContainerProps> = ({
  name,
  position,
  driverSection,
  setDriverSection,
  setEndRoute,
  setDeliveryId,
}) => {
  const { appState, setAppState } = useAppContext();
  const [deliveries, setDeliveries] = useState<any[]>([]);

  // Haversine formula to calculate distance between two coordinates
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const toRadians = (degree: number) => (degree * Math.PI) / 180;
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  useEffect(() => {
    const aeropostOrdersGet = async () => {
      try {
        // Fetch data from both sources
        const aeropostOrders = await getAeropostOrders("2025-06-17");
        const firebaseDeliveries = await getDeliveryInFirebase();

        // Filter out deliveries with matching IDs and status "delivered"
        const filteredOrders = aeropostOrders.filter((order: any) => {
          const matchingDelivery = firebaseDeliveries.find(
            (delivery: any) => delivery.deliveryid === order.id
          );
          return !(matchingDelivery && matchingDelivery.status === "delivered");
        });

        // Push the new delivery data (TO REMOVE)
        const newDelivery = [
          {
            id: "9f127869-c36f-42da-bfd1-a654d42924id",
            reference_number: "369-95082094",
            tracking_code: "HZ001TT5536342891802",
            phone: "+18684911071",
            first_name: "Walmart",
            last_name: "Moncton",
            city: "Moncton",
            address: "25 Plaza Blvd",
            address_extra: null,
            country_code: "CA",
            delivery_route: "61",
            delivery_zen: "279",
            postal_code: null,
            delivery_instructions: null,
            manifest_number: "369-95082094",
          },
          {
            id: "9f127869-c36f-42da-bfd1-a654d42924uis",
            reference_number: "369-95082094",
            tracking_code: "HZ001TT5536342891802",
            phone: "+18684911071",
            first_name: "Moncton",
            last_name: "Hospital",
            city: "Moncton",
            address: "135 Macbeath Ave",
            address_extra: null,
            country_code: "CA",
            delivery_route: "61",
            delivery_zen: "279",
            postal_code: null,
            delivery_instructions: null,
            manifest_number: "369-95082094",
          },
        ];

        const updatedDeliveries = [...filteredOrders, ...newDelivery];

        // Calculate distance from current location
        const directionsService = new google.maps.DirectionsService();

        // Function to calculate distance for each delivery
        const calculateDistances = async () => {
          const promises = updatedDeliveries.map((delivery) => {
            return new Promise((resolve, reject) => {
              const destination = delivery.address + ", " + delivery.city;

              directionsService.route(
                {
                  origin: position,
                  destination: destination,
                  travelMode: google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                  if (status === google.maps.DirectionsStatus.OK) {
                    const distance = result?.routes[0].legs[0].distance?.value; // Convert meters to kilometers
                    resolve({ ...delivery, distance: distance });
                  } else {
                    console.error(
                      `Error fetching directions for ${destination}: ${status}`
                    );
                    reject(status);
                  }
                }
              );
            });
          });

          // Wait for all distances to be calculated
          const deliveriesWithDistances = await Promise.allSettled(promises);
          // Sort deliveries by distance
          // Filter out successful results and map to the desired format
          const sortedDeliveries = deliveriesWithDistances
            .filter((result) => result.status === "fulfilled") // Keep only fulfilled promises
            .map((result) => result.value) // Extract the value directly
            .sort(
              (a: any, b: any) =>
                (a.distance || Infinity) - (b.distance || Infinity)
            ); // Sort by distance

          console.log("lookup results", sortedDeliveries);

          // Store and load sorted deliveries
          prefsStoreDeliveries(sortedDeliveries);
          loadDeliveries(sortedDeliveries);
        };
        calculateDistances();
      } catch (error) {
        console.error("Error fetching or processing deliveries:", error);
      }
    };

    aeropostOrdersGet();
  }, []);

  const loadDeliveries = (deliveries: any) => {
    setDeliveries(deliveries);
  };

  const formatToSentenceCase = (str: any) => {
    if (!str) return ""; // Handle null or undefined
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <>
      {driverSection === 0 && (
        <>
          <div className="delivery-list">
            <IonList>
              {deliveries.map((delivery) => (
                <IonItem
                  key={delivery.id}
                  onClick={() => {
                    setDriverSection(1),
                      setEndRoute(
                        `${delivery?.address}, ${delivery?.city} ${delivery?.country_code}`
                      ),
                      setDeliveryId(delivery.id);
                  }}
                >
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
            </IonList>
          </div>
        </>
      )}
    </>
  );
};

export default DriverContainer;

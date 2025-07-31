import { useEffect, useState } from "react";
import {
  IonButton,
  IonCol,
  IonGrid,
  IonIcon,
  IonItem,
  IonLabel,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonSegmentContent,
  IonSegmentView,
} from "@ionic/react";
import { getAeropostOrders } from "../services/httprequests";
import {
  createDeliveryInFirebase,
  deliveryCoodinatesStatus,
  getLatLngFromAddress,
} from "../services/util";
import React from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import AddressAutocompleteInput from "./AddressAutocompleteInput";
import { addCircle, addCircleOutline, locate, navigate } from "ionicons/icons";
import L from "leaflet";
import car01 from "../assets/pin01.png";
import car02 from "../assets/pin02.png";
import car03 from "../assets/pin03.png";
import car04 from "../assets/pin04.png";
import delivery01 from "../assets/delivery01.png";
import delivery02 from "../assets/delivery02.png";
import delivery03 from "../assets/delivery03.png";
import {
  prefsGetDeliveries,
  prefsRemoveDeliveries,
  prefsStoreDeliveries,
} from "../services/prefs";
import { useAdminOptions } from "../services/adminOptions";
import StoredDeliveries from "./StoredDeliveries";
import ActiveDeliveries from "./ActiveDeliveries";
import DeliveredDeliveries from "./DeliveredDeliveries";

// Prepare Leaflet icons for each car image
const carIcons = [
  new L.Icon({
    iconUrl: car01,
    iconSize: [30, 40], // adjust size as needed
    iconAnchor: [20, 40], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -40],
  }),
  new L.Icon({
    iconUrl: car02,
    iconSize: [30, 40],
    iconAnchor: [20, 50],
    popupAnchor: [0, -40],
  }),
  new L.Icon({
    iconUrl: car03,
    iconSize: [30, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  }),
];

const carMarker = new L.Icon({
  iconUrl: car04,
  iconSize: [30, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});
const carMarker01 = new L.Icon({
  iconUrl: car01,
  iconSize: [30, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});
const carMarker02 = new L.Icon({
  iconUrl: car02,
  iconSize: [30, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});
const carMarker03 = new L.Icon({
  iconUrl: car03,
  iconSize: [30, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});
const deliveryMarker01 = new L.Icon({
  iconUrl: delivery01,
  iconSize: [30, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});
const deliveryMarker02 = new L.Icon({
  iconUrl: delivery02,
  iconSize: [30, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});
const deliveryMarker03 = new L.Icon({
  iconUrl: delivery03,
  iconSize: [30, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Function to get a random icon from the array
const getRandomCarIcon = () => {
  const index = Math.floor(Math.random() * carIcons.length);
  return carIcons[index];
};

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.display_name || "Address not found";
};

interface ClickAndDragMarkerProps {
  markerPosition: L.LatLng | null;
  setMarkerPosition: (pos: L.LatLng) => void;
  setAddress: (address: string) => void;
}

const ClickAndDragMarker: React.FC<ClickAndDragMarkerProps> = ({
  markerPosition,
  setMarkerPosition,
  setAddress,
}) => {
  useMapEvents({
    click: async (e) => {
      // Only set marker if it doesn't exist yet
      if (!markerPosition) {
        setMarkerPosition(e.latlng);
        const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
        setAddress(address);
      }
    },
  });
  return null;
};

const Deliveries: React.FC = () => {
  const { options } = useAdminOptions();
  const [aeropostDeliveries, setAeropostDeliveries] = useState<any[]>([]);
  const position = { lat: 10.6419388, lng: -61.2808954 };
  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(
    null
  );
  const randomIcon = getRandomCarIcon();

  const [markerPosition, setMarkerPosition] = useState<L.LatLng | null>(null);
  const [segmentMarkerPositions, setSegmentMarkerPositions] = useState<
    { id: string; coordinates: L.LatLngExpression }[]
  >([]);
  const [dragAddress, setDragAddress] = useState<string>("");
  const [markerItemId, setMarkerItemId] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [showSaveBtn, setShowSaveBtn] = useState(false);
  const [storedDeliveries, setStoredDeliveries] = useState<any[]>([]);
  const [storedLoaded, setStoredLoaded] = useState(false);
  const [adminNotice, setAdminNotice] = useState<string>("");
  const [segment, setSegment] = useState("aeropost");
  const [activeScreen, setActiveScreen] = useState("");

  const getIcon = () => {
    if (activeScreen === "staging") return deliveryMarker03;
    if (activeScreen === "active") return deliveryMarker02;
    if (activeScreen === "delivered") return deliveryMarker01;
    return carMarker;
  };

  ///// GET AEROPOST DELIVERIES
  useEffect(() => {
    const aeropostOrdersGet = async () => {
      try {
        // Fetch from Aeropost if no stored deliveries
        if (options?.aeropost_endpoint) {
          const accaeropostOrders = await getAeropostOrders(
            options.aeropost_endpoint
          );
          // Add Order status info to each order
          const ordersWithStatus = accaeropostOrders.map((order: any) => ({
            ...order,
            date_created: new Date(),
            date_delivered: null,
            status: "pending",
          }));

          // Sort orders by city alphabetically
          const sortedOrders = ordersWithStatus.sort((a: any, b: any) => {
            if (a.city < b.city) return -1;
            if (a.city > b.city) return 1;
            return 0;
          });

          setAeropostDeliveries(sortedOrders);
        } else {
          setAdminNotice(
            "Please enter a delivery endpoint under options menu."
          );
        }
        // }
      } catch (error) {
        console.error("Error fetching or processing deliveries:", error);
      }
    };

    aeropostOrdersGet();
  }, [options, storedLoaded, storedDeliveries]);

  const syncAddressLonLat = async () => {
    // Determine which deliveries to update
    let deliveriesToUpdate;
    if (selectedCity.length > 0) {
      deliveriesToUpdate = aeropostDeliveries.filter((delivery) =>
        selectedCity.includes(delivery.city)
      );
    } else {
      deliveriesToUpdate = aeropostDeliveries;
    }

    // Limit to first 15 if you want, or remove .slice(0, 15) to do all
    const firstN = deliveriesToUpdate.slice(
      0,
      Number(options?.address_sync_limit)
    );

    const updatedDeliveries = await Promise.all(
      firstN.map(async (delivery) => {
        const coords = await getLatLngFromAddress(
          `${delivery.address}, ${delivery.city}, Trinidad and Tobago`
        );
        return {
          ...delivery,
          coordinates: coords,
        };
      })
    );

    // Merge updated deliveries back into the full list
    const updatedAeropostDeliveries = aeropostDeliveries.map((delivery) => {
      const updated = updatedDeliveries.find((u) => u.id === delivery.id);
      return updated ? updated : delivery;
    });

    setAeropostDeliveries(updatedAeropostDeliveries);
    setShowSaveBtn(true);
  };

  useEffect(() => {
    if (activeScreen === "aeropost") {
      setSegmentMarkerPositions([]);
    }
  }, [activeScreen]);

  // Handler for when marker is dragged
  const handleDragEnd = async (e: any) => {
    const marker = e.target;
    const newPos = marker.getLatLng();
    setMarkerPosition(newPos);
    const newAddress = await reverseGeocode(newPos.lat, newPos.lng);
    setDragAddress(newAddress);
  };

  const resetAddressMarket = () => {
    setMarkerItemId("");
    setMarkerPosition(null);
  };

  const saveMarkerAddress = () => {
    setAeropostDeliveries((prev) =>
      prev.map((item) =>
        item.id === markerItemId
          ? {
              ...item,
              address: dragAddress,
              coordinates: {
                coordinates: {
                  lat: markerPosition?.lat?.toFixed(4),
                  lng: markerPosition?.lng?.toFixed(4),
                },
                isValid: true,
                type: "house",
                wasUpdated: true,
                editable: true,
              },
            }
          : item
      )
    );
    resetAddressMarket();
    setShowSaveBtn(true);
  };

  const saveMarkerRoadAddress = () => {
    setAeropostDeliveries((prev) =>
      prev.map((item) =>
        item.id === markerItemId
          ? {
              ...item,
              address: dragAddress,
              coordinates: {
                coordinates: {
                  lat: markerPosition?.lat?.toFixed(4),
                  lng: markerPosition?.lng?.toFixed(4),
                },
                isValid: true,
                type: "road",
                wasUpdated: true,
                editable: true,
              },
            }
          : item
      )
    );
    resetAddressMarket();
  };

  const addRemoveCity = (city: string) => {
    setSelectedCity((prevSelected) => {
      if (prevSelected.includes(city)) {
        // Remove city if it exists
        return prevSelected.filter((c) => c !== city);
      } else {
        // Add city if it doesn't exist
        return [...prevSelected, city];
      }
    });
  };

  const savedata = async () => {
    if (!aeropostDeliveries.length) return;

    // Group deliveries by city (case-insensitive)
    const deliveriesByCity = aeropostDeliveries.reduce<Record<string, any[]>>(
      (acc, delivery) => {
        const city = delivery.city.toLowerCase();
        if (!acc[city]) acc[city] = [];
        acc[city].push(delivery);
        return acc;
      },
      {} as Record<string, typeof aeropostDeliveries>
    );

    // Normalize selectedCity for case-insensitive comparison
    const selectedCitySet = new Set(selectedCity.map((c) => c.toLowerCase()));
    const allDeliveryObjs = [];

    for (const [city, deliveries] of Object.entries(deliveriesByCity)) {
      // Check if this city is in selectedCity
      if (selectedCitySet.has(city)) {
        // Store only the deliveries for the selected city
        const deliveryObj = {
          id: `${deliveries[0].reference_number}-${city}`,
          endpoint: options?.aeropost_endpoint,
          area: city,
          driver: null,
          deliveries,
        };
        allDeliveryObjs.push(deliveryObj);
      } else {
        // Check if any city in this group is in selectedCity
        const filteredDeliveries = deliveries.filter((d) =>
          selectedCitySet.has(d.city.toLowerCase())
        );
        if (filteredDeliveries.length > 0) {
          // Store only the deliveries for the selected cities in this group
          const deliveryObj = {
            id: `${filteredDeliveries[0].reference_number}-${city}`,
            endpoint: options?.aeropost_endpoint,
            area: city,
            driver: null,

            deliveries: filteredDeliveries,
          };
          allDeliveryObjs.push(deliveryObj);
        } else {
          // No city in selectedCity, store all records in the group
          const deliveryObj = {
            id: `${deliveries[0].reference_number}-${city}`,
            endpoint: options?.aeropost_endpoint,
            delivery_date: null,
            area: city,
            driver: null,
            deliveries,
          };
          allDeliveryObjs.push(deliveryObj);
        }
      }
      await prefsStoreDeliveries(allDeliveryObjs);
      setShowSaveBtn(false);
    }
  };

  return (
    <>
      <div>
        <MapContainer
          center={
            segmentMarkerPositions && segmentMarkerPositions.length > 0
              ? segmentMarkerPositions[0].coordinates
              : position
          }
          zoom={12}
          scrollWheelZoom={false}
          style={{ width: "auto", height: "50vh" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <>
            {activeScreen === "aeropost" &&
              aeropostDeliveries
                .filter((mapdeliveries) => mapdeliveries?.coordinates?.isValid)
                .map(
                  (mapdeliveries) =>
                    mapdeliveries?.coordinates?.coordinates?.lat &&
                    mapdeliveries?.coordinates?.coordinates?.lng && (
                      <Marker
                        key={mapdeliveries.id}
                        position={mapdeliveries?.coordinates?.coordinates}
                        icon={randomIcon} // or use a stable icon per delivery
                      >
                        <Popup>
                          {`${mapdeliveries.first_name} ${mapdeliveries.last_name}`}{" "}
                          <br />
                          {`${mapdeliveries.address} ${mapdeliveries.city}`}.
                        </Popup>
                      </Marker>
                    )
                )}
            {/* Show segment markers */}
            {segmentMarkerPositions.map((segmentMarker) => (
              <Marker
                key={segmentMarker.id}
                position={segmentMarker.coordinates}
                icon={getIcon()} // your icon here
              />
            ))}
            {/* Only one marker, draggable */}
            {markerPosition && (
              <Marker
                position={markerPosition}
                icon={carMarker}
                draggable={true}
                eventHandlers={{
                  dragend: handleDragEnd,
                }}
              >
                <Popup>
                  {dragAddress}
                  <br />
                  Address at {markerPosition.lat.toFixed(4)},{" "}
                  {markerPosition.lng.toFixed(4)}
                  <br />
                  <IonButton
                    color={"secondary"}
                    onClick={() => saveMarkerAddress()}
                  >
                    Save Address
                  </IonButton>
                  <IonButton
                    color={"secondary"}
                    onClick={() => saveMarkerRoadAddress()}
                  >
                    Save Road
                  </IonButton>
                </Popup>
              </Marker>
            )}
          </>
          {/* Add clickable dragable marker */}
          {markerItemId && (
            <ClickAndDragMarker
              markerPosition={markerPosition}
              setMarkerPosition={setMarkerPosition}
              setAddress={setDragAddress}
            />
          )}
        </MapContainer>
      </div>
      <div className="deliveries-admin-page">
        <IonSegment
          value={segment}
          onIonChange={(e) => setSegment(String(e.detail.value))}
        >
          <IonSegmentButton
            onClick={() => setActiveScreen("aeropost")}
            value="aeropost"
            contentId="aeropost"
          >
            <IonLabel>Aeropost</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton
            onClick={() => setActiveScreen("staging")}
            value="stored"
            contentId="stored"
          >
            <IonLabel>Staging</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton
            onClick={() => setActiveScreen("active")}
            value="active"
            contentId="active"
          >
            <IonLabel>Active</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton
            onClick={() => setActiveScreen("delivered")}
            value="delivered"
            contentId="delivered"
          >
            <IonLabel>Delivered</IonLabel>
          </IonSegmentButton>
        </IonSegment>
        <IonSegmentView>
          <IonSegmentContent id="aeropost" hidden={segment !== "aeropost"}>
            <IonGrid>
              <IonItem>
                <h2>Deliveries</h2>
                <IonButton
                  onClick={() => syncAddressLonLat()}
                  expand="block"
                  shape="round"
                  slot="end"
                >
                  Sync Addresses
                </IonButton>
                {showSaveBtn && (
                  <IonButton
                    onClick={() => savedata()}
                    expand="block"
                    fill="outline"
                    shape="round"
                    slot="end"
                  >
                    Save
                  </IonButton>
                )}
              </IonItem>
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

              {aeropostDeliveries.map((aeroDeliveries, idx) => {
                // Determine if this is the first delivery of a new city
                const isFirstOfCity =
                  idx === 0 ||
                  aeroDeliveries.city !== aeropostDeliveries[idx - 1].city;

                return (
                  <React.Fragment key={aeroDeliveries.id}>
                    {isFirstOfCity && (
                      <IonRow className="city-header-row">
                        <IonCol size="12">
                          <IonItem>
                            <h4
                              style={{
                                margin: "16px 0 8px 0",
                                fontWeight: "bold",
                              }}
                            >
                              {aeroDeliveries.city}
                            </h4>
                            <IonButton
                              onClick={() => {
                                addRemoveCity(aeroDeliveries.city);
                              }}
                              className="ion-activatable ripple-parent rectangle"
                              fill="clear"
                              slot="end"
                            >
                              <IonIcon
                                icon={
                                  selectedCity.includes(aeroDeliveries.city)
                                    ? addCircle
                                    : addCircleOutline
                                }
                              ></IonIcon>
                            </IonButton>
                          </IonItem>
                        </IonCol>
                      </IonRow>
                    )}
                    <IonRow className="delivery-row">
                      <IonCol size="2">
                        <IonItem lines="none">
                          <p>{aeroDeliveries.tracking_code}</p>
                        </IonItem>
                      </IonCol>
                      <IonCol size="2">
                        <IonItem lines="none">
                          <p>{`${aeroDeliveries.first_name} ${aeroDeliveries.last_name}`}</p>
                        </IonItem>
                      </IonCol>
                      <IonCol style={{ fontWeight: "bold" }} size="5">
                        <IonItem
                          style={{ position: "relative", width: "100%" }}
                          lines="none"
                        >
                          {(aeroDeliveries?.coordinates &&
                            !aeroDeliveries?.coordinates?.isValid) ||
                          editingDeliveryId === aeroDeliveries.id ? (
                            // <IonInput
                            //   label={aeroDeliveries.address}
                            //   labelPlacement="floating"
                            //   fill="outline"
                            //   placeholder="Enter Address"
                            //   onIonChange={(e) =>
                            //     handleAddressChange(
                            //       aeroDeliveries.id,
                            //       e.detail.value ?? ""
                            //     )
                            //   }
                            //   onIonBlur={() => handleAddressBlur(aeroDeliveries)}
                            // ></IonInput>
                            <>
                              <AddressAutocompleteInput
                                delivery={aeroDeliveries}
                                onAddressSelected={(address, coordinates) => {
                                  setAeropostDeliveries((prev) =>
                                    prev.map((item) =>
                                      item.id === aeroDeliveries.id
                                        ? {
                                            ...item,
                                            address,
                                            coordinates: {
                                              coordinates: {
                                                lat: coordinates.lat,
                                                lng: coordinates.lng,
                                              },
                                              isValid: true,
                                              wasUpdated: true,
                                              editable: true,
                                            },
                                          }
                                        : item
                                    )
                                  );
                                }}
                              />
                              {(!markerItemId ||
                                markerItemId === aeroDeliveries.id) && (
                                <IonButton
                                  className="ion-margin-start"
                                  color={!markerItemId ? "secondary" : "danger"}
                                  onClick={() =>
                                    !markerItemId
                                      ? setMarkerItemId(aeroDeliveries.id)
                                      : resetAddressMarket()
                                  }
                                >
                                  <IonIcon icon={locate}></IonIcon>
                                </IonButton>
                              )}
                            </>
                          ) : (
                            <>
                              <p>{`${aeroDeliveries.address} ${aeroDeliveries.city}`}</p>
                              {(aeroDeliveries?.coordinates?.editable ||
                                aeroDeliveries?.wasUpdated) && (
                                <IonButton
                                  onClick={() =>
                                    setEditingDeliveryId(aeroDeliveries.id)
                                  }
                                  slot="end"
                                  fill="outline"
                                >
                                  <IonIcon icon={navigate}></IonIcon>
                                </IonButton>
                              )}
                            </>
                          )}
                        </IonItem>
                      </IonCol>
                      <IonCol size="2">
                        <IonItem lines="none">
                          <p>{aeroDeliveries.phone}</p>
                        </IonItem>
                      </IonCol>
                      <IonCol size="1">
                        <IonItem lines="none">
                          {deliveryCoodinatesStatus(aeroDeliveries)}
                        </IonItem>
                      </IonCol>
                    </IonRow>
                  </React.Fragment>
                );
              })}
            </IonGrid>
          </IonSegmentContent>
          <IonSegmentContent id="stored" hidden={segment !== "stored"}>
            <StoredDeliveries
              markerPositions={segmentMarkerPositions}
              setMarkerPositions={setSegmentMarkerPositions}
              screen={activeScreen}
            />
          </IonSegmentContent>
          <IonSegmentContent id="active" hidden={segment !== "active"}>
            {/* Your Active content */}
            <ActiveDeliveries
              markerPositions={segmentMarkerPositions}
              setMarkerPositions={setSegmentMarkerPositions}
              screen={activeScreen}
            />
          </IonSegmentContent>
          <IonSegmentContent id="delivered" hidden={segment !== "delivered"}>
            {/* Your delivered content */}
            <DeliveredDeliveries
              markerPositions={segmentMarkerPositions}
              setMarkerPositions={setSegmentMarkerPositions}
              screen={activeScreen}
            />
          </IonSegmentContent>
        </IonSegmentView>
        {adminNotice && <p>{adminNotice}</p>}
      </div>
    </>
  );
};

export default Deliveries;

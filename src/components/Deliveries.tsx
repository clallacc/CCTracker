import { useEffect, useState } from "react";
import {
  IonButton,
  IonCol,
  IonGrid,
  IonIcon,
  IonItem,
  IonRow,
} from "@ionic/react";
import { getAeropostOrders } from "../services/httprequests";
import {
  deliveryCoodinatesStatus,
  getLatLngFromAddress,
} from "../services/util";
import React from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import AddressAutocompleteInput from "./AddressAutocompleteInput";
import { navigate } from "ionicons/icons";
import L from "leaflet";
import car01 from "../assets/pin01.png";
import car02 from "../assets/pin02.png";
import car03 from "../assets/pin03.png";
import car04 from "../assets/pin04.png";

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
  new L.Icon({
    iconUrl: car04,
    iconSize: [30, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  }),
];

// Function to get a random icon from the array
const getRandomCarIcon = () => {
  const index = Math.floor(Math.random() * carIcons.length);
  return carIcons[index];
};

const Deliveries: React.FC = () => {
  const [aeropostDeliveries, setAeropostDeliveries] = useState<any[]>([]);
  const [editingAddresses, setEditingAddresses] = useState<{
    [id: string]: string;
  }>({});
  const position = { lat: 10.6419388, lng: -61.2808954 };
  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(
    null
  );
  const randomIcon = getRandomCarIcon();

  useEffect(() => {
    const aeropostOrdersGet = async () => {
      try {
        // const aeropostOrders = await getAeropostOrders("2025-06-26");
        const accaeropostOrders = await getAeropostOrders("2025-06-26");

        // PHSH ADDRESS
        const newDelivery = [
          {
            id: "9f25fc66-3f7e-4263-a617-a47c66b9ceb0",
            reference_number: "369-95084931",
            tracking_code: "HZ001TT5538633444412",
            phone: "+18683821406",
            first_name: "Akil",
            last_name: "Nicholas",
            city: "Arima",
            address: "2206, Winnifred Atwell Drive, Phase 2, LaHorquetta",
            address_extra: null,
            country_code: "TT",
            delivery_route: "61",
            delivery_zen: "279",
            postal_code: null,
            delivery_instructions: null,
            manifest_number: "369-95084931",
          },
          {
            id: "9f127869-c36f-42da-bfd1-a654d42924uis",
            reference_number: "369-95082094",
            tracking_code: "HZ001TT5536342891802",
            phone: "+18684911071",
            first_name: "Clare",
            last_name: "Inniss-Browne",
            city: "Arima",
            address: "Phase II, Buena Vista Gardens #40",
            address_extra: null,
            country_code: "TT",
            delivery_route: "61",
            delivery_zen: "279",
            postal_code: null,
            delivery_instructions: null,
            manifest_number: "369-95082094",
          },
        ];
        const aeropostOrders = [...accaeropostOrders, ...newDelivery];

        // PHSH ADDRESS

        // Sort orders by city alphabetically
        const sortedOrders = aeropostOrders.sort((a: any, b: any) => {
          if (a.city < b.city) return -1;
          if (a.city > b.city) return 1;
          return 0;
        });

        setAeropostDeliveries(sortedOrders);
      } catch (error) {
        console.error("Error fetching or processing deliveries:", error);
      }
    };

    aeropostOrdersGet();
  }, []);

  const syncAddressLonLat = async () => {
    const firstFive = aeropostDeliveries.slice(0, 5); // Slice records to only do first 25
    const updatedDeliveries = await Promise.all(
      firstFive.map(async (delivery) => {
        const coords = await getLatLngFromAddress(
          `${delivery.address}, ${delivery.city}, Trinidad and Tobago`
        );

        return {
          ...delivery,
          coordinates: coords,
        };
      })
    );

    setAeropostDeliveries([
      ...updatedDeliveries,
      ...aeropostDeliveries.slice(5), // Slice records to only do first 25
    ]);
    console.log("Updated deliveries with coordinates", updatedDeliveries);
  };

  const handleAddressChange = (id: string, value: string) => {
    setEditingAddresses((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleAddressBlur = async (delivery: any) => {
    const newAddress = editingAddresses[delivery.id];
    if (!newAddress || newAddress === delivery.address) return;

    // Geocode the new address
    const coords = await getLatLngFromAddress(
      `${newAddress}, ${delivery.city}, Trinidad and Tobago`
    );

    // Update the delivery in state
    setAeropostDeliveries((prev) =>
      prev.map((item) =>
        item.id === delivery.id
          ? {
              ...item,
              address: newAddress,
              coordinates: coords,
            }
          : item
      )
    );
  };

  const checkPositionIsNumber = (coordinates: any) => {
    return { lat: Number(coordinates.lat), lng: Number(coordinates.lng) };
  };

  const savedata = () => {
    console.log("delivery addresses", aeropostDeliveries);
  };

  return (
    <>
      <div>
        <MapContainer
          center={position}
          zoom={12}
          scrollWheelZoom={false}
          style={{ width: "auto", height: "50vh" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <>
            {aeropostDeliveries
              .filter((mapdeliveries) => mapdeliveries?.coordinates?.isValid)
              .map(
                (mapdeliveries) =>
                  mapdeliveries?.coordinates?.coordinates?.lat &&
                  mapdeliveries?.coordinates?.coordinates?.lng && (
                    <Marker
                      key={mapdeliveries.id}
                      position={checkPositionIsNumber(
                        mapdeliveries?.coordinates?.coordinates
                      )}
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
          </>
        </MapContainer>
      </div>
      <div className="deliveries-admin-page">
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
            <IonButton
              onClick={() => savedata()}
              expand="block"
              fill="outline"
              shape="round"
              slot="end"
            >
              Save
            </IonButton>
          </IonItem>
          <IonRow>
            <IonCol size="2">
              <IonItem>
                <h3>Order/Tracking No</h3>
              </IonItem>
            </IonCol>
            <IonCol size="2">
              <IonItem>
                <h3>Customer</h3>
              </IonItem>
            </IonCol>
            <IonCol size="5">
              <IonItem>
                <h3>Address</h3>
              </IonItem>
            </IonCol>
            <IonCol size="2">
              <IonItem>
                <h3>Phone</h3>
              </IonItem>
            </IonCol>
            <IonCol size="1">
              <IonItem>
                <h3>Status</h3>
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
                          style={{ margin: "16px 0 8px 0", fontWeight: "bold" }}
                        >
                          {aeroDeliveries.city}
                        </h4>
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
                                        ...coordinates,
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
      </div>
    </>
  );
};

export default Deliveries;

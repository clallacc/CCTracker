import { useEffect, useState } from "react";
import {
  IonButton,
  IonCol,
  IonGrid,
  IonIcon,
  IonInput,
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

const Deliveries: React.FC = () => {
  const [aeropostDeliveries, setAeropostDeliveries] = useState<any[]>([]);
  const [editingAddresses, setEditingAddresses] = useState<{
    [id: string]: string;
  }>({});
  const position = { lat: 10.6419388, lng: -61.2808954 };

  useEffect(() => {
    const aeropostOrdersGet = async () => {
      try {
        const aeropostOrders = await getAeropostOrders("2025-06-26");

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
    const firstFive = aeropostDeliveries.slice(0, 25); // Slice records to only do first 25
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
      ...aeropostDeliveries.slice(25), // Slice records to only do first 25
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

  return (
    <>
      <div>
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={false}
          style={{ width: "auto", height: "30vh" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              A pretty CSS3 popup. <br /> Easily customizable.
            </Popup>
          </Marker>
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
                    <IonItem lines="none">
                      {aeroDeliveries?.coordinates &&
                      !aeroDeliveries?.coordinates?.isValid ? (
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
                                      },
                                    }
                                  : item
                              )
                            );
                          }}
                        />
                      ) : (
                        <p>{`${aeroDeliveries.address} ${aeroDeliveries.city}`}</p>
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

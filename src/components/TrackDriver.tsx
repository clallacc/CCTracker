import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

import car01 from "../assets/mappin01.png";
import { getDriversFormFirebase } from "../services/util";
import { IonButton, IonIcon } from "@ionic/react";
import { chevronForward } from "ionicons/icons";

const carIcon = new L.Icon({
  iconUrl: car01,
  iconSize: [40, 40], // adjust size as needed
  iconAnchor: [16, 32], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -32], // point from which the popup should open relative to the iconAnchor
});

const TrackDriver: React.FC = () => {
  const [position, setPosition] = useState<any>({
    lat: 10.6419388,
    lng: -61.2808954,
  });
  const [adminDriverData, setAdminDriverData] = useState<any>([]);
  const [driver, setDriver] = useState<string>("");

  useEffect(() => {
    const loadDrivers = async () => {
      const drivers = await getDriversFormFirebase();
      setAdminDriverData(drivers);
    };
    loadDrivers();
  }, []);

  const ShowDriverLocation = (id: string) => {
    const selectedDriver = adminDriverData.filter(
      (driver: any) => driver.id === id
    );
    setPosition({ lat: selectedDriver[0].lat, lng: selectedDriver[0].lng });
    setDriver(selectedDriver[0].name);
  };

  return (
    <div>
      <MapContainer
        center={position}
        zoom={12}
        scrollWheelZoom={false}
        style={{ width: "auto", height: "92vh" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <>
          {/* Only one marker, draggable */}
          {driver && (
            <Marker position={position} icon={carIcon}>
              <Popup>{driver}</Popup>
            </Marker>
          )}
        </>
      </MapContainer>
      <div className="driver-selection-row">
        {adminDriverData.map((driver: any) => (
          <IonButton
            onClick={() => ShowDriverLocation(driver.id)}
            key={driver.id}
            className="ion-margin"
          >
            {driver.name} <IonIcon icon={chevronForward}></IonIcon>
          </IonButton>
        ))}
      </div>
    </div>
  );
};

export default TrackDriver;

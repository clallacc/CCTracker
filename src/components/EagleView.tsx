import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

import car01 from "../assets/mappin03.png";
import { getDriversFormFirebase } from "../services/util";

const carIcon = new L.Icon({
  iconUrl: car01,
  iconSize: [40, 40], // adjust size as needed
  iconAnchor: [16, 32], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -32], // point from which the popup should open relative to the iconAnchor
});

const EagleView: React.FC = () => {
  const position = { lat: 10.6419388, lng: -61.2808954 };
  const [adminDriverData, setAdminDriverData] = useState<any>([]);
  const [Address, setAddress] = useState("My home town, Arima");
  useEffect(() => {
    const loadDrivers = async () => {
      const drivers = await getDriversFormFirebase();
      setAdminDriverData(drivers);
      console.log("drivers", drivers);
    };
    loadDrivers();
  }, []);
  return (
    <>
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
            {adminDriverData.map((driver: any, idx: number) => (
              <Marker
                key={driver.id || idx}
                position={{ lat: driver.lat, lng: driver.lng }}
                icon={carIcon}
              >
                <Popup>
                  {driver.address || Address}
                  <br />
                  {driver.name && <span>{driver.name}</span>}
                </Popup>
              </Marker>
            ))}
          </>
        </MapContainer>
      </div>
    </>
  );
};

export default EagleView;

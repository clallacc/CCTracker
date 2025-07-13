import { useState } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import Directions from "./Directions";
import mappin from "../assets/mappin.png";

const CCMap: React.FC = () => {
  const position = { lat: 10.6419388, lng: -61.2808954 };
  const [driverSection, setDriverSection] = useState<number>(0);
  const [routeStart, setRouteStart] = useState(false);
  const [deliveryEndRoute, setDeliveryEndRoute] = useState("");
  const [leg, setLeg] = useState<any>([]);

  return (
    <div id="map-container">
      <APIProvider apiKey={`${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}>
        <Map
          mapId={`${import.meta.env.VITE_GOOGLE_MAPS_ID}`}
          style={{ width: "100vw", height: "100vh" }}
          defaultCenter={position}
          defaultZoom={18}
          defaultHeading={25}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
        >
          <Marker position={position} icon={mappin} />
          {!routeStart && deliveryEndRoute && (
            <Directions
              driverSection={driverSection}
              setDriverSection={setDriverSection}
              startRoute={position}
              endRoute={deliveryEndRoute}
              routeLeg={leg}
              setRouteLeg={setLeg}
            />
          )}
        </Map>
      </APIProvider>
    </div>
  );
};

export default CCMap;

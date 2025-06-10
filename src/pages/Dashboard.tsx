import { useEffect, useRef, useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenuButton,
  IonPage,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useParams } from "react-router";
import AdminContainer from "../components/AdminContainer";
import "./Dashboard.css";
import { Device } from "@capacitor/device";
import DriverContainer from "../components/DriverContainer";
import { Geolocation } from "@capacitor/geolocation";
import mappin from "../assets/mappin.png";
import {
  defaultDriverMap,
  getDeliveryRoute,
  startLocationTracking,
} from "../services/util";
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

const Page: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const [deviceIsMobile, setDeviceIsMobile] = useState(false);
  const position = { lat: 46.12775556535771, lng: -64.86594844491384 };
  const position02 = { lat: 46.12775556535771, lng: -64.86594844491384 };

  const openAppStore = async () => {
    const deviceInfo = await Device.getInfo();
    if (deviceInfo.platform === "ios" || deviceInfo.platform === "android") {
      setDeviceIsMobile(true);
    } else {
      setDeviceIsMobile(false);
    }
    console.log("Device Info:", deviceInfo);
    const coordinates = await Geolocation.getCurrentPosition();
    console.log("Current position:", coordinates);
    position.lat = coordinates.coords.latitude;
    position.lng = coordinates.coords.longitude;
  };

  useEffect(() => {
    openAppStore();
  }, []);

  // Load map

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>{name}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-margin-top ion-padding-top" fullscreen>
        <DriverContainer name={name} />
        {/* {deviceIsMobile ? (
          <DriverContainer name={name} />
        ) : (
          <AdminContainer name={name} />
        )} */}
        <div id="map-container">
          {/* <strong>Driver</strong> */}
          <APIProvider apiKey={`${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}>
            <Map
              center={position}
              zoom={12}
              mapId={`${import.meta.env.VITE_GOOGLE_MAPS_ID}`}
              fullscreenControl={false}
              zoomControl={true}
              mapTypeControl={false}
              scaleControl={true}
              streetViewControl={false}
              rotateControl={false}
            >
              <Marker position={position} icon={mappin} />
              <Marker position={position02} icon={mappin} />
              <Directions />
            </Map>
          </APIProvider>
        </div>
      </IonContent>
      <IonFooter>
        <IonToolbar>
          <IonButtons slot="end">
            <IonButton
              size="large"
              shape="round"
              expand="block"
              color="primary"
            >
              Start
            </IonButton>
          </IonButtons>
          <IonTabBar>
            <IonTabButton tab="tab1">Tab 1</IonTabButton>
            <IonTabButton tab="tab2">Tab 2</IonTabButton>
            {/* You can add tab buttons here if needed */}
          </IonTabBar>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

function Directions() {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);
  const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
  const [routeIndex, setRouteIndex] = useState<number>(0);
  const selected = routes[routeIndex];
  const leg = selected?.legs[0];

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    directionsService
      .route({
        origin: "2251 Mountain Rd, Moncton, NB E1G 6G8",
        destination: "25 Plaza Blvd, Moncton, NB E1C 0E8",
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      })
      .then((response) => {
        directionsRenderer.setDirections(response);
        setRoutes(response.routes);
      });
  }, [directionsService, directionsRenderer]);

  useEffect(() => {
    if (!directionsRenderer) return;
    directionsRenderer.setRouteIndex(routeIndex);
  }, [routeIndex]);

  if (!leg) return null;
  return (
    <div className="directions">
      <div className="directions-header">
        <h2>{selected.summary}</h2>
        <p>
          {leg.start_address.split(",")[0]} to {leg.end_address.split(",")[0]}
        </p>
        <p>
          {leg.distance?.text} - {leg.duration?.text}
        </p>
      </div>

      <IonList className="ion-padding-top">
        {routes.map((route, index) => (
          <IonItem key={index} onClick={() => setRouteIndex(index)}>
            <IonLabel>
              <h2>{route.summary}</h2>
              <p>to {route.legs[0].end_address.split(",")[0]}</p>
            </IonLabel>
          </IonItem>
        ))}
      </IonList>
    </div>
  );
}

export default Page;

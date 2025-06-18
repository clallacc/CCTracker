import { useEffect, useRef, useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
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
  getDriversFormFirebase,
  isLoggedIn,
  refreshView,
  startLocationTracking,
  userSettings,
} from "../services/util";
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import Directions from "../components/Directions";
import { useAppContext } from "../services/appContext";
import { auth } from "../services/firebase";
import Intro from "../components/Intro";
import { refresh } from "ionicons/icons";

const Page: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const [deviceIsMobile, setDeviceIsMobile] = useState(false);
  // const position = { lat: 46.12775556535771, lng: -64.86594844491384 };
  const position = { lat: 10.6419388, lng: -61.2808954 };
  const position02 = { lat: 46.12775556535771, lng: -64.86594844491384 };
  const [driverSection, setDriverSection] = useState<number>(0);
  const { appState, setAppState } = useAppContext();
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [deliveryEndRoute, setDeliveryEndRoute] = useState("");
  const [leg, setLeg] = useState<any>([]);

  console.log("loginStatus", auth?.currentUser?.email);
  // const initializeUser = async () => {
  //   try {
  //     const settings = await userSettings();

  //     if (settings?.isLoggedIn) {
  //       appState.isLoggedIn = true;
  //     } else {
  //       appState.isLoggedIn = false;
  //     }
  //     setAppState(appState);
  //     console.log("User Login Status:", settings.isLoggedIn);
  //   } catch (error) {
  //     console.error("User initialization error:", error);
  //   }
  // };
  // initializeUser();

  const openAppStore = async () => {
    console.log("from dashboard");
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

  const closeIntro = () => {
    setShowIntro(false);
    console.log("intro closed");
  };

  useEffect(() => {
    openAppStore();
  }, []);

  useEffect(() => {
    const loadDrivers = async () => {
      const drivers = await getDriversFormFirebase();
      console.log("drivers", drivers);
    };
    loadDrivers();
  }, []);

  const handlePointerDown = (event: any) => {
    // Handle pointer down event
  };

  const handlePointerMove = (event: any) => {
    // Handle pointer move event
  };

  const handlePointerUp = (event: any) => {
    // Handle pointer up event
  };

  // Load map

  const openCapacitorSite = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
        leg?.start_address
      )}&destination=${encodeURIComponent(leg.end_address)}&travelmode=driving`,
      "_system"
    );
  };

  return (
    <>
      <IonPage>
        {showIntro ? (
          <Intro setShowIntro={closeIntro} />
        ) : (
          <>
            <IonHeader>
              <IonToolbar>
                <IonButtons slot="start">
                  <IonMenuButton />
                </IonButtons>
                <IonTitle>{name}</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={refreshView}>
                    <IonIcon icon={refresh}></IonIcon>
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>

            <IonContent className="ion-margin-top ion-padding-top" fullscreen>
              <DriverContainer
                name={name}
                position={position}
                driverSection={driverSection}
                setDriverSection={setDriverSection}
                endRoute={deliveryEndRoute}
                setEndRoute={setDeliveryEndRoute}
              />
              {/* {deviceIsMobile ? (
          <DriverContainer name={name} />
        ) : (
          <AdminContainer name={name} />
        )} */}
              <div
                id="map-container"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <APIProvider
                  apiKey={`${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                >
                  <Map
                    center={position}
                    zoom={18}
                    heading={25}
                    tilt={60}
                    mapId={`${import.meta.env.VITE_GOOGLE_MAPS_ID}`}
                    fullscreenControl={false}
                    zoomControl={true}
                    mapTypeControl={false}
                    scaleControl={true}
                    streetViewControl={false}
                    rotateControl={false}
                  >
                    <Marker position={position} icon={mappin} />
                    {/* <Marker position={position02} icon={mappin} /> */}
                    {deliveryEndRoute && (
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
            </IonContent>
            <IonFooter>
              <IonToolbar className="ion-padding-start">
                <IonButtons slot="end">
                  <IonButton
                    size="large"
                    shape="round"
                    expand="block"
                    color="primary"
                    onClick={openCapacitorSite}
                  >
                    Start
                  </IonButton>
                </IonButtons>
                {/* <IonTabBar>
            <IonTabButton tab="tab1">Tab 1</IonTabButton>
            <IonTabButton tab="tab2">Tab 2</IonTabButton>
          </IonTabBar> */}
                <IonLabel>
                  <h4>
                    {leg.end_address
                      ? leg.end_address
                      : "No destination route selected."}
                  </h4>
                </IonLabel>
              </IonToolbar>
            </IonFooter>
          </>
        )}
      </IonPage>
    </>
  );
};

// function Directions() {
//   const map = useMap();
//   const routesLibrary = useMapsLibrary("routes");
//   const [directionsService, setDirectionsService] =
//     useState<google.maps.DirectionsService | null>(null);
//   const [directionsRenderer, setDirectionsRenderer] =
//     useState<google.maps.DirectionsRenderer | null>(null);
//   const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
//   const [routeIndex, setRouteIndex] = useState<number>(0);
//   const [travelMode, setTravelMode] = useState<google.maps.TravelMode>(
//     google.maps.TravelMode.DRIVING
//   );
//   const selected = routes[routeIndex];
//   const leg = selected?.legs[0];
//   const [response, setResponse] = useState(null);

//   useEffect(() => {
//     if (!routesLibrary || !map) return;
//     setDirectionsService(new routesLibrary.DirectionsService());
//     setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
//   }, [routesLibrary, map]);

//   useEffect(() => {
//     if (!directionsService || !directionsRenderer) return;

//     directionsService
//       .route({
//         origin: "2251 Mountain Rd, Moncton, NB E1G 6G8",
//         destination: "25 Plaza Blvd, Moncton, NB E1C 0E8",
//         travelMode: travelMode || google.maps.TravelMode.DRIVING,
//         provideRouteAlternatives: true,
//       })
//       .then((response) => {
//         directionsRenderer.setDirections(response);
//         setRoutes(response.routes);
//       });
//   }, [directionsService, directionsRenderer, travelMode]);

//   useEffect(() => {
//     if (!directionsRenderer) return;
//     directionsRenderer.setRouteIndex(routeIndex);
//   }, [routeIndex]);

//   /// detections by speach
//   const directionsCallback = (result: any, status: any) => {
//     if (result !== null) {
//       // Process directions
//       setResponse(result);

//       // Optional: Trigger speech navigation
//       speakDirections(result);
//     }
//   };

//   const speakDirections = (directionsResult: any) => {
//     const steps = directionsResult.routes[0].legs[0].steps;
//     steps.forEach((step: any) => {
//       // Use Web Speech API or a text-to-speech library
//       const utterance = new SpeechSynthesisUtterance(step.instructions);
//       window.speechSynthesis.speak(utterance);
//     });
//   };
//   /// detections by speach

//   if (!leg) return null;
//   return (
//     <div className="directions">
//       <div className="directions-header">
//         <h2>{selected.summary}</h2>
//         <p>
//           {leg.start_address.split(",")[0]} to {leg.end_address.split(",")[0]}
//         </p>
//         <p>
//           {leg.distance?.text} - {leg.duration?.text}
//         </p>
//       </div>

//       <IonList className="ion-padding-top">
//         {routes.map((route, index) => (
//           <IonItem key={index} onClick={() => setRouteIndex(index)}>
//             <IonLabel>
//               <h2>{route.summary}</h2>
//               <p>to {route.legs[0].end_address.split(",")[0]}</p>
//             </IonLabel>
//           </IonItem>
//         ))}
//       </IonList>
//       <div>
//         <button onClick={() => setTravelMode(google.maps.TravelMode.DRIVING)}>
//           Switch to Driving Mode
//         </button>
//       </div>
//     </div>
//   );
// }

export default Page;

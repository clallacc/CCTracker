import { useEffect, useRef, useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonLabel,
  IonLoading,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonAlert,
} from "@ionic/react";
import { useParams } from "react-router";
import AdminContainer from "../components/AdminContainer";
import "./Dashboard.css";
import DriverContainer from "../components/DriverContainer";
import { Geolocation } from "@capacitor/geolocation";
import mappin from "../assets/mappin.png";
import {
  calculateDistance,
  checkEnvironment,
  createDeliveryInFirebase,
  getDriversFormFirebase,
  refreshView,
  updateDeliveryInFirebase,
} from "../services/util";
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  useMapsLibrary,
  useApiIsLoaded,
  MapControl,
  ControlPosition,
} from "@vis.gl/react-google-maps";
import Directions from "../components/Directions";
import { useAppContext } from "../services/appContext";
import { auth } from "../services/firebase";
import Intro from "../components/Intro";
import { home, pin, refresh } from "ionicons/icons";

const Page: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const [deviceIsMobile, setDeviceIsMobile] = useState(false);
  // const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
  //   null
  // );
  const homePosition = { lat: 10.6577349, lng: -61.5131554 };
  const position = { lat: 10.6419388, lng: -61.2808954 };
  const [driverSection, setDriverSection] = useState<number>(0);
  const { appState, setAppState } = useAppContext();
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [deliveryEndRoute, setDeliveryEndRoute] = useState("");
  const [leg, setLeg] = useState<any>([]);
  const [routeStart, setRouteStart] = useState(false);
  const [deliveryId, setDeliveryId] = useState("");
  const [adminDriverData, setAdminDriverData] = useState<any>([]);
  const [presentAlert] = useIonAlert();

  // console.log("loginStatus", auth?.currentUser?.email);
  // const initializeAppAdmin = async () => {
  //   console.log("initializeAppAdmin");
  //   setPosition({
  //     lat: homePosition.lat,
  //     lng: homePosition.lng,
  //   });
  // };

  const map = useMap();

  // useEffect(() => {
  //   console.log("adminDriverData", adminDriverData);
  //   if (adminDriverData) {
  //     const newPosition = {
  //       lat: adminDriverData.lat,
  //       lng: adminDriverData.lng,
  //     };
  //     setPosition(newPosition);
  //     // Center the map on the new position
  //     if (!map) return;
  //     map.setCenter(newPosition);
  //     console.log("map", map);
  //   } else {
  //     setPosition(homePosition);
  //     map?.setCenter(homePosition);
  //   }
  // }, [adminDriverData, map]);

  useEffect(() => {
    const initializeAppDriver = async () => {
      try {
        const sposition = await Geolocation.getCurrentPosition();
        const { latitude, longitude } = sposition.coords;
        // setPosition({
        //   lat: latitude,
        //   lng: longitude,
        // });
        console.log("Current position set:", { latitude, longitude });

        // Watch position geolocation
        const options = {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        };
        const watchId = await Geolocation.watchPosition(
          options,
          (position, err) => {
            if (err) {
              console.error("Error getting location:", err);
              return;
            }

            if (position) {
              const { latitude, longitude } = position.coords;
              // setPosition({
              //   lat: latitude,
              //   lng: longitude,
              // });
              // Update your UI or perform actions based on the new position
              // check when location reached
              if (routeStart) {
                // Calculate distance to the destination
                const distance = calculateDistance(
                  latitude,
                  longitude,
                  leg.end_address_lat,
                  leg.end_address_lng
                );

                // Check if the distance is below the threshold (e.g., 50 meters)
                if (distance <= 50) {
                  presentAlert({
                    header: "Delivery address reached",
                    subHeader:
                      "You have now reached your target delivery address",
                    message:
                      "Would you like to end route and confirm delivery was made?",
                    buttons: [
                      {
                        text: "Cancel",
                        role: "cancel",
                        handler: () => {
                          console.log("Alert canceled");
                        },
                      },
                      {
                        text: "End Route",
                        role: "confirm",
                        handler: () => {
                          endRoute();
                        },
                      },
                    ],
                  });
                  Geolocation.clearWatch({ id: watchId }); // Stop watching position
                }
              }
            }
          }
        );
        // Cleanup function to stop watching position when the component unmounts
        return () => {
          Geolocation.clearWatch({ id: watchId }); // Clear the watch using the correct ID
        };
      } catch (error) {
        console.error("Error fetching location:", error);
      }
    };
    // console.log("appState", appState);
    if (deviceIsMobile) {
      initializeAppDriver();
    } else {
      // initializeAppAdmin();
    }
  }, [appState, deviceIsMobile]);

  const openAppStore = async () => {
    const devicetype = await checkEnvironment();
    if (devicetype === "mobile") {
      setDeviceIsMobile(true);
    } else {
      setDeviceIsMobile(false);
    }
  };

  useEffect(() => {
    openAppStore();
  }, []);

  const closeIntro = () => {
    setShowIntro(false);
    console.log("intro closed");
  };

  useEffect(() => {
    const loadDrivers = async () => {
      const drivers = await getDriversFormFirebase();
      console.log("drivers", drivers);
    };
    loadDrivers();
  }, []);

  const handlePointerDown = (event: any) => {
    event.stopPropagation(); // Prevent interference with the map
  };

  const handlePointerMove = (event: any) => {
    event.stopPropagation();
  };

  const handlePointerUp = (event: any) => {
    event.stopPropagation();
  };

  // Load map

  const startRoute = async () => {
    const data = {
      deliveryid: deliveryId,
      email: auth?.currentUser?.email,
      start: leg.start_address,
      end: leg.end_address,
      startDateTime: new Date().toISOString(),
      deliveredDateTime: "",
      status: "in-route",
    };

    await createDeliveryInFirebase(data).then((data) => {
      setRouteStart(true);
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
          leg?.start_address
        )}&destination=${encodeURIComponent(
          leg.end_address
        )}&travelmode=driving`,
        "_system"
      );
    });
  };

  const endRoute = async () => {
    await updateDeliveryInFirebase(deliveryId);
    setRouteStart(false);
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
              {appState.isLoggedIn && deviceIsMobile ? (
                <DriverContainer
                  name={name}
                  position={position}
                  driverSection={driverSection}
                  setDriverSection={setDriverSection}
                  endRoute={deliveryEndRoute}
                  setEndRoute={setDeliveryEndRoute}
                  setDeliveryId={setDeliveryId}
                />
              ) : (
                <AdminContainer
                  name={name}
                  driverId={adminDriverData}
                  setDriverId={setAdminDriverData}
                />
              )}
              <div
                id="map-container"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {position ? (
                  <APIProvider
                    apiKey={`${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                  >
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

                      {/* <Marker position={position02} icon={mappin} /> */}
                      {!routeStart && deliveryEndRoute && (
                        <Directions
                          driverSection={driverSection}
                          setDriverSection={setDriverSection}
                          startRoute={position}
                          endRoute={deliveryEndRoute}
                          routeLeg={leg}
                          setRouteLeg={setLeg}
                          map={map}
                        />
                      )}
                    </Map>
                  </APIProvider>
                ) : (
                  <div className="map-loading">
                    <IonLoading
                      isOpen={!position}
                      message="Loading data please wait..."
                      duration={3000}
                    />
                    Loading map...
                  </div> // Optional loading state
                )}
              </div>
            </IonContent>
            {deviceIsMobile && (
              <IonFooter>
                <IonToolbar className="ion-padding-start">
                  <IonButtons slot="end">
                    {!routeStart && (
                      <IonButton
                        size="large"
                        shape="round"
                        expand="block"
                        color="primary"
                        onClick={startRoute}
                      >
                        Start
                      </IonButton>
                    )}
                    {routeStart && (
                      <IonButton
                        size="large"
                        shape="round"
                        expand="block"
                        color="primary"
                        onClick={endRoute}
                      >
                        End
                      </IonButton>
                    )}
                  </IonButtons>
                  <IonLabel>
                    <h4>
                      {leg.end_address
                        ? leg.end_address
                        : "No destination route selected."}
                    </h4>
                  </IonLabel>
                </IonToolbar>
              </IonFooter>
            )}
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

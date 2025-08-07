import { useEffect, useRef, useState } from "react";
import {
  IonBackdrop,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
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
  createDeliveredInFirebase,
  createDeliveryInFirebase,
  getDeliveredByDriver,
  getDriversFormFirebase,
  refreshView,
  updateDeliveredInFirebase,
  updateDeliveryInFirebase,
  updateDeliveryStatusInFirebase,
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
import { close, home, navigate, options, pin, refresh } from "ionicons/icons";
import Deliveries from "../components/Deliveries";
import Options from "../components/Options";
import TrackDriver from "../components/TrackDriver";
import EagleView from "../components/EagleView";
import DriverDelivered from "../components/DriverDelivered";
import { prefsStoreDelivered } from "../services/prefs";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const Page: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const [deviceIsMobile, setDeviceIsMobile] = useState(false);
  // const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
  //   null
  // );
  const homePosition = { lat: 10.6577349, lng: -61.5131554 };
  const position = { lat: 10.6419388, lng: -61.2808954 };
  // const position = { lat: 10.6401756, lng: -61.3346946 };
  const [driverSection, setDriverSection] = useState<number>(0);
  const { appState, setAppState } = useAppContext();
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [deliveryEndRoute, setDeliveryEndRoute] = useState("");
  const [leg, setLeg] = useState<any>([]);
  const [routeStart, setRouteStart] = useState(false);
  const [deliveryId, setDeliveryId] = useState("");
  const [adminDriverData, setAdminDriverData] = useState<any>([]);
  const [presentAlert] = useIonAlert();
  const [currentPage, setCurrentPage] = useState(appState.page);
  const [showOptions, setShowOptions] = useState(false);
  const [driverContainerModelOpen, setDriverContainerModelOpen] =
    useState(false);
  const [driverDeliveredModelOpen, setDriverDeliveredModelOpen] =
    useState(false);
  const [deliveryUpdateProps, setDeliveryUpdateProps] = useState<{
    documentId: string;
    dateKey: string;
    groupId: string;
  }>({ documentId: "", dateKey: "", groupId: "" });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState("");

  // console.log("loginStatus", auth?.currentUser?.email);
  // const initializeAppAdmin = async () => {
  //   console.log("initializeAppAdmin");
  //   setPosition({
  //     lat: homePosition.lat,
  //     lng: homePosition.lng,
  //   });
  // };

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
    if (appState.page === "driver-deliveries") {
      setDriverContainerModelOpen(true);
    } else {
      setDriverContainerModelOpen(false);
    }
    if (appState.page === "driver-delivered") {
      setDriverDeliveredModelOpen(true);
    } else {
      setDriverDeliveredModelOpen(false);
    }
    console.log("page del", appState.page);
  }, [appState]);

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
                if (distance <= 20) {
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
    console.log("appContext", appState);
  }, [deviceIsMobile]);

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

  const ShowEndRouteConfirmation = ({
    setShowOptions,
    selectedDeliveryMethod,
    setSelectedDeliveryMethod,
  }: {
    setShowOptions: React.Dispatch<React.SetStateAction<boolean>>;
    selectedDeliveryMethod: string;
    setSelectedDeliveryMethod: React.Dispatch<React.SetStateAction<string>>;
  }) => {
    return (
      <div
        className="route-confirm-container"
        onClick={() => setShowOptions(false)} // Close when clicking outside
      >
        <div
          className="route-confirm-div"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          <IonList>
            <IonItem>
              <IonButton
                onClick={() => setShowOptions(false)}
                fill="clear"
                slot="start"
              >
                <IonIcon icon={close}></IonIcon>
              </IonButton>
              <IonLabel>
                <h3>Choose Delivery Status</h3>
              </IonLabel>
            </IonItem>

            {[
              { key: "del", label: "Delivered" },
              { key: "cna", label: "Call No Answer" },
              { key: "nah", label: "Not At Home" },
              { key: "naw", label: "Not At Work" },
              { key: "weh", label: "Wrong Estate/House" },
              { key: "bin", label: "Bad/Incorrect Number" },
              { key: "ovc", label: "On Vacation" },
              { key: "utc", label: "Unavailable to Collect" },
            ].map(({ key, label }) => (
              <IonItem
                key={key}
                onClick={() => setSelectedDeliveryMethod(key)}
                style={
                  selectedDeliveryMethod === key
                    ? { "--background": "#ebebeb", borderRadius: "12px" }
                    : undefined
                }
                lines={key === "utc" ? "none" : undefined}
              >
                {label}
              </IonItem>
            ))}
          </IonList>

          <div className="route-confirm-save">
            <IonButton
              slot="end"
              expand="block"
              shape="round"
              onClick={() => endRoute()} // Close on save or add your save logic here
            >
              Save
            </IonButton>
          </div>
        </div>
      </div>
    );
  };

  const startRoute = async () => {
    const data = {
      deliveryid: deliveryId,
      email: auth?.currentUser?.email,
      start: leg.start_address,
      end: leg.end_address,
      startDateTime: new Date().toISOString(),
      deliveryDateTime: null,
      coordinates: position,
      status: "in-route",
      reason: "",
    };

    await prefsStoreDelivered(data).then(async () => {
      await updateDeliveryStatusInFirebase(
        deliveryUpdateProps.documentId,
        deliveryUpdateProps.dateKey,
        deliveryUpdateProps.groupId,
        deliveryId,
        "in-route",
        "in-route"
      );
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
    console.log("selectedDeliveryMethod", selectedDeliveryMethod);
    if (!selectedDeliveryMethod) {
      setShowOptions(true);
      return;
    }
    console.log("selectedDeliveryMethod 02", selectedDeliveryMethod);
    // Update deliveries if delivered
    if (selectedDeliveryMethod === "del") {
      const delivered = await getDeliveredByDriver();
      delivered.deliveryDateTime = new Date().toISOString();
      delivered.status = "delivered";
      await createDeliveredInFirebase(delivered).then(async () => {
        await updateDeliveryStatusInFirebase(
          deliveryUpdateProps.documentId,
          deliveryUpdateProps.dateKey,
          deliveryUpdateProps.groupId,
          deliveryId,
          "delivered",
          selectedDeliveryMethod
        );
        alert("Delivery updated");
      });
      setRouteStart(false);
      setShowOptions(false);
      setSelectedDeliveryMethod("");
    } else {
      // Update cancel deliveries
      const data = {
        deliveryid: deliveryId,
        email: auth?.currentUser?.email,
        start: leg.start_address,
        end: leg.end_address,
        startDateTime: new Date().toISOString(),
        deliveryDateTime: null,
        coordinates: position,
        status: "return",
        reason: selectedDeliveryMethod,
      };

      await prefsStoreDelivered(data).then(async () => {
        await updateDeliveryStatusInFirebase(
          deliveryUpdateProps.documentId,
          deliveryUpdateProps.dateKey,
          deliveryUpdateProps.groupId,
          deliveryId,
          "return",
          selectedDeliveryMethod
        );
      });
      setShowOptions(false);
      setSelectedDeliveryMethod("");
    }
  };

  useEffect(() => {
    setCurrentPage(appState.page); // Update current page when appState.page changes
  }, [appState.page, currentPage]);

  return (
    <>
      <IonBackdrop visible={showOptions}></IonBackdrop>
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
                  {!deviceIsMobile && (
                    <IonButton onClick={() => setShowOptions(true)}>
                      <IonIcon icon={options}></IonIcon>
                    </IonButton>
                  )}
                  <IonButton onClick={refreshView}>
                    <IonIcon icon={refresh}></IonIcon>
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>

            <IonContent className="ion-margin-top ion-padding-top" fullscreen>
              {appState.isLoggedIn && deviceIsMobile ? (
                <>
                  {appState.page === "driver-deliveries" && (
                    <DriverContainer
                      name={name}
                      position={position}
                      driverSection={driverSection}
                      setDriverSection={setDriverSection}
                      endRoute={deliveryEndRoute}
                      setEndRoute={setDeliveryEndRoute}
                      setDeliveryId={setDeliveryId}
                      isModalOpen={driverContainerModelOpen}
                      setIsModalOpen={setDriverContainerModelOpen}
                      setDeliveryUpdateParams={setDeliveryUpdateProps}
                      setShowReturnOptions={setShowOptions}
                    />
                  )}
                  {appState.page === "driver-delivered" && (
                    <DriverDelivered
                      isModalOpen={driverDeliveredModelOpen}
                      setIsModalOpen={setDriverDeliveredModelOpen}
                    />
                  )}
                </>
              ) : (
                // <AdminContainer
                //   name={name}
                //   driverId={adminDriverData}
                //   setDriverId={setAdminDriverData}
                // />
                <>
                  {(appState.page === "dashboard" ||
                    appState.page === "deliveries") && <Deliveries />}
                  {appState.page === "track-drivers" && <TrackDriver />}
                  {appState.page === "eagle-view" && <EagleView />}
                </>
              )}
              {/* <MapContainer
                center={position}
                zoom={13}
                scrollWheelZoom={false}
                style={{ width: "auto", height: "100vh" }}
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
              </MapContainer> */}
              <>
                {appState.isLoggedIn && deviceIsMobile && (
                  <div
                    id="map-container"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  >
                    {position ? (
                      // <APIProvider
                      //   apiKey={`${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                      // >
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
                            driverContainerModelOpen={driverContainerModelOpen}
                            setDriverContainerModelOpen={
                              setDriverContainerModelOpen
                            }
                            cancelDelivery={showOptions}
                            setCancelDelivery={setShowOptions}
                          />
                        )}
                      </Map>
                    ) : (
                      // </APIProvider>
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
                )}
              </>
            </IonContent>
            {deviceIsMobile && (
              <IonFooter>
                <IonToolbar>
                  {leg.end_address && (
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
                  )}
                  <IonIcon icon={navigate} slot="start"></IonIcon>
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
      {/* Show backdrop and options only when showOptions is true */}
      {showOptions && (
        <ShowEndRouteConfirmation
          setShowOptions={setShowOptions}
          selectedDeliveryMethod={selectedDeliveryMethod}
          setSelectedDeliveryMethod={setSelectedDeliveryMethod}
        />
      )}
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

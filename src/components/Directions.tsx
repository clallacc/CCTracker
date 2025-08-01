import { IonButton, IonIcon, IonItem, IonLabel, IonList } from "@ionic/react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { chevronBack, navigate } from "ionicons/icons";
import { useEffect, useState } from "react";

interface ContainerProps {
  driverSection: number;
  setDriverSection: (driverSection: number) => void;
  startRoute: any;
  endRoute: string;
  routeLeg: any;
  setRouteLeg: (leg: any) => void;
  driverContainerModelOpen: boolean;
  setDriverContainerModelOpen: (driverContainerModelOpen: boolean) => void;
}

const Directions: React.FC<ContainerProps> = ({
  driverSection,
  setDriverSection,
  startRoute,
  endRoute,
  routeLeg,
  setRouteLeg,
  driverContainerModelOpen,
  setDriverContainerModelOpen,
}) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);
  const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
  const [routeIndex, setRouteIndex] = useState<number>(0);
  const [travelMode, setTravelMode] = useState<google.maps.TravelMode>(
    google.maps.TravelMode.DRIVING
  );
  const selected = routes[routeIndex];
  const leg = selected?.legs[0];
  const [response, setResponse] = useState(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
  }, [routesLibrary, map, endRoute]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    directionsService
      .route({
        origin: startRoute,
        destination: endRoute,
        travelMode: travelMode || google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      })
      .then((response) => {
        directionsRenderer.setDirections(response);
        setRoutes(response.routes);
      });
  }, [directionsService, directionsRenderer, travelMode]);

  useEffect(() => {
    if (!directionsRenderer) return;
    directionsRenderer.setRouteIndex(routeIndex);
  }, [routeIndex, endRoute]);

  /// detections by speach
  const directionsCallback = (result: any, status: any) => {
    if (result !== null) {
      // Process directions
      setResponse(result);

      // Optional: Trigger speech navigation
      speakDirections(result);
    }
  };

  const speakDirections = (directionsResult: any) => {
    const steps = directionsResult.routes[0].legs[0].steps;
    steps.forEach((step: any) => {
      // Use Web Speech API or a text-to-speech library
      const utterance = new SpeechSynthesisUtterance(step.instructions);
      window.speechSynthesis.speak(utterance);
    });
  };
  /// detections by speach
  // Return null if data not loaded
  if (!leg) return null;

  return (
    <>
      {driverSection === 1 && (
        <div className="directions">
          <IonItem>
            <IonButton
              onClick={() => {
                setDriverSection(0);
                // Reset directions and related state
                setRoutes([]);
                setRouteIndex(0);
                if (directionsRenderer) {
                  directionsRenderer.setMap(null); // Clear the map
                }
                setDriverContainerModelOpen(true);
              }}
              fill="clear"
              slot="start"
            >
              <IonIcon icon={chevronBack}></IonIcon>
              Back
            </IonButton>
          </IonItem>
          <div className="directions-header">
            <h2>{selected.summary}</h2>
            <p>
              {leg.start_address.split(",")[0]} to{" "}
              {leg.end_address.split(",")[0]}
            </p>
            <p>
              {leg.distance?.text} - {leg.duration?.text}
            </p>
          </div>

          <IonList className="ion-padding-top">
            {routes.map((route, index) => (
              <IonItem
                key={index}
                onClick={() => {
                  setRouteIndex(index), setRouteLeg(leg);
                }}
              >
                <IonIcon icon={navigate} slot="start"></IonIcon>
                <IonLabel>
                  <h2>{route.summary}</h2>
                  <p>to {route.legs[0].end_address.split(",")[0]}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
          <div>
            <button
              onClick={() => setTravelMode(google.maps.TravelMode.DRIVING)}
            >
              Switch to Driving Mode
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Directions;

import { GoogleMap } from "@capacitor/google-maps";
import { Geolocation } from "@capacitor/geolocation";
import { useEffect, useRef, useState } from "react";
import "./DriverContainer.css";
import { IonFooter, IonItem, IonList } from "@ionic/react";
import mappin from "../assets/mappin.png";
import { isLoggedIn } from "../services/util";
import LoginModal from "./loginComponent";

interface ContainerProps {
  name: string;
}

const DriverContainer: React.FC<ContainerProps> = ({ name }) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<GoogleMap | null>(null);
  const userMarkerRef = useRef<any | null>(null);
  const destinationMarkerRef = useRef<any | null>(null);
  const [isUserLogin, setIsUserLogin] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const loginStatus = await isLoggedIn();
        setIsUserLogin(false);
        console.log("User Login Status:", loginStatus);
      } catch (error) {
        console.error("User initialization error:", error);
      }
    };
    initializeUser();
  }, []);

  // useEffect(() => {
  //   const initializeMap = async () => {
  //     try {
  //       // Check if mapRef is available
  //       if (!mapRef.current) {
  //         console.error("Map container is not available");
  //         return;
  //       }

  //       // Get current position
  //       const coordinates = await Geolocation.getCurrentPosition();

  //       // Create map
  //       const newMap = await GoogleMap.create({
  //         id: "map",
  //         element: mapRef.current,
  //         apiKey: "AIzaSyDva18CszbH8rztKzLnfwPq1oj_M9RqFiY",
  //         config: {
  //           center: {
  //             lat: coordinates.coords.latitude,
  //             lng: coordinates.coords.longitude,
  //           },
  //           zoom: 8,
  //         },
  //       });

  //       // Set map state
  //       setMap(newMap);

  //       // Add destination marker
  //       const destMarker = await newMap.addMarker({
  //         coordinate: {
  //           lat: 40.7128, // New York City
  //           lng: -74.006,
  //         },
  //         title: "Destination",
  //         iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  //       });

  //       // Store destination marker reference
  //       destinationMarkerRef.current = destMarker;

  //       // Start tracking user location
  //       // startLocationTracking(newMap);
  //     } catch (error) {
  //       console.error("Map initialization error:", error);
  //     }
  //   };

  //   const timer = setTimeout(() => {
  //     initializeMap();
  //   }, 2000);
  //   return () => clearTimeout(timer);
  // }, []);

  const startLocationTracking = async (mapInstance: GoogleMap) => {
    try {
      // Check if Permissions API is supported
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        if (permission.state === "denied") {
          alert("Location permission is required to track your position.");
          return;
        }
      } else {
        console.warn("Permissions API is not supported in this environment.");
      }

      // Watch position
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Update map camera
          await mapInstance.setCamera({
            coordinate: { lat: latitude, lng: longitude },
            zoom: 12,
          });

          // Update or create user marker
          if (!userMarkerRef.current) {
            const newUserMarker = await mapInstance.addMarker({
              coordinate: { lat: latitude, lng: longitude },
              title: "You are here!",
              iconUrl: mappin,
            });
            userMarkerRef.current = newUserMarker;
          } else {
            await userMarkerRef.current.setPosition({
              lat: latitude,
              lng: longitude,
            });
          }
        },
        (error) => {
          console.error("Location tracking error:", error);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );

      // Optional: Return a cleanup function to stop watching position
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } catch (error) {
      console.error("Location tracking setup error:", error);
    }
  };

  return (
    <>
      <div className="delivery-list">
        <IonList>
          <IonItem>Delivery 01</IonItem>
          <IonItem>Delivery 02</IonItem>
          <IonItem>Delivery 03</IonItem>
          <IonItem>Delivery 04</IonItem>
          <IonItem>Delivery 05</IonItem>
        </IonList>
      </div>
      <LoginModal isModalOpen={isUserLogin} setIsModalOpen={setIsUserLogin} />
    </>
  );
};

export default DriverContainer;

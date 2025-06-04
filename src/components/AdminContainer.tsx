import { GoogleMap } from "@capacitor/google-maps";
import { useEffect, useRef } from "react";
import "./AdminContainer.css";
import { Capacitor } from "@capacitor/core";

interface ContainerProps {
  name: string;
}

const AdminContainer: React.FC<ContainerProps> = ({ name }) => {
  const mapRef = useRef<HTMLDivElement | null>(null); // Explicitly type the ref
  let newMap: GoogleMap;
  let userMarker: any; // Reference for the user's live location marker
  let destinationMarker: any; // Reference for the destination marker

  const loadMap = async () => {
    // Create the map
    newMap = await GoogleMap.create({
      id: "map",
      element: mapRef.current!, // Use non-null assertion since we check for null
      apiKey: "AIzaSyCR4eiy5WOt_JlIjCV-Fm4gkmWTNhtHTU4", // Replace with your Google Maps API key
      config: {
        center: {
          lat: 39.8282, // Default center (USA)
          lng: -98.5795,
        },
        zoom: 8,
      },
    });

    // Add a destination marker with a custom icon
    destinationMarker = await newMap.addMarker({
      coordinate: {
        lat: 40.7128, // Example destination: New York City
        lng: -74.006,
      },
      title: "Destination",
      iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Custom icon for the destination
    });

    // Start tracking the user's live location
    trackUserLocation();
  };

  const trackUserLocation = async () => {
    // Request permission to access location
    const permission = await navigator.permissions.query({
      name: "geolocation" as PermissionName,
    });
    if (permission.state === "denied") {
      alert("Location permission is required to track your position.");
      return;
    }

    // Watch the user's position
    navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Update the map's camera to follow the user's location
        await newMap.setCamera({
          coordinate: {
            lat: latitude,
            lng: longitude,
          },
          zoom: 8,
        });

        // Add or update the user's live location marker
        if (!userMarker) {
          userMarker = await newMap.addMarker({
            coordinate: {
              lat: latitude,
              lng: longitude,
            },
            title: "You are here!",
            iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png", // Custom icon for the user's location
          });
        } else {
          await userMarker.setPosition({
            lat: latitude,
            lng: longitude,
          });
        }
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMap();
    }, 2000); // Load the map after 3 seconds

    // Cleanup function to clear the timeout if the component unmounts
    return () => clearTimeout(timer);
  }, []);

  return (
    <div id="container">
      {/* <strong>{name}</strong> */}
      <div
        id="map"
        ref={mapRef}
        style={{ width: "100vw", height: "100vh" }}
      ></div>
    </div>
  );
};

export default AdminContainer;

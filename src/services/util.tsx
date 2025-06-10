import { prefsGetUserSettings } from "./prefs";
import { Geolocation } from "@capacitor/geolocation";
import { GoogleMap } from "@capacitor/google-maps";
import mappin from "../assets/mappin.png";
import { getRoute } from "./httprequests";

export const userSettings = async () => {
  try {
    const settings = await prefsGetUserSettings();
    return settings;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const isLoggedIn = async () => {
  try {
    const settings = await prefsGetUserSettings();
    if (settings && settings.length > 0) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const defaultDriverMap = async (
  mapRef: React.RefObject<HTMLDivElement | null>
) => {
  try {
    // Check if mapRef is available
    if (!mapRef.current) {
      console.error("Map container is not available");
      return;
    }

    // Get current position
    const coordinates = await Geolocation.getCurrentPosition();

    // Create map
    const newMap = await GoogleMap.create({
      id: "map",
      element: mapRef.current,
      apiKey: "AIzaSyDva18CszbH8rztKzLnfwPq1oj_M9RqFiY",
      config: {
        center: {
          lat: coordinates.coords.latitude,
          lng: coordinates.coords.longitude,
        },
        zoom: 15,
      },
    });

    await newMap.setCamera({
      coordinate: {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
      },
    });
    await newMap.addMarker({
      coordinate: {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
      },
      title: "You are here!",
      iconUrl: mappin,
    });
    await newMap.enableTrafficLayer(true);
    await newMap.enableClustering();

    // Set map state
    return newMap;
  } catch (error) {
    console.error("Map initialization error:", error);
  }
};

export const startLocationTracking = async (
  mapInstance: GoogleMap,
  userMarkerRef: React.RefObject<any | null>
) => {
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
          zoom: 15,
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

export const getDeliveryRoute = async (
  mapInstance: any,
  userMarkerRef: React.RefObject<any | null>,
  destination: { lat: number; lng: number }
) => {
  try {
    // Get current position
    const coordinates = await Geolocation.getCurrentPosition();

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

    // Get the user's current location
    const userPosition = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      }
    );

    // const origin = {
    //   lat: coordinates.coords.latitude,
    //   lng: coordinates.coords.longitude,
    // };

    console.log("User position:", userPosition);
    console.log("destination:", destination);

    const origin = {
      lat: userPosition.coords.latitude,
      lng: userPosition.coords.longitude,
    };

    // Call the Google Maps Routes API
    const apiKey = "AIzaSyDva18CszbH8rztKzLnfwPq1oj_M9RqFiY"; // Replace with your API key
    // const response = await fetch(
    //   `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${apiKey}`
    // );
    const response = await getRoute(origin, destination, apiKey);

    console.log("Directions response:", response);

    // if (!response.ok) {
    //   throw new Error("Failed to fetch route from Google Maps API");
    // }

    // const data = await response.json();

    // if (data.routes && data.routes.length > 0) {
    //   const route = data.routes[0];

    //   // Render the route on the map
    //   const path = route.overview_polyline.points;
    //   const decodedPath = google.maps.geometry.encoding.decodePath(path);

    //   const routePolyline = new google.maps.Polyline({
    //     path: decodedPath,
    //     geodesic: true,
    //     strokeColor: "#FF0000",
    //     strokeOpacity: 1.0,
    //     strokeWeight: 2,
    //   });

    //   routePolyline.setMap(mapInstance);

    //   // Optionally, update the user marker position
    //   if (userMarkerRef.current) {
    //     userMarkerRef.current.setPosition(origin);
    //   }
    // } else {
    //   console.warn("No routes found in the API response.");
    // }
  } catch (error) {
    console.error("Error fetching or displaying the route:", error);
  }
};

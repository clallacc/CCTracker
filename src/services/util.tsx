import {
  prefsGetUserSettings,
  prefsRemoveUserSettings,
  prefsStoreUserSettings,
} from "./prefs";
import { Geolocation } from "@capacitor/geolocation";
import { GoogleMap } from "@capacitor/google-maps";
import mappin from "../assets/mappin.png";
import { getRoute } from "./httprequests";
import { signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { Device } from "@capacitor/device";
import {
  getDocs,
  getDoc,
  addDoc,
  collection,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

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
    return auth?.currentUser?.email;
  } catch (e) {
    console.error(e);
    return "";
  }
};

export const updateUserSettings = async (userSettings: any) => {
  try {
    const settings = await prefsStoreUserSettings(userSettings);
    return settings;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const handleRoute = (
  route: string,
  appContext: Record<string, any>,
  setAppContext: (value: Record<string, any>) => void
) => {
  switch (route) {
    case "logout":
      signOut(auth);
      prefsRemoveUserSettings();
      appContext.isLoggedIn = false;
      setAppContext(appContext);
      window.location.reload();
      console.log("your are logged out", appContext);
      break;
    case "Deliveries":
      break;
    default:
      console.log("Unknown route:", route);
      // Handle any other routes if necessary
      break; // Optional, but good practice
  }
};

export const checkEnvironment = async () => {
  const deviceInfo = await Device.getInfo();
  if (
    deviceInfo.model === "Macintosh" ||
    deviceInfo.model === "Windows" ||
    deviceInfo.model === "Linux" ||
    deviceInfo.model === "Browser"
  ) {
    return "desktop";
  } else {
    return "mobile";
  }
  // if (Capacitor.isNativePlatform()) {
  //   // Check if running on a mobile platform
  //   if (isPlatform("ios")) {
  //     return "driver";
  //   } else if (isPlatform("android")) {
  //     return "driver";
  //   } else {
  //     return "driver";
  //   }
  // } else if (window && window.process && window?.process.env) {
  //   // Check if running as an Electron app
  //   return "admin";
  // } else {
  //   // Check if running in a browser
  //   return "admin";
  // }
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

// Firebase calls
const DriverCollectionRef = collection(db, "drivers");
export const getDriversFormFirebase = async () => {
  try {
    const data = await getDocs(DriverCollectionRef);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    return filteredData;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getDriverRouteFormFirebase = async () => {
  try {
    const data = await getDocs(DriverCollectionRef);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    return filteredData;
  } catch (error) {
    console.error(error);
    return [];
  }
};

// get driver details
export const getDriverDetails = async (email: string): Promise<any | null> => {
  try {
    // Create a query to find documents where the email matches
    const emailQuery = query(DriverCollectionRef, where("email", "==", email));

    // Execute the query
    const querySnapshot = await getDocs(emailQuery);

    // Check if any documents were returned
    if (!querySnapshot.empty) {
      // Return the first document's data
      const driverData = querySnapshot.docs[0].data();
      const driverId = querySnapshot.docs[0].id;
      return {
        id: driverId,
        ...driverData, // Spread the driver's details
      };
    } else {
      console.log("No driver found with the provided email.");
      return null; // Return null if no driver is found
    }
  } catch (error) {
    console.error("Error retrieving driver details:", error);
    return null; // Return null in case of an error
  }
};

// create a driver
export const createDriverInFirebase = async (data: any) => {
  try {
    // Get the driver's current location
    const position = await Geolocation.getCurrentPosition();
    const { latitude, longitude } = position.coords;
    data.lat = latitude;
    data.lng = longitude;
    (data.lastSignIn = {
      seconds: Math.floor(Date.now() / 1000), // Current timestamp in seconds
      nanoseconds: 0, // Nanoseconds set to 0
    }),
      await addDoc(DriverCollectionRef, data);
  } catch (error) {
    console.error(error);
  }
};

// Helper function to calculate the distance between two coordinates using the Haversine formula
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const R = 6371; // Radius of the Earth in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

export const updateDriverLocationInFirebase = async (driverId: any) => {
  try {
    // Get the driver's current location
    const position = await Geolocation.getCurrentPosition();
    const { latitude, longitude } = position.coords;

    // Fetch the driver's current location from Firestore
    const driverDocRef = doc(DriverCollectionRef, driverId);
    const driverDocSnapshot = await getDoc(driverDocRef);

    if (driverDocSnapshot.exists()) {
      const driverData = driverDocSnapshot.data();
      const currentLat = parseFloat(driverData.lat);
      const currentLng = parseFloat(driverData.lng);

      // Calculate the distance between the current location and the new location
      const distance = calculateDistance(
        currentLat,
        currentLng,
        latitude,
        longitude
      );

      if (distance > 2) {
        // Update the driver's location in Firestore
        await updateDoc(driverDocRef, {
          lat: latitude.toString(),
          lng: longitude.toString(),
          lastSignIn: {
            seconds: Math.floor(Date.now() / 1000), // Current timestamp in seconds
            nanoseconds: 0, // Nanoseconds set to 0
          },
        });
        console.log("Driver location updated in Firestore.");
      } else {
        console.log("Driver has not moved more than 2 km. No update required.");
      }
    } else {
      console.error("Driver document does not exist in Firestore.");
    }
  } catch (error) {
    console.error("Error updating driver location:", error);
  }
};

export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    // Create a query to find documents where the email matches
    const emailQuery = query(DriverCollectionRef, where("email", "==", email));

    // Execute the query
    const querySnapshot = await getDocs(emailQuery);

    // Check if any documents were returned
    return !querySnapshot.empty; // Returns true if email exists, false otherwise
  } catch (error) {
    console.error("Error checking email existence:", error);
    return false; // Return false in case of an error
  }
};

export const getLatLngFromAddress = async (
  address: string
): Promise<{ lat: number; lng: number } | null> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Ensure your API key is stored in an environment variable
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } else {
      console.error("Geocoding API error:", data.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching latitude and longitude:", error);
    return null;
  }
};

export const refreshView = () => {
  window.location.reload();
};

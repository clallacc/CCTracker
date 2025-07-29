import {
  prefsGetAdminOptions,
  prefsGetUserSettings,
  prefsRemoveUserSettings,
  prefsStoreUserSettings,
} from "./prefs";
import { Geolocation } from "@capacitor/geolocation";
import { GoogleMap } from "@capacitor/google-maps";
import mappin from "../assets/mappin.png";
import { getDriversFirestore, getRoute } from "./httprequests";
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
import { IonIcon } from "@ionic/react";
import { star, starHalf, starOutline } from "ionicons/icons";

interface Delivery {
  deliveryid: string;
  email: string;
  end: string;
  start: string;
  startDateTime: string;
  status: string; // Include the status property
}

export const userSettings = async () => {
  try {
    const settings = await prefsGetUserSettings();
    return settings;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const adminOptions = async () => {
  try {
    const options = await prefsGetAdminOptions();
    return options;
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
    case "/Track-Drivers":
      setAppContext({ ...appContext, page: "track-drivers" });
      console.log("page", "deliveries");
      break;
    case "/Deliveries":
      setAppContext({ ...appContext, page: "deliveries" });
      console.log("page", "deliveries");
      break;
    case "/Eagle-View":
      setAppContext({ ...appContext, page: "eagle-view" });
      break;
    case "/Driver-deliveries":
      setAppContext({ ...appContext, page: "driver-deliveries" });
      console.log("page", "driver-deliveries");
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

// Function to fetch latitude and longitude using OpenStreetMap's Nominatim API
export const fetchLatLon = async (
  address: string,
  city: string,
  countryCode: string
) => {
  const query = `${address}, ${city}, ${countryCode}`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&addressdetails=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
    console.error("No results found for address:", query);
    return null;
  } catch (error) {
    console.error("Error fetching geocoding data:", error);
    return null;
  }
};

// Firebase calls
const DriverCollectionRef = collection(db, "drivers");
const DeliveryCollectionRef = collection(db, "deliveries");

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
export const calculateDistance = (
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
): Promise<{
  coordinates: { lat: number; lng: number } | null;
  isValid: boolean;
  type: string;
  editable: boolean;
}> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;

      // Optional: Check location_type for precision (e.g., "ROOFTOP" is most precise)
      const locationType = data.results[0].geometry.location_type;
      const validTypes = ["ROOFTOP", "RANGE_INTERPOLATED", "GEOMETRIC_CENTER"];
      const isValid = validTypes.includes(locationType);

      // Check for street_number in address_components
      const hasStreetNumber = result.address_components.some((component: any) =>
        component.types.includes("street_number")
      );

      const type = hasStreetNumber ? "house" : "road";
      // editable is false by default; true only if isValid is false
      const editable = !isValid;

      return {
        coordinates: { lat: location.lat, lng: location.lng },
        isValid,
        type,
        editable,
      };
    } else {
      console.error("Geocoding API error:", data.status);
      return {
        coordinates: null,
        isValid: false,
        type: "undefined",
        editable: true,
      };
    }
  } catch (error) {
    console.error("Error fetching latitude and longitude:", error);
    return {
      coordinates: null,
      isValid: false,
      type: "undefined",
      editable: true,
    };
  }
};

export const deliveryCoodinatesStatus = (delivery: any) => {
  if (delivery?.coordinates) {
    if (
      delivery?.coordinates?.isValid &&
      delivery?.coordinates?.type === "house"
    ) {
      return (
        <p>
          <IonIcon color="success" icon={star}></IonIcon>
          <IonIcon color="success" icon={star}></IonIcon>
          <IonIcon color="success" icon={star}></IonIcon>
        </p>
      );
    } else if (
      delivery?.coordinates?.isValid &&
      delivery?.coordinates?.type === "road"
    ) {
      return (
        <p>
          <IonIcon color="secondary" icon={star}></IonIcon>
          <IonIcon color="secondary" icon={star}></IonIcon>
        </p>
      );
    } else {
      return (
        <p>
          <IonIcon color="warning" icon={star}></IonIcon>
          <IonIcon color="warning" icon={starHalf}></IonIcon>
        </p>
      );
    }
  } else {
    return (
      <p>
        <IonIcon color="danger" icon={starOutline}></IonIcon>
      </p>
    );
  }
};

/// deliveries logic
export const createDeliveryInFirebase = async (data: any) => {
  try {
    // Get the driver's current location
    const deliveryDocRef = await addDoc(DeliveryCollectionRef, data);

    const deliveryDataWithId = {
      id: deliveryDocRef.id,
      ...data, // Spread the original data to include it in the returned object
    };

    return deliveryDataWithId;
  } catch (error) {
    console.error(error);
  }
};

export const updateDeliveryInFirebase = async (deliveryId: any) => {
  try {
    // Get the driver's current location
    const deliveryDocRef = doc(DeliveryCollectionRef, deliveryId);
    // Update the driver's location in Firestore
    await updateDoc(deliveryDocRef, {
      status: "delivered",
      deloveredDateTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating driver location:", error);
  }
};

export const getDeliveryInFirebase = async (): Promise<Delivery[]> => {
  try {
    // Get the delivery documents from Firestore
    const deliveryDocsRef = await getDocs(DeliveryCollectionRef);

    // Map the documents to the Delivery type
    const filteredData: Delivery[] = deliveryDocsRef.docs.map((doc) => {
      const data = doc.data();
      return {
        deliveryid: data.deliveryid, // Ensure this matches your Firestore structure
        email: data.email,
        end: data.end,
        start: data.start,
        startDateTime: data.startDateTime,
        status: data.status,
        id: doc.id, // You can keep this if you need the Firestore document ID
      };
    });

    return filteredData;
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return [];
  }
};

export const getInFirebaseDelivery = async (): Promise<any[]> => {
  try {
    // Get the delivery documents from Firestore
    const deliveryDocsRef = await getDocs(DeliveryCollectionRef);

    // Map the documents to the Delivery type
    const filteredData: any[] = deliveryDocsRef.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, data: data };
    });

    return filteredData;
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return [];
  }
};

// Util function (implement this in your backend or Firebase service) update delivery status
// export const updateDeliveryStatusInFirebase = async (
//   docId: string,
//   dateKey: string,
//   groupId: string,
//   deliveryId: string,
//   newStatus: string
// ) => {
//   const docRef = doc(DeliveryCollectionRef, docId);
//   const docSnap = await getDoc(docRef);

//   if (!docSnap.exists()) {
//     throw new Error(`Delivery document for date ${dateKey} not found`);
//   }

//   const data = docSnap.data();
//   const groups = data.groups || data;

//   console.log("deliveries:", groups);
//   console.log("deliveryGroup:", groupId);

//   // Find the group index
//   const groupIndex = groups.findIndex((g: any) => g[0].id === groupId);
//   if (groupIndex === -1) {
//     throw new Error(`Group ${groupId} not found in document ${dateKey}`);
//   }

//   const deliveries = groups[groupIndex].deliveries;
//   console.log("deliveries:", deliveries);

//   if (!Array.isArray(deliveries)) {
//     throw new Error(
//       `Deliveries is not an array in group ${groupId} of document ${dateKey}`
//     );
//   }

//   // Find the delivery index inside the group
//   const deliveryIndex = deliveries.findIndex((d: any) => d.id === deliveryId);
//   if (deliveryIndex === -1) {
//     throw new Error(`Delivery ${deliveryId} not found in group ${groupId}`);
//   }

//   // Update the status locally
//   deliveries[deliveryIndex].status = newStatus;

//   // Update the document with the modified groups array
//   await updateDoc(docRef, {
//     groups: groups,
//   });
// };

export const updateDeliveryStatusInFirebase = async (
  docId: string,
  dateKey: string,
  groupId: string,
  deliveryId: string,
  newStatus: string
) => {
  const docRef = doc(DeliveryCollectionRef, docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error(`Delivery document for date ${dateKey} not found`);
  }

  const data = docSnap.data();
  const groups = data.groups || data; // groups is an object with date keys

  // 1. Get the array of groups for the dateKey
  const groupArray = groups[dateKey];
  if (!Array.isArray(groupArray)) {
    throw new Error(`No group array found for dateKey ${dateKey}`);
  }

  // 2. Find the group index in the array
  const groupIndex = groupArray.findIndex((g) => g.id === groupId);
  if (groupIndex === -1) {
    throw new Error(`Group ${groupId} not found in date ${dateKey}`);
  }

  // 3. Find the delivery index inside the group
  const deliveries = groupArray[groupIndex].deliveries;
  if (!Array.isArray(deliveries)) {
    throw new Error(`Deliveries is not an array in group ${groupId}`);
  }

  const deliveryIndex = deliveries.findIndex((d) => d.id === deliveryId);
  if (deliveryIndex === -1) {
    throw new Error(`Delivery ${deliveryId} not found in group ${groupId}`);
  }

  // 4. Update the status locally
  deliveries[deliveryIndex].status = newStatus;

  // 5. Write back the entire modified group array for this dateKey
  await updateDoc(docRef, {
    [dateKey]: groupArray,
  });
};

// Firebase calls

// IOS Firebase calls
export const checkDriverExistInFirebase = async (email: string) => {
  try {
    const drivers = await getDriversFirestore(
      "AIzaSyC0EJ1qu-bnh0PfL2gpA2cMPS5Jbs_jki8"
    );
    if (drivers && drivers?.documents) {
      const driverExists = drivers.documents.some((driver: any) => {
        return driver.fields.email.stringValue === email; // Adjust based on your Firestore document structure
      });
      return driverExists;
    } else {
      console.log("No drivers found.");
      return false; // No drivers found
    }
  } catch (error) {
    console.error("Error checking driver existence:", error);
  }
};

export const getDriverDetailsFromFirebaseIos = async (
  email: string
): Promise<any | null> => {
  try {
    const drivers = await getDriversFirestore(
      "AIzaSyC0EJ1qu-bnh0PfL2gpA2cMPS5Jbs_jki8"
    );
    if (drivers && drivers?.documents) {
      const driverDetails = drivers.documents.filter((driver: any) => {
        return driver.fields.email.stringValue === email; // Adjust based on your Firestore document structure
      });
      return driverDetails;
    } else {
      console.log("No drivers found.");
      return false; // No drivers found
    }
  } catch (error) {
    console.error("Error checking driver existence:", error);
  }
};
// IOS Firebase calls

export const refreshView = () => {
  window.location.reload();
};

export const convertNanosecondsToFormattedDate = (nanoseconds: number) => {
  // Convert nanoseconds to seconds
  const seconds = nanoseconds / 1e9;

  // Create a date object from the seconds
  const date = new Date(seconds * 1000); // Convert seconds to milliseconds

  // Format the date
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  // Return the formatted date string
  return date.toLocaleString("en-US", options);
};

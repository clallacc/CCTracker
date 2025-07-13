import { CapacitorHttp } from "@capacitor/core";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

export const getRoute = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  apiKey: string
) => {
  const options = {
    url: `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${apiKey}`,
    headers: {
      "Content-type": "application/json",
      Accept: "application/json",
    },
  };

  try {
    const route = await CapacitorHttp.get(options);
    return route || [];
  } catch (error) {
    console.error("Error fetching route:", error);
    return [];
  }
};

const DeliveryListCollectionRef = collection(db, "deliverylist");
const getDeliveryList = async () => {
  try {
    const data = await getDocs(DeliveryListCollectionRef);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
    }));
    return filteredData;
  } catch (error) {
    console.error(error);
    return [];
  }
};
export const getAeropostOrders = async (date: any) => {
  try {
    // const listUrl = await getDeliveryList();
    const options = {
      // url: `${listUrl[0].url}`,
      url: `https://api.shipper.aeropost.com/api/lmp/parcels/date/${date}`,
      headers: {
        "Content-type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer 111|xJdtb5GO7TltyuRQofTMnZJBSV2FvmRuHenT18Oma222b490`,
      },
    };

    try {
      const packages = await CapacitorHttp.get(options);
      return packages.data || [];
    } catch (error) {
      console.error("Error fetching route:", error);
      return [];
    }
  } catch (error) {
    console.error(error);
  }
};

export const loginEmailAndPasswordIos = async (login: any, password: any) => {
  try {
    const response = await CapacitorHttp.request({
      method: "POST",
      url: "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyC0EJ1qu-bnh0PfL2gpA2cMPS5Jbs_jki8",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        email: login,
        password: password,
        returnSecureToken: true,
      },
    });

    return response.data || [];

    // Accessing the response properties
    console.log("Response Status:", response.status); // e.g., 200
    console.log("Response URL:", response.url); // e.g., the request URL
    console.log("Response Headers:", response.headers); // e.g., headers object
    console.log("Response Data:", response.data); // e.g., the main data object

    // Extracting specific fields from the `data` object
    const { email, localId, expiresIn } = response.data;
    console.log("Email:", email);
    console.log("Local ID:", localId);
    console.log("Expires In:", expiresIn);

    // Use the extracted data as needed
    // For example, save the email and localId to local storage or state
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const registerEmailAndPasswordIos = async (
  login: any,
  password: any
) => {
  try {
    const response = await CapacitorHttp.request({
      method: "POST",
      url: "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyC0EJ1qu-bnh0PfL2gpA2cMPS5Jbs_jki8",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        email: login,
        password: password,
        returnSecureToken: true,
      },
    });

    return response.data || [];

    // Use the extracted data as needed
    // For example, save the email and localId to local storage or state
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const registerUserWithGoogleIos = async () => {
  try {
    const response = await CapacitorHttp.request({
      method: "POST",
      url: "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPopup?key=AIzaSyC0EJ1qu-bnh0PfL2gpA2cMPS5Jbs_jki8",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        returnSecureToken: true,
      },
    });

    return response.data || [];

    // Use the extracted data as needed
    // For example, save the email and localId to local storage or state
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getDriversFirestore = async (idToken: string) => {
  try {
    // Use the ID token to fetch data from Firestore
    const firestoreResponse = await CapacitorHttp.request({
      method: "GET",
      url: "https://firestore.googleapis.com/v1/projects/cc-tracker-35290/databases/(default)/documents/drivers",
      headers: {
        Authorization: `Bearer ${idToken}`, // Pass the ID token in the Authorization header
      },
    });

    // Extract and return the Firestore data
    const firestoreData = firestoreResponse.data;
    console.log("Firestore Data:", firestoreData);

    return firestoreData || [];
  } catch (error) {
    console.error("Error fetching data from Firestore:", error);
    return [];
  }
};

export const storeDriversFirestoreIos = async (idToken: string, data: any) => {
  try {
    // Use the ID token to fetch data from Firestore
    const firestoreResponse = await CapacitorHttp.request({
      method: "POST",
      url: "https://firestore.googleapis.com/v1/projects/cc-tracker-35290/databases/(default)/documents/drivers",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json", // Pass the ID token in the Authorization header
      },
      data: {
        fields: {
          name: { stringValue: data.name },
          email: { stringValue: data.email },
          phone: { stringValue: data.phone },
          location: {
            mapValue: {
              fields: {
                lat: { doubleValue: data.location.lat },
                lng: { doubleValue: data.location.lng },
              },
            },
          },
        },
      },
    });

    // Extract and return the Firestore data
    const firestoreData = firestoreResponse.data;
    console.log("Firestore Data:", firestoreData);

    return firestoreData || [];
  } catch (error) {
    console.error("Error fetching data from Firestore:", error);
    return [];
  }
};

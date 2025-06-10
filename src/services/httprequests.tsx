import { CapacitorHttp } from "@capacitor/core";

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

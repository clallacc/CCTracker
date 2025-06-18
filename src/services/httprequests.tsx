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

export const getAeropostOrders = async (date: any) => {
  const options = {
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
};

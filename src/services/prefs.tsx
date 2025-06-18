import { Preferences } from "@capacitor/preferences";

export const prefsStoreUserSettings = async (value: any) => {
  await Preferences.set({
    key: "cctracker-settings",
    value: JSON.stringify(value),
  });
};
export const prefsGetUserSettings = async () => {
  const { value } = await Preferences.get({
    key: "cctracker-settings",
  });
  return value ? JSON.parse(value) : [];
};
export const prefsRemoveUserSettings = async () => {
  await Preferences.remove({
    key: "cctracker-settings",
  });
};
export const prefsStoreDeliveries = async (value: any) => {
  await Preferences.set({
    key: "cctracker-deliveries",
    value: JSON.stringify(value),
  });
};
export const prefsGetDeliveries = async () => {
  const { value } = await Preferences.get({
    key: "cctracker-deliveries",
  });
  return value ? JSON.parse(value) : [];
};

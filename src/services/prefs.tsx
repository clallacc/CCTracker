import { Preferences } from "@capacitor/preferences";

export const prefsStoreUserSettings = async (value: any) => {
  await Preferences.set({
    key: "cctracker-settings",
    value: value,
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

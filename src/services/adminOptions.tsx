import React, { createContext, useContext, useEffect, useState } from "react";
import { adminOptions } from "../services/util";
import { prefsStoreAdminOptions } from "../services/prefs";

type AdminOptionsType = {
  address_sync_limit?: string;
  aeropost_endpoint?: string;
  demo_mode?: boolean;
  // add other options as needed
};

type AdminOptionsContextType = {
  options: AdminOptionsType | null;
  refreshOptions: () => Promise<void>;
  updateOptions: (opts: Partial<AdminOptionsType>) => Promise<void>;
};

const AdminOptionsContext = createContext<AdminOptionsContextType | undefined>(
  undefined
);

export const useAdminOptions = () => {
  const ctx = useContext(AdminOptionsContext);
  if (!ctx)
    throw new Error("useAdminOptions must be used within AdminOptionsProvider");
  return ctx;
};

export const AdminOptionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [options, setOptions] = useState<AdminOptionsType | null>(null);

  const refreshOptions = async () => {
    const opts = await adminOptions();
    setOptions(opts);
  };

  const updateOptions = async (opts: Partial<AdminOptionsType>) => {
    const newOptions = { ...options, ...opts };
    await prefsStoreAdminOptions(newOptions);
    setOptions(newOptions);
  };

  useEffect(() => {
    refreshOptions();
  }, []);

  return (
    <AdminOptionsContext.Provider
      value={{ options, refreshOptions, updateOptions }}
    >
      {children}
    </AdminOptionsContext.Provider>
  );
};

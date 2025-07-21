import React, { createContext, useContext, useState } from "react";

// Define the shape of the context state
interface AppState {
  appState: Record<string, any>;
  setAppState: (value: Record<string, any>) => void;
}

// Create the context with a default value
const AppContext = createContext<AppState | undefined>(undefined);

// Create a provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [appState, setAppState] = useState<Record<string, any>>({
    isMobile: true,
    page: "dashboard",
    isLoggedIn: false,
  });

  return (
    <AppContext.Provider value={{ appState, setAppState }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useAppContext = (): AppState => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

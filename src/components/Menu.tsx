import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
} from "@ionic/react";

import { useLocation } from "react-router-dom";
import {
  archiveOutline,
  archiveSharp,
  cubeOutline,
  cubeSharp,
  heartOutline,
  heartSharp,
  mailOutline,
  mailSharp,
  mapOutline,
  mapSharp,
  navigateOutline,
  navigateSharp,
  paperPlaneOutline,
  paperPlaneSharp,
  warningOutline,
  warningSharp,
} from "ionicons/icons";
import "./Menu.css";
import { checkEnvironment, handleRoute, userSettings } from "../services/util";
import { useEffect, useState } from "react";
import { useAppContext } from "../services/appContext";
import { useAdminOptions } from "../services/adminOptions";

interface AppPage {
  url: string;
  iosIcon: string;
  mdIcon: string;
  title: string;
}

const appAdminPages: AppPage[] = [
  {
    title: "Track Driver",
    url: "/Track-Drivers",
    iosIcon: navigateOutline,
    mdIcon: navigateSharp,
  },
  {
    title: "Deliveries",
    url: "/Deliveries",
    iosIcon: cubeOutline,
    mdIcon: cubeSharp,
  },
  {
    title: "Eagle View",
    url: "/Eagle-View",
    iosIcon: mapOutline,
    mdIcon: mapSharp,
  },
  {
    title: "Logout",
    url: "logout",
    iosIcon: warningOutline,
    mdIcon: warningSharp,
  },
];

const appDeliveryPages: AppPage[] = [
  {
    title: "Deliveries",
    url: "/Driver-deliveries",
    iosIcon: archiveOutline,
    mdIcon: archiveSharp,
  },
  {
    title: "Contact Client",
    url: "contacts",
    iosIcon: heartOutline,
    mdIcon: heartSharp,
  },
  {
    title: "Note",
    url: "note",
    iosIcon: mailOutline,
    mdIcon: mailSharp,
  },
  {
    title: "Profile",
    url: "profile",
    iosIcon: paperPlaneOutline,
    mdIcon: paperPlaneSharp,
  },
  {
    title: "Logout",
    url: "logout",
    iosIcon: warningOutline,
    mdIcon: warningSharp,
  },
];

const Menu: React.FC = () => {
  const location = useLocation();
  const { appState, setAppState } = useAppContext();
  const { options, updateOptions } = useAdminOptions();
  const [isMobile, setIsMobile] = useState(true);
  const [currentURL, setCurrentUrl] = useState("");

  useEffect(() => {
    const checkDevice = async () => {
      const environment = await checkEnvironment();

      if (environment === "mobile") {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };
    checkDevice();
  }, []);

  return (
    <IonMenu contentId="main" type="overlay">
      <IonContent>
        {!isMobile && (
          <IonList id="inbox-list">
            <IonListHeader>Computers and Controls</IonListHeader>
            <IonNote>Live delivery and driver tracking</IonNote>
            {appAdminPages.map((appPage, index) => {
              return (
                <IonMenuToggle key={index} autoHide={false}>
                  <IonItem
                    style={
                      currentURL === appPage.url
                        ? { "--background": "#e8e8e8" }
                        : undefined
                    }
                    className={
                      location.pathname === appPage.url ? "selected" : ""
                    }
                    onClick={() => {
                      handleRoute(appPage.url, appState, setAppState),
                        setCurrentUrl(appPage.url),
                        console.log(appPage.url, appState.page);
                    }}
                    // routerLink={appPage.url}
                    // routerDirection="none"
                    lines="none"
                    detail={false}
                  >
                    <IonIcon
                      aria-hidden="true"
                      slot="start"
                      ios={appPage.iosIcon}
                      md={appPage.mdIcon}
                    />
                    <IonLabel>{appPage.title}</IonLabel>
                  </IonItem>
                </IonMenuToggle>
              );
            })}
          </IonList>
        )}

        {isMobile && (
          <IonList id="inbox-list">
            <IonListHeader>Computers and Controls</IonListHeader>
            <IonNote>Live delivery and driver tracking</IonNote>
            {appDeliveryPages.map((driverPage, index) => {
              return (
                <IonMenuToggle key={index} autoHide={false}>
                  <IonItem
                    className={
                      location.pathname === driverPage.url ? "selected" : ""
                    }
                    onClick={() => {
                      handleRoute(driverPage.url, appState, setAppState);
                    }}
                    lines="none"
                    detail={false}
                  >
                    <IonIcon
                      aria-hidden="true"
                      slot="start"
                      ios={driverPage.iosIcon}
                      md={driverPage.mdIcon}
                    />
                    <IonLabel>{driverPage.title}</IonLabel>
                  </IonItem>
                </IonMenuToggle>
              );
            })}
          </IonList>
        )}
      </IonContent>
    </IonMenu>
  );
};

export default Menu;

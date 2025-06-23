import { IonButton, IonContent, IonSpinner } from "@ionic/react";
import loadingImg from "../assets/loadervanlogo.svg";
import { useEffect, useState } from "react";
import { useAppContext } from "../services/appContext";
import {
  checkEnvironment,
  getDriverDetails,
  updateDriverLocationInFirebase,
  userSettings,
} from "../services/util";
import LoginModal from "./loginComponent";
import IosLoginModal from "./iosLoginComponent";
import { Device } from "@capacitor/device";

interface IntroProps {
  setShowIntro: () => void;
}

const Intro: React.FC<IntroProps> = ({ setShowIntro }) => {
  const { appState, setAppState } = useAppContext();
  const [isUserLogin, setIsUserLogin] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [platform, SetPlatform] = useState("");

  const deviceType = async () => {
    const deviceInfo = await Device.getInfo();
    const devicePlatform = deviceInfo.platform;
    if (devicePlatform === "ios") {
      setIsIosDevice(true);
      SetPlatform(devicePlatform);
    }
  };

  useEffect(() => {
    deviceType();
  }, []);

  useEffect(() => {
    const checkDevice = async () => {
      try {
        // Fetch environment and user settings asynchronously
        const environment = await checkEnvironment();
        const settings = await userSettings();

        // Update appState based on the environment and settings
        if (environment === "mobile") {
          appState.isMobile = true;

          setTimeout(async () => {
            if (settings && settings?.isLoggedIn) {
              setAppState(settings);
              setShowIntro(); // Hide intro when settings are loaded
              setIsUserLogin(false);
              const driverDetails = await getDriverDetails(settings?.email);
              updateDriverLocationInFirebase(driverDetails.id);
            } else {
              appState.isLoggedIn = false;
              setIsUserLogin(true);
            }
          }, 1500);
        } else {
          appState.isMobile = false;
          setShowIntro(); // Hide intro for non-mobile environments
        }

        // Update the app state
        // setAppState({ ...appState }); // Use a spread operator to trigger re-render
      } catch (err) {
        console.error("Error loading settings or environment:", err);
      }
    };

    checkDevice();
  }, [isUserLogin]);

  return (
    <>
      <IonContent
        className="ion-margin-top ion-padding-top intro-content"
        fullscreen
      >
        <div className="image-div">
          <img src={loadingImg} alt="CC Tracker logo" />
        </div>
        <h1>Welcome to Delivery Tracker</h1>
        {!isUserLogin && <IonSpinner></IonSpinner>}
        {!isUserLogin ? (
          <IonButton
            expand="block"
            shape="round"
            className="ion-margin"
            onClick={() => setIsUserLogin(true)}
          >
            {" "}
            Sign in
          </IonButton>
        ) : (
          <IonButton
            expand="block"
            shape="round"
            color={"light"}
            className="ion-margin"
            onClick={() => setShowIntro()}
          >
            {" "}
            Continue
          </IonButton>
        )}
      </IonContent>
      {isIosDevice ? (
        <IosLoginModal
          isModalOpen={isUserLogin}
          setIsModalOpen={setIsUserLogin}
          platform={platform}
          isIosDevice={isIosDevice}
        />
      ) : (
        <LoginModal
          isModalOpen={isUserLogin}
          setIsModalOpen={setIsUserLogin}
          platform={platform}
          isIosDevice={isIosDevice}
        />
      )}
    </>
  );
};

export default Intro;

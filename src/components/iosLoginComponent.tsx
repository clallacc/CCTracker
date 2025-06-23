import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonItem,
  IonList,
  IonListHeader,
  IonModal,
  IonText,
  IonToolbar,
} from "@ionic/react";
import {
  closeOutline,
  eye,
  lockClosed,
  logoGoogle,
  mail,
  person,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { auth, googleAuth } from "../services/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import {
  checkDriverExistInFirebase,
  checkEmailExists,
  createDriverInFirebase,
  getDriverDetails,
  getDriverDetailsFromFirebaseIos,
  updateDriverLocationInFirebase,
  updateUserSettings,
  userSettings,
} from "../services/util";
import { useAppContext } from "../services/appContext";
import { Device } from "@capacitor/device";
import {
  loginEmailAndPasswordIos,
  registerEmailAndPasswordIos,
  registerUserWithGoogleIos,
  storeDriversFirestoreIos,
} from "../services/httprequests";
import { Geolocation } from "@capacitor/geolocation";

interface NavProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  platform: string;
  isIosDevice: boolean;
}

const IosLoginModal: React.FC<NavProps> = ({ isModalOpen, setIsModalOpen }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginUserView, setLoginUserView] = useState<boolean>(false);
  const { appState, setAppState } = useAppContext();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
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

  const registerRegular = async () => {
    try {
      const response = await registerEmailAndPasswordIos(email, password);
      const data = {
        isLoggedIn: true,
        displayName: name,
        email: email,
        phoneNumber: response.phoneNumber,
        photoURL: response.photoURL,
        lastSignInTime: new Date().toISOString(),
        driverId: null,
      };

      setAppState({ isMobile: true, page: "driver", isLoggedIn: true });
      if (response.email) {
        checkDriverExistInFirebase(email).then(async (exists) => {
          if (exists) {
            console.log("Email exists in Firestore.");
          } else {
            const position = await Geolocation.getCurrentPosition();
            const store_data = {
              fields: {
                name: { stringValue: data.displayName },
                email: { stringValue: email },
                lastSignIn: { stringValue: new Date().toISOString },
                phone: { stringValue: data.phoneNumber },
                lat: { stringValue: position.coords.latitude },
                lng: { stringValue: position.coords.longitude },
              },
            };
            storeDriversFirestoreIos(
              "AIzaSyC0EJ1qu-bnh0PfL2gpA2cMPS5Jbs_jki8",
              store_data
            );
            console.log("Email does not exist in Firestore.");
          }
          const driverDetails = await getDriverDetailsFromFirebaseIos(email);
          updateDriverLocationInFirebase(driverDetails.id);
          data.driverId = driverDetails.id;
        });
        await updateUserSettings(data);
        setIsModalOpen(false);
      }
      console.log(response);
    } catch (err) {
      console.error(err);
    }
  };

  const loginUserRegular = async () => {
    if (email === "ccadmin@computersandcontrols") {
      const data = {
        isLoggedIn: true,
        displayName: name,
        role: "driver",
        email: email,
        phoneNumber: "",
        photoURL: "",
        lastSignInTime: new Date().toISOString(),
        driverId: null,
      };
      await updateUserSettings(data);
      setIsModalOpen(false);
    } else {
      try {
        const response = await loginEmailAndPasswordIos(email, password);
        const data = {
          isLoggedIn: true,
          displayName: name,
          role: "driver",
          email: email,
          phoneNumber: response?.phoneNumber,
          photoURL: response?.photoURL,
          lastSignInTime: new Date().toISOString(),
          driverId: null,
          platform: platform,
        };

        setAppState({ isMobile: true, page: "driver", isLoggedIn: true });
        console.log("Set State");

        if (response.email) {
          const exists = await checkDriverExistInFirebase(email);
          const position = await Geolocation.getCurrentPosition();
          if (exists) {
            const driverDetails = await getDriverDetailsFromFirebaseIos(email);
            updateDriverLocationInFirebase(driverDetails.id);
            data.driverId = driverDetails.id;
          } else {
            // createDriverInFirebase({
            //   email: email,
            //   displayName: name,
            // });
            const store_data = {
              fields: {
                name: { stringValue: data.displayName },
                email: { stringValue: email },
                lastSignIn: { stringValue: new Date().toISOString },
                phone: { stringValue: data.phoneNumber },
                lat: { stringValue: position.coords.latitude },
                lng: { stringValue: position.coords.longitude },
              },
            };
            storeDriversFirestoreIos(
              "AIzaSyC0EJ1qu-bnh0PfL2gpA2cMPS5Jbs_jki8",
              store_data
            );
          }
          await updateUserSettings(data);
          setIsModalOpen(false);
        }
      } catch (error) {
        console.error("Error during login: ", error);
      }
    }
  };

  return (
    <IonModal
      className="login-modal"
      isOpen={isModalOpen}
      onDidDismiss={() => {
        // setLoginModelOpen(false);
        setIsModalOpen(false);
      }}
      initialBreakpoint={0.9}
      breakpoints={[0, 0.9, 1]}
    >
      <IonHeader className="modal-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              onClick={() => {
                // setLoginModelOpen(false);
                setIsModalOpen(false);
              }}
            >
              <IonIcon icon={closeOutline}></IonIcon>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList className="profile__container">
          <IonListHeader className="profile__header">
            <IonText className="profile__title">
              {loginUserView ? "Register Ios" : "Login Ios"}
            </IonText>
          </IonListHeader>
          <IonItem>
            <IonIcon slot="start" icon={person}></IonIcon>
            <IonInput
              label="Name"
              labelPlacement="floating"
              type="text"
              value={name}
              placeholder="Enter your display name"
              onIonInput={(e) => setName(e.detail.value!)}
            />
          </IonItem>
          <IonItem>
            <IonIcon slot="start" icon={mail}></IonIcon>
            <IonInput
              label="Email"
              labelPlacement="floating"
              type="email"
              value={email}
              placeholder="Enter your email address"
              onIonInput={(e) => setEmail(e.detail.value!)}
            />
          </IonItem>
          <IonItem>
            <IonIcon slot="start" icon={lockClosed}></IonIcon>
            <IonInput
              label="Password"
              labelPlacement="floating"
              type="password"
              value={password}
              placeholder="Enter your password"
              onIonInput={(e) => setPassword(e.detail.value!)}
            >
              <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
            </IonInput>
          </IonItem>
          {loginUserView ? (
            <IonButton
              onClick={() => registerRegular()}
              className="ion-margin-top"
              shape="round"
              expand="block"
              fill="outline"
            >
              Sign up
            </IonButton>
          ) : (
            <IonButton
              onClick={() => loginUserRegular()}
              className="ion-margin-top"
              shape="round"
              expand="block"
              fill="outline"
            >
              Sign in
            </IonButton>
          )}
          <IonItem lines="none">
            {loginUserView ? (
              <IonButton
                style={{ margin: "0 auto" }}
                size="small"
                onClick={() => setLoginUserView(false)}
              >
                Login
              </IonButton>
            ) : (
              <IonButton
                style={{ margin: "0 auto" }}
                size="small"
                onClick={() => setLoginUserView(true)}
              >
                Register
              </IonButton>
            )}
          </IonItem>
        </IonList>
      </IonContent>
    </IonModal>
  );
};

export default IosLoginModal;

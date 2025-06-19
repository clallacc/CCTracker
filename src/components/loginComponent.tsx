import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
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
  checkEmailExists,
  createDriverInFirebase,
  getDriverDetails,
  updateDriverLocationInFirebase,
  updateUserSettings,
  userSettings,
} from "../services/util";
import { useAppContext } from "../services/appContext";
import { Device } from "@capacitor/device";

interface NavProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

const LoginModal: React.FC<NavProps> = ({ isModalOpen, setIsModalOpen }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginUserView, setLoginUserView] = useState<boolean>(false);
  const { appState, setAppState } = useAppContext();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  const deviceType = async () => {
    const deviceInfo = await Device.getInfo();
    const devicePlatform = deviceInfo.platform;
    if (devicePlatform === "ios") {
      setIsIosDevice(true);
    }
  };

  useEffect(() => {
    deviceType();
  }, []);

  const registerRegular = async () => {
    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const data = {
        isLoggedIn: true,
        displayName: name,
        email: response.user.email,
        phoneNumber: response.user.phoneNumber,
        photoURL: response.user.photoURL,
        lastSignInTime: response.user.metadata.lastSignInTime,
        driverId: null,
      };

      setAppState({ isMobile: true, page: "driver", isLoggedIn: true });
      if (response.user.email) {
        checkEmailExists(email).then(async (exists) => {
          if (exists) {
            console.log("Email exists in Firestore.");
          } else {
            console.log("Email does not exist in Firestore.");
          }
          const driverDetails = await getDriverDetails(email);
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
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      const data = {
        isLoggedIn: true,
        displayName: name,
        email: response.user.email,
        phoneNumber: response.user.phoneNumber,
        photoURL: response.user.photoURL,
        lastSignInTime: response.user.metadata.lastSignInTime,
        driverId: null,
      };

      setAppState({ isMobile: true, page: "driver", isLoggedIn: true });
      if (response.user.email) {
        checkEmailExists(email).then(async (exists) => {
          if (exists) {
            const driverDetails = await getDriverDetails(email);
            updateDriverLocationInFirebase(driverDetails.id);
            data.driverId = driverDetails.id;
            console.log("Email exists in Firestore.", driverDetails);
          } else {
            createDriverInFirebase({
              email: response.user.email,
              displayName: name,
            });
            console.log("Email does not exist in Firestore.");
          }
        });
        await updateUserSettings(data);
        setIsModalOpen(false);
      }
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };

  const googleLogin = async () => {
    if (isAuthenticating) return; // Prevent multiple requests
    setIsAuthenticating(true);
    try {
      const response = await signInWithPopup(auth, googleAuth);
      const data = {
        isLoggedIn: true,
        displayName: response.user.displayName,
        email: response.user.email,
        phoneNumber: response.user.phoneNumber,
        photoURL: response.user.photoURL,
        lastSignInTime: response.user.metadata.lastSignInTime,
        driverId: null,
      };

      if (response?.user?.emailVerified) {
        checkEmailExists(response.user.email!).then(async (exists) => {
          if (exists) {
            const driverDetails = await getDriverDetails(email);
            updateDriverLocationInFirebase(driverDetails.id);
            data.driverId = driverDetails.id;
            console.log("Email exists in Firestore.", driverDetails);
          } else {
            createDriverInFirebase({
              email: response.user.email,
              displayName: name,
            });
            console.log("Email does not exist in Firestore.");
          }
        });
        await updateUserSettings(data);
        setIsModalOpen(false);
      }
      console.log(response);
    } catch (error: any) {
      if (error.code === "auth/cancelled-popup-request") {
        console.warn("Popup request was canceled:", error);
      } else {
        console.error("Error during sign-in:", error);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // const googleLogin = async () => {
  //   if (isAuthenticating) return; // Prevent multiple requests
  //   setIsAuthenticating(true);

  //   try {
  //     // Initiate the redirect-based login
  //     await signInWithRedirect(auth, googleAuth);
  //   } catch (error: any) {
  //     if (error.code === "auth/cancelled-popup-request") {
  //       console.warn("Popup request was canceled:", error);
  //     } else {
  //       console.error("Error during sign-in:", error);
  //     }
  //   } finally {
  //     setIsAuthenticating(false);
  //   }
  // };

  // // Handle the redirect result after the user is redirected back to the app
  // const handleRedirectResult = async () => {
  //   try {
  //     const response = await getRedirectResult(auth);
  //     if (response) {
  //       const data = {
  //         isLoggedIn: true,
  //         displayName: response.user.displayName,
  //         email: response.user.email,
  //         phoneNumber: response.user.phoneNumber,
  //         photoURL: response.user.photoURL,
  //         lastSignInTime: response.user.metadata.lastSignInTime,
  //         driverId: null,
  //       };

  //       if (response?.user?.emailVerified) {
  //         checkEmailExists(response.user.email!).then(async (exists) => {
  //           if (exists) {
  //             const driverDetails = await getDriverDetails(
  //               response.user.email!
  //             );
  //             updateDriverLocationInFirebase(driverDetails.id);
  //             data.driverId = driverDetails.id;
  //             console.log("Email exists in Firestore.", driverDetails);
  //           } else {
  //             createDriverInFirebase({
  //               email: response.user.email,
  //               displayName: response.user.displayName,
  //             });
  //             console.log("Email does not exist in Firestore.");
  //           }
  //         });
  //         await updateUserSettings(data);
  //         setIsModalOpen(false);
  //       }
  //       console.log(response);
  //     }
  //   } catch (error) {
  //     console.error("Error handling redirect result:", error);
  //   }
  // };

  // // Call `handleRedirectResult` when the app loads to process the redirect result
  // useEffect(() => {
  //   handleRedirectResult();
  // }, []);

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
            <IonText className="profile__title">Register</IonText>
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
            />
            <IonButton fill="clear" slot="end" aria-label="Show/hide">
              <IonIcon slot="icon-only" icon={eye} aria-hidden="true"></IonIcon>
            </IonButton>
          </IonItem>
          {loginUserView ? (
            <IonButton
              onClick={registerRegular}
              className="ion-margin-top"
              shape="round"
              expand="block"
              fill="outline"
            >
              Sign up
            </IonButton>
          ) : (
            <IonButton
              onClick={loginUserRegular}
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
          <>
            {!isIosDevice && (
              <IonListHeader className="google-login-header">
                <IonText className="profile__title">Login with Google</IonText>
              </IonListHeader>
            )}
            {!isIosDevice && (
              <IonButton
                className="ion-margin-top"
                fill="outline"
                shape="round"
                expand="block"
                onClick={googleLogin}
                disabled={isAuthenticating}
              >
                <IonIcon icon={logoGoogle}></IonIcon>
                {isAuthenticating ? "Signing in..." : "Sign in with Google"}
              </IonButton>
            )}
          </>
        </IonList>
      </IonContent>
    </IonModal>
  );
};

export default LoginModal;

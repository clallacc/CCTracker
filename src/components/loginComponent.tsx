import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
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
import { useState } from "react";
import { auth, googleAuth } from "../services/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  checkEmailExists,
  createDriverInFirebase,
  getDriverDetails,
  updateDriverLocationInFirebase,
  updateUserSettings,
} from "../services/util";
import { useAppContext } from "../services/appContext";

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
      };
      await updateUserSettings(data);
      setAppState({ isMobile: true, page: "driver", isLoggedIn: true });
      if (response.user.email) {
        checkEmailExists(email).then((exists) => {
          if (exists) {
            console.log("Email exists in Firestore.");
          } else {
            console.log("Email does not exist in Firestore.");
          }
        });
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
      };
      await updateUserSettings(data);
      setAppState({ isMobile: true, page: "driver", isLoggedIn: true });
      if (response.user.email) {
        checkEmailExists(email).then(async (exists) => {
          if (exists) {
            const driverDetails = await getDriverDetails(email);
            updateDriverLocationInFirebase(driverDetails.id);
            console.log("Email exists in Firestore.", driverDetails);
          } else {
            createDriverInFirebase({
              email: response.user.email,
              displayName: name,
            });
            console.log("Email does not exist in Firestore.");
          }
        });
        setIsModalOpen(false);
      }
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };

  const googleLogin = async () => {
    try {
      const response = await signInWithPopup(auth, googleAuth);
      const data = {
        isLoggedIn: true,
        displayName: response.user.displayName,
        email: response.user.email,
        phoneNumber: response.user.phoneNumber,
        photoURL: response.user.photoURL,
        lastSignInTime: response.user.metadata.lastSignInTime,
      };
      await updateUserSettings(data);
      if (response?.user?.emailVerified) {
        checkEmailExists(response.user.email!).then(async (exists) => {
          if (exists) {
            const driverDetails = await getDriverDetails(email);
            updateDriverLocationInFirebase(driverDetails.id);
            console.log("Email exists in Firestore.", driverDetails);
          } else {
            createDriverInFirebase({
              email: response.user.email,
              displayName: name,
            });
            console.log("Email does not exist in Firestore.");
          }
        });
        setIsModalOpen(false);
      }
      console.log(response);
    } catch (err) {
      console.error(err);
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
            >
              Sign up
            </IonButton>
          ) : (
            <IonButton
              onClick={loginUserRegular}
              className="ion-margin-top"
              shape="round"
              expand="block"
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
          <IonListHeader className="google-login-header">
            <IonText className="profile__title">Login with Google</IonText>
          </IonListHeader>
          <IonButton
            className="ion-margin-top"
            fill="outline"
            shape="round"
            expand="block"
            onClick={googleLogin}
          >
            <IonIcon icon={logoGoogle}></IonIcon>
            Google
          </IonButton>
        </IonList>
      </IonContent>
    </IonModal>
  );
};

export default LoginModal;

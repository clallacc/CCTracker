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
import { closeOutline } from "ionicons/icons";

interface NavProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

const LoginModal: React.FC<NavProps> = ({ isModalOpen, setIsModalOpen }) => {
  return (
    <IonModal
      className="login-modal"
      isOpen={isModalOpen}
      onDidDismiss={() => setIsModalOpen(false)}
      initialBreakpoint={0.9}
      breakpoints={[0, 0.9, 1]}
    >
      <IonHeader className="modal-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => setIsModalOpen(false)}>
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
          <IonItem className="profile__item">
            <IonLabel className="profile__label">First Name</IonLabel>
            <IonInput className="profile__input"></IonInput>
          </IonItem>
          <IonItem className="profile__item">
            <IonLabel className="profile__label">Last Name</IonLabel>
            <IonInput className="profile__input"></IonInput>
          </IonItem>
        </IonList>
      </IonContent>
    </IonModal>
  );
};

export default LoginModal;

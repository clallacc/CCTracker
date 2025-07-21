import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { close } from "ionicons/icons";
import { prefsStoreAdminOptions } from "../services/prefs";
import { useEffect, useState } from "react";
import { adminOptions } from "../services/util";
import { useAdminOptions } from "../services/adminOptions";

interface optionProps {
  isOptionsOpen: boolean;
  setIsOptionsOpen: (isOpen: boolean) => void;
}

const Options: React.FC<optionProps> = ({
  setIsOptionsOpen,
  isOptionsOpen,
}) => {
  const { options, updateOptions } = useAdminOptions();
  const [syncAddressLimit, setSyncAddressLimit] = useState(
    options?.address_sync_limit ?? ""
  );
  const [aeropostEndpoint, setAeropostEndpoint] = useState(
    options?.aeropost_endpoint ?? ""
  );
  const [demoMode, setDemoMode] = useState(options?.demo_mode);

  useEffect(() => {
    setSyncAddressLimit(options?.address_sync_limit ?? "");
    setAeropostEndpoint(options?.aeropost_endpoint ?? "");
    setDemoMode(options?.demo_mode);
  }, [options]);

  const storeAdminOprions = async () => {
    await updateOptions({
      address_sync_limit: syncAddressLimit,
      aeropost_endpoint: aeropostEndpoint,
      demo_mode: demoMode,
    });
  };

  return (
    <>
      <div className="ion-page options-panel">
        <div className="options">
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setIsOptionsOpen(false)}>
                  <IonIcon icon={close}></IonIcon>
                </IonButton>
              </IonButtons>
              <IonTitle>Options</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonCheckbox
                checked={!!demoMode}
                onIonChange={(e) => setDemoMode(e.detail.checked)}
              >
                Demo Mode
              </IonCheckbox>
            </IonItem>
            <IonItem>
              <IonInput
                type="number"
                label="Sync addresses limit"
                value={syncAddressLimit}
                placeholder="Enter number of records"
                onIonInput={(e) => setSyncAddressLimit(e.detail.value ?? "")}
              ></IonInput>
            </IonItem>
            <IonItem>
              <IonInput
                type="text"
                label="Aeropost Endpoint"
                value={aeropostEndpoint}
                placeholder="Enter Date"
                onIonInput={(e) => setAeropostEndpoint(e.detail.value ?? "")}
              ></IonInput>
            </IonItem>
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonButtons slot="end">
                <IonButton
                  size="large"
                  shape="round"
                  expand="block"
                  fill="outline"
                  color="primary"
                  className="ion-margin-start"
                  onClick={() => setIsOptionsOpen(false)}
                >
                  close
                </IonButton>
                <IonButton
                  size="large"
                  shape="round"
                  expand="block"
                  fill="solid"
                  color="primary"
                  className="ion-margin-start"
                  onClick={() => {
                    storeAdminOprions();
                  }}
                >
                  Save
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonFooter>
        </div>
      </div>
    </>
  );
};

export default Options;

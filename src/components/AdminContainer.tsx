import { useEffect, useState } from "react";
import "./AdminContainer.css";
import {
  convertNanosecondsToFormattedDate,
  getDriversFormFirebase,
} from "../services/util";
import { IonIcon, IonItem, IonLabel, IonList } from "@ionic/react";
import { chevronForward } from "ionicons/icons";

interface ContainerProps {
  name: string;
  driverId: any;
  setDriverId: (driverId: any) => void;
}

const AdminContainer: React.FC<ContainerProps> = ({
  name,
  driverId,
  setDriverId,
}) => {
  const [drivers, setDrivers] = useState<any[]>([]);

  const loadDrivers = async () => {
    const drivers = await getDriversFormFirebase();
    setDrivers(drivers);
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDrivers();
    }, 2000); // Load the map after 3 seconds

    // Cleanup function to clear the timeout if the component unmounts
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="admin-list">
      <IonList>
        {drivers.map((driver) => (
          <>
            <IonItem
              onClick={() => {
                setDriverId({
                  driverId: driver.id,
                  lng: Number(driver.lng),
                  lat: Number(driver.lat),
                }),
                  console.log("driver data updated");
              }}
              key={driver.id}
            >
              <IonIcon slot="end" icon={chevronForward}></IonIcon>
              <IonLabel>
                <h3>{driver.name}</h3>
                <p>{driver.email}</p>
                <small>
                  {convertNanosecondsToFormattedDate(driver.lastSignIn.seconds)}
                </small>
              </IonLabel>
            </IonItem>
          </>
        ))}
        <IonItem
          onClick={() => {
            setDriverId(null), console.log("driver data updated");
          }}
        >
          Reset Map
        </IonItem>
      </IonList>
    </div>
  );
};

export default AdminContainer;

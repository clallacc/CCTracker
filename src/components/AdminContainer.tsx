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
}

const AdminContainer: React.FC<ContainerProps> = ({ name }) => {
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
      <strong>{name}</strong>
      <p>drivers</p>
      <IonList>
        {drivers.map((driver) => (
          <IonItem key={driver.id}>
            <IonIcon slot="end" icon={chevronForward}></IonIcon>
            <IonLabel>
              <h3>{driver.name}</h3>
              <p>{driver.email}</p>
              <small>
                {convertNanosecondsToFormattedDate(driver.lastSignIn.seconds)}
              </small>
            </IonLabel>
          </IonItem>
        ))}
      </IonList>
    </div>
  );
};

export default AdminContainer;

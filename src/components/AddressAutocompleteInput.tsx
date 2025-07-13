import React, { useEffect, useRef, useState } from "react";
import { IonInput, IonItem, IonList, IonLabel } from "@ionic/react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

interface AddressAutocompleteInputProps {
  delivery: any;
  onAddressSelected: (
    address: string,
    coordinates: { lat: number; lng: number }
  ) => void;
}

const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  delivery,
  onAddressSelected,
}) => {
  const placesLibrary = useMapsLibrary("places");
  const [inputValue, setInputValue] = useState(delivery.address || "");
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const inputRef = useRef<HTMLIonInputElement>(null);

  useEffect(() => {
    if (placesLibrary) {
      autocompleteService.current =
        new window.google.maps.places.AutocompleteService();
      geocoder.current = new window.google.maps.Geocoder();
    }
  }, [placesLibrary]);

  const fetchPredictions = (input: string) => {
    if (!autocompleteService.current || input.length < 3) {
      setPredictions([]);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: "tt" }, // restrict to Trinidad and Tobago
        types: ["address"],
      },
      (preds, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          preds
        ) {
          setPredictions(preds);
          setShowDropdown(true);
        } else {
          setPredictions([]);
          setShowDropdown(false);
        }
      }
    );
  };

  const handleInputChange = (e: CustomEvent) => {
    const val = e.detail.value || "";
    setInputValue(val);
    fetchPredictions(val);
  };

  const handleSelectPrediction = (placeId: string, description: string) => {
    setInputValue(description);
    setShowDropdown(false);

    if (!geocoder.current) return;

    geocoder.current.geocode({ placeId }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location;
        onAddressSelected(description, {
          lat: location.lat(),
          lng: location.lng(),
        });
      }
    });
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <IonInput
        ref={inputRef}
        value={inputValue}
        label="Address"
        labelPlacement="floating"
        fill="outline"
        placeholder="Enter Address"
        onIonChange={handleInputChange}
        onIonBlur={() => {
          // Delay hiding dropdown to allow click on dropdown items
          setTimeout(() => setShowDropdown(false), 200);
        }}
        onIonFocus={() => {
          if (predictions.length > 0) setShowDropdown(true);
        }}
      />
      {showDropdown && predictions.length > 0 && (
        <IonList
          style={{
            position: "absolute",
            zIndex: 1000,
            background: "white",
            width: "100%",
            maxHeight: "200px",
            overflowY: "auto",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        >
          {predictions.map((prediction) => (
            <IonItem
              button
              key={prediction.place_id}
              onClick={() =>
                handleSelectPrediction(
                  prediction.place_id,
                  prediction.description
                )
              }
            >
              <IonLabel>{prediction.description}</IonLabel>
            </IonItem>
          ))}
        </IonList>
      )}
    </div>
  );
};

export default AddressAutocompleteInput;

import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { IonInput, IonItem, IonList, IonLabel, IonPopover } from "@ionic/react";
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
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  const [inputValue, setInputValue] = useState(delivery.address || "");
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLIonInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [servicesReady, setServicesReady] = useState(false);

  useEffect(() => {
    if (!placesLibrary) return;
    if (
      placesLibrary &&
      window.google?.maps?.places &&
      !autocompleteService.current &&
      !geocoder.current
    ) {
      autocompleteService.current =
        new window.google.maps.places.AutocompleteService();
      geocoder.current = new window.google.maps.Geocoder();
      setServicesReady(true);
    }
  }, [placesLibrary, predictions]);

  // Debounced fetchPredictions
  const fetchPredictions = (input: string) => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      if (!servicesReady || input.length < 3) {
        setPredictions([]);
        setShowDropdown(true);
        return;
      }

      autocompleteService.current!.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: "tt" },
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
    }, 300);
  };

  const handleInputChange = (e: CustomEvent) => {
    const val = e.detail.value || "";
    // console.log("handleInputChange: ", val);
    setInputValue(val);
    if (val.trim() === "") {
      setPredictions([]);
      setShowDropdown(false);
    } else {
      fetchPredictions(val);
    }
  };

  const handleSelectPrediction = (placeId: string, description: string) => {
    setInputValue(description);
    setShowDropdown(false);
    if (!geocoder.current) return;
    geocoder.current.geocode({ placeId }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location;
        console.log("location", description);
        onAddressSelected(description, {
          lat: location.lat(),
          lng: location.lng(),
        });
      }
    });
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {showDropdown && predictions.length > 0 && (
        <IonList
          style={{
            position: "sticky",
            zIndex: 1000,
            background: "white",
            width: "100%",
            maxHeight: "200px",
            overflowY: "auto",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        >
          <IonItem style={{ "--background": "#f6f6f6" }}>
            <h6>Predictions...</h6>
          </IonItem>
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
      <IonInput
        ref={inputRef}
        value={inputValue}
        label={`${delivery.address} ${delivery.city}`}
        labelPlacement="floating"
        fill="outline"
        placeholder="Enter Address"
        onIonInput={handleInputChange}
        onIonBlur={() => {
          setTimeout(() => setShowDropdown(false), 200);
        }}
        onIonFocus={() => {
          if (predictions.length > 0) setShowDropdown(true);
        }}
        clearInput
        // onIonClear={() => {
        //   setInputValue("");
        //   setPredictions([]);
        //   setShowDropdown(false);
        // }}
      />
    </div>
  );
};

export default AddressAutocompleteInput;

// const AddressAutocompleteInput: React.FC<
//   AddressAutocompleteInputProps
// > = () => {
//   const placesLibrary = useMapsLibrary("places");
//   const [service, setService] =
//     useState<google.maps.places.AutocompleteService | null>(null);
//   const [results, setResults] = useState<
//     google.maps.places.QueryAutocompletePrediction[] | null
//   >([]);
//   const [inputValue, setInputValue] = useState<string>("");

//   useEffect(() => {
//     if (placesLibrary) setService(new placesLibrary.AutocompleteService());
//     return () => setService(null);
//   }, [placesLibrary]);

//   const updateResults = (inputValue: string) => {
//     if (!service || inputValue.length === 0) {
//       setResults([]);
//       return;
//     }
//     const request = { input: inputValue };
//     service.getQueryPredictions(request, (res) => {
//       setResults(res);
//     });
//   };

//   const onInputChange = (ev: any) => {
//     const value = ev.detail.value ?? ""; // detail.value can be string | null
//     setInputValue(value);
//     updateResults(value);
//   };

//   const handleSelectedPlace = (
//     place: google.maps.places.QueryAutocompletePrediction
//   ) => {
//     setInputValue(place.description);
//     setResults([]);
//   };

//   if (!service) return null;

//   return (
//     <div style={{ position: "relative", width: "100%" }}>
//       <IonInput
//         value={inputValue}
//         label="Address"
//         labelPlacement="floating"
//         fill="outline"
//         placeholder="Enter Address"
//         onIonChange={onInputChange}
//       />
//       {results && results.length > 0 && (
//         <ul className="bg-white mt-2">
//           {results.map((place) => (
//             <li
//               className="cursor-pointer whitespace-nowrap p-1 hover:bg-slate-100 overflow-hidden"
//               key={place.place_id}
//               onClick={() => handleSelectedPlace(place)}
//             >
//               {place.description}
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default AddressAutocompleteInput;

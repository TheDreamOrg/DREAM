"use client"
import React, { useRef, useState } from "react";
import Map, { Source, Layer } from "react-map-gl";
import axios from 'axios';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

const stateOptions = [
  { value: "", label: "Select a state" },
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" }
];

const colorLegend = [
  { color: 'rgb(255,0,0)', label: 'Not Permitted' },
  { color: 'rgb(255,69,0)', label: 'Terrible' },
  { color: 'rgb(255,165,0)', label: 'Bad' },
  { color: 'rgb(255,255,0)', label: 'OK' },
  { color: 'rgb(144,238,144)', label: 'Good' },
  { color: 'rgb(0,100,0)', label: 'Great' },
];

const MapComponent = () => {
  const mapRef = useRef();
  const [selectedState, setSelectedState] = useState("");
  const [zipcodeData, setZipcodeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchZipcodeData = async () => {
    if (!selectedState) {
      setError("Please select a state");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/getZipcodeData", { countyname: selectedState });
      
      if (response.data && Array.isArray(response.data)) {
        setZipcodeData(response.data);
        console.log(response.data[0])
        // If we have data, zoom to the first zipcode's coordinates
        if (response.data.length > 0 && response.data[0].lat && response.data[0].long) {
          mapRef.current.flyTo({
            center: [response.data[0].long, response.data[0].lat],
            zoom: 7,
            essential: true,
          });
        }
      }
    } catch (error) {
      setError(error.response?.data?.error || "Error fetching data");
      console.error("Error fetching zipcode data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setZipcodeData([]);
    setSelectedState("");
    setError("");
    mapRef.current.flyTo({
      center: [-98.5795, 39.8283],
      zoom: 3,
      essential: true,
    });
  };

  const getColor = (lucidscore) => {
    if (lucidscore === undefined || lucidscore === null) return 'rgb(255,255,255)'; // White for undefined
    if (lucidscore === 0) return 'rgb(255,0,0)'; // Red for not permitted
  
    const score = Math.max(0, Math.min(1, lucidscore));
  
    if (score <= 0.2) {
      return 'rgb(255,69,0)'; // Deep Orange for terrible
    } else if (score < 0.4) {
      return 'rgb(255,165,0)'; // Light Orange for bad
    } else if (score < 0.6) {
      return 'rgb(255,255,0)'; // Yellow for OK
    } else if (score < 0.8) {
      return 'rgb(144,238,144)'; // Light Green for good
    } else {
      return 'rgb(0,100,0)'; // Dark Green for great
    }
  };

  const createGeoJsonData = () => {
    if (!zipcodeData || zipcodeData.length === 0) return null;

    return {
      type: "FeatureCollection",
      features: zipcodeData
        .filter(zipcode => zipcode && zipcode.geojson)
        .map((zipcode) => ({
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [zipcode.geojson],
          },
          properties: {
            color: getColor(zipcode.score),
            zipcode: zipcode.zipcode,
            score: zipcode.score
          },
        })),
    };
  };

  const zipcodeLayer = {
    id: "zipcode-layer",
    type: "fill",
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": 0.7,
    },
  };

  const zipcodeOutlineLayer = {
    id: "zipcode-outline",
    type: "line",
    paint: {
      "line-color": "#000",
      "line-width": 1,
    },
  };

  const geoJsonData = createGeoJsonData();

  return (
    <div className="relative w-full h-screen">
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: 39.8283,
          longitude: -98.5795,
          zoom: 3,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v10"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {geoJsonData && (
          <Source id="zipcode-data" type="geojson" data={geoJsonData}>
            <Layer {...zipcodeLayer} />
            <Layer {...zipcodeOutlineLayer} />
          </Source>
        )}
      </Map>

      <div className="absolute top-4 left-4 right-4 z-10 bg-white p-4 rounded shadow-md space-y-2 md:w-64 md:right-auto">
        <div className="space-y-2">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded bg-white text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {stateOptions.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
          <button
            onClick={fetchZipcodeData}
            disabled={loading}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 transition duration-200"
          >
            {loading ? "Loading..." : "Search"}
          </button>
          <button
            onClick={handleReset}
            className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
          >
            Reset Map
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        {zipcodeData.length > 0 && (
          <div className="text-sm text-gray-600">
            Found {zipcodeData.length} zipcodes
          </div>
        )}
      </div>

      <div className="absolute bottom-4 text-black left-4 right-4 z-10 bg-white p-4 rounded shadow-md md:w-64 md:left-4 md:right-auto">
        <h3 className="font-bold mb-2">Legend</h3>
        <div className="grid grid-cols-2 gap-2">
          {colorLegend.map(({ color, label }) => (
            <div key={label} className="flex items-center">
              <div className="w-4 h-4 mr-2" style={{ backgroundColor: color }}></div>
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-20 left-4 flex flex-col space-y-2 md:top-auto md:bottom-4 md:left-auto md:right-4">
        <button
          onClick={() => mapRef.current.zoomIn()}
          className="bg-white w-8 h-8 rounded shadow hover:bg-gray-200 transition duration-200 flex items-center justify-center"
        >
          <span className="text-2xl font-bold text-gray-600">+</span>
        </button>
        <button
          onClick={() => mapRef.current.zoomOut()}
          className="bg-white w-8 h-8 rounded shadow hover:bg-gray-200 transition duration-200 flex items-center justify-center"
        >
          <span className="text-2xl font-bold text-gray-600">-</span>
        </button>
      </div>

    </div>
  );
};

export default MapComponent;
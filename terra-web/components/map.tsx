"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

import { fetchAgricultureData, generateLandSummary } from "@/utils/dataFetchers";

interface CustomLayerInterface extends maptilersdk.CustomLayerInterface {
  camera?: THREE.Camera;
  scene?: THREE.Scene;
  renderer?: THREE.WebGLRenderer;
  map?: maptilersdk.Map;
}

export type SensorData = {
  temperature: number;
  humidity: number;
  latitude: number;
  longitude: number;
  timestamp: string;
};

const demoSensorData: SensorData = {
  temperature: 25.5,
  humidity: 60,
  latitude: 41.3611847,
  longitude: 36.1770237,
  timestamp: new Date().toISOString(),
};

type SearchResult = {
  id: string;
  place_name: string;
  center: [number, number];
};

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<
    [number, number] | null
  >(null);
  const [isChatboxOpen, setIsChatboxOpen] = useState(false);
  const initialPin = { lat: 41.3611847, lng: 36.1770237 };
  const zoom = 14;
  maptilersdk.config.apiKey = process.env
    .NEXT_PUBLIC_MAPTILER_API_KEY as string;
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const clickMarkerRef = useRef<maptilersdk.Marker | null>(null);
  const sensorMarkerRef = useRef<maptilersdk.Marker | null>(null);
  const [nearSensor, setNearSensor] = useState(false);
  const [landSummary, setLandSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [is3DModelEnabled, setIs3DModelEnabled] = useState(true);
  const [modelLoadingError, setModelLoadingError] = useState<string | null>(
    null
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! How can I help you with information about this land?",
    },
  ]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const add3DModel = useCallback(() => {
    if (!map.current || !is3DModelEnabled) {
      return;
    }

    const modelOrigin: [number, number] = [initialPin.lng, initialPin.lat];
    const modelAltitude = 0;
    const modelRotate = [Math.PI / 2, 0, 0];

    const modelAsMercatorCoordinate = maptilersdk.MercatorCoordinate.fromLngLat(
      modelOrigin,
      modelAltitude
    );

    const modelTransform = {
      translateX: modelAsMercatorCoordinate.x,
      translateY: modelAsMercatorCoordinate.y,
      translateZ: modelAsMercatorCoordinate.z,
      rotateX: modelRotate[0],
      rotateY: modelRotate[1],
      rotateZ: modelRotate[2],
      scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * 10,
    };

    const customLayer: CustomLayerInterface = {
      id: "3d-model",
      type: "custom",
      renderingMode: "3d",
      onAdd: function (map: maptilersdk.Map, gl: WebGLRenderingContext) {
        console.log("3D model layer added to map");
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        // Remove ambient and directional lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight);

        const loader = new GLTFLoader();
        loader.load(
          "model.gltf",
          (gltf) => {
            if (gltf && gltf.scene) {
              // Create a matte orange material
              const matteOrangeMaterial = new THREE.MeshBasicMaterial({
                color: 0xff8c00, // Deep orange color
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9,
              });

              // Apply the material to all meshes in the model
              gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.material = matteOrangeMaterial;
                }
              });

              this.scene!.add(gltf.scene);
            }
          },
          undefined,
          (error) => {
            console.error("Error loading 3D model:", error);
            setModelLoadingError(
              "Failed to load 3D model. Falling back to 2D map."
            );
            setIs3DModelEnabled(false);
          }
        );

        this.map = map;

        try {
          this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true,
          });
          this.renderer.autoClear = false;
        } catch (error) {
          console.error("Failed to create WebGL renderer:", error);
          setModelLoadingError(
            "WebGL rendering not supported. Falling back to 2D map."
          );
          setIs3DModelEnabled(false);
        }
      },
      render: function (
        gl: WebGLRenderingContext,
        matrix: number[] | Float32Array
      ) {
        if (!this.camera || !this.scene || !this.renderer || !this.map) {
          return;
        }

        const rotationX = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(1, 0, 0),
          modelTransform.rotateX
        );
        const rotationY = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 1, 0),
          modelTransform.rotateY
        );
        const rotationZ = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 0, 1),
          modelTransform.rotateZ
        );

        const m = new THREE.Matrix4().fromArray(matrix as number[]);
        const l = new THREE.Matrix4()
          .makeTranslation(
            modelTransform.translateX,
            modelTransform.translateY,
            modelTransform.translateZ
          )
          .scale(
            new THREE.Vector3(
              modelTransform.scale,
              -modelTransform.scale,
              modelTransform.scale
            )
          )
          .multiply(rotationX)
          .multiply(rotationY)
          .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.state.reset();

        try {
          this.renderer.render(this.scene, this.camera);
        } catch (error) {
          console.error("Error rendering 3D model:", error);
          setModelLoadingError(
            "Error rendering 3D model. Falling back to 2D map."
          );
          setIs3DModelEnabled(false);
        }

        this.map.triggerRepaint();
      },
    };

    // TODO: Find a more specific type for the custom layer
    map.current.addLayer(customLayer);
    console.log("3D model layer added successfully");
  }, [is3DModelEnabled, initialPin.lat, initialPin.lng]);

  useEffect(() => {
    if (map.current) return;

    console.log("Initializing map...");

    map.current = new maptilersdk.Map({
      container: mapContainer.current!,
      style: maptilersdk.MapStyle.SATELLITE,
      center: [initialPin.lng, initialPin.lat],
      zoom: zoom,
      terrain: true,
      terrainControl: true,
      pitch: 60,
      bearing: -100.86,
      maxPitch: 85,
      maxZoom: 30,
      antialias: true,
    });

    console.log("Map instance created");

    map.current.on("load", () => {
      console.log("Map loaded event fired");
      setMapLoaded(true);
      fetchSensorData();
      add3DModel();
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialPin.lng, initialPin.lat, add3DModel]);

  useEffect(() => {
    if (sensorData) {
      console.log("Sensor data updated:", sensorData);
    }
  }, [sensorData]);

  const fetchSensorData = async () => {
    setSensorData(demoSensorData);

    if (map.current && demoSensorData.latitude && demoSensorData.longitude) {
      if (sensorMarkerRef.current) {
        sensorMarkerRef.current.setLngLat([
          demoSensorData.longitude,
          demoSensorData.latitude,
        ]);
        console.log("Existing sensor marker updated");
      } else {
        sensorMarkerRef.current = new maptilersdk.Marker({
          color: "#FF0000",
        })
          .setLngLat([demoSensorData.longitude, demoSensorData.latitude])
          .addTo(map.current);
        console.log("New sensor marker added");
      }
    }
  };

  const getDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Radius of the earth in km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
          Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c; // Distance in km
      return d;
    },
    []
  );

  const handleMapClick = useCallback(
    async (e: maptilersdk.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      console.log("Map clicked. Coordinates:", lng, lat);
      setSelectedCoordinates([lng, lat]);
      setIsChatboxOpen(true);
      setIsLoadingSummary(true);
      setLandSummary(null);

      if (map.current) {
        if (clickMarkerRef.current) {
          clickMarkerRef.current.remove();
        }

        // Create a custom marker element
        const el = document.createElement("div");
        el.className = "custom-marker";
        el.style.width = "20px";
        el.style.height = "20px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#FFFFFF";
        el.style.border = "2px solid #000000"; // Black border
        el.style.boxShadow = "0 0 5px rgba(0,0,0,0.5)"; // Shadow for better visibility

        // Create a new marker with the custom element
        clickMarkerRef.current = new maptilersdk.Marker({
          element: el,
        })
          .setLngLat([lng, lat])
          .addTo(map.current);

        // Check if click is within 10km of sensor
        if (sensorData) {
          const distance = getDistance(
            lat,
            lng,
            sensorData.latitude,
            sensorData.longitude
          );
          console.log(`Distance to sensor: ${distance.toFixed(2)} km`);
          setNearSensor(distance <= 10);
          console.log(`Near sensor: ${distance <= 10}`);
        } else {
          console.log("No sensor data available");
        }

        try {
          // Fetch terrain and land cover data
          const agricultureData = await fetchAgricultureData(lat, lng);

          // Generate summary using GPT-4
          const summary = await generateLandSummary(
            lat,
            lng,
            agricultureData,
            sensorData
          );
          setLandSummary(summary);
        } catch (error) {
          console.error("Error fetching data or generating summary:", error);
          setLandSummary("Unable to generate land summary at this time.");
        } finally {
          setIsLoadingSummary(false);
        }
      }
    },
    [
      sensorData,
      map,
      setSelectedCoordinates,
      setIsChatboxOpen,
      setIsLoadingSummary,
      setLandSummary,
      clickMarkerRef,
      setNearSensor,
      getDistance,
      fetchAgricultureData,
      generateLandSummary,
    ]
  );

  useEffect(() => {
    if (map.current) {
      map.current.on("click", handleMapClick);
      return () => {
        if (map.current) {
          map.current.off("click", handleMapClick);
        }
      };
    }
  }, [handleMapClick]);

  useEffect(() => {
    if (mapLoaded && is3DModelEnabled) {
      const timer = setTimeout(() => {
        add3DModel();
      }, 2000); // 2 seconds delay

      return () => clearTimeout(timer);
    }
  }, [mapLoaded, is3DModelEnabled, add3DModel]);

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { role: "user", content: input };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            landSummary,
            selectedCoordinates,
            sensorData,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get chat response");
        }

        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      } catch (error) {
        console.error("Error in chat:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
          },
        ]);
      }
    }
  };

  const handleSearch = useCallback(async () => {
    if (searchQuery.length > 0 && (!selectedResult || searchQuery !== selectedResult.place_name)) {
      try {
        const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(searchQuery)}.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`);
        const data = await response.json();
        setSearchResults(data.features);
        setSelectedResult(null);
      } catch (error) {
        console.error('Error searching:', error);
      }
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedResult]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  const handleResultClick = (result: SearchResult) => {
    setSearchQuery(result.place_name);
    setSelectedResult(result);
    setSearchResults([]);
    inputRef.current?.focus();

    if (map.current) {
      map.current.flyTo({ center: result.center, zoom: 14 });
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute w-full h-full" />

      {/* search box */}
      <div className="absolute top-4 left-4 z-20 w-full max-w-sm">
        <div className="relative">
          <Input
            ref={inputRef}
            className="w-full pl-10 pr-2 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            placeholder="Search locations..."
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search locations"
            aria-autocomplete="list"
            aria-controls="search-results"
          />
          <Button
            className="absolute inset-y-0 left-0 flex items-center pl-3"
            type="submit"
            variant="ghost"
            aria-label="Submit search"
            onClick={handleSearch}
          >
            <Search className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
        {searchResults.length > 0 && (
          <ul
            id="search-results"
            className="mt-2 bg-white rounded-md shadow-lg max-h-60 overflow-auto"
            role="listbox"
          >
            {searchResults.map((result) => (
              <li 
                key={result.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleResultClick(result)}
                role="option"
                aria-selected={result === selectedResult}
              >
                {result.place_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {modelLoadingError && (
        <div className="absolute top-0 left-0 bg-red-500 text-white p-2 m-2 rounded">
          {modelLoadingError}
        </div>
      )}
      <AnimatePresence>
        {isChatboxOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-2 left-4 bottom-4 w-96 bg-white shadow-lg rounded-2xl overflow-hidden mt-14"
          >
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-2xl font-bold text-gray-800">
                  Land Information
                </h2>
                <button
                  onClick={() => {
                    setIsChatboxOpen(false);
                    console.log("Chatbox closed");
                  }}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-4">
                {selectedCoordinates && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Selected Location
                    </h3>
                    <p className="text-sm text-gray-700">
                      Latitude: {selectedCoordinates[1].toFixed(6)}
                      <br />
                      Longitude: {selectedCoordinates[0].toFixed(6)}
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-1 text-gray-800">
                    Land Summary
                  </h3>
                  {isLoadingSummary ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  ) : landSummary ? (
                    <>
                      <p className="text-gray-700">{landSummary}</p>
                      <button
                        onClick={() => {
                          setIsChatOpen(true);
                          console.log("Chat opened");
                        }}
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                      >
                        Ask More
                      </button>
                    </>
                  ) : (
                    <p className="text-gray-700">
                      Click on the map to generate a land summary.
                    </p>
                  )}
                </div>

                {nearSensor && sensorData && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">
                      Nearby Sensor Data
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">
                            Temperature
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {sensorData.temperature}°C
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">
                            Humidity
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {sensorData.humidity}%
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-xs text-gray-500">
                            Last updated:
                          </span>
                          <span className="text-xs font-medium text-gray-900 ml-1">
                            {new Date(sensorData.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!mapLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-white"
          >
            <p className="text-2xl font-bold text-gray-800">Loading map...</p>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-lg shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="text-2xl font-semibold">Chat about this land</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatOpen(false)}
                  aria-label="Close chat"
                >
                  <X className="h-6 w-6" />
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full pr-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 ${
                        message.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      <div
                        className={`inline-block rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex w-full items-center space-x-2"
                >
                  <Input
                    id="message"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" aria-label="Send message">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

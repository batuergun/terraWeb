"use client";

import React, { useRef, useEffect, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { motion, AnimatePresence } from "framer-motion";

interface CustomLayerInterface
  extends Omit<maptilersdk.CustomLayerInterface, "render"> {
  camera?: THREE.Camera;
  scene?: THREE.Scene;
  renderer?: THREE.WebGLRenderer;
  map?: maptilersdk.Map;
  render(gl: WebGLRenderingContext, matrix: number[] | Float32Array): void;
}

type SensorData = {
  temperature: number;
  humidity: number;
  latitude: number;
  longitude: number;
  timestamp: string;
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

  useEffect(() => {
    if (map.current) return;

    console.log("Initializing map...");

    map.current = new maptilersdk.Map({
      container: mapContainer.current!,
      style: maptilersdk.MapStyle.OUTDOOR,
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
  }, []);

  useEffect(() => {
    if (sensorData) {
      console.log("Sensor data updated:", sensorData);
    }
  }, [sensorData]);

  const fetchSensorData = async () => {
    console.log("Fetching sensor data...");
    try {
      const response = await fetch("/api/sensor-data", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
        },
      });
      if (response.ok) {
        const data: SensorData = await response.json();
        console.log("Sensor data fetched:", data);
        setSensorData(data);

        if (map.current && data.latitude && data.longitude) {
          if (sensorMarkerRef.current) {
            sensorMarkerRef.current.setLngLat([data.longitude, data.latitude]);
            console.log("Existing sensor marker updated");
          } else {
            sensorMarkerRef.current = new maptilersdk.Marker({ color: "#FF0000" })
              .setLngLat([data.longitude, data.latitude])
              .addTo(map.current);
            console.log("New sensor marker added");
          }
        }
      } else {
        console.error("Failed to fetch sensor data:", response.status, response.statusText);
        setSensorData(null);
      }
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      setSensorData(null);
    }
  };

  const handleMapClick = (e: maptilersdk.MapMouseEvent) => {
    const { lng, lat } = e.lngLat;
    console.log("Map clicked. Coordinates:", lng, lat);
    setSelectedCoordinates([lng, lat]);

    if (map.current) {
      if (clickMarkerRef.current) {
        clickMarkerRef.current.remove();
      }

      clickMarkerRef.current = new maptilersdk.Marker({ color: "#0000FF" })
        .setLngLat([lng, lat])
        .addTo(map.current);

      console.log("Blue marker added at clicked location");

      // Check if click is within 10km of sensor
      if (sensorData) {
        console.log("Checking distance to sensor...");
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
    }

    setIsChatboxOpen(true);
    console.log("Chatbox opened");
  };

  useEffect(() => {
    if (map.current) {
      map.current.on("click", handleMapClick);
      return () => {
        map.current?.off("click", handleMapClick);
      };
    }
  }, [map.current, sensorData]);

  const add3DModel = () => {
    console.log("Adding 3D model...");
    if (!map.current) {
      console.log("Map not initialized, cannot add 3D model");
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

        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff);
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight2);

        const loader = new GLTFLoader();
        loader.load(
          "https://docs.maptiler.com/sdk-js/assets/34M_17/34M_17.gltf",
          (gltf) => {
            if (gltf && gltf.scene) {
              this.scene!.add(gltf.scene);
            }
          }
        );

        this.map = map;

        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true,
        });

        this.renderer.autoClear = false;
      },
      render: function (
        gl: WebGLRenderingContext,
        matrix: number[] | Float32Array
      ) {
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

        this.camera!.projectionMatrix = m.multiply(l);
        this.renderer!.state.reset();
        this.renderer!.render(this.scene!, this.camera!);
        this.map!.triggerRepaint();
      },
    };

    map.current.addLayer(customLayer as any);
    console.log("3D model layer added successfully");
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  return (
    <div className="relative w-full h-[calc(100vh-77px)]">
      <div ref={mapContainer} className="absolute w-full h-full" />
      <AnimatePresence>
        {isChatboxOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 w-80 h-full bg-white shadow-lg p-4 text-black"
          >
            <h2 className="text-xl font-bold mb-4">Coordinates Info</h2>
            {selectedCoordinates && (
              <p>
                Latitude: {selectedCoordinates[1].toFixed(6)}
                <br />
                Longitude: {selectedCoordinates[0].toFixed(6)}
              </p>
            )}
            {nearSensor && sensorData && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Nearby Sensor Data</h3>
                <p>Temperature: {sensorData.temperature}°C</p>
                <p>Humidity: {sensorData.humidity}%</p>
                <p>Last updated: {new Date(sensorData.timestamp).toLocaleString()}</p>
              </div>
            )}
            <button
              onClick={() => {
                setIsChatboxOpen(false);
                console.log("Chatbox closed");
              }}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>
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
            <p className="text-2xl font-bold">Loading map...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const markerRef = useRef<maptilersdk.Marker | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<
    [number, number] | null
  >(null);
  const [isChatboxOpen, setIsChatboxOpen] = useState(false);
  const initialPin = { lat: 41.3611847, lng: 36.1770237 };
  const zoom = 14;
  maptilersdk.config.apiKey = process.env
    .NEXT_PUBLIC_MAPTILER_API_KEY as string;

  useEffect(() => {
    if (map.current) return; // stops map from intializing more than once

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

    // print clicked
    map.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      console.log("Clicked coordinates:", lng, lat);
      setSelectedCoordinates([lng, lat]);

      if (map.current) {
        // Remove the old marker if it exists
        if (markerRef.current) {
          markerRef.current.remove();
        }

        // Create a new marker
        markerRef.current = new maptilersdk.Marker({ color: "#FF0000" })
          .setLngLat([lng, lat])
          .addTo(map.current);
      }

      setIsChatboxOpen(true);
    });

    // initial marker
    // new maptilersdk.Marker({ color: "#FF0000" })
    //   .setLngLat([initialPin.lng, initialPin.lat])
    //   .addTo(map.current);

    // add marker
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
      scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
    };

    const customLayer: CustomLayerInterface = {
      id: "3d-model",
      type: "custom",
      renderingMode: "3d",
      onAdd: function (map: maptilersdk.Map, gl: WebGLRenderingContext) {
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

    map.current.on("style.load", () => {
      map.current!.addLayer(customLayer as any);
    });
  }, [initialPin.lng, initialPin.lat, zoom]);

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
            className="absolute top-0 right-0 w-80 h-full bg-white shadow-lg p-4"
          >
            <h2 className="text-xl font-bold mb-4">Coordinates Info</h2>
            {selectedCoordinates && (
              <p>
                Latitude: {selectedCoordinates[1].toFixed(6)}
                <br />
                Longitude: {selectedCoordinates[0].toFixed(6)}
              </p>
            )}
            <button
              onClick={() => setIsChatboxOpen(false)}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

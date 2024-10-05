"use client";

import React, { useRef, useEffect } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const pin = { lat: 41.3611847, lng: 36.1770237 };
  const zoom = 14;
  maptilersdk.config.apiKey = process.env
    .NEXT_PUBLIC_MAPTILER_API_KEY as string;
  console.log(maptilersdk.config.apiKey);

  useEffect(() => {
    if (map.current) return; // stops map from intializing more than once

    map.current = new maptilersdk.Map({
      container: mapContainer.current!,
      style: maptilersdk.MapStyle.OUTDOOR,
      center: [pin.lng, pin.lat],
      zoom: zoom,
      terrain: true,
      terrainControl: true,
      pitch: 60,
      bearing: -100.86,
      maxPitch: 85,
      maxZoom: 14,
      antialias: true
    });

    map.current.on("click", (e) => {
      console.log("Clicked coordinates:", e.lngLat.lng, e.lngLat.lat);
    });

    new maptilersdk.Marker({color: "#FF0000"})
      .setLngLat([pin.lng, pin.lat])
      .addTo(map.current);
  }, [pin.lng, pin.lat, zoom]);

  return (
    <div className="relative w-full h-[calc(100vh-77px)]">
      <div ref={mapContainer} className="absolute w-full h-full" />
    </div>
  );
}

"use client";

import Map from "@/components/map";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOverlay(false);
    }, 3000); // 3 seconds delay before starting fade out

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-screen">
      <Map />

      {/* Overlay */}
      <div
        className={`absolute inset-7 bg-black flex flex-col items-center justify-center transition-opacity duration-[2000ms] z-50 ${
          showOverlay ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-1/2 max-w-md aspect-square relative mb-8">
          <Image
            src="/cosmos.png"
            alt="Cosmos Logo"
            layout="fill"
            objectFit="contain"
            priority
          />
        </div>
        <div className="w-14 h-14 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>

      {/* Top middle logo */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 p-2 rounded-full bg-white bg-opacity-30 backdrop-blur-sm">
        <Image 
          src="/cosmos2.png" 
          alt="Second Logo" 
          width={150} 
          height={150}
          className="drop-shadow-lg"
        />
      </div>

      {/* Bottom right dataset name */}
      <div className="absolute bottom-6 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded z-10">
        <h1 className="text-lg">MODIS-13A1-061</h1>
      </div>
    </div>
  );
}
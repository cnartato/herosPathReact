import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

export default function Markerwhatever(props) {
  const map = useMap();
  const prevPos = useRef(null);
 
  useEffect(() => {
    if(props.lat && props.lng) {
      const newPos = [props.lat, props.lng];
      
      // Only pan if position has actually changed
      if (!prevPos.current || 
          prevPos.current[0] !== newPos[0] || 
          prevPos.current[1] !== newPos[1]) {
        
        // Use panTo for smooth, real-time animation
        map.panTo(newPos, {
          animate: true,
          duration: 0.5, // 0.5 second smooth animation
          easeLinearity: 0.25
        });
        
        prevPos.current = newPos;
      }
    }
  }, [props.lat, props.lng, map]);

  return (
    <div>
    </div>
  );
}

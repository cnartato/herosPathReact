import React from "react";
import { Marker, useMap } from "react-leaflet";

export default function Markerwhatever(props) {
  const map = useMap();
 
  if(props.lat && props.lng) 
    map.setView([props.lat,props.lng])

  return (
    <div>
    </div>
  );
}

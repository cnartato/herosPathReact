import './App.css';
import 'leaflet/dist/leaflet.css';

import React, { useState, useEffect , useRef} from 'react';
import { MapContainer, TileLayer , Marker, Polyline, useMap, useMapEvent} from 'react-leaflet'
import Playbar from './components/playbar';

import Move from './components/move';

function App() {

  const trailLength = 8

  const centerCoords = [ 
    29.6260028,
    -82.3411691
  ]

  const [pos, setPoses] = useState([])
  const [historyPos, setHistoryPoses] = useState([])
  const [stepname, setstepname] = useState('')
  const [posStep, setPositionStep] = useState(0)
  const [uploadedPoses, setUploadedPos] = useState();
  const [playing, setPlaying] = useState(false);

  const [focusPos, setFocusPos] = useState(false);
  const [focusZoom, setFocusZoom] = useState(13);


  const distance = (xya,xyb) => {
    const xa = xya[0]
    const ya = xya[1]
    const xb = xyb[0]
    const yb = xyb[1]
    return Math.sqrt(Math.pow(xb-xa,2) + Math.pow(yb-ya,2))
  }

  const newTimestamp = () => {
    if(!uploadedPoses?.length) return 
    if(!uploadedPoses[posStep]) return setPlaying(false)
    if(isNaN(uploadedPoses[posStep][2])) return setPlaying(false)

    const nextStep = uploadedPoses[posStep]

    console.log(nextStep)

    setstepname(nextStep[0])
    const stepToPush = [nextStep[2], nextStep[3]]

    if(pos.length)
    {
      const prestepToPush = pos[pos.length-1]
      
      setFocusPos(stepToPush)
      const dist = (distance(stepToPush, prestepToPush)) 
      console.log(dist)

      if(dist > 0.1) setFocusZoom(7)
      //else if(dist > 0.08) setFocusZoom(8)
      else if (focusZoom < 12) setFocusZoom(focusZoom + 0.005)
    }

    const newPos = [...pos, stepToPush]

    if(newPos.length > trailLength) {
      let removePos = newPos.shift()
      
      const newHistoryPos = [...historyPos, removePos]
      setHistoryPoses(newHistoryPos)
    }
    
    setPoses(newPos)

    setPositionStep(posStep+1)
  }

  const upload = (event)=>{
    var input = event.target;

    var reader = new FileReader();
    reader.onload = function() {
      var text = reader.result;

      parseCsv(text)
    }
    reader.readAsText(input.files[0]);

    setPlaying(true)
  }

  const parseCsv = (csvContents) => {
    const lines = csvContents.split('\n')

    let output = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if(i===0) continue
      
      const cells = line.split(',')
      const dcon = convertTimestamp(cells[2])
      const date = dcon.date
      const time = dcon.time
      const lat = cells[0]
      const long = cells[1]
      //const date = (cells[0])
      //const time = (cells[1])
      //const long = parseFloat(cells[2])
      //const lat = parseFloat(cells[3])
      output.push([date, time, lat, long])
    }

    setUploadedPos(output)
  }

  function convertTimestamp(swiftTimestamp) {
    let dateObj = new Date(swiftTimestamp * 1000); // convert to milliseconds

    let date = dateObj.toISOString().split('T')[0]; // extract date (YYYY-MM-DD)
    let time = dateObj.toISOString().split('T')[1].slice(0, -1); // extract time with milliseconds

    return { date, time };
}
  return (
   <>
      <input type="file" onChange={upload} style={{position:'absolute', zIndex: 2000, top:0, right: 0}}></input>

      <Playbar newTimestamp={newTimestamp} range={uploadedPoses?.length} playing={playing} stepname={stepname}></Playbar>

      <MapContainer key={JSON.stringify([centerCoords[0], centerCoords[1]])} center={[centerCoords[0], centerCoords[1]]} zoom={focusZoom}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline positions={historyPos} color="rgba(2,244,244,.6)" />
        <Polyline positions={pos} color="blue" />
        <Move lat={focusPos[0]} lng={focusPos[1]} zoom={focusZoom}></Move>
      </MapContainer>
   </>
  );
}

export default App;

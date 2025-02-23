import './App.css';
import {addHours, parseCsv, findPosesWithinPeriod, findLastEstablishedPos,
  formInterpolatedPoint, findFutureEstablishedPosOutsidePeriod, trimPath} from './Helper.js'
import React, { useState, useEffect , useRef} from 'react';
import { MapContainer, TileLayer , Marker, Polyline, useMap, useMapEvent} from 'react-leaflet'
import 'leaflet/dist/leaflet.css';
import Playbar from './components/playbar';
import Move from './components/move';

function App() 
{
  const DEBUGMODE = false
  const stepSize = .05 / 4 //1 hour
  const trailLength = 2

  const urlParams = new URLSearchParams(window.location.search)


  const tick = urlParams.get('tick') || 100 
  const centerCoords = [ 
    29.6260028,
    -82.3411691
  ]

  const [positionHistoryPathMain, setPositionHistoryPathMain] = useState([])
  const [historyPos, setHistoryPoses] = useState([])
  const [positionHistoryPathInterpolatedOnly, setPositionHistoryPathInterpolatedOnly] = useState([])
  const [stepname, setstepname] = useState('')
  const [posStep, setPositionStep] = useState(0)//51770 * 4) //posStep is the amount of configured units (probably hours) away from beginning
  const [uploadedPoses, setUploadedPos] = useState([])
  const [playing, setPlaying] = useState(false)
  const [focusPos, setFocusPos] = useState(false)
  const [focusZoom, setFocusZoom] = useState(13)
  const [startingDate, setStartingDate] = useState('')
  let [stepsBetweenInitialInterpolatedAndEstablished, setStepsTillEstablishedPoint] = useState('')
  let [initialInterpolatedPos, setInitialInterpolatedPos] = useState('')

  const startingDateRef = useRef(startingDate)

  useEffect(() => {
    startingDateRef.current = startingDate; // Update ref with new startingDate
  }, [startingDate])

  const newTimestamp = () => {
    if(!startingDate) return

    let newPosStep = posStep + 1

    let updatedHistoryPathMain = [...positionHistoryPathMain]
    let updatedHistoryPathInterpolatedOnly = [...positionHistoryPathInterpolatedOnly]

    let previousTime = addHours(startingDate, posStep * stepSize)
    let currentTime = addHours(startingDate, newPosStep * stepSize)
    setstepname(currentTime.toLocaleString())

    //Add Positions Within Range to Array
    let posesWithinPeriod = findPosesWithinPeriod(previousTime, currentTime, uploadedPoses)
    for (let i = 0; i < posesWithinPeriod.length; i++) {
      const posWithinPeriod = posesWithinPeriod[i]
      console.log('Placing an established point', posWithinPeriod)
      updatedHistoryPathMain.push([posWithinPeriod.lat, posWithinPeriod.long])
    }
    
    let upcomingEstablishedPos = findFutureEstablishedPosOutsidePeriod(currentTime, uploadedPoses)
    let mostRecentEstablishedPos = findLastEstablishedPos(currentTime, uploadedPoses)

    if(upcomingEstablishedPos) 
    {
      let interpolatedPoint = formInterpolatedPoint(upcomingEstablishedPos,mostRecentEstablishedPos,currentTime)
      updatedHistoryPathMain.push(interpolatedPoint)
    }

    updatedHistoryPathInterpolatedOnly = [
      {lat: upcomingEstablishedPos.lat, lng: upcomingEstablishedPos.long},
      {lat: mostRecentEstablishedPos.lat, lng: mostRecentEstablishedPos.long},
    ]
    
    trimPath(updatedHistoryPathMain, trailLength)
    trimPath(updatedHistoryPathInterpolatedOnly, 2)

    setPositionHistoryPathMain(updatedHistoryPathMain)
    setPositionHistoryPathInterpolatedOnly(updatedHistoryPathInterpolatedOnly)
    setPositionStep(newPosStep)
    setStepsTillEstablishedPoint(stepsBetweenInitialInterpolatedAndEstablished)
    setInitialInterpolatedPos(initialInterpolatedPos)
  }

  const upload = (e) =>{
    var reader = new FileReader()
    reader.onload = () => {
      const csv = parseCsv(reader.result)
      setUploadedPos(csv)
      setStartingDate(csv[0].datetime)
    }
    reader.readAsText(e.target.files[0])
    setPlaying(true)
  }

  React.useEffect(() => {
    fetchData()
    async function fetchData()
    {
      if(DEBUGMODE) {
        const response = await (await fetch('/New Locations.csv')).text()
        const csv = parseCsv(response)
        setUploadedPos(csv)
        setStartingDate(csv[0].datetime)
        setPlaying(true)
      }
    }
  }, [DEBUGMODE])

  return (
   <>
      <input type="file" onChange={upload} style={{position:'absolute', zIndex: 2000, }}></input>

      <Playbar newTimestamp={newTimestamp} range={uploadedPoses?.length} playing={playing} stepname={stepname} tick={tick}></Playbar>

      <MapContainer key={JSON.stringify([centerCoords[0], centerCoords[1]])} center={[centerCoords[0], centerCoords[1]]} zoom={focusZoom}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline positions={historyPos} color="rgba(2,244,244,.6)" />
        <Polyline positions={positionHistoryPathMain} color="blue" />
        <Move lat={focusPos[0]} lng={focusPos[1]} zoom={focusZoom}></Move>

        {
          positionHistoryPathInterpolatedOnly.map(location => (
            <Marker opacity={0.5} key={location.id} position={[location.lat, location.lng]}>
            </Marker>
          ))
        }
      </MapContainer>
   </>
  )
}

export default App;

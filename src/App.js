import './App.css';
import {addHours, parseCsv, findPosesWithinPeriod, findLastEstablishedPos, findLastEstablishedPosIncludingHome,
  formInterpolatedPoint, findFutureEstablishedPosOutsidePeriod, trimPath} from './Helper.js'
import React, { useState, useEffect , useRef} from 'react';
import { MapContainer, TileLayer , Marker, Polyline, useMap, useMapEvent} from 'react-leaflet'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Playbar from './components/playbar';
import Move from './components/move';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function App() 
{
  const DEBUGMODE = false
  const stepSize = .05 / 4 //1 hour
  const trailLength = 20

  const urlParams = new URLSearchParams(window.location.search)


  const tick = parseInt(urlParams.get('tick')) || 100 
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
  const [maxSteps, setMaxSteps] = useState(null)
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // 1x speed by default
  let [stepsBetweenInitialInterpolatedAndEstablished, setStepsTillEstablishedPoint] = useState('')
  let [initialInterpolatedPos, setInitialInterpolatedPos] = useState('')
  
  console.log('🎬 App render - maxSteps:', maxSteps, 'uploadedPoses.length:', uploadedPoses.length)

  const startingDateRef = useRef(startingDate)

  useEffect(() => {
    startingDateRef.current = startingDate; // Update ref with new startingDate
  }, [startingDate])

  // Calculate maxSteps whenever data changes
  useEffect(() => {
    console.log('🔍 useEffect triggered. uploadedPoses:', uploadedPoses.length, 'startingDate:', startingDate)
    if (uploadedPoses.length > 0 && startingDate) {
      const firstDate = new Date(startingDate)
      const lastDate = new Date(uploadedPoses[uploadedPoses.length - 1].datetime)
      console.log('📅 First date:', firstDate.toLocaleString())
      console.log('📅 Last date:', lastDate.toLocaleString())
      const hoursDifference = (lastDate - firstDate) / (1000 * 60 * 60)
      const calculatedMaxSteps = Math.ceil(hoursDifference / stepSize)
      console.log('⏱️ Hours difference:', hoursDifference)
      console.log('📐 Step size:', stepSize)
      console.log('🔄 Calculated max steps:', calculatedMaxSteps)
      setMaxSteps(calculatedMaxSteps)
      console.log('✅ Set maxSteps to:', calculatedMaxSteps)
    }
  }, [uploadedPoses, startingDate, stepSize])

  const newTimestamp = () => {
    if(!startingDate) return

    let newPosStep = posStep + 1
    
    // Check if we've reached the end
    if (maxSteps && newPosStep >= maxSteps) {
      console.log('🏁 Reached the end! Pausing playback.')
      setPlaying(false)
      return
    }

    let updatedHistoryPathMain = [...positionHistoryPathMain]
    let updatedHistoryPathInterpolatedOnly = [...positionHistoryPathInterpolatedOnly]

    // Use playbackSpeed to adjust how much time each step covers
    let effectiveStepSize = stepSize * playbackSpeed
    let previousTime = addHours(startingDate, posStep * effectiveStepSize)
    let currentTime = addHours(startingDate, newPosStep * effectiveStepSize)

    //Add Positions Within Range to Array
    let posesWithinPeriod = findPosesWithinPeriod(previousTime, currentTime, uploadedPoses)
    
    // If no non-home positions in this period, jump to the next non-home position
    if(posesWithinPeriod.length === 0) {
      let nextNonHomePos = findFutureEstablishedPosOutsidePeriod(currentTime, uploadedPoses)
      if(nextNonHomePos) {
        // Jump time forward to this position
        let timeDiffInHours = (new Date(nextNonHomePos.datetime) - new Date(startingDate)) / (1000 * 60 * 60)
        newPosStep = Math.ceil(timeDiffInHours / effectiveStepSize)
        currentTime = addHours(startingDate, newPosStep * effectiveStepSize)
      }
    }
    
    setstepname(currentTime.toLocaleString())

    // Re-check positions with the potentially updated time
    posesWithinPeriod = findPosesWithinPeriod(previousTime, currentTime, uploadedPoses)
    for (let i = 0; i < posesWithinPeriod.length; i++) {
      const posWithinPeriod = posesWithinPeriod[i]
      console.log('Placing an established point', posWithinPeriod)
      updatedHistoryPathMain.push([posWithinPeriod.lat, posWithinPeriod.long])
    }
    
    let upcomingEstablishedPos = findFutureEstablishedPosOutsidePeriod(currentTime, uploadedPoses)
    let mostRecentEstablishedPos = findLastEstablishedPos(currentTime, uploadedPoses)

    // Check if the gap is too large (more than 24 hours = probably a data gap)
    const MAX_INTERPOLATION_GAP_HOURS = 24;
    let shouldInterpolate = false;
    
    if (upcomingEstablishedPos && mostRecentEstablishedPos) {
      const gapHours = (new Date(upcomingEstablishedPos.datetime) - new Date(mostRecentEstablishedPos.datetime)) / (1000 * 60 * 60);
      shouldInterpolate = gapHours <= MAX_INTERPOLATION_GAP_HOURS;
    }

    if(shouldInterpolate && upcomingEstablishedPos && mostRecentEstablishedPos) 
    {
      let interpolatedPoint = formInterpolatedPoint(upcomingEstablishedPos,mostRecentEstablishedPos,currentTime)
      updatedHistoryPathMain.push(interpolatedPoint)
      
      updatedHistoryPathInterpolatedOnly = [
        {lat: upcomingEstablishedPos.lat, lng: upcomingEstablishedPos.long},
        {lat: mostRecentEstablishedPos.lat, lng: mostRecentEstablishedPos.long},
      ]
      
      // Update focus position to center on current interpolated point
      setFocusPos(interpolatedPoint)
    }
    else if (mostRecentEstablishedPos) {
      // Gap too large - stay at last known position (don't interpolate)
      let lastKnownPoint = [mostRecentEstablishedPos.lat, mostRecentEstablishedPos.long]
      
      // Only add to path if it's not already the last point
      if (updatedHistoryPathMain.length === 0 || 
          updatedHistoryPathMain[updatedHistoryPathMain.length - 1][0] !== lastKnownPoint[0] ||
          updatedHistoryPathMain[updatedHistoryPathMain.length - 1][1] !== lastKnownPoint[1]) {
        updatedHistoryPathMain.push(lastKnownPoint)
      }
      
      // Keep focus on last known position
      setFocusPos(lastKnownPoint)
      
      // Clear interpolation markers during gap
      updatedHistoryPathInterpolatedOnly = []
    }
    
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
      console.log('📊 GPS Data loaded:', csv.length, 'points')
      console.log('🏁 First point:', csv[0]?.datetime?.toLocaleString())
      console.log('🏁 Last point:', csv[csv.length - 1]?.datetime?.toLocaleString())
      
      // Calculate max steps IMMEDIATELY before setting state
      if (csv.length > 0) {
        const firstDate = new Date(csv[0].datetime)
        const lastDate = new Date(csv[csv.length - 1].datetime)
        console.log('📅 firstDate:', firstDate, 'isValid:', !isNaN(firstDate.getTime()))
        console.log('📅 lastDate:', lastDate, 'isValid:', !isNaN(lastDate.getTime()))
        console.log('📅 firstDate.getTime():', firstDate.getTime())
        console.log('📅 lastDate.getTime():', lastDate.getTime())
        const hoursDifference = (lastDate - firstDate) / (1000 * 60 * 60)
        console.log('⏱️ Hours difference:', hoursDifference)
        console.log('📐 stepSize:', stepSize)
        const calculatedMaxSteps = Math.ceil(hoursDifference / stepSize)
        console.log('📏 Calculated Max steps:', calculatedMaxSteps)
        setMaxSteps(calculatedMaxSteps)
        console.log('✅ Called setMaxSteps with:', calculatedMaxSteps)
      }
      
      setUploadedPos(csv)
      setStartingDate(csv[0].datetime)
      console.log('💾 Set uploadedPoses and startingDate')
    }
    reader.readAsText(e.target.files[0])
    setPlaying(true)
  }

  const handleSpeedChange = (newSpeed) => {
    // Calculate current time position BEFORE changing speed
    const currentEffectiveStepSize = stepSize * playbackSpeed
    const currentTimeInHours = posStep * currentEffectiveStepSize
    
    // Update speed
    setPlaybackSpeed(newSpeed)
    
    // Calculate new step position to maintain the same time
    const newEffectiveStepSize = stepSize * newSpeed
    const newStep = Math.round(currentTimeInHours / newEffectiveStepSize)
    setPositionStep(newStep)
    
    // Recalculate maxSteps based on new speed
    if (uploadedPoses.length > 0 && startingDate) {
      const firstDate = new Date(startingDate)
      const lastDate = new Date(uploadedPoses[uploadedPoses.length - 1].datetime)
      const hoursDifference = (lastDate - firstDate) / (1000 * 60 * 60)
      const calculatedMaxSteps = Math.ceil(hoursDifference / newEffectiveStepSize)
      setMaxSteps(calculatedMaxSteps)
      console.log('🔄 Speed changed to', newSpeed + 'x, maxSteps recalculated to', calculatedMaxSteps, 'current step adjusted to', newStep)
    }
  }

  const handleSeek = (newStep) => {
    // When user drags the timeline, jump to that step
    setPositionStep(newStep)
    
    // Calculate the new time position
    let newTime = addHours(startingDate, newStep * stepSize * playbackSpeed)
    setstepname(newTime.toLocaleString())
    
    // Build the trail - get ALL recent positions (including home) leading up to this point
    // Look back much further to ensure we get a visible trail
    let hoursToLookBack = trailLength * stepSize * playbackSpeed * 50 // Look back much more
    let trailStartTime = addHours(newTime, -hoursToLookBack)
    let trailPositions = uploadedPoses.filter(pose => {
      let poseTime = new Date(pose.datetime);
      return poseTime >= new Date(trailStartTime) && poseTime <= new Date(newTime);
    })
    
    console.log('🔍 Seeking - trailPositions found:', trailPositions.length, 'looking back', hoursToLookBack, 'hours')
    
    // Build the path from recent positions (take last N points for the trail)
    let recentPoints = trailPositions.slice(-trailLength)
    let updatedHistoryPathMain = recentPoints.map(pose => [pose.lat, pose.long])
    
    console.log('📍 Building trail with', updatedHistoryPathMain.length, 'actual points')
    
    // Find and display the interpolated position at this time
    let mostRecentPos = findLastEstablishedPosIncludingHome(newTime, uploadedPoses)
    let upcomingPos = uploadedPoses.find(pose => new Date(pose.datetime) > new Date(newTime))
    
    // Check if the gap is too large (more than 24 hours = probably a data gap)
    const MAX_INTERPOLATION_GAP_HOURS = 24;
    let shouldInterpolate = false;
    
    if (upcomingPos && mostRecentPos) {
      const gapHours = (new Date(upcomingPos.datetime) - new Date(mostRecentPos.datetime)) / (1000 * 60 * 60);
      shouldInterpolate = gapHours <= MAX_INTERPOLATION_GAP_HOURS;
      console.log('⏱️ Gap between points:', gapHours.toFixed(1), 'hours - shouldInterpolate:', shouldInterpolate);
    }
    
    if (shouldInterpolate && upcomingPos && mostRecentPos) {
      let interpolatedPoint = formInterpolatedPoint(upcomingPos, mostRecentPos, newTime)
      
      // Add interpolated point to the trail
      updatedHistoryPathMain.push(interpolatedPoint)
      
      // Set focus and markers
      setFocusPos(interpolatedPoint)
      setPositionHistoryPathMain(updatedHistoryPathMain)
      setPositionHistoryPathInterpolatedOnly([
        {lat: upcomingPos.lat, lng: upcomingPos.long},
        {lat: mostRecentPos.lat, lng: mostRecentPos.long},
      ])
      
      console.log('✅ Seeked to:', newTime.toLocaleString(), 'with trail of', updatedHistoryPathMain.length, 'total points')
    } else {
      // No interpolation - just show the most recent actual position
      if (mostRecentPos) {
        updatedHistoryPathMain.push([mostRecentPos.lat, mostRecentPos.long])
        setFocusPos([mostRecentPos.lat, mostRecentPos.long])
        setPositionHistoryPathMain(updatedHistoryPathMain)
        setPositionHistoryPathInterpolatedOnly([])
        console.log('⚠️ Gap too large or no data - showing last known position with', updatedHistoryPathMain.length, 'trail points')
      } else {
        console.log('❌ No position data found for this time')
      }
    }
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
        
        // Calculate max steps based on time span
        if (csv.length > 0) {
          const firstDate = new Date(csv[0].datetime)
          const lastDate = new Date(csv[csv.length - 1].datetime)
          const hoursDifference = (lastDate - firstDate) / (1000 * 60 * 60)
          const calculatedMaxSteps = Math.ceil(hoursDifference / stepSize)
          setMaxSteps(calculatedMaxSteps)
        }
      }
    }
  }, [DEBUGMODE])

  return (
   <>
      <input type="file" onChange={upload} style={{position:'absolute', zIndex: 2000, }}></input>

      {maxSteps !== null && (
        <Playbar 
          newTimestamp={newTimestamp} 
          range={maxSteps} 
          playing={playing} 
          setPlaying={setPlaying}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
          onSpeedChange={handleSpeedChange}
          stepname={stepname} 
          tick={tick}
          onSeek={handleSeek}
          currentStep={posStep}
        />
      )}

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

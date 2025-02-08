import './playbar.css' 
import React, { useEffect, useState, useRef } from 'react';

function useInterval(callback, delay) {
    const savedCallback = useRef();
   
    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
   
    // Set up the interval.
    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  }

  
function Playbar(props) {
    var [current, setCount] = useState(0)
    const range = props.range || 100

    const tickTime = 20

    const playing = props.playing
  

    const barDimensions = {
        width: 540,
        height: 40
    };

    useInterval(() => {
        if (playing) {
          setCount(current+1)
          props.newTimestamp()
        }
    }, tickTime);


    const findPercentOfRange = () =>{
        return (current / range) * barDimensions.width
    }

    return (
        <div>
            <div className="bar" style={{width: barDimensions.width, height: barDimensions.height}}>
            <div>{current}</div>
            <div>{props.stepname}</div>
                {/* <button onClick={start}>Play</button> */}
                {/* <button style={{position: 'absolute', left: `${findPercentOfRange()}px`, top: 0}}>|</button> */}
            </div>
        </div>
    )
}

export default Playbar;

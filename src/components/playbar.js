import './playbar.css' 
import React, { useEffect, useState, useRef, useCallback } from 'react';

const TAPMODE = false;

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
    const [current, setCount] = useState(0);
    const range = props.range || 100;
    const tickTime = props.tick;
    const playing = props.playing;
  
    const barDimensions = {
        width: 540,
        height: 40
    };

    // Memoized handleKeyDown using useCallback to ensure the latest current value is used
    const handleKeyDown = useCallback(() => {
        setCount(prev => prev + 1);  // Using functional update to ensure correct increment
        props.newTimestamp();
    }, [props]);  // `props` dependency ensures this is updated when `props` change

    useInterval(() => {
        if (playing && !TAPMODE) {
          setCount(prev => prev + 1);  // Functional update ensures correct state increment
          props.newTimestamp();
        }
    }, tickTime)

    useEffect(() => {
      // Add the event listener when the component mounts
      window.addEventListener('keydown', handleKeyDown);
      
      // Clean up the event listener when the component unmounts
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);  // Ensure useEffect runs again when handleKeyDown changes

    const findPercentOfRange = () => {
        return (current / range) * barDimensions.width;
    }

    return (
        <div>
            <div className="bar">
                <div>{current}</div>
                <div>{props.stepname}</div>
            </div>
        </div>
    );
}

export default Playbar;

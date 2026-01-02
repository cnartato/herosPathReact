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
    const range = props.range;
    const tickTime = props.tick;
    const playing = props.playing;
    const setPlaying = props.setPlaying;
    const playbackSpeed = props.playbackSpeed || 1;
    const setPlaybackSpeed = props.setPlaybackSpeed;
    const currentStep = props.currentStep || 0;
  
    const barDimensions = {
        width: 540,
        height: 40
    };

    // Sync internal counter with parent's step
    useEffect(() => {
        setCount(currentStep);
    }, [currentStep]);

    // Handle slider change
    const handleSliderChange = (e) => {
        const newStep = parseInt(e.target.value);
        setCount(newStep);
        if (props.onSeek) {
            props.onSeek(newStep);
        }
    };

    // Toggle play/pause
    const togglePlay = () => {
        setPlaying(!playing);
    };

    // Speed controls
    const speedUp = () => {
        const newSpeed = Math.min(playbackSpeed * 2, 32); // Max 32x
        if (props.onSpeedChange) {
            props.onSpeedChange(newSpeed);
        }
    };

    const slowDown = () => {
        const newSpeed = Math.max(playbackSpeed / 2, 0.25); // Min 0.25x
        if (props.onSpeedChange) {
            props.onSpeedChange(newSpeed);
        }
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
    }, tickTime) // Keep tick time constant, speed adjusts step size

    useEffect(() => {
      // Add the event listener when the component mounts
      window.addEventListener('keydown', handleKeyDown);
      
      // Clean up the event listener when the component unmounts
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);  // Ensure useEffect runs again when handleKeyDown changes

    const findPercentOfRange = () => {
        return (current / range) * barDimensions.width;
    }
    
    // NOW do validation AFTER all hooks
    console.log('📊 Playbar render - range:', range, 'currentStep:', currentStep)
    
    if (!range || range <= 0) {
      console.error('❌ Playbar received invalid range:', range)
      return <div>Error: Invalid range</div>
    }

    return (
        <div>
            <div className="bar">
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <button onClick={slowDown} style={{padding: '5px 10px', cursor: 'pointer'}}>
                        🐌 Slower
                    </button>
                    
                    <button onClick={togglePlay} style={{padding: '5px 15px', cursor: 'pointer', fontWeight: 'bold'}}>
                        {playing ? '⏸ Pause' : '▶ Play'}
                    </button>
                    
                    <button onClick={speedUp} style={{padding: '5px 10px', cursor: 'pointer'}}>
                        🚀 Faster
                    </button>
                    
                    <div style={{marginLeft: '10px'}}>
                        Speed: {playbackSpeed}x
                    </div>
                </div>
                
                <div>Step: {current} / {range}</div>
                <div>{props.stepname}</div>
                <input 
                    type="range" 
                    min="0" 
                    max={range} 
                    value={current} 
                    onChange={handleSliderChange}
                    style={{
                        width: '500px',
                        cursor: 'pointer',
                        marginTop: '10px'
                    }}
                />
            </div>
        </div>
    );
}

export default Playbar;

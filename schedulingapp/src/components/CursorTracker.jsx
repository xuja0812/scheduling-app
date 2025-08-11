import React from 'react';
import useMousePosition from '../hooks/useMousePosition';

export default function CursorTracker() {
    const { x, y } = useMousePosition();
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'blue',
          transform: 'translate(-50%, -50%)'
        }}
      ></div>
    </div>
    );
};
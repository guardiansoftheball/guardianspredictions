import React from 'react';

/**
 * Blue glow background blob.
 *
 * @param {"fixed"|"sticky"} position - CSS position mode (default: "fixed")
 * @param {string} width  - Blob width  (default: "75vw")
 * @param {string} height - Blob height (default: "100vh")
 */
const BlueGlow = ({
  position = 'fixed',
  width = '75vw',
  height = '100vh',
}) => {
  if (position === 'sticky') {
    return (
      <div
        style={{
          position: 'sticky',
          top: '25%',
          height: 0,
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <div
          style={{
            width,
            height,
            margin: '0 auto',
            transform: 'translateY(-15%)',
            background:
              'linear-gradient(135deg, rgb(81 173 246 / 35%) 0%, rgb(30 144 255 / 37%) 0%)',
            filter: 'blur(250px)',
            borderRadius: '50%',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        width,
        height,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        background:
          'linear-gradient(135deg, rgb(81 173 246 / 35%) 0%, rgb(30 144 255 / 30%) 0%)',
        filter: 'blur(250px)',
        pointerEvents: 'none',
        zIndex: 0,
        borderRadius: '50%',
      }}
    />
  );
};

export default BlueGlow;

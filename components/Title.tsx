import { useState } from 'react';
import { Info } from 'lucide-react';

export const Title = () => {
  const [showPopover, setShowPopover] = useState(false);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'PT Mono',
          fontWeight: 'bold',
          color: '#243532',
        }}
      >
        Tip Assistant
      </div>
      <Info
        style={{
          cursor: 'pointer',
          color: 'rgb(54 80 99 / 0.6)',
          height: '15px',
          width: '15px',
          margin: '1px 0 0 3px',
        }}
        onClick={() => setShowPopover(!showPopover)}
      />
      {showPopover && (
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1b2832',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
          }}
        >
          To manage the other Assistants or uninstall the protocol completly go
          to {'\n'}
          https://upassistants.com
        </div>
      )}
    </div>
  );
};

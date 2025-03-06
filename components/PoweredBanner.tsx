import { Info } from 'lucide-react';
import { useState } from 'react';

const PoweredByBanner = () => {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <Info
        style={{
          cursor: 'pointer',
          color: 'rgb(54 80 99 / 0.6)',
          height: '20px',
          width: '20px',
          margin: '6px 0 0 0',
        }}
        onClick={() => setShowPopover(!showPopover)}
      />
      {showPopover && (
        <div
          style={{
            position: 'absolute',
            top: '190px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#f8fafb',
            color: 'rgb(122 157 184)',
            padding: '10px',
            borderRadius: '5px',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
          }}
        >
          Add this app to your Grid{'\n'}
          www...com
        </div>
      )}
      <a
        href="https://upassistants.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          margin: '5px',
          display: 'block',
          backgroundColor: '#f8fafb',
          fontSize: '12px',
          width: '180px',
          color: 'rgb(54 80 99 / 0.6)',
          padding: '2px 2px',
          textAlign: 'center',
          borderRadius: '5px',
          textDecoration: 'none',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        Powered by UpAssistants
      </a>
    </div>
  );
};

export default PoweredByBanner;

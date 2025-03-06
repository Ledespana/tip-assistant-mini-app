import { useEffect, useState } from 'react';
import { useUpProvider } from './upProvider';

//a) No assistant configure and visitor is not owner
//b) No assistant configure and visitor is owner

// on page load: 1) check if permissions are granted
// 2) check if URD is installed
// 3) enable buttons according to that
export const NoAssistant = () => {
  const { accounts, contextAccounts, walletConnected } = useUpProvider();
  const [displaySettings, setDisplaySettings] = useState(false);

  useEffect(() => {
    if (!walletConnected) return;
    if (accounts[0].toLowerCase() === contextAccounts[0].toLowerCase()) {
      setDisplaySettings(true);
    } else {
      setDisplaySettings(false);
    }
  }, [accounts, contextAccounts, walletConnected]);
  return (
    <div>
      <h1>Tip Assistant not installed</h1>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {displaySettings && (
          <button
            style={{
              margin: '5px 0',
              display: 'block',
              backgroundColor: '#DB7C3D',
              fontSize: '12px',
              width: '100%',
              color: '#fff',
              padding: '2px 5px',
              textAlign: 'center',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            1- Add Permissions
          </button>
        )}
        {displaySettings && (
          <button
            style={{
              margin: '5px 0',
              display: 'block',
              backgroundColor: '#DB7C3D',
              fontSize: '12px',
              width: '100%',
              color: '#fff',
              padding: '2px 5px',
              textAlign: 'center',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            2- Install UAP Protocol
          </button>
        )}
        {displaySettings && (
          <button
            style={{
              margin: '5px 0',
              display: 'block',
              backgroundColor: '#DB7C3D',
              fontSize: '12px',
              width: '100%',
              color: '#fff',
              padding: '2px 5px',
              textAlign: 'center',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            3- Install Tip Assistant
          </button>
        )}
      </div>
    </div>
  );
};

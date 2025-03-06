import { useEffect, useState } from 'react';
import { useUpProvider } from './upProvider';

//a) No assistant configure and visitor is not owner
//b) No assistant configure and visitor is owner
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
      {/* {displaySettings && <button>Install Tip Assistant</button>} */}
    </div>
  );
};

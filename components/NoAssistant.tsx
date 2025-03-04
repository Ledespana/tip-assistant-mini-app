import { use, useEffect, useState } from "react";
import { useUpProvider } from "./upProvider";

//a) No assistant configure and visitor is not owner
//b) No assistant configure and visitor is owner
export const NoAssistant = () => {
    const {accounts, contextAccounts, walletConnected } =
    useUpProvider();
    const [displaySettings, setDisplaySettings] = useState(false);

    useEffect(() => {
        if (!walletConnected) return;
        async function compareAddresses() {
            // Retrieve the string address from the signer
            const signerAddress = await accounts[0].getAddress();
            // Convert both addresses to lower case for comparison
            if (
              signerAddress.toLowerCase() === contextAccounts[0].toLowerCase()
            ) {
              setDisplaySettings(true);
            } else {
              setDisplaySettings(false);
            }
          }
        
          compareAddresses();
    }, [accounts, contextAccounts, walletConnected]);
    return (
        <div>
          <h1>Tip Assistant not installed</h1>
          {displaySettings && <button>Install Tip Assistant</button>} 
        </div>
    );
}

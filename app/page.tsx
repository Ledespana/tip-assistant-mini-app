'use client';

import { UpProvider } from '@/components/upProvider';
import { useUpProvider } from '@/components/upProvider';
import { useState, useEffect } from 'react';
import { TipProfile } from '@/components/TipProfile';
import { NoAssistant } from '@/components/NoAssistant';
import PoweredByBanner from '@/components/PoweredBanner';
import Settings from '@/components/Settings';
import { getAssistantAddress, TIP_ASSISTANT_CONFIG } from '@/config';
import { LuksoProfile } from '@/components/LuksoProfile';
import { fetchAssistantConfig } from './utils';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';

// Import the LUKSO web-components library
let promise: Promise<unknown> | null = null;
if (typeof window !== 'undefined') {
  promise = import('@lukso/web-components');
}

/**
 * Main content component that handles the conditional rendering of Donate and ProfileSearch components.
 * Utilizes the UpProvider context to manage selected addresses and search state.
 *
 * @component
 * @returns {JSX.Element} A component that toggles between Donate and ProfileSearch views
 * based on the isSearching state from UpProvider.
 */
function MainContent() {
  const [mounted, setMounted] = useState(false);
  const {
    publicClient,
    client,
    accounts,
    contextAccounts,
    walletConnected,
    universalTipAssistant,
  } = useUpProvider();
  const [isLoading, setIsLoading] = useState(false);
  const [isUPSubscribedToAssistant, setIsUPSubscribedToAssistant] =
    useState(false);
  const [shouldDisplaySettings, setShouldDisplaySettings] = useState(false);
  const [percentageTipped, setPercentageTipped] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');

  useEffect(() => {
    // Load web component here if needed
    promise?.then(() => {
      setMounted(true);
    });
  }, []);

  const fetchAndUpdateAssistantConfig = async () => {
    try {
      setIsLoading(true);
      const configParams = TIP_ASSISTANT_CONFIG.map(({ name, type }) => ({
        name,
        type,
      }));

      const assistantResponse = await fetchAssistantConfig({
        upAddress: contextAccounts[0],
        assistantAddress: universalTipAssistant,
        supportedTransactionTypes: [LSP1_TYPE_IDS.LSP0ValueReceived],
        configParams,
        publicClient,
      });

      setIsUPSubscribedToAssistant(assistantResponse.isUPSubscribedToAssistant);

      if (
        assistantResponse.isUPSubscribedToAssistant &&
        assistantResponse.fieldValues
      ) {
        setPercentageTipped(assistantResponse.fieldValues.tipAmount);
        setDestinationAddress(assistantResponse.fieldValues.tipAddress);
      } else {
        setPercentageTipped('');
        setDestinationAddress('');
      }
    } catch (err) {
      console.error('Failed to load assistant config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!client || !walletConnected) return;
    fetchAndUpdateAssistantConfig();
  }, [accounts, publicClient, walletConnected]);

  const backFromSettings = async () => {
    await fetchAndUpdateAssistantConfig();
    setShouldDisplaySettings(false);
  };

  if (!mounted) {
    return null; // or a loading placeholder
  }

  if (!client || !walletConnected) {
    return (
      <div>
        <h1>Connect your wallet</h1>
        <p>To start using the XXX, you need to connect your wallet.</p>
      </div>
    );
  }

  if (shouldDisplaySettings) {
    return (
      <Settings
        universalTipAssistant={universalTipAssistant}
        loadedDestinationAddress={destinationAddress}
        loadedPercentageTipped={percentageTipped}
        onBack={backFromSettings}
      />
    );
  }

  return (
    <>
      <div className={`${isUPSubscribedToAssistant ? 'hidden' : 'block'}`}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'PT Mono',
            fontWeight: 'bold',
            color: 'rgb(122 157 184)',
          }}
        >
          Tip Assistant
        </div>
        <NoAssistant />
        <PoweredByBanner />
      </div>

      <div className={`${!isUPSubscribedToAssistant ? 'hidden' : 'block'}`}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'PT Mono',
            fontWeight: 'bold',
            color: 'rgb(122 157 184)',
          }}
        >
          Tip Assistant
        </div>

        <LuksoProfile
          address={destinationAddress}
          percentageTipped={percentageTipped}
        />

        {contextAccounts[0].toLowerCase() === accounts[0].toLowerCase() && (
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
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
            onClick={() => setShouldDisplaySettings(true)}
          >
            Settings
          </button>
        )}
        <PoweredByBanner />
      </div>
    </>
  );
}

/**
 * Root component of the application that wraps the main content with the UpProvider context.
 * Serves as the entry point for the donation and profile search functionality.
 *
 * @component
 * @returns {JSX.Element} The wrapped MainContent component with UpProvider context
 */
export default function Home() {
  return (
    <UpProvider>
      <MainContent />
    </UpProvider>
  );
}

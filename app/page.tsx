'use client';

import { UpProvider } from '@/components/upProvider';
import { useUpProvider } from '@/components/upProvider';
import { useState, useEffect, useCallback } from 'react';
import { NoAssistant } from '@/components/NoAssistant';
import PoweredByBanner from '@/components/PoweredBanner';
import Settings from '@/components/Settings';
import { getURDProtocolAddress, TIP_ASSISTANT_CONFIG } from '@/config';
import { LuksoProfile } from '@/components/LuksoProfile';
import { fetchAssistantConfig, isUAPInstalled } from './utils';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { Title } from '@/components/Title';

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
    chainId,
  } = useUpProvider();
  const [isLoading, setIsLoading] = useState(false);
  const [isUPSubscribedToAssistant, setIsUPSubscribedToAssistant] =
    useState(false);
  const [isURDInstalled, setIsURDInstalled] = useState(false);
  const [shouldDisplaySettings, setShouldDisplaySettings] = useState(false);
  const [percentageTipped, setPercentageTipped] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');

  useEffect(() => {
    // Load web component here if needed
    promise?.then(() => {
      setMounted(true);
    });
  }, []);

  const checkURDInstalled = useCallback(async () => {
    if (!client || !walletConnected) return;

    try {
      const protocolAddress = getURDProtocolAddress(chainId);
      const urdInstalled = await isUAPInstalled(
        publicClient,
        contextAccounts[0],
        protocolAddress
      );

      setIsURDInstalled(urdInstalled);
    } catch (error) {
      console.error('Error checking assistant installation', error);
      // setError("Failed to check assistant installation");
    }
  }, [client, walletConnected, contextAccounts, chainId]);

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
    checkURDInstalled();
  }, [accounts, publicClient, walletConnected]);

  const backFromSettings = async () => {
    await fetchAndUpdateAssistantConfig();
    setShouldDisplaySettings(false);
  };

  if (!mounted) {
    return null; // or a loading placeholder
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!client || !walletConnected) {
    return (
      <div style={{ margin: '0 20px' }}>
        <Title />

        <div
          style={{
            textAlign: 'center',
            fontFamily: 'PT Mono',
            color: 'rgb(122 157 184)',
          }}
        >
          <p>
            The Executive Assistant that automatically channels your receiving
            LYX transaction to tip third party UP accounts.
          </p>
          <p>Connect your wallet to continue.</p>
        </div>
        <PoweredByBanner />
      </div>
    );
  }

  if (shouldDisplaySettings || (isURDInstalled && !isUPSubscribedToAssistant)) {
    return (
      <Settings
        universalTipAssistant={universalTipAssistant}
        loadedDestinationAddress={destinationAddress}
        loadedPercentageTipped={percentageTipped}
        isInitialSetting={isURDInstalled && !isUPSubscribedToAssistant}
        onBack={backFromSettings}
      />
    );
  }

  return (
    <>
      <div className={`${isUPSubscribedToAssistant ? 'hidden' : 'block'}`}>
        <Title />
        <NoAssistant />
        <PoweredByBanner />
      </div>

      <div className={`${!isUPSubscribedToAssistant ? 'hidden' : 'block'}`}>
        <Title />
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

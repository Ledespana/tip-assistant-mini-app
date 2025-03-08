import { useCallback, useEffect, useState } from 'react';
import { useUpProvider } from './upProvider';
import { SiweMessage } from 'siwe';
import {
  createWalletClient,
  http,
  encodeAbiParameters,
  getContract,
} from 'viem';
import { verifyMessage } from 'ethers';
import { subscribeToUapURD, updateBECPermissions } from '@/app/utils';
import { getURDProtocolAddress } from '@/config';

//a) No assistant configure and visitor is not owner
//b) No assistant configure and visitor is owner

// on page load: 1) check if permissions are granted
// 2) check if URD is installed
// 3) enable buttons according to that
export const NoAssistant = () => {
  const {
    accounts,
    contextAccounts,
    walletConnected,
    chainId,
    client,
    publicClient,
  } = useUpProvider();
  const [displaySettings, setDisplaySettings] = useState(false);
  const [mainController, setMainController] = useState('');
  const [arePermssionsSet, setArePermssionsSet] = useState(false);
  const [isURDInstalled, setIsURDInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(false);

  useEffect(() => {
    if (!walletConnected) return;
    if (accounts[0].toLowerCase() === contextAccounts[0].toLowerCase()) {
      setDisplaySettings(true);
    } else {
      setDisplaySettings(false);
    }
  }, [accounts, contextAccounts, walletConnected]);

  const sign = async (): Promise<boolean> => {
    try {
      if (!client) return false;
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        uri: window.location.origin,
        address: [accounts[0]],
        statement:
          'Signing this message will enable the Universal Assistants Catalog to read your UP Browser Extension to manage Assistant configurations.',
        version: '1',
        chainId: chainId,
        resources: [`${window.location.origin}/terms`],
      }).prepareMessage();

      const signature = await client.request({
        method: 'personal_sign',
        params: [siweMessage, accounts[0]],
      });

      const mainUPController = await verifyMessage(siweMessage, signature);
      setMainController(mainUPController);
      console.log('Verified UP Controller:', mainUPController);
      return true;
    } catch (error: any) {
      console.error('ProfileProvider: Error', error);
      throw error;
    }
  };

  const ERC725Y_ABI = [
    {
      type: 'function',
      name: 'setDataBatch',
      stateMutability: 'nonpayable',
      inputs: [{ type: 'bytes32[]' }, { type: 'bytes[]' }],
      outputs: [],
    },
    {
      type: 'function',
      name: 'getData',
      stateMutability: 'view',
      inputs: [{ type: 'bytes32' }],
      outputs: [{ type: 'bytes' }],
    },
  ];

  const handleUpdateBECPermissions = async () => {
    if (!mainController) return;

    // setIsUpdatingPermissions(true);
    try {
      await updateBECPermissions(
        client,
        publicClient,
        accounts[0],
        mainController,
        ERC725Y_ABI
      );

      // setHasExtensionPermissions(true);
    } catch (error: any) {
      console.log('Error updating permissions:', error);
    } finally {
      // setIsUpdatingPermissions(false);
    }
  };

  const handleInstallUAP = async () => {
    // setIsInstallingProtocol(true);
    try {
      const UAPProtocolAddress = getURDProtocolAddress(chainId);
      await subscribeToUapURD(client, accounts[0], UAPProtocolAddress);
      console.log('Subscribed to UAP Universal Receiver Delegate');
    } catch (error: any) {
      console.error(
        'Error subscribing to UAP Universal Receiver Delegate',
        error.message
      );
    } finally {
      // setIsInstallingProtocol(false);
    }
  };

  return (
    <div>
      <h1>Tip Assistant not installed</h1>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {displaySettings && (
          <button
            onClick={sign}
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
            1- Sign
          </button>
        )}
        {displaySettings && (
          <button
            onClick={handleUpdateBECPermissions}
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
            2- Add Permissions
          </button>
        )}
        {displaySettings && (
          <button
            onClick={handleInstallUAP}
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
            3- Install UAP Protocol
          </button>
        )}
      </div>
    </div>
  );
};

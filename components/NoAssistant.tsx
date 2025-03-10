import { useEffect, useState, CSSProperties } from 'react';
import { useUpProvider } from './upProvider';
import { SiweMessage } from 'siwe';
import { verifyMessage } from 'ethers';
import { subscribeToUapURD, updateBECPermissions } from '@/app/utils';
import { getURDProtocolAddress } from '@/config';

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
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(false);
  const [hasExtensionPermissions, setHasExtensionPermissions] = useState(false);

  useEffect(() => {
    if (!walletConnected) return;
    setDisplaySettings(
      accounts[0].toLowerCase() === contextAccounts[0].toLowerCase()
    );
  }, [accounts, contextAccounts, walletConnected]);

  const sign = async (): Promise<boolean> => {
    try {
      if (!client || !accounts.length || !accounts[0]) return false; // Explicitly check accounts[0]
  
      const userAddress: `0x${string}` = accounts[0];
  
      setIsLoadingTransaction(true);
  
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        uri: window.location.origin,
        address: userAddress,
        statement:
          'Signing this message will enable the Universal Assistants Catalog to read your UP Browser Extension to manage Assistant configurations.',
        version: '1',
        chainId: chainId,
      }).prepareMessage();

      const signature = await client.request({
        method: 'personal_sign',
        params: [siweMessage, userAddress], 
      });
  
      const mainUPController = await verifyMessage(siweMessage, signature as string);
      setMainController(mainUPController);
      return true;
    } catch (error: any) {
      console.error('ProfileProvider: Error', error);
      throw error;
    } finally {
      setIsLoadingTransaction(false);
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
    setIsLoadingTransaction(true);
    try {
      await updateBECPermissions(client, publicClient, accounts[0], mainController, ERC725Y_ABI);
      setHasExtensionPermissions(true);
    } catch (error) {
      console.error('Error updating permissions:', error);
    } finally {
      setIsLoadingTransaction(false);
    }
  };

  const handleInstallUAP = async () => {
    setIsLoadingTransaction(true);
    try {
      const UAPProtocolAddress = getURDProtocolAddress(chainId);
      await subscribeToUapURD(client, accounts[0], UAPProtocolAddress);
    } catch (error) {
      console.error('Error subscribing to UAP Universal Receiver Delegate', error);
    } finally {
      setIsLoadingTransaction(false);
    }
  };

  const getButtonStyle = (disabled: boolean): CSSProperties => ({
    margin: '5px 0',
    display: 'block',
    backgroundColor: disabled ? '#B0B0B0' : '#DB7C3D',
    fontSize: '12px',
    width: '100%',
    color: disabled ? '#666' : '#fff',
    padding: '2px 5px',
    textAlign: 'center',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  });

  return (
    <div>
      <h1 style={{ marginTop: '20px' }}>Tip Assistant not installed</h1>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {displaySettings && (
          <button
            onClick={sign}
            disabled={isLoadingTransaction}
            style={getButtonStyle(isLoadingTransaction)}
          >
            {isLoadingTransaction ? 'Loading...' : '1- Sign'}
          </button>
        )}
        {displaySettings && (
          <button
            onClick={handleUpdateBECPermissions}
            disabled={isLoadingTransaction || !mainController}
            style={getButtonStyle(isLoadingTransaction || !mainController)}
          >
            {isLoadingTransaction ? 'Loading...' : '2- Add Permissions'}
          </button>
        )}
        {displaySettings && (
          <button
            onClick={handleInstallUAP}
            disabled={isLoadingTransaction || !mainController || !hasExtensionPermissions}
            style={getButtonStyle(isLoadingTransaction || !mainController || !hasExtensionPermissions)}
          >
            {isLoadingTransaction ? 'Loading...' : '3- Install UAP Protocol'}
          </button>
        )}
      </div>
    </div>
  );
};

import { customEncodeAddresses, generateMappingKey } from '@/app/utils';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { AbiCoder } from 'ethers';
import { useEffect, useState } from 'react';
import { useUpProvider } from './upProvider';

const ERC725Y_ABI = [
  {
    type: 'function',
    name: 'setDataBatch',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'bytes32[]' }, { type: 'bytes[]' }],
    outputs: [],
  },
];

function Settings({
  onBack,
  universalTipAssistant,
  loadedDestinationAddress = '',
  loadedPercentageTipped = '',
  loadedTypeConfigAddresses = [],
}: {
  onBack: () => void;
  universalTipAssistant: string;
  loadedDestinationAddress?: string; // Allow optional props
  loadedPercentageTipped?: string;
  loadedTypeConfigAddresses?: string[];
}) {
  const { publicClient, client, accounts, contextAccounts, walletConnected } =
    useUpProvider();
  const [destinationAddress, setDestinationAddress] = useState(
    loadedDestinationAddress || ''
  );
  const [tipPercentage, setTipPercentage] = useState(
    loadedPercentageTipped || ''
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setDestinationAddress(loadedDestinationAddress || '');
    setTipPercentage(loadedPercentageTipped || '');
  }, [loadedDestinationAddress, loadedPercentageTipped]);

  const validateTipPercentage = (value: string) => {
    const number = parseInt(value, 10);
    if (isNaN(number) || number < 1 || number > 100 || value.includes('.')) {
      setErrorMessage('Tip amount must be between 1 and 100 without decimals');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleSave = async () => {
    if (!validateTipPercentage(tipPercentage)) return;
    setIsLoading(true);
    setSuccessMessage('');

    try {
      //   setIsProcessingTransaction(true);
      // 1) Load existing config
      const updatedTypeConfigAddresses = { ...loadedTypeConfigAddresses };
      const selectedConfigTypes = [LSP1_TYPE_IDS.LSP0ValueReceived];
      // 2) Figure out if the type needs to be added
      const dataKeys: string[] = [];
      const dataValues: string[] = [];
      const abiCoder = new AbiCoder();

      // ==== TYPES ====
      const assistantSupportedTransactionTypes = [
        LSP1_TYPE_IDS.LSP0ValueReceived,
      ];
      assistantSupportedTransactionTypes.forEach(typeId => {
        const currentTypeAddresses = [
          ...(updatedTypeConfigAddresses[typeId] || []),
        ];
        const currentAssistantIndex = currentTypeAddresses.findIndex(
          a => a.toLowerCase() === universalTipAssistant.toLowerCase()
        );
        if (selectedConfigTypes.includes(typeId)) {
          // todo when configuring for first time
          if (currentAssistantIndex === -1) {
            currentTypeAddresses.push(universalTipAssistant);
          }
        } else {
          // todo, in theory not possible on Tip assistant V1
          if (currentAssistantIndex !== -1) {
            currentTypeAddresses.splice(currentAssistantIndex, 1);
          }
        }

        updatedTypeConfigAddresses[typeId] = currentTypeAddresses;
        // 3) update types
        const typeConfigKey = generateMappingKey('UAPTypeConfig', typeId);
        if (currentTypeAddresses.length === 0) {
          dataKeys.push(typeConfigKey);
          dataValues.push('0x');
        } else {
          dataKeys.push(typeConfigKey);
          dataValues.push(customEncodeAddresses(currentTypeAddresses));
        }
      });
      // 4. % and destination fields

      const assistantConfigKey = generateMappingKey(
        'UAPExecutiveConfig',
        universalTipAssistant // todo handle mainnet/testnet
      );
      const types = ['address', 'uint256'];
      const values = [destinationAddress, tipPercentage];
      const assistantConfigValue = abiCoder.encode(types, values);
      dataKeys.push(assistantConfigKey);
      dataValues.push(assistantConfigValue);

      const txHash = await client.writeContract({
        address: contextAccounts[0],
        abi: ERC725Y_ABI,
        functionName: 'setDataBatch',
        args: [dataKeys, dataValues],
        account: contextAccounts[0],
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      setSuccessMessage('Transaction successful!');
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ margin: '0 30px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'PT Mono',
          fontWeight: 'bold',
          color: 'rgb(122 157 184)',
          marginBottom: '20px',
        }}
      >
        Tip Assistant
      </div>
      <label style={{ fontWeight: 'bold', color: 'rgb(122 157 184)' }}>
        Destination Address
      </label>
      <input
        type="text"
        value={destinationAddress}
        onChange={e => setDestinationAddress(e.target.value)}
        placeholder="Enter destination address"
        style={{
          width: '100%',
          padding: '5px',
          marginBottom: '10px',
          opacity: '0.7',
        }}
      />

      <label style={{ fontWeight: 'bold', color: 'rgb(122 157 184)' }}>
        Percentage of LYX to Tip
      </label>
      <input
        type="text"
        value={tipPercentage}
        onChange={e => setTipPercentage(e.target.value)}
        placeholder="e.g. 10"
        style={{
          width: '100%',
          padding: '5px',
          marginBottom: '5px',
          opacity: '0.7',
        }}
      />

      {errorMessage && (
        <p style={{ color: 'red', fontSize: '12px' }}>{errorMessage}</p>
      )}
      {successMessage && (
        <p style={{ color: 'green', fontSize: '12px' }}>{successMessage}</p>
      )}
      {isLoading && (
        <p style={{ color: 'blue', fontSize: '12px' }}>
          Processing transaction...
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={isLoading}
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
        Save
      </button>

      <button
        onClick={() => {
          onBack();
        }}
        disabled={isLoading}
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
        Back
      </button>
    </div>
  );
}

export default Settings;

import {
  customEncodeAddresses,
  fetchAssistantConfig,
  generateMappingKey,
} from '@/app/utils';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { AbiCoder } from 'ethers';
import { use, useEffect, useState } from 'react';
import { useUpProvider } from './upProvider';
import { TIP_ASSISTANT_CONFIG } from '@/config';
import PoweredByBanner from './PoweredBanner';

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
  universalTipAssistant,
  loadedDestinationAddress = '',
  loadedPercentageTipped = '',
  isInitialSetting = false,
  onBack,
}: {
  universalTipAssistant: string;
  loadedDestinationAddress?: string; // Allow optional props
  loadedPercentageTipped?: string;
  isInitialSetting?: boolean;
  onBack: () => void;
}) {
  const { publicClient, client, contextAccounts, chain, accounts } =
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
  const [displayNoSettings, setDisplayNoSettings] = useState(false);

  useEffect(() => {
    if (accounts[0].toLowerCase() === contextAccounts[0].toLowerCase()) {
      setDisplayNoSettings(false);
    } else {
      setDisplayNoSettings(true);
    }
  }, [accounts, contextAccounts]);

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
    if (!validateTipPercentage(tipPercentage) || !client) return;
    setIsLoading(true);
    setSuccessMessage('');

    try {
      // 1) Load existing config
      const configParams = TIP_ASSISTANT_CONFIG.map(({ name, type }) => ({
        name,
        type,
      }));
      const latestAssistantConfig = await fetchAssistantConfig({
        upAddress: contextAccounts[0],
        assistantAddress: universalTipAssistant,
        supportedTransactionTypes: [LSP1_TYPE_IDS.LSP0ValueReceived],
        configParams,
        publicClient,
      });
      const updatedTypeConfigAddresses = {
        ...latestAssistantConfig.typeConfigAddresses,
      };
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
        chain,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      setSuccessMessage('Transaction successful!');
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setIsLoading(false);
      onBack();
    }
  };

  const handleDeactivateAssistant = async () => {
    if (!client) return;
    try {
      // setIsProcessingTransaction(true);
      const configParams = TIP_ASSISTANT_CONFIG.map(({ name, type }) => ({
        name,
        type,
      }));
      const latestAssistantConfig = await fetchAssistantConfig({
        upAddress: contextAccounts[0],
        assistantAddress: universalTipAssistant,
        supportedTransactionTypes: [LSP1_TYPE_IDS.LSP0ValueReceived],
        configParams,
        publicClient,
      });

      const updatedTypeConfigAddresses = {
        ...latestAssistantConfig.typeConfigAddresses,
      };
      const dataKeys: string[] = [];
      const dataValues: string[] = [];

      Object.entries(updatedTypeConfigAddresses).forEach(
        ([typeId, addresses]) => {
          const currentAssistantIndex = addresses.findIndex(
            a => a.toLowerCase() === universalTipAssistant.toLowerCase()
          );
          if (currentAssistantIndex !== -1) {
            addresses.splice(currentAssistantIndex, 1);
          }

          const typeConfigKey = generateMappingKey('UAPTypeConfig', typeId);
          if (addresses.length === 0) {
            dataKeys.push(typeConfigKey);
            dataValues.push('0x');
          } else {
            dataKeys.push(typeConfigKey);
            dataValues.push(customEncodeAddresses(addresses));
          }
        }
      );

      const assistantConfigKey = generateMappingKey(
        'UAPExecutiveConfig',
        universalTipAssistant
      );
      dataKeys.push(assistantConfigKey);
      dataValues.push('0x');

      const txHash = await client.writeContract({
        address: contextAccounts[0],
        abi: ERC725Y_ABI,
        functionName: 'setDataBatch',
        args: [dataKeys, dataValues],
        account: contextAccounts[0],
        chain,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
    } catch (err: any) {
      console.error('Error unsubscribing this assistant', err);
    } finally {
      setIsLoading(false);
      onBack();
    }
  };

  if (displayNoSettings) {
    return (
      <div style={{ margin: '0 30px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'PT Mono',
            fontWeight: 'bold',
            color: '#243532',
            marginBottom: '20px',
          }}
        >
          Tip Assistant
        </div>
        <div
          style={{
            textAlign: 'center',
            fontFamily: 'PT Mono',
            color: 'rgb(122 157 184)',
          }}
        >
          <p>The current UP doesn&apos;t have configured the Tip Assistant.</p>
        </div>
        <PoweredByBanner />
      </div>
    );
  }

  return (
    <div style={{ margin: '0 30px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'PT Mono',
          fontWeight: 'bold',
          color: '#243532',
          marginBottom: '20px',
        }}
      >
        Tip Assistant
      </div>
      <label
        style={{
          fontWeight: 'bold',
          color: 'rgb(122 157 184)',
          fontFamily: 'PT Mono',
        }}
      >
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
          fontFamily: 'PT Mono',
        }}
      />

      <label
        style={{
          fontWeight: 'bold',
          color: 'rgb(122 157 184)',
          fontFamily: 'PT Mono',
        }}
      >
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
          fontFamily: 'PT Mono',
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

      {!isInitialSetting && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'PT Mono',
            fontWeight: 'bold',
            color: '#243532',
            marginBottom: '20px',
          }}
        >
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
              width: '50%',
              color: '#fff',
              padding: '2px 5px',
              textAlign: 'center',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginRight: '5px',
            }}
          >
            Back
          </button>
          <button
            onClick={handleDeactivateAssistant}
            disabled={isLoading}
            style={{
              margin: '5px 0',
              display: 'block',
              backgroundColor: '#DB7C3D',
              fontSize: '12px',
              width: '50%',
              color: '#fff',
              padding: '2px 5px',
              textAlign: 'center',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {' '}
            Deactivate Assistant
          </button>
        </div>
      )}
      <PoweredByBanner />
    </div>
  );
}

export default Settings;

import {
  customEncodeAddresses,
  fetchAssistantConfig,
  generateMappingKey,
} from '@/app/utils';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { AbiCoder } from 'ethers';
import { useEffect, useState } from 'react';
import { useUpProvider } from './upProvider';
import { TIP_ASSISTANT_CONFIG } from '@/config';
import PoweredByBanner from './PoweredBanner';
import { Title } from './Title';
import { Info } from 'lucide-react';
import { isAddress } from 'viem';

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
  const [displayNoSettings, setDisplayNoSettings] = useState(false);
  const [showPopover, setShowPopover] = useState(false);

  useEffect(() => {
    if (
      accounts.length &&
      accounts[0].toLowerCase() === contextAccounts[0].toLowerCase()
    ) {
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

  const validateDestinationAddress = (
    address: string,
    contextAddress: string
  ): boolean => {
    if (!isAddress(address)) {
      setErrorMessage('Please enter a valid address.');
      return false;
    }
    if (address.toLowerCase() === contextAddress.toLowerCase()) {
      setErrorMessage(
        'Destination address cannot be the same as your current account.'
      );
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleSave = async () => {
    if (!validateTipPercentage(tipPercentage) || !client) return;
    if (!validateDestinationAddress(destinationAddress, contextAccounts[0]))
      return;
    setIsLoading(true);

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
          //  in theory not possible on Tip assistant V1
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
      setIsLoading(false);
      onBack();
    } catch (error) {
      console.error('Failed to save config:', error);
      setIsLoading(false);
    }
  };

  const handleDeactivateAssistant = async () => {
    if (!client) return;
    setIsLoading(true);
    try {
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
      setIsLoading(false);
      onBack();
    } catch (err: any) {
      console.error('Error unsubscribing this assistant', err);
      setIsLoading(false);
    }
  };

  if (displayNoSettings) {
    return (
      <div style={{ margin: '0 30px' }}>
        <Title />
        <div
          style={{
            marginTop: '0',
            textAlign: 'center',
            fontFamily: 'PT Mono',
            color: 'rgb(122 157 184)',
          }}
        >
          <p>The owner of the grid has not configured the Tip Assistant yet.</p>
        </div>
        <PoweredByBanner />
      </div>
    );
  }

  return (
    <div style={{ margin: '0 30px' }}>
      <div style={{ marginBottom: '10px' }}>
        <Title />
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
          display: 'flex',
        }}
      >
        Percentage of LYX to Tip
        <Info
          style={{
            cursor: 'pointer',
            color: 'rgb(54 80 99 / 0.6)',
            height: '15px',
            width: '15px',
            margin: '5px 0 0 3px',
          }}
          onClick={() => setShowPopover(!showPopover)}
        />
        {showPopover && (
          <div
            style={{
              position: 'absolute',
              top: '130px',
              left: '40%',
              transform: 'translateX(-50%)',
              backgroundColor: '#1b2832',
              color: 'white',
              padding: '10px',
              borderRadius: '5px',
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 100,
            }}
          >
            The Tip Assistant will send this percentage of the total amount from
            any incoming LYX transaction to the destination wallet.
          </div>
        )}
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
        {isLoading ? 'Saving...' : 'Save'}
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
            marginBottom: '10px',
          }}
        >
          <button
            onClick={onBack}
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
            {isLoading ? 'Deactivating...' : 'Deactivate Assistant'}
          </button>
        </div>
      )}
      <PoweredByBanner />
    </div>
  );
}

export default Settings;

import { customEncodeAddresses, generateMappingKey } from '@/app/utils';
import { UNIVERSAL_TIP_ASSISTANT_ADDRESS } from '@/config';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { AbiCoder } from 'ethers';
import { useEffect, useState } from 'react';

function Settings({
  loadedDestinationAddress = '',
  loadedPercentageTipped = '',
  loadedTypeConfigAddresses = [],
  onBack,
}: {
  onBack: () => void;
  loadedDestinationAddress?: string; // Allow optional props
  loadedPercentageTipped?: string;
  loadedTypeConfigAddresses?: string[];
}) {
  const [destinationAddress, setDestinationAddress] = useState(
    loadedDestinationAddress || ''
  );
  const [tipPercentage, setTipPercentage] = useState(
    loadedPercentageTipped || ''
  );
  const [errorMessage, setErrorMessage] = useState('');

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

    try {
      //   setIsProcessingTransaction(true);

      const updatedTypeConfigAddresses = { ...loadedTypeConfigAddresses };

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
          a => a.toLowerCase() === UNIVERSAL_TIP_ASSISTANT_ADDRESS.toLowerCase()
        );
        if (selectedConfigTypes.includes(typeId)) {
          // todo when configuring for first time
          if (currentAssistantIndex === -1) {
            currentTypeAddresses.push(UNIVERSAL_TIP_ASSISTANT_ADDRESS);
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
        UNIVERSAL_TIP_ASSISTANT_ADDRESS // todo handle mainnet/testnet
      );
      const types = ['address', 'uint256'];
      const values = [destinationAddress, tipPercentage];
      const assistantConfigValue = abiCoder.encode(types, values);
      dataKeys.push(assistantConfigKey);
      dataValues.push(assistantConfigValue);

      const tx = await upContract.setDataBatch(dataKeys, dataValues);
      await tx.wait();
    } catch (error) {
      console.error('Failed to save config:', error);
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
        }}
      >
        Tip Assistant
      </div>
      <label>Destination Address</label>
      <input
        type="text"
        value={destinationAddress}
        onChange={e => setDestinationAddress(e.target.value)}
        placeholder="Enter destination address"
        style={{ width: '100%', padding: '5px', marginBottom: '10px' }}
      />

      <label>Percentage of LYX to Tip</label>
      <input
        type="text"
        value={tipPercentage}
        onChange={e => setTipPercentage(e.target.value)}
        placeholder="e.g. 10"
        style={{ width: '100%', padding: '5px', marginBottom: '5px' }}
      />

      {errorMessage && (
        <p style={{ color: 'red', fontSize: '12px' }}>{errorMessage}</p>
      )}

      <button
        onClick={handleSave}
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
        onClick={onBack}
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

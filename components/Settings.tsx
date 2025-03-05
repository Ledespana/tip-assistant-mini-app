import { useEffect, useState } from 'react';

function Settings({
  loadedDestinationAddress = '',
  loadedPercentageTipped = '',
  onBack,
}: {
  onBack: () => void;
  loadedDestinationAddress?: string; // Allow optional props
  loadedPercentageTipped?: string;
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
    debugger;
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

  const handleSave = () => {
    if (!validateTipPercentage(tipPercentage)) return;
    console.log('Saved settings:', { destinationAddress, tipPercentage });
    // Here you can save the settings (e.g., to state, a backend, or blockchain)
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

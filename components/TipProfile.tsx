import { useState } from 'react';
import { LuksoProfile } from './LuksoProfile';
import { useUpProvider } from './upProvider';

/**
 * TipProfile Component
 *
 * Renders a card with the recipient’s profile (using LuksoProfile)
 * and provides a simple input for specifying a tip amount.
 * Includes a button to trigger the tip/donation action.
 *
 * @component
 * @param {string} destinationAddress - The address to which LYX will be donated/tipped.
 */
interface TipProfileProps {
  destinationAddress: string;
}

export function TipProfile({ destinationAddress }: TipProfileProps) {
  const { provider, client, walletConnected } = useUpProvider();
  const [tipAmount, setTipAmount] = useState('2'); // default tip amount
  const [isSending, setIsSending] = useState(false);

  /**
   * handleTip
   * Trigger the actual tip/donation transaction.
   */
  const handleTip = async () => {
    try {
      if (!walletConnected) {
        console.warn('Wallet not connected!');
        return;
      }
      setIsSending(true);

      // TODO: Implement your tipping logic here.
      // Example (pseudocode):
      // const signer = await client.getSigner();
      // await signer.sendTransaction({
      //   to: destinationAddress,
      //   value: ethers.parseEther(tipAmount) // or however you'd like to compute the LYX
      // });

      console.log(`Tipping ${tipAmount} LYX to ${destinationAddress}...`);
    } catch (error) {
      console.error('Tip failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <LuksoProfile address={destinationAddress} />
    </div>
  );
}

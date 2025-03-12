export const MAINET_TIP_ASSISTANT_ADDRESS =
  '0x0c3dc7ea7521c79b99a667f2024d76714d33def2';

export const TESNET_TIP_ASSISTANT_ADDRESS =
  '0xf24c39a4d55994e70059443622fc166f05b5ff14';

export const getAssistantAddress = (chainId: number): string => {
  return chainId === 42
    ? MAINET_TIP_ASSISTANT_ADDRESS
    : TESNET_TIP_ASSISTANT_ADDRESS;
};

export const urdProtocolAddressMainnet =
  '0x2BB77E952f44cF4707E312c5e0c425ca066F4C2d';
export const urdProtocolAddressTestnet =
  '0x3C9b2f2F301962674314cC029f56b118bCDccbfd';

export const getURDProtocolAddress = (chainId: number): string => {
  return chainId === 42 ? urdProtocolAddressMainnet : urdProtocolAddressTestnet;
};

export const TIP_ASSISTANT_CONFIG = [
  // todo needed?
  {
    name: 'tipAddress',
    type: 'address',
  },
  {
    name: 'tipAmount',
    type: 'uint256',
  },
];

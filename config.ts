export const UNIVERSAL_TIP_ASSISTANT_ADDRESS =
  "0x0c3dc7ea7521c79b99a667f2024d76714d33def2";

export const TIP_ASSISTANT_CONFIG = [
  {
    name: "tipAddress",
    type: "address",
    hidden: false,
    description: "The address you want to tip:",
    placeholder: "Enter destination address",
    validationMessage: "Tip address cannot be your own address",
    validate: (value: any, upAddress: string) =>
      value.toLowerCase() !== upAddress.toLowerCase(),
  },
  {
    name: "tipAmount",
    type: "uint256",
    defaultValue: "2",
    hidden: false,
    description: "Percentage of LYX to tip:",
    placeholder: "e.g 10",
    validate: (value: any) => {
      const number = parseInt(value);
      return number > 0 && number <= 100 && value.indexOf(".") === -1;
    },
    validationMessage: "Tip amount must be between 1 and 100 without decimals",
  },
];
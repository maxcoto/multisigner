export const AllyConstants = {
  testnet: {
    algodUrl: "https://testnet-algorand.api.purestake.io/ps2",
    algodApiKey: "2siY5xX5fj3Vexu10qwXq1cdrLlUnf5F5MHEIekr",
  },
  mainnet: {
    algodUrl: "https://mainnet-algorand.api.purestake.io/ps2",
    algodApiKey: "2siY5xX5fj3Vexu10qwXq1cdrLlUnf5F5MHEIekr",
  },

  pinataApiKey: "9ed8a5817575dcabd275",
  pinataApiSecret: "a89764385b70d3630998b67b864af93e963cf0d23e6f8156f4feae35f446df4e",
  pinataDownloadUrl: "https://presail.mypinata.cloud/ipfs/",
  
  jsonStorage: "https://multisigner.herokuapp.com/json/",
  
  txnTypes: {
    pay: "Payment",
    keyreg: "Key Registration",
    acfg: "Asset Configuration",
    afrz: "Asset Freeze",
    axfer: "Asset Transfer",
    appl: "Application Call"
  },
  
  onCompleteTypes: [
    "NoOp",
    "OptIn",
    "CloseOut",
    "ClearState",
    "UpdateApplication",
    "DeleteApplication"
  ]
};

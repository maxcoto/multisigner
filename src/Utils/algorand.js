export async function waitForConfirmation(algodclient, txId) {
  let response = await algodclient.status().do();
  let lastround = response["last-round"];
  while (true) {
    const pendingInfo = await algodclient
      .pendingTransactionInformation(txId)
      .do();
    if (
      pendingInfo["confirmed-round"] !== null &&
      pendingInfo["confirmed-round"] > 0
    ) {
      //Got the completed Transaction
      break;
    }
    lastround++;
    await algodclient.statusAfterBlock(lastround).do();
  }
}

export async function balance(algodclient, address){
  const accountInfo = await algodclient.accountInformation(address).do();
  const balance = microToFloat(accountInfo.amount);
  return balance;
}

export function microToFloat(number) {
  return number / 1e6;
}


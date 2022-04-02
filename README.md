# MultiSigner

An Algorand multisig transaction offline signer.

The process:

- You upload an unsigned multisig transaction file

- The app gives you a link you can share with the signers

- Signers open the link, download the unsigned file

- Signers sign the transaction offline using algokey or a ledger:

```
algokey multisig -t unsigned_file -o signed_file -m "signer mnemonic"
```

example:
```
algokey multisig -t ~/Desktop/unsigned.mtx -o ~/Desktop/signed.txn -m "reject hotel taste ... pet make head"
```

- Signers upload the signed transaction file 

- You click send to send the transaction to the blockchain


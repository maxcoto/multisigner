import algosdk from "algosdk";
import { decode } from "@msgpack/msgpack";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { AllyConstants } from "../Utils/constants";
import { waitForConfirmation } from "../Utils/algorand";
import { jsonStore, jsonLoad, txnFromBuffer, readFile, uuid } from "../Utils/apis";


const MultiSigner = (props) => {  
  const [hash, setHash] = useState(props.hash);
  const [txn, setTxn] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState({ color: "red", msg: "" });
  const [address, setAddress] = useState(null);

  let history = useHistory();
  const tx = txn && txn.data;
  
  const connect = async (address) => {
    const mainnet = tx && tx.network === "mainnet";
    window.AlgoSigner.connect();
    const data = await window.AlgoSigner.accounts({ ledger: mainnet ? 'MainNet' : 'TestNet' })
    setAddress(data[0].address);
  };
  
  const copy = (link) => {
    navigator.clipboard.writeText(window.location.href);
  };

  useEffect(() => {
    (async () => {
      if(hash && !tx){
        setTxn(await jsonLoad(hash));
      }
    })();
  }, [hash, tx]);
  
  const drop = async (event) => {
    setResult({ color: "", msg: "" });
    const hash = await uuid();
    history.push("/?" + hash);

    const callback = async (buffer) => {
      const data = txnFromBuffer(buffer);

      if(!data) {
        setResult({ color: "red", msg: "wrong file" });
        return;
      }
      
      const newTxn = { buffer: Array.from(buffer), data: data };

      await setTxn(newTxn);
      await setHash(hash);

      const json = await jsonStore(hash, newTxn);
      setTxn(json);
    };
    
    const file = event.target.files[0];
    readFile(file, callback);  
  };
  
  const sign = async () => {
    setResult({ color: "red", msg: "" });

    if (typeof window.AlgoSigner === "undefined") {
      alert("AlgoSigner is not installed");
      return;
    }

    if(txn.data.whosigned.includes(address)){
      setResult({ color: "red", msg: "This co-signer has already signed this transaction" });
      return;
    }

    // TODO - might be not necessary  
    if(!txn.data.cosigners.includes(address)){
      setResult({ color: "red", msg: "This address is not included in the co-signers list" });
      return;
    }

    const decoded = decode(Uint8Array.from(txn.buffer));
    const transaction = algosdk.Transaction.from_obj_for_encoding(decoded.txn);
    const binary = transaction.toByte();
    const base64 = window.AlgoSigner.encoding.msgpackToBase64(binary);
    const params = { version: 1, threshold: txn.data.threshold, addrs: txn.data.cosigners };

    const signed = await window.AlgoSigner.signTxn([{ txn: base64, msig: params }]);
    const blob = signed[0].blob;
    console.log(signed);
  
    txn.data.signatures.push(blob);
    txn.data.whosigned.push(address);

    const json = await jsonStore(hash, txn);
    setTxn(json);
  };

  const send = async () => {
    setResult({ color: "", msg: "" });
    setProcessing(true);

    const { buffer, data } = await jsonLoad(hash);    
    const { algodApiKey, algodUrl } = AllyConstants[data.network];
    const algodClient = new algosdk.Algodv2({ "X-API-Key": algodApiKey }, algodUrl, "");

    const signatures = data.signatures.map((sig) => window.AlgoSigner.encoding.base64ToMsgpack(sig));
    console.log("ss2:", data.signatures);

    try {
      var signedTxn;
      if(signatures.length > 1){
        signedTxn = algosdk.mergeMultisigTransactions(signatures);  
      } else {
        signedTxn = signatures[0];
      }

      const response = await algodClient.sendRawTransaction(signedTxn).do();
      await waitForConfirmation(algodClient, response.txId);
      const msg = "Transaction " + response.txId + " confirmed.";
      setResult({ color: "green", msg: msg });

      const json = { buffer, data: { ...data, sent: true }};
      await jsonStore(hash, json);
    } catch (error) {
      setResult({ color: "red", msg: error.message });
    }
    
    setProcessing(false);
  };

  return (
    <div>
      { !tx &&
        <div>
          <span className="green">Unsigned Multisig</span>
          <span> Transaction File</span>
          <br /><br />
          <div className="upload">
            <Button className="button">Upload</Button>
            <input type="file" onChange={(event) => drop(event)} />
          </div>
        </div>
      }
    
      { tx &&
        <div>
          <Button className="button" onClick={copy}>copy to clipboard</Button>
          <br />

          <div>
            <div>
              <br /><br />
              <span className="green">Multisig</span><span> Transaction</span>
            </div>
            <br />
            <div>network: {tx.network}</div>
            <div>type: {tx.type}</div>
            <div>app index: {tx.appIndex}</div>
            <div>on complete: {tx.onComplete}</div>
            { tx.amount &&
              <div>amount: {tx.amount}</div>
            }
            <div>fee: {tx.fee}</div>
            { tx.appArgs &&
              <div>
                <div>app args:</div>
                {tx.appArgs.map((arg, index) => (
                  <div key={index} style={{marginLeft: "20px"}}> - {arg} </div>
                ))}
              </div>
            }
            <br />
            <div>sender:</div>
            <div style={{marginLeft: "20px"}}> - {tx.address}</div>
            <br />
            <div>co-signers:</div>
            {tx.cosigners.map((signer, index) => (
              <div key={index} style={{marginLeft: "20px"}}>
                <span>- {signer} </span>
                { tx.whosigned.includes(signer) &&
                  <span className="green">signed</span>
                }
              </div>
            ))}
            <br />
            <div>signatures: {tx.signatures.length}/{tx.threshold}</div>
          </div>

          <br />
          { address &&
            <div>
              <br />
              <span>connected as: {address}</span>
            </div>
          }

          { tx.threshold !== tx.signatures.length &&
            <div>
              <br />
              { !address &&
                <Button className="button" onClick={connect}>connect</Button>
              }

              { address &&
                <Button className="button" onClick={sign}>sign</Button>
              }
            </div>
          }
          
          { tx.threshold === tx.signatures.length &&
            <div>
              { tx.sent &&
                <div className="green">This transaction has been sent</div>
              }
              { !tx.sent &&
                <div>
                  <div>
                    <br />
                    <Button className="button" onClick={send} disabled={processing}>
                      { processing &&
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      }
                      { processing ? " sending..." : "send" }
                    </Button>
                  </div>
                </div>
              }
            </div>
          }  
        </div>
      }

      <br /><br />
      <span className={result.color}>{result.msg}</span>

    </div>
  );
};

export default MultiSigner;

import algosdk from "algosdk";
import { decode } from "@msgpack/msgpack";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { AllyConstants } from "../Utils/constants";
import { waitForConfirmation, microToFloat } from "../Utils/algorand";
import { jsonStore, jsonLoad, uploadFile, readFile } from "../Utils/apis";


const MultiSigner = (props) => {
  let history = useHistory();
  const [hash, setHash] = useState(props.hash);
  const [txn, setTxn] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const [result, setResult] = useState({ color: "red", msg: "" });

  useEffect(() => {
    (async () => {
      if(hash){
        const txn = await jsonLoad(hash);
        setTxn(txn);
      }
    })();
  }, [hash]);
  
  const fromBase64 = (arg) => {
    if(arg[0] === 0){
      const buffer = Buffer.from(arg);
      const uint = buffer.readUIntBE(0, arg.length);
      return uint;
    }
    return Buffer.from(arg, "base64").toString();
  }
  
  const unsignedDrop = async (event) => {
    setResult({ color: "", msg: "" });
    var file = event.target.files[0];

    const callback = async (buffer) => {
      try {
        var decoded = decode(buffer);
        var txn = algosdk.Transaction.from_obj_for_encoding(decoded.txn);
      } catch(error) {
        setResult({ color: "red", msg: "Wrong file." });
        return;
      }
      
      const uploaded = await uploadFile(file);

      var appArgs = null;
      if(txn.appArgs){
        appArgs = txn.appArgs.map((arg) => fromBase64(arg))
      }

      const transaction = {
        sent: false,
        unsigned: { bin: Array.from(buffer), url: uploaded.url },
        appIndex: txn.appIndex,
        appArgs: appArgs,
        fee: microToFloat(txn.fee),
        address: algosdk.encodeAddress(txn.from.publicKey),
        threshold: decoded.msig.thr,
        signers: decoded.msig.subsig.map((signer) => algosdk.encodeAddress(signer.pk) ),
        signatures: [],
        signed: [],
        network: txn.genesisID,
        type: AllyConstants.txnTypes[txn.type],
        onComplete: AllyConstants.onCompleteTypes[txn.appOnComplete],
        amount: txn.amount,
        // genesisHash: fromBase64(txn.genesisHash),
        // note: decode txn.note
        // tag: decode txn.tag
        // lease: decode txn.lease
      };

      await jsonStore(uploaded.hash, transaction);
      setHash(uploaded.hash);
      setTxn(transaction);
      history.push("/?" + uploaded.hash);
    };

    readFile(file, callback);  
  };

  const signatureDrop = async (event) => {
    setResult({ color: "red", msg: "" });
    var file = event.target.files[0];

    const callback = async (buffer) => {
      try {
        var decoded = decode(buffer);
        var subsigs = decoded.msig.subsig;
      } catch(error) {
        setResult({ color: "red", msg: "Wrong file." });
        return;
      }

      var signer = "";
      for(let i=0; i<subsigs.length; i++){
        if(subsigs[i].s){
          signer = algosdk.encodeAddress(subsigs[i].pk);
        }
      }

      if(txn.signed.includes(signer)){
        setResult({ color: "red", msg: "The signer has already signed this transaction" });
        return;
      }
      
      if(!txn.signers.includes(signer)){
        setResult({ color: "red", msg: "The signer is not included in the allowed signers list" });
        return;
      }
      
      var cpy = {...txn};
      cpy.signed.push(signer);
      cpy.signatures.push(Array.from(buffer));

      const json = await jsonStore(hash, cpy);
      setTxn(json);
    };

    readFile(file, callback);
  };
  
  const download = (link) => {
    window.open(link, "_blank");
  };
  
  const send = async () => {
    setResult({ color: "", msg: "" });
    setProcessing(true);

    const txn = await jsonLoad(hash);
    const signatures = txn.signatures.map((sign) => Uint8Array.from(sign));
    
    const network = txn.network.split("-")[0];
    const { algodApiKey, algodUrl } = AllyConstants[network];
    const algodClient = new algosdk.Algodv2({ "X-API-Key": algodApiKey }, algodUrl, "");
    
    try {
      const signedTxn = algosdk.mergeMultisigTransactions(signatures);
      const response = await algodClient.sendRawTransaction(signedTxn).do();
      await waitForConfirmation(algodClient, response.txId);

      var cpy = {...txn};
      cpy.sent = true;

      await jsonStore(hash);
      const msg = "Transaction " + response.txId + " confirmed in round " + response["confirmed-round"];
      setResult({ color: "green", msg: msg });

    } catch (error) {
      setResult({ color: "red", msg: error.message });
    }
    
    setProcessing(false);
  };
  
  return (
    <div>  
      <div>
        <span className="green">Unsigned Multisig</span>
        <span> Transaction File</span>
      </div>
      <br />
      
      { !txn &&
        <div>
          <div className="upload">
            <Button className="button">Upload</Button>
            <input type="file" onChange={(event) => unsignedDrop(event)} />
          </div>
        </div>
      }
    
      { txn &&
        <div>
          { true &&
            <div>
              <Button className="button" onClick={() => download(txn.unsigned.url)}>Download</Button>
              
              <a
                className="link green"
                href="https://www.purestake.com/blog/multisig-transaction-example-5-steps-to-sending-algo-securely/"
                target="_blank"
                rel="noreferrer"
              >how can I sign offline</a><span className="green">?</span>
            </div>
          }
          <div>
            <div>
              <br /><br />
              <span className="green">Multisig</span>
              <span> Transaction Status</span>
            </div>
            <br />
            <div>network: {txn.network}</div>
            <div>type: {txn.type}</div>
            <div>app index: {txn.appIndex}</div>
            <div>on complete: {txn.onComplete}</div>
            { txn.amount &&
              <div>amount: {txn.amount}</div>
            }
            <div>fee: {txn.fee}</div>
            { txn.appArgs &&
              <div>
                <div>app args:</div>
                {txn.appArgs.map((arg, index) => (
                  <div key={index} style={{marginLeft: "20px"}}> - {arg} </div>
                ))}
              </div>
            }
            <br />
            <div>sender:</div>
            <div style={{marginLeft: "20px"}}> - {txn.address}</div>
            <br />
            <div>allowed signers:</div>
            {txn.signers.map((signer, index) => (
              <div key={index} style={{marginLeft: "20px"}}>
                <span>- {signer} </span>
                { txn.signed.includes(signer) &&
                  <span className="green">signed</span>
                }
              </div>
            ))}
            <br />
            <div>signatures: {txn.signatures.length}/{txn.threshold}</div>
          </div>
          
          { txn.threshold !== txn.signatures.length &&
            <div>
              <br /><br />
              <div>
                <span className="green">Add Signature</span>
                <span> File</span>
              </div>
              <br />
              <div className="upload">
                <Button className="button">Upload</Button>
                <input type="file" onChange={(event) => signatureDrop(event)} />
              </div>
            </div>
          }
          
          { txn.threshold === txn.signatures.length &&
            <div>
              { txn.sent &&
                <div>Transaction Sent</div>
              }
              { !txn.sent &&
                <div>
                  <div>
                    <br /><br />
                    <Button className="button" onClick={send} disabled={processing}>
                      { processing &&
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      }
                      { processing ? " Sending..." : "Send" }
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

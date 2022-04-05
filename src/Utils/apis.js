import axios from "axios";
import algosdk from "algosdk";
import { decode } from "@msgpack/msgpack";
import { v4 as uuidv4 } from 'uuid';
import { AllyConstants } from "./constants";
import { microToFloat } from "./algorand";

export function uuid(){
  return uuidv4().replace(/-/g, "");
}

export async function jsonStore(hash, data) {
  const res = await axios.post(
    AllyConstants.jsonStorage + hash,
    data
  );
  return res.data;
}

export async function jsonLoad(hash) {
  const res = await axios.get(
    AllyConstants.jsonStorage + hash
  );
  return res.data;
}

export function readFile(file, callback) {
  var reader = new FileReader();
  reader.readAsBinaryString(file);
  
  reader.onload = function(event) {
    const data = event.target.result;
    var buffer = new Uint8Array(data.length)
    for (let i = 0; i < data.length; i++) {
      buffer[i] = data.charCodeAt(i);
    }

    callback(buffer);
  };
}

const fromBase64 = (arg) => {
  if(arg[0] === 0){
    const buffer = Buffer.from(arg);
    const uint = buffer.readUIntBE(0, arg.length);
    return uint;
  }
  return Buffer.from(arg, "base64").toString();
}

export function txnFromBuffer(buffer) {
  try {
    var { msig, txn } = decode(buffer);
    txn = algosdk.Transaction.from_obj_for_encoding(txn);
  } catch(error) {
    return null;
  }

  return {
    threshold: msig.thr,
    cosigners: msig.subsig.map((sig) => algosdk.encodeAddress(sig.pk) ),

    amount: txn.amount,
    appIndex: txn.appIndex,
    network: txn.genesisID.split("-")[0],
    fee: microToFloat(txn.fee),
    type: AllyConstants.txnTypes[txn.type],
    address: algosdk.encodeAddress(txn.from.publicKey),
    onComplete: AllyConstants.onCompleteTypes[txn.appOnComplete],
    appArgs: txn.appArgs && txn.appArgs.map((arg) => fromBase64(arg)),
    
    // genesisHash: fromBase64(txn.genesisHash),
    // note: decode txn.note
    // tag: decode txn.tag
    // lease: decode txn.lease,
    
    sent: false,
    signatures: [],
    whosigned: []
  };
};


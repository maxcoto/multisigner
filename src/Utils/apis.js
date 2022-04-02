import axios from "axios";

import { AllyConstants } from "./constants";


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

export async function uploadFile(file) {
  const fileData = new FormData();
  fileData.append("file", file)

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    fileData,
    {
      maxContentLength: "Infinity",
      headers: {
        "Content-Type": `multipart/form-data;boundary=${fileData._boundary}`,
        'pinata_api_key': AllyConstants.pinataApiKey,
        'pinata_secret_api_key': AllyConstants.pinataApiSecret
      }
    }
  );
  
  const hash = res.data.IpfsHash;

  return {
    hash: hash,
    url: AllyConstants.pinataDownloadUrl + hash
  }
}

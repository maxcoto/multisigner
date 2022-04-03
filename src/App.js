import React from "react";
import { useLocation } from "react-router-dom";
import Multisig from "./Components/MultiSigner";
import "bootstrap/dist/css/bootstrap.min.css";


const loadHash = (location) => {
  if(!location) return null;
  if(!location.search) return null;
  const param = location.search.replace("?", "").trim();
  const hash = param === "" ? null : param;
  return hash;
}

const App = () => {
  const location = useLocation();
  const hash = loadHash(location);

  return (
    <div>
      <Multisig hash={hash} />
    </div>
  );
};

export default App;

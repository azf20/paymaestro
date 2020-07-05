import React, { useState } from 'react'
import 'antd/dist/antd.css';
//import { gql } from "apollo-boost";
import { ethers } from "ethers";
//import { useQuery } from "@apollo/react-hooks";
import "./App.css";
import { Row, Col } from 'antd';
import { useExchangePrice, useGasPrice, useContractLoader } from "./hooks"
import { Header, Account, AdminWidget, AddressInput } from "./components"

import ScribblePad from "./ScribblePad.js"
import ScribbleList from "./ScribbleList.js"

const mainnetProvider = new ethers.providers.InfuraProvider("mainnet","2717afb6bf164045b5d5468031b93f87")
const localProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER?process.env.REACT_APP_PROVIDER:"http://localhost:8545")

function App() {

  const readContracts = useContractLoader(localProvider);

  const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  const price = useExchangePrice(mainnetProvider)
  const gasPrice = useGasPrice("fast")

  return (
    <div className="App">
      <Header />
      <div style={{position:'fixed',textAlign:'right',right:0,top:0,padding:10}}>
        <Account
          address={address}
          setAddress={setAddress}
          localProvider={localProvider}
          injectedProvider={injectedProvider}
          setInjectedProvider={setInjectedProvider}
          mainnetProvider={mainnetProvider}
          price={price}
        />
      </div>
      <Row>
      <Col>
      <ScribblePad
        address={address}
        mainnetProvider={mainnetProvider}
        injectedProvider={injectedProvider}
        readContracts={readContracts}
      />
      </Col>
      <Col>
      <ScribbleList
      address={address}
      readContracts={readContracts}
      injectedProvider={injectedProvider}
      mainnetProvider={mainnetProvider}/>
      </Col>
      </Row>

      <AdminWidget
        address={address}
        localProvider={localProvider}
        injectedProvider={injectedProvider}
        mainnetProvider={mainnetProvider}
        price={price}/>

    </div>
  );
}

export default App;

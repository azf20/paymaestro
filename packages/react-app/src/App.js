import React, { useState } from 'react'
import 'antd/dist/antd.css';
//import { gql } from "apollo-boost";
import { ethers } from "ethers";
//import { useQuery } from "@apollo/react-hooks";
import "./App.css";
import { Row, Col } from 'antd';
import { useExchangePrice, useGasPrice } from "./hooks"
import { Header, Account, Provider, Faucet, Ramp } from "./components"

import SmartContractWallet from './SmartContractWallet.js'

const mainnetProvider = new ethers.providers.InfuraProvider("mainnet","813ba28a534f416793957d3fe470923c")
const localProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER?process.env.REACT_APP_PROVIDER:"http://localhost:8545")

function App() {

  const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  const [metaProvider, setMetaProvider] = useState();
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
          metaProvider={metaProvider}
          setMetaProvider={setMetaProvider}
          mainnetProvider={mainnetProvider}
          price={price}
        />
      </div>
      <div style={{padding:40,textAlign: "left"}}>
        <SmartContractWallet
          address={address}
          injectedProvider={injectedProvider}
          metaProvider={metaProvider}
          localProvider={localProvider}
          price={price}
          gasPrice={gasPrice}
        />
      </div>
      <div style={{position:'fixed',textAlign:'right',right:0,bottom:20,padding:10}}>
        <Row align="middle" gutter={4}>
          <Col span={6}>
            <Provider name={"mainnet"} provider={mainnetProvider} />
          </Col>
          <Col span={6}>
            <Provider name={"local"} provider={localProvider} />
          </Col>
          <Col span={6}>
            <Provider name={"injected"} provider={injectedProvider} />
          </Col>
          <Col span={6}>
            <Provider name={"meta"} provider={metaProvider} />
          </Col>
        </Row>
      </div>
      <div style={{position:'fixed',textAlign:'left',left:0,bottom:20,padding:10}}>
        <Row align="middle" gutter={4}>
          <Col span={9}>
            <Ramp
              price={price}
              address={address}
            />
          </Col>
          <Col span={15}>
            <Faucet
              localProvider={localProvider}
              dollarMultiplier={price}
            />
          </Col>
        </Row>


      </div>

    </div>
  );
}

export default App;

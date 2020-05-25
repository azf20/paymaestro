import React, { useState } from 'react'
import { ethers } from "ethers";
import Blockies from 'react-blockies';
import { Card, Row, Col, List, Tabs, Form, Input, Button, Modal } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useContractLoader, useContractReader, useEventListener, useBlockNumber, useBalance } from "./hooks"
import { Transactor } from "./helpers"
import { Address, Balance, Timeline } from "./components"
const { Meta } = Card;
const { TabPane } = Tabs;

const { Search } = Input;

export default function SmartContractWallet(props) {

  const tx = Transactor(props.injectedProvider,props.gasPrice)

  const localBlockNumber = useBlockNumber(props.localProvider)
  const localBalance = useBalance(props.address,props.localProvider)

  const readContracts = useContractLoader(props.localProvider);
  const writeContracts = useContractLoader(props.injectedProvider);
  const metaWriteContracts = useContractLoader(props.metaProvider);

  const contractsList = ["SmartContractWallet","PayMaestro"]

  let contracts = {}

  for (const contractIndex in contractsList) {
    contracts[contractsList[contractIndex]] = {}
  }

  const contractName = "SmartContractWallet"

  contracts[contractName]['owner'] = useContractReader(readContracts,"SmartContractWallet","owner",1777);
  contracts['PayMaestro']['owner'] = useContractReader(readContracts,'PayMaestro',"owner",1777);

  contracts["SmartContractWallet"]['address'] = readContracts?readContracts["SmartContractWallet"].address:""
  contracts['PayMaestro']['address'] = readContracts?readContracts['PayMaestro'].address:""

  const title = useContractReader(readContracts,"SmartContractWallet","title",1777);
  const ownerUpdates = useEventListener(readContracts,"SmartContractWallet","UpdateOwner",props.localProvider,1);//set that last number to the block the contract is deployed (this needs to be automatic in the contract loader!?!)

  contracts['PayMaestro']['relayBalance'] = useContractReader(readContracts,'PayMaestro',"getRelayHubDeposit",1777);
  contracts['PayMaestro']['relayBalanceString'] = contracts['PayMaestro']['relayBalance']?contracts['PayMaestro']['relayBalance'].toString():"";
  contracts['PayMaestro']['starterBalance'] = useContractReader(readContracts,'PayMaestro',"starterBalance",1777);
  contracts['PayMaestro']['starterBalanceString'] = contracts['PayMaestro']['starterBalance']?contracts['PayMaestro']['starterBalance'].toString():"";

  contracts['PayMaestro']['TargetsAdded'] = useEventListener(readContracts,'PayMaestro',"TargetAdded",props.localProvider,1,[null, props.injectedProvider?props.injectedProvider.address:props.address]);

  contracts['PayMaestro']['myFunder'] = useContractReader(readContracts,'PayMaestro',"funder",[props.address],1777);

  const [targetAddress, setTargetAddress] = useState('placeholder')
  const [targetModal, setTargetModal] = useState(false)

  const targetAddressInfo = useContractReader(readContracts,'PayMaestro',"target",[targetAddress]);

  function showTargetModal(address) {
    setTargetModal(true)
    setTargetAddress(address)
  }

  function hideTargetModal() {
    setTargetModal(false)
    setTargetAddress('placeholder')
    targetAddressInfo.exists = false
  }

  let targetModalContents

    if(targetAddressInfo && targetAddressInfo.exists) {
      targetModalContents = (
        <>
      <Row>
        <Col span={12} style={{textAlign:"right",opacity:0.333,paddingRight:6,fontSize:24}}>Target Address:</Col>
        <Col span={12}><Address value={targetAddressInfo.targetAddress} /></Col>
      </Row>
      <Row>
        <Col span={12} style={{textAlign:"right",opacity:0.333,paddingRight:6,fontSize:24}}>Funder Address:</Col>
        <Col span={12}><Address value={targetAddressInfo.funderAddress} /></Col>
      </Row>
      <Row>
        <Col span={12} style={{textAlign:"right",opacity:0.333,paddingRight:6,fontSize:24}}>Active?</Col>
        <Col span={12} style={{fontSize:24}}>{targetAddressInfo.active?'✅':'❌'}</Col>
      </Row>
      <Row>
      <Button style={{verticalAlign:"top",marginLeft:8,marginTop:4}} shape={"round"} type="secondary" onClick={() => {
        if(targetAddressInfo.active) {
        tx(
           writeContracts['PayMaestro'].deactivateTarget(targetAddressInfo.targetAddress
           )
        )}
        else {
        tx(
           writeContracts['PayMaestro'].activateTarget(targetAddressInfo.targetAddress
           )
        )}
      }}>
            {targetAddressInfo.active?'Deactivate':'Activate'}
          </Button>
      </Row>
      </>
    )}
    else {
      targetModalContents = (<Row>
        <Col span={8} style={{textAlign:"right",opacity:0.333,paddingRight:6,fontSize:24}}>Loading...</Col>
      </Row>)
    }

  function displayDeployedAddress(contract) {
    if(readContracts && readContracts[contract]) {
    return (
      <Row>
        <Col span={10} style={{textAlign:"right",opacity:0.333,paddingRight:6,fontSize:24}}>Deployed to:</Col>
        <Col span={14}><Address value={contracts[contract]['address']} /></Col>
      </Row>
    )
  }
  }

  let payMaestroMeta

  if(readContracts && readContracts["PayMaestro"]) {
    payMaestroMeta = (
    <>
    {displayDeployedAddress("PayMaestro")}
    <Row>
      <Col span={10} style={{textAlign:"right",opacity:0.333,paddingRight:6,fontSize:24}}>Relay Balance:</Col>
      <Col span={14} style={{fontSize:24}}>
        {ethers.utils.formatEther(contracts['PayMaestro']['relayBalanceString'])}
      </Col>
    </Row>
    <Row>
      <Col span={10} style={{textAlign:"right",opacity:0.333,paddingRight:6,fontSize:24}}>Starter Balance:</Col>
      <Col span={14} style={{fontSize:24}}>
        {ethers.utils.formatEther(contracts['PayMaestro']['starterBalanceString'])}
      </Col>
    </Row>
    </>
  )
}


  let displayOwner

  if(readContracts && readContracts[contractName]){
    displayOwner = (
      <Row>
        <Col span={8} style={{textAlign:"right",opacity:0.333,paddingRight:6,fontSize:24}}>Owner:</Col>
        <Col span={16}><Address value={contracts[contractName]['owner']} onChange={(newOwner)=>{
          tx(
             metaWriteContracts['SmartContractWallet'].updateOwner(newOwner,
               { gasLimit: ethers.utils.hexlify(40000) }
             )
          )
        }}/></Col>
      </Row>
    )
  }

  function displayContractInfo(contract, metaInformation = "") {
    return (
    <Card
      title={(
        <div>
          {contract}
          <div style={{float:'right',opacity:title?0.77:0.33}}>
            <Balance
              address={contracts[contract]['address']}
              provider={props.localProvider}
              dollarMultiplier={props.price}
            />
          </div>
        </div>
      )}
      size="large"
      style={{ width: 550, marginTop: 25 }}
      loading={!contracts[contract]['address']}
      actions={[
          <div onClick={()=>{
            tx({
              to: contracts[contract]['address'],
              value: ethers.utils.parseEther('0.001'),
            })
          }}>
            <DownloadOutlined /> Deposit
          </div>,
      ]}>
        <Meta
          description={(
            <div>
              {metaInformation}
            </div>
          )}
        />
    </Card>
  )
  }

  return (
    <div>
    <Tabs defaultActiveKey="1">
    <TabPane tab="SmartContractWallet" key="1">
      <Card
        title={(
          <div>
            {title}
            <div style={{float:'right',opacity:title?0.77:0.33}}>
              <Balance
                address={contracts["SmartContractWallet"]['address']}
                provider={props.localProvider}
                dollarMultiplier={props.price}
              />
            </div>
          </div>
        )}
        size="large"
        style={{ width: 550, marginTop: 25 }}
        loading={!title}
        actions={[
            <div onClick={()=>{
              tx(
                metaWriteContracts['SmartContractWallet'].withdraw(
                  { gasLimit: ethers.utils.hexlify(40000) }
                )
              )
            }}>
              <UploadOutlined /> Withdraw
            </div>,
            <div onClick={()=>{
              tx({
                to: contracts["SmartContractWallet"]['address'],
                value: ethers.utils.parseEther('0.001'),
              })
            }}>
              <DownloadOutlined /> Deposit
            </div>,
        ]}>
          <Meta
            description={(
              <div>
                {displayDeployedAddress('SmartContractWallet')}
                {displayOwner}
              </div>
            )}
          />
      </Card>
      <List
        style={{ width: 550, marginTop: 25}}
        header={<div><b>UpdateOwner</b> events</div>}
        bordered
        dataSource={ownerUpdates}
        renderItem={item => (
          <List.Item style={{ fontSize:22 }}>
            <Blockies seed={item.oldOwner.toLowerCase()} size={8} scale={2}/> transferred ownership to <Blockies seed={item.newOwner.toLowerCase()} size={8} scale={2}/>
          </List.Item>
        )}
      />
    </TabPane>
    <TabPane tab="PayMaestro" key="2">
    <Row gutter={16}>
    <Col>
    {displayContractInfo("PayMaestro", payMaestroMeta)}
    <List
      style={{ width: 550, marginTop: 25}}
      header={<div><b>Target Added</b> events</div>}
      bordered
      dataSource={contracts['PayMaestro']['TargetsAdded']}
      renderItem={item => (
        <List.Item style={{ fontSize:22 }}>
          <Address value={item.target} size={8} scale={2}/>
          <Button style={{verticalAlign:"top",marginLeft:8,marginTop:4}} shape={"round"} type="secondary" onClick={() => showTargetModal(item.target)}>
                View details
              </Button>
        </List.Item>
      )}
    />
    </Col>
    <Col>
    <Card title="Add a contract to the PayMaestro"
    size="large"
    style={{ width: 550, marginTop: 25 }}>
    <Row>
      <Col span={8} style={{textAlign:"right",opacity:0.333,paddingRight:6,fontSize:24}}>My balance:</Col>
      <Col span={16} style={{fontSize:24}}>
        {contracts['PayMaestro']['myFunder']?ethers.utils.formatEther(contracts['PayMaestro']['myFunder']['balance'].toString()):123.0}
      </Col>
    </Row>
    <Search
      placeholder="enter contract address"
      enterButton="Add to PayMaestro"
      size="large"
      onSearch={(newTarget)=>{
        tx(
           writeContracts['PayMaestro'].addTarget(newTarget
           )
        )}
      }
    />
    </Card>
    </Col>
    </Row>
    <Modal
          title="Paymaster Target Details"
          visible={targetModal}
          onOk={hideTargetModal}
          onCancel={hideTargetModal}
        >
          {targetModalContents}
    </Modal>
    </TabPane>
    </Tabs>
    </div>
  );

}

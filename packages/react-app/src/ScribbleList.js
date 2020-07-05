import React, { useState, useEffect, useRef } from 'react'
import { Modal, Button, List, Popover, Badge, Avatar, Empty, Tabs, Typography, Card} from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useContractReader } from "./hooks"
const { TabPane } = Tabs;

const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI({host: 'ipfs.infura.io', port: '5001', protocol: 'https' })
const { BufferList } = require('bl')

export default function ScribbleList(props) {

  const getFromIPFS = async hashToGet => {
    for await (const file of ipfs.get(hashToGet)) {
      if (!file.content) continue;
      const content = new BufferList()
      for await (const chunk of file.content) {
        content.append(chunk)
      }
      return content
    }
  }

  let scribbles
  const [scribbleData, setScribbleData] = useState()

  let scribbleView

  let totalScribbles
  totalScribbles = useContractReader(props.readContracts,'Scribbler',"totalScribbles",1777);

  let displayTotalScribbles
  if(totalScribbles) {
    displayTotalScribbles = totalScribbles.toString()
  }

  useEffect(()=>{
    if(props.readContracts && props.address && totalScribbles) {

  const loadScribbles = async () => {
    scribbles = new Array(totalScribbles)

    const getScribbleInfo = async (i) => {
      let scribbleInfo = await props.readContracts['Scribbler']["scribbleById"](i)

      let ipfsHash = scribbleInfo[0]

      let scribbleImageURI
      const imageFromIPFS = await getFromIPFS(ipfsHash)
      scribbleImageURI = 'data:image/png;base64,' + imageFromIPFS.toString('base64')


      return {scribbleId: i, artist: scribbleInfo[1], url: scribbleInfo[0], image: scribbleImageURI}
    }
    for(var i = 0; i < totalScribbles.toString(); i++){
      let scribbleInfo = await getScribbleInfo(i+1)
      scribbles[i] = scribbleInfo
    }

    setScribbleData(scribbles)
  }

  loadScribbles()

}
})

useEffect(()=>{
  if(scribbles) {
  setScribbleData(scribbles)
}
},[scribbles])

if(totalScribbles > 0) {
scribbleView = (
  <List
    itemLayout="horizontal"
    dataSource={scribbleData}
    renderItem={item => (
      <List.Item>
        <List.Item.Meta
          avatar={item['image']?<img src={item['image']} height="50" width="50"/>:<Avatar icon={<LoadingOutlined />} />}
          title={<a href={'https://ipfs.io/ipfs/' + item['url']}>{'Scribble #' + item['scribbleId'] + ' by ' + item['artist']}</a>}
        />
      </List.Item>
    )}
  />)
} else { scribbleView = (<Empty
    description={
      <span>
        No one has saved any scribbles :(
      </span>
    }
  />
  )}

    return (
      <Card title="Scribbles">
          {scribbleView}
      </Card>
    );

}

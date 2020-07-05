import React, { useState, useRef, useEffect } from 'react'
import 'antd/dist/antd.css';
import "./App.css";
import { UndoOutlined, ClearOutlined, PlaySquareOutlined, DoubleRightOutlined, PlusOutlined } from '@ant-design/icons';
import { Row, Button, Input, InputNumber, Form, Typography, Space, Checkbox, notification, message } from 'antd';
import { useContractLoader } from "./hooks"
import { Transactor } from "./helpers"
import CanvasDraw from "react-canvas-draw";
import { ChromePicker, TwitterPicker, CompactPicker, CirclePicker } from 'react-color';
import LZ from "lz-string";

const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI({host: 'ipfs.infura.io', port: '5001', protocol: 'https' })
const Hash = require('ipfs-only-hash')
const { BufferList } = require('bl')
const axios = require('axios');
const pickers = [CompactPicker, ChromePicker, TwitterPicker, CirclePicker]


export default function InkCanvas(props) {

  const writeContracts = useContractLoader(props.injectedProvider);
  const tx = Transactor(props.injectedProvider)

  const [picker, setPicker] = useState(0)
  const [color, setColor] = useState("#666666")
  const [drawing, setDrawing] = useState("")

  const drawingCanvas = useRef(null);
  const calculatedVmin = Math.min(window.document.body.clientHeight, window.document.body.clientWidth)
  const [size, setSize] = useState([0.7 * calculatedVmin, 0.7 * calculatedVmin])//["70vmin", "70vmin"]) //["50vmin", "50vmin"][750, 500]

  const [formLimit, setFormLimit] = useState(false);

  const getFromIPFS = async hashToGet => {
    for await (const file of ipfs.get(hashToGet)) {
      console.log(file.path)
      if (!file.content) continue;
      const content = new BufferList()
      for await (const chunk of file.content) {
        content.append(chunk)
      }
      console.log(content)
      return content
    }
  }

  const addToIPFS = async fileToUpload => {
    for await (const result of ipfs.add(fileToUpload)) {
      return result
    }
  }

  const mintScribble = async (hashToMint) => {
  let result = await tx(writeContracts["Scribbler"].createScribble(hashToMint))//eventually pass the JSON link not the Drawing link
  console.log("result", result)
  return result
}

  const PickerDisplay = pickers[picker % pickers.length]

  const createScribble = async values => {
    console.log('Success:', values);

    let imageData = drawingCanvas.current.canvas.drawing.toDataURL("image/png");

    let imageBuffer = Buffer.from(imageData.split(",")[1], 'base64')

    const imageHash = await Hash.of(imageBuffer)
    console.log("imageHash", imageHash)

    //setMode("mint")
    notification.open({
    message: 'Saving Scribble to the blockchain',
    description:
      'Contacting the smartcontract',
    });

    var mintResult = await mintScribble(imageHash);

    if(mintResult) {

    //setMode("mint")
    notification.open({
    message: 'Sending scribble to IPFS',
    description:
      'Uploading to the distributed web',
    });

    message.loading('Uploading to IPFS...', 0);

    const imageResult = addToIPFS(imageBuffer)

    Promise.all([imageResult]).then((values) => {
      console.log(values);
      message.destroy()
      //setMode("mint")
      notification.open({
      message: 'Scribble saved in IPFS',
      description:
        'Your scribble is now InterPlanetary!',
      });
    });
    }
  };


  const onFinishFailed = errorInfo => {
  console.log('Failed:', errorInfo);
  };

  let top, buttons, bottom

    top = (
      <div style={{ width: "90vmin", margin: "0 auto", marginBottom: 16}}>

      <Form
      layout={'inline'}
      name="createScribble"
      onFinish={createScribble}
      onFinishFailed={onFinishFailed}
      labelAlign = {'middle'}
      style={{justifyContent: 'center'}}
      >
      <Form.Item
      name="title"
      rules={[{ required: true, message: 'What is this work of art called?' }]}
      >
      <Input placeholder={"name"} />
      </Form.Item>

      <Form.Item >
      <Button type="primary" htmlType="submit">
        Save
      </Button>
      </Form.Item>
      </Form>

      </div>

    )

    buttons = (
      <div>
        <Button onClick={() => {
          drawingCanvas.current.undo()
        }}><UndoOutlined /> UNDO</Button>
        <Button onClick={() => {
          drawingCanvas.current.clear()
          setDrawing()
        }}><ClearOutlined /> CLEAR</Button>
        <Button onClick={() => {
          drawingCanvas.current.loadSaveData(LZ.decompress(drawing), false)
        }}><PlaySquareOutlined /> PLAY</Button>
      </div>
    )
    bottom = (
      <Row style={{ width: "90vmin", margin: "0 auto", justifyContent:'center'}}>
        <Space>
        <PickerDisplay
          color={color}
          onChangeComplete={setColor}
        />
        <div style={{ marginTop: 16 }}>
          <Button onClick={() => {
            setPicker(picker + 1)
          }}><DoubleRightOutlined /></Button>
        </div>

        </Space>
      </Row>
    )

  return (
      <div>
      {top}
          <div style={{ backgroundColor: "#666666", width: size[0], margin: "0 auto", border: "1px solid #999999", boxShadow: "2px 2px 8px #AAAAAA" }}>
            <CanvasDraw
              key={props.mode}
              ref={drawingCanvas}
              canvasWidth={size[0]}
              canvasHeight={size[1]}
              brushColor={color.hex}
              lazyRadius={4}
              brushRadius={8}
              onChange={(newDrawing) => {
                let savedData = LZ.compress(newDrawing.getSaveData())
                setDrawing(savedData)
              }}
            />
          </div>
          <div style={{ padding: 8 }}>
            {buttons}
          </div>
          {bottom}
      </div>
  );
}

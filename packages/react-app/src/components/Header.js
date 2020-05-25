import React from 'react'
import { PageHeader } from 'antd';

export default function Header(props) {
  return (
    <div onClick={()=>{
      window.open("https://azfuller.com");
    }}>
      <PageHeader
        title="🎛️ hack-money"
        subTitle="a meandering web3 journey"
        style={{cursor:'pointer'}}
      />
    </div>
  );
}

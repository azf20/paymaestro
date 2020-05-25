import { useState, useEffect } from 'react';

export default function useEventListener(contracts,contractName,eventName,provider,startBlock,filters,args) {

  const [updates,setUpdates] = useState([]);

  useEffect(() => {
    if(typeof provider != "undefined"&&typeof startBlock != "undefined"){
      // if you want to read _all_ events from your contracts, set this to the block number it is deployed
      provider.resetEventsBlock(startBlock)
    }
    if(contracts && contractName && contracts[contractName]){
      let eventOrFilter
      if(filters) {
        eventOrFilter = contracts[contractName].filters[eventName](...filters)
      }
      else {eventOrFilter = eventName}
      try{
        contracts[contractName].on(eventOrFilter, (...args) => {
          setUpdates(messages => [...messages, (args.pop()).args])
        });
        return ()=>{
          contracts[contractName].removeListener(eventName)
        }
      }catch(e){
        console.log(e)
      }
    }
  },[provider,contracts,contractName,eventName])

  return updates;
}

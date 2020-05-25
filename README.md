
# PayMaestro

> TL;DR: Hacking on GSN for Hack.Money

- PayMaestro is a GSN2 Paymaster: add, fund and manage your contracts, and have some gas to get you started!
- Extending Austin Griffith's [scaffold-eth](https://github.com/austintgriffith/scaffold-eth) as a Proof-of-Concept

---

## ⏱ Quickstart:

First, you'll need [NodeJS>=10](https://nodejs.org/en/download/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads) installed.

💾 Clone/fork repo and then install:

```
yarn install
```

---

⛓ Start your local blockchain powered by 👷‍♀️[Buidler](https://buidler.dev/tutorial/):
```
yarn run chain
```

__Note__: You'll need to run this command in a new terminal window

Get GSN running locally
```
yarn gsn-start
```
__Note__: You'll need to run this command in *another* new terminal window

*Update the packages/buidler/contracts/PayMaestro.args file with the RelayHub address*

⚙️ Compile your contracts:
```
yarn run compile
```

🚢 Deploy your contracts to the frontend:
```
yarn run deploy
```

You're ready to run the frontend!

```
yarn start
```

Tip of the hat to:
⚛️ [React](https://reactjs.org/tutorial/tutorial.html)
📱[create-eth-app](https://github.com/PaulRBerg/create-eth-app)
🔧[Ethers.js](https://docs.ethers.io/ethers.js/html/index.html)
[scaffold-eth](https://github.com/austintgriffith/scaffold-eth)
[antd](ant.design/components/upload/)
[truffle](https://www.trufflesuite.com)

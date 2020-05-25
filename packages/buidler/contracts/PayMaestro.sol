pragma solidity >=0.6.2 <0.7.0;
pragma experimental ABIEncoderV2;

import "@opengsn/gsn/contracts/BasePaymaster.sol";



contract PayMaestro is BasePaymaster {

  string name;

  constructor(IRelayHub _relayHub) public {
        starterBalance = 50000000000000000;
        gasUsedByPost = 0;
        setRelayHub(_relayHub);
        name = "PayMaestro";
    }

  struct Target {
    uint256 id;
    address targetAddress;
    address funderAddress;
    bool exists;
    uint256 spend;
    bool active;
  }

  struct Funder {
    uint256 id;
    address funderAddress;
    bool exists;
    uint256 balance;
    uint256 spend;
    uint256 starterBalance;
    mapping (address => uint256) targetIndex;
    address[] targets;
  }

  // @notice starterBalance
  uint256 public starterBalance;

  // @notice All target information
  address[] public allTargets;
  uint256 public targetNumber;
  address[] public allFunders;

  // @notice Mapping target contracts and funders
  mapping (address => Target) public target;
  mapping (address => Funder) public funder;

	// Events
	event TargetAdded(address indexed target, address indexed funder);
  event TargetDeleted(address indexed target, address indexed funder);
  event FunderAdded(address indexed funder);
  event TargetActivated(address indexed target, address indexed funder);
  event TargetDeactivated(address indexed target, address indexed funder);
  event FundsAdded(address indexed funder, uint256 amount);
  event FundsWithdrawn(address indexed funder, uint256 amount);
  event NewStarterBalance(uint256 newBalance);

  //filled by calculatePostGas()
  uint256 public gasUsedByPost;

  /**
   * set gas used by postRelayedCall, for proper gas calculation.
   * You can use TokenGasCalculator to calculate these values (they depend on actual code of postRelayedCall,
   * but also the gas usage of the token and of Uniswap)
   */
  function setPostGasUsage(uint256 _gasUsedByPost) external onlyOwner {
      gasUsedByPost = _gasUsedByPost;
  }


  function addTarget(address _targetAddress) external {

    require(!target[_targetAddress].exists, "this target already exists!");

    uint256 _target_number = targetNumber + 1;
    targetNumber = targetNumber + 1;

    Target memory _target = Target({
      id: _target_number,
      targetAddress: _targetAddress,
      funderAddress: msg.sender,
      exists: true,
      spend: 0,
      active: true
    });

    target[_targetAddress] = _target;

    if(funder[msg.sender].exists) {
      funder[msg.sender].targets.push(_targetAddress);
      funder[msg.sender].targetIndex[msg.sender] = funder[msg.sender].targets.length + 1;
    }
    else {
        uint256 _funderNumber = allFunders.length + 1;

      Funder memory _funder;

      funder[msg.sender] = _funder;
      funder[msg.sender].id = _funderNumber;
      funder[msg.sender].funderAddress = msg.sender;
      funder[msg.sender].exists = true;
      funder[msg.sender].balance = starterBalance;
      funder[msg.sender].starterBalance = starterBalance;
      funder[msg.sender].spend = 0;
      funder[msg.sender].targets.push(_targetAddress);
      funder[msg.sender].targetIndex[_targetAddress] = 1;

      allFunders.push(msg.sender);
      emit FunderAdded(msg.sender);
    }

    allTargets.push(_targetAddress);

    emit TargetAdded(_targetAddress, msg.sender);
  }

  function removeTarget(address _targetAddress) external {

    Target memory _target = target[_targetAddress];

    require(_target.exists, "this target does not exist!");
    require(msg.sender == _target.funderAddress, "sender is not the funder!");

    uint256 _targetIndex = funder[msg.sender].targetIndex[_targetAddress];
    delete funder[msg.sender].targets[_targetIndex];

    delete allTargets[_target.id];
    delete target[_targetAddress];

    emit TargetDeleted(_targetAddress, msg.sender);
  }

  function setStarterBalance(uint256 _starterBalance) public onlyOwner {
    starterBalance = _starterBalance;
    emit NewStarterBalance(_starterBalance);
  }

  function deactivateTarget(address targetAddress) public {
    require(target[targetAddress].exists, "this target does not exist!");
    require(target[targetAddress].active, "this target is already inactive!");
    require(target[targetAddress].funderAddress == msg.sender, "only the funder can deactivate");

    target[targetAddress].active = false;

    emit TargetDeactivated(targetAddress, msg.sender);
  }

  function activateTarget(address targetAddress) public {
    require(target[targetAddress].exists, "this target does not exist!");
    require(!target[targetAddress].active, "this target is already active!");
    require(target[targetAddress].funderAddress == msg.sender, "only the funder can deactivate");

    target[targetAddress].active = true;

    emit TargetActivated(targetAddress, msg.sender);
  }

  function withdrawFunderBalance() public {
    uint256 owed = funder[msg.sender].balance + funder[msg.sender].spend - funder[msg.sender].starterBalance;
    require(funder[msg.sender].exists, "this target does not exist!");
    require(owed > 0, "You have no free balance");
    msg.sender.transfer(owed);
    emit FundsWithdrawn(msg.sender, owed);
  }

  receive() external payable override {
    require(address(relayHub) != address(0), "relay hub address not set");
    relayHub.depositFor{value:msg.value}(address(this));
    if(funder[msg.sender].exists) {
      funder[msg.sender].balance += msg.value;
    }
    emit FundsAdded(msg.sender, msg.value);
  }

	// GNSTypes.RelayRequest is defined in GNSTypes.sol.
	// The relevant fields for us are:
	// target - the address of the target contract
	// encodedFunction - the called function's name and parameters
	// relayData.senderAddress - the sender's address
	function acceptRelayedCall(
		GSNTypes.RelayRequest calldata relayRequest  ,
		bytes calldata approvalData,
		uint256 maxPossibleGas
	) external view override returns (bytes memory context) {
		(approvalData, maxPossibleGas);  // avoid a warning

    Target memory _target = target[relayRequest.target];
    uint256 maxPossibleCharge = relayHub.calculateCharge(maxPossibleGas, relayRequest.gasData);
		require(_target.exists,"This target contract has not been added");
    require(_target.active,"This target is not currently active");
    require(funder[_target.funderAddress].balance >= maxPossibleCharge,"The funder does not have enough gas");

		// If we got here, we're successful. Return the time
		// to be able to match PreRelayed and PostRelayed events
		return abi.encode(relayRequest.target);
	}

	event PreRelayed(uint);
	event PostRelayed(uint);

	function preRelayedCall(
		bytes calldata context
	) external relayHubOnly override returns(bytes32) {
		emit PreRelayed(abi.decode(context, (uint256)));
		return bytes32(0);
	}

	function postRelayedCall(
		bytes calldata context,
		bool success,
		bytes32 preRetVal,
		uint256 gasUse,
		GSNTypes.GasData calldata gasData
	) external relayHubOnly override {
		(success, preRetVal, gasUse, gasData);
    address _targetAddress = abi.decode(context, (address));
    uint256 chargeAmount = relayHub.calculateCharge(gasUse + gasUsedByPost, gasData);
    funder[target[_targetAddress].funderAddress].balance -= chargeAmount;
    funder[target[_targetAddress].funderAddress].spend += chargeAmount;
    target[_targetAddress].spend += chargeAmount;

		emit PostRelayed(abi.decode(context, (uint256)));

	}

}

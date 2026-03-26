// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

struct UserOperationV06 {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}

interface IEntryPointV06 {
    function depositTo(address account) external payable;
    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external;
}

contract PaymasterV06 is Ownable {
    enum PostOpMode {
        opSucceeded,
        opReverted,
        postOpReverted
    }

    IEntryPointV06 public immutable entryPoint;

    constructor(address _entryPoint) Ownable(msg.sender) {
        entryPoint = IEntryPointV06(_entryPoint);
    }

    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), "only EntryPoint");
        _;
    }

    function validatePaymasterUserOp(
        UserOperationV06 calldata,
        bytes32,
        uint256
    ) external view returns (bytes memory context, uint256 validationData) {
        context = new bytes(0);
        validationData = 0;
    }

    function postOp(
        PostOpMode,
        bytes calldata,
        uint256
    ) external {
    }

    function deposit() external payable onlyOwner {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    function withdrawTo(address payable to, uint256 amount) external onlyOwner {
        entryPoint.withdrawTo(to, amount);
    }

    receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

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

interface IAccountV06 {
    function validateUserOp(
        UserOperationV06 calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);
}

contract AccountV06 is IAccountV06 {
    address public owner;
    address public immutable entryPoint;

    constructor(address _owner, address _entryPoint) {
        owner = _owner;
        entryPoint = _entryPoint;
    }

    function validateUserOp(
        UserOperationV06 calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override returns (uint256 validationData) {
        require(msg.sender == entryPoint, "only EntryPoint");

        bytes32 hash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        address recovered = ECDSA.recover(hash, userOp.signature);

        if (missingAccountFunds > 0) {
            (bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
            require(success, "failed to pay EntryPoint");
        }

        return owner == recovered ? 0 : 1;
    }

    function execute(address dest, uint256 value, bytes calldata func) external {
        require(msg.sender == entryPoint, "only EntryPoint");
        (bool success, bytes memory result) = dest.call{value: value}(func);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    receive() external payable {}
}

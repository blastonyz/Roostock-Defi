// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Paymaster is IPaymaster, Ownable {
    IEntryPoint public immutable entryPoint;

    constructor(address _entryPoint) Ownable(msg.sender) {
        entryPoint = IEntryPoint(_entryPoint);
    }

    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), "only EntryPoint");
        _;
    }

    function validatePaymasterUserOp(
        PackedUserOperation calldata,
        bytes32,
        uint256
    ) external view override onlyEntryPoint returns (bytes memory context, uint256 validationData) {
        context = new bytes(0);
        validationData = 0;
    }

    function postOp(
        PostOpMode,
        bytes calldata,
        uint256,
        uint256
    ) external override onlyEntryPoint {
    }

    function deposit() external payable onlyOwner {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    function withdrawTo(address payable to, uint256 amount) external onlyOwner {
        entryPoint.withdrawTo(to, amount);
    }

    receive() external payable {}
}

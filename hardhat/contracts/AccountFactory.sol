// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Account.sol";
import "@openzeppelin/contracts/utils/Create2.sol";

contract AccountFactory {
    address public immutable entryPoint;

    constructor(address _entryPoint) {
        entryPoint = _entryPoint;
    }

    function createAccount(address _owner) external returns (address) {
        bytes32 salt = bytes32(uint256(uint160(_owner)));
        bytes memory bytecode = _accountCreationCode(_owner);

        address addr = Create2.computeAddress(salt, keccak256(bytecode));

        if (addr.code.length > 0) {
            return addr;
        }

        return _deploy(salt, bytecode);
    }

    function getAddress(address _owner) external view returns (address) {
        bytes32 salt = bytes32(uint256(uint160(_owner)));
        bytes memory bytecode = _accountCreationCode(_owner);
        return Create2.computeAddress(salt, keccak256(bytecode));
    }

    function _accountCreationCode(address _owner) internal view returns (bytes memory) {
        return abi.encodePacked(type(Account).creationCode, abi.encode(_owner, entryPoint));
    }

    function _deploy(bytes32 salt, bytes memory bytecode) internal returns (address) {
        address addr;
        require(bytecode.length != 0, "Create2: bytecode length is zero");
        assembly {
            addr := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        require(addr != address(0), "Create2: Failed on deploy");
        return addr;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {PayperPlane} from "../src/PayperPlane.sol";
import {CREATE3} from "solady/utils/CREATE3.sol";

/// @title DeployPayperPlane
/// @notice Deployment script for the PayperPlane contract
contract DeployPayperPlane is Script {
    bytes32 public constant SALT = keccak256(abi.encodePacked(bytes("PayperPlane x Origins TOKEN2049 Hackathon")));
    address public constant OWNER = 0x9cb048e45aAA295Ebb4a9b3dEcb05c529C4C6D88;


    function run() external {
        // Get deployer private key from environment

        // Start broadcasting transactions
        bytes memory initCode = abi.encodePacked(type(PayperPlane).creationCode, abi.encode(OWNER));
        vm.startBroadcast();
        address deployed = CREATE3.deployDeterministic(initCode, SALT);
        vm.stopBroadcast();

        // Log deployment info
        console.log("Contract Address:", deployed);
        console.log("Deployer Address:", PayperPlane(deployed).owner());
    }
}

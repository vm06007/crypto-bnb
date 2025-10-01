// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {PayperPlane} from "../src/PayperPlane.sol";

/// @title DeployPayperPlane
/// @notice Deployment script for the PayperPlane contract
contract DeployPayperPlane is Script {
    function run() external returns (PayperPlane) {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        PayperPlane payperPlane = new PayperPlane();
        vm.stopBroadcast();

        // Log deployment info
        console.log("Contract Address:", address(payperPlane));
        console.log("Deployer Address:", vm.addr(deployerPrivateKey));

        return payperPlane;
    }
}

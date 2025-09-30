// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {CryptoBnB} from "../src/CryptoBnB.sol";

/// @title DeployCryptoBnB
/// @notice Deployment script for the CryptoBnB contract
contract DeployCryptoBnB is Script {
    function run() external returns (CryptoBnB) {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        CryptoBnB cryptoBnB = new CryptoBnB();
        vm.stopBroadcast();

        // Log deployment info
        console.log("Contract Address:", address(cryptoBnB));
        console.log("Deployer Address:", vm.addr(deployerPrivateKey));

        return cryptoBnB;
    }
}

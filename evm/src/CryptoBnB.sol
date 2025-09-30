// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "solady/auth/Ownable.sol";
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";

/// @title CryptoBnB
/// @notice Allows users to fund virtual cards with crypto
contract CryptoBnB is Ownable {
    /// @notice Struct to store card funding information
    struct Funding {
        uint256 id;                  // Unique card identifier
        address tokenAddress;        // ERC20 token used for payment
        uint256 tokenAmount;         // Amount paid in crypto tokens
        address user;                // User who funded the card
        bool refunded;               // Whether the funding has been refunded
    }

    /// @notice Mapping from cardId to funding information
    mapping(uint256 id => Funding) public fundings;

    /// @notice Emitted when a card is funded
    event Funded(
        uint256 indexed id,
        uint256 indexed amount,
        string indexed currencyCode
    );

    /// @notice Emitted when a card is refunded
    event Refunded(
        uint256 indexed id,
        uint256 indexed amount,
        address indexed tokenAddress
    );

    /// @notice Constructor to set initial supported tokens
    constructor() {
        // Set ownership to deployer
        _initializeOwner(msg.sender);
    }

    /// @notice Fund a virtual card with crypto payment
    /// @param id Unique identifier
    /// @param tokenAddress ERC20 token address to pay with
    /// @param tokenAmount Amount of tokens to pay
    /// @param currencyCode Reference fiat currency for the card
    /// @param fiatAmount Reference fiat amount in cents
    function fund(
        uint256 id,
        address tokenAddress,
        uint256 tokenAmount,
        string calldata currencyCode,
        uint256 fiatAmount
    ) external {      
        fundings[id] = Funding({
            id: id,
            tokenAddress: tokenAddress,
            tokenAmount: tokenAmount,
            user: msg.sender,
            refunded: false
        });
        SafeTransferLib.safeTransferFrom(tokenAddress, msg.sender, address(this), tokenAmount);
        emit Funded(id, fiatAmount, currencyCode);
    }

    /// @notice Refund a user (owner only)
    /// @param id Unique identifier
    function refund(uint256 id) external onlyOwner {
        fundings[id].refunded = true;
        Funding memory funding = fundings[id];
        SafeTransferLib.safeTransfer(funding.tokenAddress, funding.user, funding.tokenAmount);
        emit Refunded(id, funding.tokenAmount, funding.tokenAddress);
    }

    /// @notice Withdraw accumulated tokens (owner only)
    /// @param tokenAddress Token address to withdraw
    function withdrawTokens(address tokenAddress) external onlyOwner {
        SafeTransferLib.safeTransferAll(tokenAddress, owner());
    }
}

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
        address tokenAddress;        // ERC20 token used for payment, address(0) for native token
        uint256 tokenAmount;         // Amount paid in tokens or native currency
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

    error InvalidAmount();

    /// @notice Constructor to set initial supported tokens
    constructor() {
        // Set ownership to deployer
        _initializeOwner(msg.sender);
    }

    /// @notice Fund a virtual card with crypto payment
    /// @param _id Unique identifier
    /// @param _tokenAddress ERC20 token address to pay with, address(0) for native token
    /// @param _tokenAmount Amount of tokens to pay
    /// @param _currencyCode Reference fiat currency for the card
    /// @param _fiatAmount Reference fiat amount in cents
    function fund(
        uint256 _id,
        address _tokenAddress,
        uint256 _tokenAmount,
        string calldata _currencyCode,
        uint256 _fiatAmount
    )
        external
        payable
    {
        fundings[_id] = Funding({
            id: _id,
            tokenAddress: _tokenAddress,
            tokenAmount: _tokenAmount,
            user: msg.sender,
            refunded: false
        });
        if (_tokenAddress != address(0x0)) {
            SafeTransferLib.safeTransferFrom(
                _tokenAddress,
                msg.sender,
                address(this),
                _tokenAmount
            );
        } else {
            if (msg.value != _tokenAmount) {
                revert InvalidAmount();
            }
        }
        emit Funded(
            _id,
            _fiatAmount,
            _currencyCode
        );
    }

    /// @notice Refund a user (owner only)
    /// @param _id Unique identifier
    function refund(
        uint256 _id
    )
        external
        onlyOwner
    {
        fundings[_id].refunded = true;
        Funding memory funding = fundings[_id];

        if (funding.tokenAddress != address(0x0)) {
            SafeTransferLib.safeTransfer(
                funding.tokenAddress,
                funding.user,
                funding.tokenAmount
            );
        } else {
            SafeTransferLib.safeTransferETH(
                funding.user,
                funding.tokenAmount
            );
        }

        emit Refunded(
            _id,
            funding.tokenAmount,
            funding.tokenAddress
        );
    }

    /// @notice Withdraw accumulated tokens (owner only)
    /// @param _tokenAddress Token address to withdraw
    function withdrawTokens(
        address _tokenAddress
    )
        external
        onlyOwner
    {
        SafeTransferLib.safeTransferAll(
            _tokenAddress,
            owner()
        );
    }

    /// @notice Withdraw accumulated native currency (owner only)
    function withdrawNative()
        external
        onlyOwner
    {
        SafeTransferLib.safeTransferAllETH(
            owner()
        );
    }
}

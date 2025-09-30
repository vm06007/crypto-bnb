// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";
import {CryptoBnB} from "../src/CryptoBnB.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract CryptoBnBTest is Test {
    CryptoBnB public cryptoBnB;
    MockERC20 public token;
    address public owner;
    address public user1;
    address public user2;

    // Events to test
    event Funded(
        uint256 indexed id,
        uint256 indexed amount,
        string indexed currencyCode
    );

    event Refunded(
        uint256 indexed id,
        uint256 indexed amount,
        address indexed tokenAddress
    );

    function setUp() public {
        // Set up accounts
        owner = makeAddr("owner"); // Separate owner address
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy mock token
        token = new MockERC20("Test Token", "TEST", 18);

        // Deploy CryptoBnB contract as owner
        vm.prank(owner);
        cryptoBnB = new CryptoBnB();

        // Mint tokens to users for testing
        token.mint(user1, 1000e18);
        token.mint(user2, 1000e18);

        // Approve contract to spend tokens
        vm.prank(user1);
        token.approve(address(cryptoBnB), type(uint256).max);

        vm.prank(user2);
        token.approve(address(cryptoBnB), type(uint256).max);
    }

    function testFund() public {
        uint256 cardId = 1;
        uint256 tokenAmount = 100e18;
        string memory currencyCode = "SGD";
        uint256 fiatAmount = 10000; // $100 in cents

        // Expect Funded event
        vm.expectEmit(true, true, true, true);
        emit Funded(cardId, fiatAmount, currencyCode);

        // Fund the card
        vm.prank(user1);
        cryptoBnB.fund(cardId, address(token), tokenAmount, currencyCode, fiatAmount);

        // Check funding was stored correctly
        (uint256 id, address tokenAddress, uint256 amount, address user, bool refunded) =
            cryptoBnB.fundings(cardId);

        assertEq(id, cardId);
        assertEq(tokenAddress, address(token));
        assertEq(amount, tokenAmount);
        assertEq(user, user1);
        assertFalse(refunded);

        // Check tokens were transferred
        assertEq(token.balanceOf(address(cryptoBnB)), tokenAmount);
        assertEq(token.balanceOf(user1), 900e18); // 1000 - 100
    }

    function testFundMultipleTimes() public {
        uint256 cardId = 1;
        uint256 firstAmount = 50e18;
        uint256 secondAmount = 75e18;

        // First funding
        vm.prank(user1);
        cryptoBnB.fund(cardId, address(token), firstAmount, "SGD", 5000);

        // Second funding (should overwrite)
        vm.prank(user2);
        cryptoBnB.fund(cardId, address(token), secondAmount, "USD", 7500);

        // Check latest funding data
        (uint256 id, address tokenAddress, uint256 amount, address user, bool refunded) =
            cryptoBnB.fundings(cardId);

        assertEq(id, cardId);
        assertEq(tokenAddress, address(token));
        assertEq(amount, secondAmount);
        assertEq(user, user2); // Should be the last funder
        assertFalse(refunded);
    }

    function testFundDifferentTokens() public {
        // Deploy second token
        MockERC20 token2 = new MockERC20("Test Token 2", "TEST2", 18);
        token2.mint(user1, 1000e18);

        vm.prank(user1);
        token2.approve(address(cryptoBnB), type(uint256).max);

        uint256 cardId = 1;

        // Fund with first token
        vm.prank(user1);
        cryptoBnB.fund(cardId, address(token), 100e18, "SGD", 10000);

        // Fund with second token (different card)
        vm.prank(user1);
        cryptoBnB.fund(cardId + 1, address(token2), 200e18, "USD", 20000);

        // Check both fundings
        (, address tokenAddress1,,,) = cryptoBnB.fundings(cardId);
        (, address tokenAddress2,,,) = cryptoBnB.fundings(cardId + 1);

        assertEq(tokenAddress1, address(token));
        assertEq(tokenAddress2, address(token2));
    }

    function testFundWithDifferentCurrencies() public {
        uint256 cardId1 = 1;
        uint256 cardId2 = 2;

        // Expect events before calling functions
        vm.expectEmit(true, true, true, true);
        emit Funded(cardId1, 10000, "SGD");

        // Fund SGD card
        vm.prank(user1);
        cryptoBnB.fund(cardId1, address(token), 100e18, "SGD", 10000);

        // Expect second event
        vm.expectEmit(true, true, true, true);
        emit Funded(cardId2, 10000, "USD");

        // Fund USD card
        vm.prank(user1);
        cryptoBnB.fund(cardId2, address(token), 100e18, "USD", 10000);
    }

    function testRefund() public {
        uint256 cardId = 1;
        uint256 tokenAmount = 100e18;

        // First fund the card
        vm.prank(user1);
        cryptoBnB.fund(cardId, address(token), tokenAmount, "SGD", 10000);

        // Expect Refunded event
        vm.expectEmit(true, true, true, true);
        emit Refunded(cardId, tokenAmount, address(token));

        // Refund the card (owner only)
        vm.prank(owner);
        cryptoBnB.refund(cardId);

        // Check refund was processed
        (,,,, bool refunded) = cryptoBnB.fundings(cardId);
        assertTrue(refunded);

        // Check tokens were returned to user
        assertEq(token.balanceOf(user1), 1000e18); // Back to original amount
        assertEq(token.balanceOf(address(cryptoBnB)), 0); // Contract has no tokens
    }

    function testRefundNonOwner() public {
        uint256 cardId = 1;

        // Fund the card
        vm.prank(user1);
        cryptoBnB.fund(cardId, address(token), 100e18, "SGD", 10000);

        // Try to refund as non-owner (should fail)
        vm.prank(user2);
        vm.expectRevert();
        cryptoBnB.refund(cardId);
    }

    function testWithdrawTokens() public {
        uint256 cardId = 1;
        uint256 tokenAmount = 100e18;

        // Fund the card
        vm.prank(user1);
        cryptoBnB.fund(cardId, address(token), tokenAmount, "SGD", 10000);

        // Withdraw tokens as owner
        vm.prank(owner);
        cryptoBnB.withdrawTokens(address(token));

        // Check tokens were withdrawn to owner
        assertEq(token.balanceOf(owner), tokenAmount);
        assertEq(token.balanceOf(address(cryptoBnB)), 0);
    }

    function testWithdrawTokensNonOwner() public {
        uint256 cardId = 1;

        // Fund the card
        vm.prank(user1);
        cryptoBnB.fund(cardId, address(token), 100e18, "SGD", 10000);

        // Try to withdraw as non-owner (should fail)
        vm.prank(user2);
        vm.expectRevert();
        cryptoBnB.withdrawTokens(address(token));
    }

    function testFundingsMapping() public {
        uint256 cardId = 1;

        // Initially no funding
        (uint256 id, address tokenAddress, uint256 amount, address user, bool refunded) =
            cryptoBnB.fundings(cardId);
        assertEq(id, 0);
        assertEq(tokenAddress, address(0));
        assertEq(amount, 0);
        assertEq(user, address(0));
        assertFalse(refunded);

        // After funding
        vm.prank(user1);
        cryptoBnB.fund(cardId, address(token), 100e18, "SGD", 10000);

        (id, tokenAddress, amount, user, refunded) = cryptoBnB.fundings(cardId);
        assertEq(id, cardId);
        assertEq(tokenAddress, address(token));
        assertEq(amount, 100e18);
        assertEq(user, user1);
        assertFalse(refunded);
    }

    function testMultipleUsers() public {
        uint256 cardId1 = 1;
        uint256 cardId2 = 2;

        // User1 funds card1
        vm.prank(user1);
        cryptoBnB.fund(cardId1, address(token), 100e18, "SGD", 10000);

        // User2 funds card2
        vm.prank(user2);
        cryptoBnB.fund(cardId2, address(token), 200e18, "USD", 20000);

        // Check both fundings are stored correctly
        (,, uint256 amount1, address user1Check,) = cryptoBnB.fundings(cardId1);
        (,, uint256 amount2, address user2Check,) = cryptoBnB.fundings(cardId2);

        assertEq(amount1, 100e18);
        assertEq(user1Check, user1);
        assertEq(amount2, 200e18);
        assertEq(user2Check, user2);
    }

    function testZeroAmount() public {
        uint256 cardId = 1;

        // Fund with zero amount (should still work but transfer 0 tokens)
        vm.prank(user1);
        cryptoBnB.fund(cardId, address(token), 0, "SGD", 0);

        // Check funding was stored
        (,, uint256 amount,,) = cryptoBnB.fundings(cardId);
        assertEq(amount, 0);

        // No tokens should be transferred
        assertEq(token.balanceOf(address(cryptoBnB)), 0);
        assertEq(token.balanceOf(user1), 1000e18);
    }

    function testFundWithNativeToken() public {
        uint256 cardId = 1;
        uint256 nativeAmount = 1e18; // 1 ETH
        string memory currencyCode = "SGD";
        uint256 fiatAmount = 10000; // $100 in cents

        // Give user1 some ETH
        vm.deal(user1, 10e18);

        // Expect Funded event
        vm.expectEmit(true, true, true, true);
        emit Funded(cardId, fiatAmount, currencyCode);

        // Fund the card with native token (address(0))
        vm.prank(user1);
        cryptoBnB.fund{value: nativeAmount}(cardId, address(0), nativeAmount, currencyCode, fiatAmount);

        // Check funding was stored correctly
        (uint256 id, address tokenAddress, uint256 amount, address user, bool refunded) =
            cryptoBnB.fundings(cardId);

        assertEq(id, cardId);
        assertEq(tokenAddress, address(0)); // Native token
        assertEq(amount, nativeAmount);
        assertEq(user, user1);
        assertFalse(refunded);

        // Check ETH was transferred (user1 had 10 ETH, spent 1 ETH)
        assertEq(user1.balance, 9e18);
        assertEq(address(cryptoBnB).balance, nativeAmount);
    }

    function testFundNativeTokenWrongValue() public {
        uint256 cardId = 1;
        uint256 nativeAmount = 1e18;
        uint256 wrongValue = 0.5e18; // Wrong amount

        // Give user1 some ETH
        vm.deal(user1, 10e18);

        // Try to fund with wrong msg.value (should revert)
        vm.prank(user1);
        vm.expectRevert(CryptoBnB.InvalidAmount.selector);
        cryptoBnB.fund{value: wrongValue}(cardId, address(0), nativeAmount, "SGD", 10000);
    }

    function testRefundNativeToken() public {
        uint256 cardId = 1;
        uint256 nativeAmount = 1e18;

        // First fund the card with native token
        vm.deal(user1, 10e18);
        vm.prank(user1);
        cryptoBnB.fund{value: nativeAmount}(cardId, address(0), nativeAmount, "SGD", 10000);

        // Check initial balances
        assertEq(user1.balance, 9e18);
        assertEq(address(cryptoBnB).balance, nativeAmount);

        // Expect Refunded event
        vm.expectEmit(true, true, true, true);
        emit Refunded(cardId, nativeAmount, address(0));

        // Refund the card (owner only)
        vm.prank(owner);
        cryptoBnB.refund(cardId);

        // Check refund was processed
        (,,,, bool refunded) = cryptoBnB.fundings(cardId);
        assertTrue(refunded);

        // Check ETH was returned to user
        assertEq(user1.balance, 10e18); // Back to original amount
        assertEq(address(cryptoBnB).balance, 0); // Contract has no ETH
    }

    function testWithdrawNativeTokens() public {
        uint256 cardId = 1;
        uint256 nativeAmount = 1e18;

        // Fund the card with native token
        vm.deal(user1, 10e18);
        vm.prank(user1);
        cryptoBnB.fund{value: nativeAmount}(cardId, address(0), nativeAmount, "SGD", 10000);

        // Check contract has ETH
        assertEq(address(cryptoBnB).balance, nativeAmount);

        // Withdraw native tokens as owner
        vm.prank(owner);
        cryptoBnB.withdrawNative();

        // Check ETH was withdrawn to owner
        assertEq(owner.balance, nativeAmount);
        assertEq(address(cryptoBnB).balance, 0);
    }

    function testWithdrawNativeTokensNonOwner() public {
        uint256 cardId = 1;
        uint256 nativeAmount = 1e18;

        // Fund the card with native token
        vm.deal(user1, 10e18);
        vm.prank(user1);
        cryptoBnB.fund{value: nativeAmount}(cardId, address(0), nativeAmount, "SGD", 10000);

        // Try to withdraw as non-owner (should fail)
        vm.prank(user2);
        vm.expectRevert();
        cryptoBnB.withdrawNative();
    }

    function testFundBothTokenTypes() public {
        uint256 erc20CardId = 1;
        uint256 nativeCardId = 2;

        // Fund with ERC20 token
        vm.prank(user1);
        cryptoBnB.fund(erc20CardId, address(token), 100e18, "SGD", 10000);

        // Fund with native token
        vm.deal(user1, 10e18);
        vm.prank(user1);
        cryptoBnB.fund{value: 1e18}(nativeCardId, address(0), 1e18, "USD", 20000);

        // Check both fundings are stored correctly
        (,, uint256 erc20Amount, address erc20User,) = cryptoBnB.fundings(erc20CardId);
        (,, uint256 nativeAmount, address nativeUser,) = cryptoBnB.fundings(nativeCardId);

        assertEq(erc20Amount, 100e18);
        assertEq(erc20User, user1);
        assertEq(nativeAmount, 1e18);
        assertEq(nativeUser, user1);

        // Check balances
        assertEq(token.balanceOf(address(cryptoBnB)), 100e18); // ERC20 tokens
        assertEq(address(cryptoBnB).balance, 1e18); // Native tokens
    }
}

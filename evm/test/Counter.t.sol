// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/Counter.sol";

contract CounterTest is Test {
    Counter public counter;

    function setUp() public {
        counter = new Counter();
    }

    function testInitialCount() public {
        assertEq(counter.count(), 0);
    }

    function testIncrement() public {
        counter.increment();
        assertEq(counter.count(), 1);
    }

    function testDecrement() public {
        counter.increment();
        counter.increment();
        counter.decrement();
        assertEq(counter.count(), 1);
    }

    function testReset() public {
        counter.increment();
        counter.increment();
        counter.reset();
        assertEq(counter.count(), 0);
    }

    function testGetCount() public {
        counter.increment();
        counter.increment();
        assertEq(counter.getCount(), 2);
    }

    function testMultipleOperations() public {
        counter.increment();
        counter.increment();
        counter.increment();
        counter.decrement();
        counter.increment();
        assertEq(counter.count(), 3);
    }
}

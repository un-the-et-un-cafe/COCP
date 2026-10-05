// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MockUSDC — TEST-ONLY stand-in for Base USDC (6 decimals)
/// @notice Lives under contracts/test, never deployed. Not a project token.
///         Balances are set directly by the test harness; no issuance logic.
///         `failMode` lets tests simulate a token that returns false.
contract MockUSDC {
    string public constant name = "Mock USDC (test only)";
    uint8 public constant decimals = 6;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    bool public failMode;

    event Transfer(address indexed from, address indexed to, uint256 value);

    function setBalance(address account, uint256 value) external {
        balanceOf[account] = value;
    }

    function setFailMode(bool value) external {
        failMode = value;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        if (failMode) return false;
        _move(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        if (failMode) return false;
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "allowance");
        allowance[from][msg.sender] = allowed - value;
        _move(from, to, value);
        return true;
    }

    function _move(address from, address to, uint256 value) private {
        require(balanceOf[from] >= value, "balance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}

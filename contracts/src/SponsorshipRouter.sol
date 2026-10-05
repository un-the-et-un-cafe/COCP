// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SponsorshipRouter — Model B charity settlement helper (testnet)
/// @notice NOT a sponsor checkout. After TradFi clears, an operator sends the
///         USDC amount corresponding to the 90% charity leg to a verified
///         association wallet. Admin 10% may remain EUR off-chain.
/// @dev Non-upgradeable. No pause that traps funds. No mint. feeBps ≤ 1000
///      applies only if an on-chain admin fee path is used; Model B default
///      uses payoutCharityLeg with feeBps = 0 on-chain.
interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
}

contract SponsorshipRouter {
    address public immutable paymentToken;
    address public immutable adminWallet;
    uint16 public immutable feeBps; // ≤ 1000

    error FeeTooHigh();
    error ZeroAddress();
    error BeneficiaryIsAdmin();
    error ZeroAmount();
    error TransferFailed();

    event CharityPayout(
        address indexed operator,
        address indexed association,
        uint256 usdcAmount,
        bytes32 indexed fiatPaymentRefHash
    );

    constructor(address paymentToken_, address adminWallet_, uint16 feeBps_) {
        if (paymentToken_ == address(0) || adminWallet_ == address(0)) revert ZeroAddress();
        if (feeBps_ > 1000) revert FeeTooHigh();
        paymentToken = paymentToken_;
        adminWallet = adminWallet_;
        feeBps = feeBps_;
    }

    /// @notice Pull USDC from operator and send 100% of `amount` to association
    ///         (amount must already equal the 90% EUR leg converted via authorised CASP in prod).
    function payoutCharityLeg(
        address association,
        uint256 amount,
        bytes32 fiatPaymentRefHash
    ) external {
        if (association == address(0)) revert ZeroAddress();
        if (association == adminWallet) revert BeneficiaryIsAdmin();
        if (amount == 0) revert ZeroAmount();
        if (!IERC20(paymentToken).transferFrom(msg.sender, association, amount)) revert TransferFailed();
        emit CharityPayout(msg.sender, association, amount, fiatPaymentRefHash);
    }

    /// @notice Optional on-chain 90/10 when both legs are USDC (secondary path; not Model B default).
    function settleWithOnChainFee(address association, uint256 amount) external {
        if (association == address(0)) revert ZeroAddress();
        if (association == adminWallet) revert BeneficiaryIsAdmin();
        if (amount == 0) revert ZeroAmount();
        uint256 fee = (amount * uint256(feeBps)) / 10_000;
        uint256 toAssociation = amount - fee;
        if (!IERC20(paymentToken).transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        if (!IERC20(paymentToken).transfer(association, toAssociation)) revert TransferFailed();
        if (fee > 0) {
            if (!IERC20(paymentToken).transfer(adminWallet, fee)) revert TransferFailed();
        }
    }
}

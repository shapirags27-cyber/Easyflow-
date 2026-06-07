// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Central fee configuration controlled by the protocol admin.
contract ProtocolFees is Ownable {
    uint256 public constant FEE_BASE = 10_000;
    uint256 public constant MAX_FEE_BPS = 1_000; // 10% cap

    uint256 public swapFeeBps = 30; // 0.30% default (Uniswap-like)
    uint256 public multisendFeeBps;
    uint256 public stakingFeeBps;
    address public feeRecipient;

    event SwapFeeUpdated(uint256 bps);
    event MultisendFeeUpdated(uint256 bps);
    event StakingFeeUpdated(uint256 bps);
    event FeeRecipientUpdated(address recipient);
    event FeesUpdated(uint256 swapBps, uint256 multisendBps, uint256 stakingBps);

    constructor(address owner_, address recipient_) Ownable(owner_) {
        feeRecipient = recipient_;
    }

    function swapFeeMultiplier() external view returns (uint256) {
        return FEE_BASE - swapFeeBps;
    }

    function setSwapFeeBps(uint256 bps) external onlyOwner {
        require(bps <= MAX_FEE_BPS, "Fees: swap too high");
        swapFeeBps = bps;
        emit SwapFeeUpdated(bps);
    }

    function setMultisendFeeBps(uint256 bps) external onlyOwner {
        require(bps <= MAX_FEE_BPS, "Fees: multisend too high");
        multisendFeeBps = bps;
        emit MultisendFeeUpdated(bps);
    }

    function setStakingFeeBps(uint256 bps) external onlyOwner {
        require(bps <= MAX_FEE_BPS, "Fees: staking too high");
        stakingFeeBps = bps;
        emit StakingFeeUpdated(bps);
    }

    function setFeeRecipient(address recipient) external onlyOwner {
        require(recipient != address(0), "Fees: zero recipient");
        feeRecipient = recipient;
        emit FeeRecipientUpdated(recipient);
    }

    /// @notice Batch update used by admin backend.
    function setFees(uint256 swapBps, uint256 multisendBps, uint256 stakeBps) external onlyOwner {
        require(swapBps <= MAX_FEE_BPS, "Fees: swap too high");
        require(multisendBps <= MAX_FEE_BPS, "Fees: multisend too high");
        require(stakeBps <= MAX_FEE_BPS, "Fees: staking too high");
        swapFeeBps = swapBps;
        multisendFeeBps = multisendBps;
        stakingFeeBps = stakeBps;
        emit FeesUpdated(swapBps, multisendBps, stakeBps);
    }
}

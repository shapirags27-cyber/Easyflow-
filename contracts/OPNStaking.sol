// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {PointsManager} from "./PointsManager.sol";
import {ProtocolFees} from "./ProtocolFees.sol";

contract OPNStaking is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    PointsManager public immutable points;
    ProtocolFees public immutable protocolFees;

    mapping(address => uint256) public stakedBalance;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount, uint256 fee);
    event Unstaked(address indexed user, uint256 amount);

    constructor(address token, address pointsManager, address protocolFees_) {
        stakingToken = IERC20(token);
        points = PointsManager(pointsManager);
        protocolFees = ProtocolFees(protocolFees_);
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Staking: amount=0");

        uint256 bps = protocolFees.stakingFeeBps();
        uint256 fee = (amount * bps) / protocolFees.FEE_BASE();
        uint256 net = amount - fee;

        stakedBalance[msg.sender] += net;
        totalStaked += net;

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        if (fee > 0) {
            address recipient = protocolFees.feeRecipient();
            require(recipient != address(0), "Staking: no recipient");
            stakingToken.safeTransfer(recipient, fee);
        }

        points.award(msg.sender, PointsManager.Action.Stake);
        emit Staked(msg.sender, net, fee);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Staking: amount=0");
        uint256 bal = stakedBalance[msg.sender];
        require(bal >= amount, "Staking: insufficient");

        stakedBalance[msg.sender] = bal - amount;
        totalStaked -= amount;

        stakingToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }
}

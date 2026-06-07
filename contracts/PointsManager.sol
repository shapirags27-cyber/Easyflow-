// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PointsManager is Ownable {
    enum Action {
        Swap,
        Stake,
        MultiSend,
        AddLiquidity
    }

    uint256 public constant SWAP_POINTS = 15;
    uint256 public constant STAKE_POINTS = 25;
    uint256 public constant MULTISEND_POINTS = 10;
    uint256 public constant ADD_LIQUIDITY_POINTS = 30;

    mapping(address => uint256) public points;
    mapping(address => bool) public isModule;

    address[] private leaderboard;
    mapping(address => bool) private inLeaderboard;
    uint256 public constant LEADERBOARD_MAX = 50;

    event ModuleUpdated(address indexed module, bool allowed);
    event PointsAwarded(address indexed user, Action indexed action, uint256 amount, uint256 newTotal);

    constructor(address owner_) Ownable(owner_) {}

    modifier onlyModule() {
        require(isModule[msg.sender], "PointsManager: not module");
        _;
    }

    function setModule(address module, bool allowed) external onlyOwner {
        isModule[module] = allowed;
        emit ModuleUpdated(module, allowed);
    }

    function award(address user, Action action) external onlyModule returns (uint256 delta) {
        if (action == Action.Swap) delta = SWAP_POINTS;
        else if (action == Action.Stake) delta = STAKE_POINTS;
        else if (action == Action.MultiSend) delta = MULTISEND_POINTS;
        else if (action == Action.AddLiquidity) delta = ADD_LIQUIDITY_POINTS;
        else revert("PointsManager: bad action");

        uint256 newTotal = points[user] + delta;
        points[user] = newTotal;

        _touchLeaderboard(user);
        emit PointsAwarded(user, action, delta, newTotal);
    }

    function getLeaderboard(uint256 limit)
        external
        view
        returns (address[] memory users, uint256[] memory scores)
    {
        uint256 n = leaderboard.length;
        if (limit < n) n = limit;

        users = new address[](n);
        scores = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            address u = leaderboard[i];
            users[i] = u;
            scores[i] = points[u];
        }
    }

    function leaderboardLength() external view returns (uint256) {
        return leaderboard.length;
    }

    function _touchLeaderboard(address user) internal {
        if (!inLeaderboard[user]) {
            inLeaderboard[user] = true;
            leaderboard.push(user);
        }

        // Bubble up based on points (descending). O(n) but bounded by 50.
        uint256 i = _indexOf(user);
        while (i > 0) {
            address prev = leaderboard[i - 1];
            if (points[user] <= points[prev]) break;
            leaderboard[i - 1] = user;
            leaderboard[i] = prev;
            i--;
        }

        if (leaderboard.length > LEADERBOARD_MAX) {
            address removed = leaderboard[leaderboard.length - 1];
            leaderboard.pop();
            inLeaderboard[removed] = false;
        }
    }

    function _indexOf(address user) internal view returns (uint256) {
        uint256 n = leaderboard.length;
        for (uint256 i = 0; i < n; i++) {
            if (leaderboard[i] == user) return i;
        }
        return n - 1;
    }
}


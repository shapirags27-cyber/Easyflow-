// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {PointsManager} from "./PointsManager.sol";
import {ProtocolFees} from "./ProtocolFees.sol";

contract MultiSend {
    PointsManager public immutable points;
    ProtocolFees public immutable protocolFees;

    event MultiSendFixed(address indexed sender, uint256 total, uint256 fee, uint256 recipients);
    event MultiSendPercent(address indexed sender, uint256 total, uint256 fee, uint256 recipients);

    constructor(address pointsManager, address protocolFees_) {
        points = PointsManager(pointsManager);
        protocolFees = ProtocolFees(protocolFees_);
    }

    function _collectFee(uint256 value) internal returns (uint256 net) {
        uint256 bps = protocolFees.multisendFeeBps();
        if (bps == 0) return value;
        uint256 fee = (value * bps) / protocolFees.FEE_BASE();
        address recipient = protocolFees.feeRecipient();
        if (fee > 0 && recipient != address(0)) {
            (bool ok,) = payable(recipient).call{value: fee}("");
            require(ok, "MultiSend: fee failed");
        }
        return value - fee;
    }

    function multiSendFixed(address[] calldata recipients, uint256[] calldata amounts) external payable {
        uint256 n = recipients.length;
        require(n > 0 && n == amounts.length, "MultiSend: bad input");

        uint256 total;
        for (uint256 i = 0; i < n; i++) total += amounts[i];
        require(total == msg.value, "MultiSend: value mismatch");

        uint256 fee = (msg.value * protocolFees.multisendFeeBps()) / protocolFees.FEE_BASE();
        uint256 distributable = msg.value - fee;
        if (fee > 0) {
            address recipient = protocolFees.feeRecipient();
            require(recipient != address(0), "MultiSend: no recipient");
            (bool ok,) = payable(recipient).call{value: fee}("");
            require(ok, "MultiSend: fee failed");
        }

        uint256 sent;
        for (uint256 i = 0; i < n; i++) {
            uint256 amt = (distributable * amounts[i]) / total;
            sent += amt;
            (bool ok,) = payable(recipients[i]).call{value: amt}("");
            require(ok, "MultiSend: transfer failed");
        }

        uint256 dust = distributable - sent;
        if (dust > 0) {
            (bool ok,) = payable(msg.sender).call{value: dust}("");
            require(ok, "MultiSend: refund failed");
        }

        points.award(msg.sender, PointsManager.Action.MultiSend);
        emit MultiSendFixed(msg.sender, msg.value, fee, n);
    }

    function multiSendPercent(address[] calldata recipients, uint256[] calldata bps) external payable {
        uint256 n = recipients.length;
        require(n > 0 && n == bps.length, "MultiSend: bad input");

        uint256 sum;
        for (uint256 i = 0; i < n; i++) sum += bps[i];
        require(sum == 10_000, "MultiSend: bps must sum 10000");

        uint256 fee = (msg.value * protocolFees.multisendFeeBps()) / protocolFees.FEE_BASE();
        uint256 total = msg.value - fee;
        if (fee > 0) {
            address recipient = protocolFees.feeRecipient();
            require(recipient != address(0), "MultiSend: no recipient");
            (bool ok,) = payable(recipient).call{value: fee}("");
            require(ok, "MultiSend: fee failed");
        }

        uint256 sent;
        for (uint256 i = 0; i < n; i++) {
            uint256 amt = (total * bps[i]) / 10_000;
            sent += amt;
            (bool ok,) = payable(recipients[i]).call{value: amt}("");
            require(ok, "MultiSend: transfer failed");
        }

        uint256 dust = total - sent;
        if (dust > 0) {
            (bool ok,) = payable(msg.sender).call{value: dust}("");
            require(ok, "MultiSend: refund failed");
        }

        points.award(msg.sender, PointsManager.Action.MultiSend);
        emit MultiSendPercent(msg.sender, msg.value, fee, n);
    }

    receive() external payable {}
}

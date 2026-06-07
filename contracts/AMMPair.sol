// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ProtocolFees} from "./ProtocolFees.sol";

contract AMMPair is ERC20 {
    using SafeERC20 for IERC20;

    address public immutable token0;
    address public immutable token1;
    ProtocolFees public immutable protocolFees;

    uint112 private reserve0;
    uint112 private reserve1;

    event Mint(address indexed sender, uint256 amount0, uint256 amount1, uint256 liquidity);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint256 amountIn0,
        uint256 amountIn1,
        uint256 amountOut0,
        uint256 amountOut1,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    constructor(address _token0, address _token1, address protocolFees_) ERC20("EasyFlow LP", "EF-LP") {
        token0 = _token0;
        token1 = _token1;
        protocolFees = ProtocolFees(protocolFees_);
    }

    function getReserves() external view returns (uint112, uint112) {
        return (reserve0, reserve1);
    }

    function _update(uint256 balance0, uint256 balance1) private {
        require(balance0 <= type(uint112).max && balance1 <= type(uint112).max, "Pair: overflow");
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        emit Sync(reserve0, reserve1);
    }

    function mint(address to) external returns (uint256 liquidity) {
        (uint112 _r0, uint112 _r1) = (reserve0, reserve1);
        uint256 bal0 = IERC20(token0).balanceOf(address(this));
        uint256 bal1 = IERC20(token1).balanceOf(address(this));
        uint256 amount0 = bal0 - _r0;
        uint256 amount1 = bal1 - _r1;
        require(amount0 > 0 && amount1 > 0, "Pair: insufficient");

        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount1);
        } else {
            liquidity = Math.min((amount0 * _totalSupply) / _r0, (amount1 * _totalSupply) / _r1);
        }
        require(liquidity > 0, "Pair: liquidity=0");

        _mint(to, liquidity);
        _update(bal0, bal1);
        emit Mint(msg.sender, amount0, amount1, liquidity);
    }

    function burn(address to) external returns (uint256 amount0, uint256 amount1) {
        (uint112 _r0, uint112 _r1) = (reserve0, reserve1);
        uint256 bal0 = IERC20(token0).balanceOf(address(this));
        uint256 bal1 = IERC20(token1).balanceOf(address(this));

        uint256 liquidity = balanceOf(address(this));
        uint256 _totalSupply = totalSupply();
        amount0 = (liquidity * bal0) / _totalSupply;
        amount1 = (liquidity * bal1) / _totalSupply;
        require(amount0 > 0 && amount1 > 0, "Pair: burn=0");

        _burn(address(this), liquidity);
        IERC20(token0).safeTransfer(to, amount0);
        IERC20(token1).safeTransfer(to, amount1);

        bal0 = IERC20(token0).balanceOf(address(this));
        bal1 = IERC20(token1).balanceOf(address(this));
        _update(bal0, bal1);

        emit Burn(msg.sender, amount0, amount1, to);
    }

    // amountOut0/1 are exact outputs; caller must have sent in required input before calling.
    function swap(uint256 amountOut0, uint256 amountOut1, address to) external {
        require(amountOut0 > 0 || amountOut1 > 0, "Pair: out=0");
        (uint112 _r0, uint112 _r1) = (reserve0, reserve1);
        require(amountOut0 < _r0 && amountOut1 < _r1, "Pair: liquidity");

        if (amountOut0 > 0) IERC20(token0).safeTransfer(to, amountOut0);
        if (amountOut1 > 0) IERC20(token1).safeTransfer(to, amountOut1);

        uint256 bal0 = IERC20(token0).balanceOf(address(this));
        uint256 bal1 = IERC20(token1).balanceOf(address(this));

        uint256 amountIn0 = bal0 > (_r0 - amountOut0) ? bal0 - (_r0 - amountOut0) : 0;
        uint256 amountIn1 = bal1 > (_r1 - amountOut1) ? bal1 - (_r1 - amountOut1) : 0;
        require(amountIn0 > 0 || amountIn1 > 0, "Pair: in=0");

        uint256 feeBase = protocolFees.FEE_BASE();
        uint256 swapFeeBps = protocolFees.swapFeeBps();
        uint256 bal0Adj = (bal0 * feeBase) - (amountIn0 * swapFeeBps);
        uint256 bal1Adj = (bal1 * feeBase) - (amountIn1 * swapFeeBps);
        require(bal0Adj * bal1Adj >= uint256(_r0) * uint256(_r1) * (feeBase**2), "Pair: k");

        _update(bal0, bal1);
        emit Swap(msg.sender, amountIn0, amountIn1, amountOut0, amountOut1, to);
    }
}


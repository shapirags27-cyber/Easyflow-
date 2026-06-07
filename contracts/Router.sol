// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AMMFactory} from "./AMMFactory.sol";
import {AMMPair} from "./AMMPair.sol";
import {PointsManager} from "./PointsManager.sol";
import {ProtocolFees} from "./ProtocolFees.sol";

contract Router {
    using SafeERC20 for IERC20;

    AMMFactory public immutable factory;
    PointsManager public immutable points;
    ProtocolFees public immutable protocolFees;

    event LiquidityAdded(
        address indexed provider,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    event LiquidityRemoved(
        address indexed provider,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    event SwapExecuted(
        address indexed trader,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address factory_, address pointsManager, address protocolFees_) {
        factory = AMMFactory(factory_);
        points = PointsManager(pointsManager);
        protocolFees = ProtocolFees(protocolFees_);
    }

    function _pairFor(address tokenA, address tokenB) internal view returns (address pair) {
        pair = factory.getPair(tokenA, tokenB);
        require(pair != address(0), "Router: pair missing");
    }

    function _sortTokens(address tokenA, address tokenB) internal pure returns (address t0, address t1) {
        require(tokenA != tokenB, "Router: identical");
        (t0, t1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(t0 != address(0), "Router: zero");
    }

    function _getReserves(address pair, address tokenIn, address tokenOut)
        internal
        view
        returns (uint256 reserveIn, uint256 reserveOut, address t0)
    {
        (uint112 r0, uint112 r1) = AMMPair(pair).getReserves();
        (t0,) = _sortTokens(tokenIn, tokenOut);
        (reserveIn, reserveOut) = tokenIn == t0 ? (uint256(r0), uint256(r1)) : (uint256(r1), uint256(r0));
    }

    function _quote(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal view returns (uint256 amountOut) {
        uint256 feeBase = protocolFees.FEE_BASE();
        uint256 feeMul = protocolFees.swapFeeMultiplier();
        uint256 amountInWithFee = amountIn * feeMul;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * feeBase) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function getAmountOut(uint256 amountIn, address tokenIn, address tokenOut) external view returns (uint256 amountOut) {
        address pair = factory.getPair(tokenIn, tokenOut);
        require(pair != address(0), "Router: pair missing");

        (uint256 reserveIn, uint256 reserveOut,) = _getReserves(pair, tokenIn, tokenOut);
        require(reserveIn > 0 && reserveOut > 0, "Router: empty");
        amountOut = _quote(amountIn, reserveIn, reserveOut);
    }

    function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB, address to)
        external
        returns (uint256 liquidity)
    {
        address pair = factory.getPair(tokenA, tokenB);
        if (pair == address(0)) {
            pair = factory.createPair(tokenA, tokenB);
        }

        IERC20(tokenA).safeTransferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, pair, amountB);

        liquidity = AMMPair(pair).mint(to);
        points.award(msg.sender, PointsManager.Action.AddLiquidity);

        emit LiquidityAdded(msg.sender, tokenA, tokenB, amountA, amountB, liquidity);
    }

    function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, address to)
        external
        returns (uint256 amountA, uint256 amountB)
    {
        address pair = _pairFor(tokenA, tokenB);
        IERC20(pair).safeTransferFrom(msg.sender, pair, liquidity);
        (uint256 amount0, uint256 amount1) = AMMPair(pair).burn(to);

        (address t0,) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        (amountA, amountB) = tokenA == t0 ? (amount0, amount1) : (amount1, amount0);

        emit LiquidityRemoved(msg.sender, tokenA, tokenB, amountA, amountB, liquidity);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 minOut,
        address tokenIn,
        address tokenOut,
        address to
    ) external returns (uint256 amountOut) {
        address pair = _pairFor(tokenIn, tokenOut);

        (uint256 reserveIn, uint256 reserveOut, address t0) = _getReserves(pair, tokenIn, tokenOut);
        amountOut = _quote(amountIn, reserveIn, reserveOut);
        require(amountOut >= minOut, "Router: slippage");

        IERC20(tokenIn).safeTransferFrom(msg.sender, pair, amountIn);

        (uint256 amountOut0, uint256 amountOut1) = tokenIn == t0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
        AMMPair(pair).swap(amountOut0, amountOut1, to);

        points.award(msg.sender, PointsManager.Action.Swap);
        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }
}

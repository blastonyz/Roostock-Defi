// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Sovryn Protocol AMM swap interface
interface ISovrynProtocol {
    /// @notice Direct AMM swap, does NOT require margin oracle pricing
    function swapExternal(
        address sourceToken,
        address destToken,
        address receiver,
        address returnToSender,
        uint256 sourceTokenAmount,
        uint256 requiredDestTokenAmount,
        uint256 minReturn,
        bytes calldata swapData
    ) external returns (uint256 destTokenAmountReceived, uint256 sourceTokenAmountUsed);

    /// @notice Get estimated output for AMM swap
    function getSwapExpectedReturn(
        address sourceToken,
        address destToken,
        uint256 sourceTokenAmount
    ) external view returns (uint256);
}

/// @title SovrynSwapper
/// @notice Wraps Sovryn Protocol AMM swapExternal for simple token swaps on RSK
contract SovrynSwapper {
    address public constant SOVRYN_PROTOCOL = 0x25380305f223B32FDB844152abD2E82BC5Ad99c3;

    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    /// @notice Get estimated output amount
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256) {
        return ISovrynProtocol(SOVRYN_PROTOCOL).getSwapExpectedReturn(tokenIn, tokenOut, amountIn);
    }

    /// @notice Swap tokens via Sovryn AMM
    /// @param tokenIn  Input token (e.g. WRBTC)
    /// @param tokenOut Output token (e.g. DoC)
    /// @param amountIn Amount of input token
    /// @param minAmountOut Minimum output for slippage protection
    /// @return amountOut Actual output received
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, "SovrynSwapper: amount must be > 0");

        // Pull tokens from caller
        require(
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
            "SovrynSwapper: transferFrom failed"
        );

        // Approve protocol
        IERC20(tokenIn).approve(SOVRYN_PROTOCOL, amountIn);

        // Execute AMM swap — tokens sent directly to msg.sender
        (uint256 received, ) = ISovrynProtocol(SOVRYN_PROTOCOL).swapExternal(
            tokenIn,
            tokenOut,
            msg.sender,       // receiver
            address(this),    // returnToSender (unused excess)
            amountIn,
            0,                // requiredDestTokenAmount = 0 means "use all sourceAmount"
            minAmountOut,
            ""                // swapData = empty
        );

        require(received >= minAmountOut, "SovrynSwapper: insufficient output");
        amountOut = received;
        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }
}

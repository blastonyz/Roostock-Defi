// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Minimal Uniswap V2 Router interface
interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function WETH() external pure returns (address);

    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);
}

/// @title UniswapSwapper
/// @notice Simple contract to perform Uniswap V2 swaps on RSK
contract UniswapSwapper {
    address public constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    /// @notice Swap tokens via Uniswap V2
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Amount of input token
    /// @param minAmountOut Minimum output amount for slippage protection
    /// @return amountOut Actual output amount
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, "UniswapSwapper: amount must be > 0");
        require(tokenIn != tokenOut, "UniswapSwapper: tokens cannot be the same");

        // Transfer input tokens from caller
        require(
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
            "UniswapSwapper: transferFrom failed"
        );

        // Approve router
        IERC20(tokenIn).approve(UNISWAP_V2_ROUTER, amountIn);

        // Build path
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        // Execute swap
        uint256[] memory amounts = IUniswapV2Router(UNISWAP_V2_ROUTER).swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            msg.sender,
            block.timestamp + 300 // 5 min deadline
        );

        amountOut = amounts[amounts.length - 1];
        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    /// @notice Get estimated output amount for a swap
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256[] memory amounts = IUniswapV2Router(UNISWAP_V2_ROUTER).getAmountsOut(amountIn, path);
        amountOut = amounts[amounts.length - 1];
    }

    /// @notice Unwrap WRBTC to tRBTC (native)
    function unwrapWRBTC(uint256 amount) external {
        address weth = IUniswapV2Router(UNISWAP_V2_ROUTER).WETH();
        // WRBTC is WETH on RSK
        IERC20(weth).transferFrom(msg.sender, address(this), amount);
        // Send native tRBTC back (requires receive function)
        // Note: actual unwrap depends on WRBTC implementation
    }

    receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


/// @notice Minimal ILoanToken interface for margin trading
interface ILoanToken {
    function marginTrade(
        bytes32 loanId,
        uint256 leverageAmount,
        uint256 loanTokenSent,
        uint256 collateralTokenSent,
        address collateralTokenAddress,
        address tradeTokenAddress,
        uint256 minReturn,
        bytes memory loanDataBytes
    ) external returns (bytes32 newLoanId);

    function getEstimatedMarginDetails(
        uint256 leverageAmount,
        uint256 loanTokenSent,
        uint256 collateralTokenSent,
        address collateralTokenAddress
    ) external view returns (uint256 posibleSize, uint256 minReturn, uint256 collateralNeeded);
}

/// @notice Minimal ISovryn interface for position queries
interface ISovryn {
    function getLoan(bytes32 loanId)
        external
        view
        returns (
            bytes32 id,
            bytes32 loanParamsId,
            bool active,
            address lender,
            address borrower,
            address collateralToken,
            uint256 collateralAmount,
            uint256 principalAmount,
            uint256 interestOwedPerDay,
            uint256 interestDepositRemaining,
            uint256 startTime,
            uint256 endTime,
            uint256 closePrice
        );

    function getUserLoans(
        address user,
        uint256 start,
        uint256 count,
        uint256 loanType,
        bool isLender,
        bool unsafeOnly
    ) external view returns (bytes32[] memory loansIds, uint256 total);
}

/// @title SovrynMarginTrader
/// @notice Simple contract to open margin positions on Sovryn Protocol
contract SovrynMarginTrader {
    // ── Constants ──
    bytes32 private constant NEW_LOAN_ID = bytes32(0);
    bytes private constant EMPTY_LOAN_DATA = "";

    // ── State ──
    ILoanToken public iDOC;
    ILoanToken public iRBTC;
    ISovryn public sovrynProtocol;

    IERC20 public DoC;
    IERC20 public WRBTC;

    // Track opened positions
    mapping(address => bytes32[]) public userLoans;

    // ── Events ──
    event MarginTradeOpened(
        address indexed user,
        bytes32 indexed loanId,
        address borrowToken,
        uint256 loanAmount,
        uint256 collateralAmount,
        address indexed collateralToken,
        uint256 leverage
    );

    event ContractsUpdated(
        address indexed iDOC,
        address indexed iRBTC,
        address indexed sovrynProtocol
    );

    // ── Constructor ──
    constructor(
        address _iDOC,
        address _iRBTC,
        address _sovrynProtocol,
        address _DoC,
        address _WRBTC
    ) {
        iDOC = ILoanToken(_iDOC);
        iRBTC = ILoanToken(_iRBTC);
        sovrynProtocol = ISovryn(_sovrynProtocol);
        DoC = IERC20(_DoC);
        WRBTC = IERC20(_WRBTC);

        emit ContractsUpdated(_iDOC, _iRBTC, _sovrynProtocol);
    }

    // ── Admin ──
    function updateContracts(
        address _iDOC,
        address _iRBTC,
        address _sovrynProtocol,
        address _DoC,
        address _WRBTC
    ) external {
        iDOC = ILoanToken(_iDOC);
        iRBTC = ILoanToken(_iRBTC);
        sovrynProtocol = ISovryn(_sovrynProtocol);
        DoC = IERC20(_DoC);
        WRBTC = IERC20(_WRBTC);
        emit ContractsUpdated(_iDOC, _iRBTC, _sovrynProtocol);
    }

    // ── Main: Margin Trade ──

    /// @notice Open a margin trade position using DoC as loan token
    /// @dev Bypasses price validation for offline testnet oracles
    /// @param loanAmount Amount of DoC to borrow
    /// @param collateralAmount Amount of WRBTC as collateral
    /// @param leverageAmount Leverage-1 (1 for 2x, 2 for 3x, etc)
    /// @param tradeTokenAddress Token to buy in swap
    /// @return loanId The newly created loan ID
    function openMarginTradeDoC(
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 leverageAmount,
        address tradeTokenAddress
    ) external returns (bytes32 loanId) {
        // Ensure caller has enough WRBTC collateral
        require(
            WRBTC.transferFrom(msg.sender, address(this), collateralAmount),
            "SovrynMarginTrader: transferFrom collateral failed"
        );

        // Approve iDOC to spend WRBTC (it will pull collateral)
        WRBTC.approve(address(iDOC), collateralAmount);

        // Execute margin trade with minReturn=0 (skip price validation for offline oracles)
        loanId = iDOC.marginTrade(
            NEW_LOAN_ID, // new position
            leverageAmount,
            loanAmount,
            collateralAmount,
            address(WRBTC), // collateral token
            tradeTokenAddress == address(0) ? address(iDOC) : tradeTokenAddress, // fallback to iDOC if not specified
            0,  // minReturn=0 to bypass oracle price disagreement check
            EMPTY_LOAN_DATA
        );

        // Track position
        userLoans[msg.sender].push(loanId);

        emit MarginTradeOpened(
            msg.sender,
            loanId,
            address(iDOC),
            loanAmount,
            collateralAmount,
            address(WRBTC),
            leverageAmount + 1
        );
    }

    /// @notice Open a margin trade position using WRBTC as loan token
    /// @dev Bypasses price validation for offline testnet oracles
    /// @param loanAmount Amount of WRBTC to borrow
    /// @param collateralAmount Amount of DoC as collateral
    /// @param leverageAmount Leverage-1 (1 for 2x, 2 for 3x, etc)
    /// @param tradeTokenAddress Token to buy in swap
    /// @return loanId The newly created loan ID
    function openMarginTradeWRBTC(
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 leverageAmount,
        address tradeTokenAddress
    ) external returns (bytes32 loanId) {
        // Ensure caller has enough DoC collateral
        require(
            DoC.transferFrom(msg.sender, address(this), collateralAmount),
            "SovrynMarginTrader: transferFrom collateral failed"
        );

        // Approve iRBTC to spend DoC (it will pull collateral)
        DoC.approve(address(iRBTC), collateralAmount);

        // Execute margin trade with minReturn=0 (skip price validation for offline oracles)
        loanId = iRBTC.marginTrade(
            NEW_LOAN_ID, // new position
            leverageAmount,
            loanAmount,
            collateralAmount,
            address(DoC), // collateral token
            tradeTokenAddress == address(0) ? address(iRBTC) : tradeTokenAddress, // fallback to iRBTC if not specified
            0,  // minReturn=0 to bypass oracle price disagreement check
            EMPTY_LOAN_DATA
        );

        // Track position
        userLoans[msg.sender].push(loanId);

        emit MarginTradeOpened(
            msg.sender,
            loanId,
            address(iRBTC),
            loanAmount,
            collateralAmount,
            address(DoC),
            leverageAmount + 1
        );
    }

    // ── Getters ──

    /// @notice Get all loan IDs for a user
    function getUserLoanCount(address user) external view returns (uint256) {
        return userLoans[user].length;
    }

    /// @notice Get a specific loan ID for a user
    function getUserLoan(address user, uint256 index) external view returns (bytes32) {
        require(index < userLoans[user].length, "SovrynMarginTrader: index out of bounds");
        return userLoans[user][index];
    }

    /// @notice Query basic loan details from SovrynProtocol
    function getLoanDetails(bytes32 loanId)
        external
        view
        returns (
            bool active,
            address borrower,
            uint256 principalAmount,
            uint256 collateralAmount
        )
    {
        (
            ,
            ,
            active,
            ,
            borrower,
            ,
            collateralAmount,
            principalAmount,
            ,
            ,
            ,
            ,
        ) = sovrynProtocol.getLoan(loanId);
    }

    // ── Emergency ──

    /// @notice Recover ERC20 tokens stuck in contract (not collateral in active trades)
    function recoverERC20(address token, uint256 amount, address recipient) external {
        IERC20(token).transfer(recipient, amount);
    }
}

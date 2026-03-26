
Trading: 
Contract “to”: To interact with this feature, transactions must be addressed to the Respective LoanToken Contracts:

Mainnet:

iDOC  → When the asset borrowed for the position is DoC.

iXUSD → When the asset borrowed for the position is XUSD.

iUSDT → (DEPRECIATED, No Longer Maintained) When the asset borrowed for the position is USDT.

iBPro → When the asset borrowed for the position is BPro. (Short positions in BPro)

iRBTC → When the asset borrowed for the position is RBTC (WRBTC). (Short positions in BTC).

Testnet:

iDOC  → When the asset borrowed for the position is DoC.

iXUSD → When the asset borrowed for the position is XUSD.

iUSDT → (DEPRECIATED, No Longer Maintained) When the asset borrowed for the position is USDT.

iBPro → When the asset borrowed for the position is BPro. (Short positions in BPro)

iRBTC → When the asset borrowed for the position is RBTC (WRBTC). (Short positions in BTC).

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABIs: LoanTokenLogicLM if the asset to be borrowed is any other than rBTC and LoanTokenLogicWrbtc otherwise.

With the former two elements the iToken contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: Methods and selectors in order to create a margin position are:

For simple Margin Trade: iToken.marginTrade, described here. With the selector:

"0x28a02f19": "marginTrade(bytes32,uint256,uint256,uint256,address,address,uint256,bytes)"

For Margin Trade with Affiliates: iToken.marginTradeAffiliate, described here.With the selector:

"0xf6b69f99": "marginTradeAffiliate(bytes32,uint256,uint256,uint256,address,address,uint256,address,bytes)"

Hints: in the parameter leverageAmount we need to indicate the number - 1 for “number-x” leverage : “uint256(1)” for “2x” leverage, “uint256(2)” for “3x” leverage… “uint256(4)” for “5x” leverage.

affiliateReferrer → If you build on top of Sovryn and wish to have benefits from bringing to your platform new users, here is where you put your address.

loanId → If you are creating new margin positions, this field must contain the bytes32(0) value. For interactions with pre-existent positions we will need to query the storage of the SovrynProtocol contract, which is described ahead.

minReturn → You can place in this field the unit256(0) value. However, in order to obtain a more accurate and fair value, you can use the getter function: getEstimatedMarginDetails, using the second value that this getter returns, and choosing for minReturn a given value, at some percentage below this obtained getter value. Back

 

Borrowing: 
Contract “to”: To interact with this feature, transactions must be addressed to the Respective LoanToken Contracts: 

Mainnet:

iDOC  → When the asset borrowed is DoC.

iXUSD → When the asset borrowed is XUSD.

iUSDT → (DEPRECIATED, No Longer Maintained) When the asset borrowed is USDT.

iBPro → When the asset borrowed is BPro.

iRBTC → When the asset borrowed is RBTC (WRBTC). 

Testnet:

iDOC  → When the asset borrowed is DoC.

iXUSD → When the asset borrowed is XUSD.

iUSDT → (DEPRECIATED, No Longer Maintained) When the asset borrowed is USDT.

iBPro → When the asset borrowed is BPro.

iRBTC → When the asset borrowed is RBTC (WRBTC).

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABIs: LoanTokenLogicLM if the asset to be borrowed is any other than rBTC and LoanTokenLogicWrbtc otherwise.

With the former two elements the iToken contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Point: Method and selector in order to borrow a given asset:

iToken.borrow, described here. With the selector:

"0x2ea295fa": "borrow(bytes32,uint256,uint256,uint256,address,address,address,bytes)"

Hints: the standard value of the parameter initialLoanDuration is 28 days, however the protocol can manage any other value of time. A reasonable window of time is advised in order to escrow a moderate amount of interests and in order to allow the platform a reasonable window to collect fees for lenders.

loanId → If you are creating new borrowing positions, this field must contain the bytes32(0) value. For interactions with pre-existent positions we will need to query the storage of the SovrynProtocol contract, which is described ahead.

collateralTokenSent → This field must be filled with the right amount in order to create a successful borrowing position.In order to obtain this information we can use the getter function: getDepositAmountForBorrow, using the only value that this getter returns, and choosing for collateralTokenSent an amount of funds something above this obtained value. Back

 

Lend or Withdraw: 
Contract “to”: To interact with this feature, transactions must be addressed to the Respective LoanToken Contracts: 

Mainnet:

iDOC  → When the asset to be lent / withdrawn is DoC.

iXUSD → When the asset to be lent / withdrawn is XUSD.

iUSDT → (DEPRECIATED, No Longer Maintained) When the asset to be lent / withdrawn is USDT.

iBPro → When the asset to be lent / withdrawn is BPro.

iRBTC → When the asset to be lent / withdrawn is RBTC (WRBTC). 

Testnet:

iDOC  → When the asset to be lent / withdrawn is DoC.

iXUSD → When the asset to be lent / withdrawn is XUSD.

iUSDT → (DEPRECIATED, No Longer Maintained) When the asset to be lent / withdrawn is USDT.

iBPro → When the asset to be lent / withdrawn is BPro.

iRBTC → When the asset to be lent / withdrawn is RBTC (WRBTC).

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABIs: LoanTokenLogicLM if the asset to be borrowed is any other than rBTC and LoanTokenLogicWrbtc otherwise.

With the former two elements the iToken contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: Methods and selectors in order to lend funds and mint i-Tokens (or withdraw funds plus interests and burn the i-Tokens):

For Lending Assets to the Protocol: if the asset to be lent is RBTC, use the method iToken.mintWithBTC, described here. With the selector:

"0xfb5f83df": "mintWithBTC(address,bool)"

If the asset to be lent is other than RBTC, use the method iToken.mint, described here. With the selector:

"0xd1a1beb4": "mint(address,uint256,bool)"

For Retrieving Lended Assets to the Protocol: if the lent asset is RBTC, use the method iToken.burnToBTC, described here. With the selector:

"0x0506af04": "burnToBTC(address,uint256,bool)"

If the lent asset is other than RBTC, use the method iToken.burn, described here. With the selector:

"0x76fd4fdf": "burn(address,uint256,bool)"

Hints: the boolean parameter useLM indicates whether or not to send the iTokens - to be minted - to the LiquidityMining contract or to the address instructed by the user, and in the case of the withdrawal, it indicates if the iTokens are held or not by the LiquidityMining contract on the behalf of the msg.sender. Back

 

Deposit More Collateral to a Position (or withdraw from a position): 
Contract “to”: To interact with this feature, transactions must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: ISovryn.

With the former two elements the SovrynProtocol contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Point: Method and selector in order to increase the collateral of a position:

sovrynProtocol.depositCollateral, described here. With the selector:

"0xdea9b464": "depositCollateral(bytes32,uint256)"

Also if your position is overcollateralized you can withdraw funds from there using:

sovrynProtocol.withdrawCollateral, described here. With the selector:

"0xdb35400d": "withdrawCollateral(bytes32,address,uint256)"

Hints: loanId → In this case an interaction with a pre-existent position is required. In order to obtain the value of this parameter we will need to query the storage of the SovrynProtocol contract, which is described ahead. Back

 

Extend / Reduce the Time Life of a Position: 
Contract “to”: To interact with this feature, transactions must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: LoanMaintenance.

With the former two elements the SovrynProtocol contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: Methods and selectors in order to extend or reduce the loan duration:

To Extend it: sovrynProtocol.extendLoanDuration, described here. With the selector:

"0xcfc85c06": "extendLoanDuration(bytes32,uint256,bool,bytes)"

To Reduce It: sovrynProtocol.reduceLoanDuration, described here. With the selector:

"0x122f0e3a": "reduceLoanDuration(bytes32,address,uint256)"

Hints: loanId → In this case an interaction with a pre-existent position is required. In order to obtain the value of this parameter we will need to query the storage of the SovrynProtocol contract, which is described ahead. Back

 

Closing a Position: 
Contract “to”: To interact with this feature, transactions must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: ISovryn.

With the former two elements the SovrynProtocol contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: Methods and selectors in order to close a margin position are:

Rollover (position renewal): sovrynProtocol.rollover, described here. With the selector:

"0xcf0eda84": "rollover(bytes32,bytes)"

Liquidation: sovrynProtocol.liquidate, described here. With the selector:

"0xe4f3e739": "liquidate(bytes32,address,uint256)"

Normal Closings: to close a margin position → sovrynProtocol.closeWithSwap, described here. With the selector:

"0xf8de21d2": "closeWithSwap(bytes32,address,uint256,bool,bytes)"

And to close a Borrowing position - usually referred to in the code as a “Torque Loan” - we execute the method:  

sovrynProtocol.closeWithDeposit, described here. With the selector:

"0x366f513b": "closeWithDeposit(bytes32,address,uint256)"

Hints: loanId → In all these cases an interaction with a pre-existent position is required. In order to obtain the value of this parameter we will need to query the storage of the SovrynProtocol contract, which is described ahead. Back

 

Getting a Specific loanId: 
To interact with pre-existent loan positions the right loanId value must be provided. Two methods can work for this:  querying a function (getUserLoans) and querying an event (Trade)
Contract “to”: To interact with these features, requests must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: ISovryn.

With the former two elements the SovrynProtocol contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: the following are the recommended methods to retrieve the referred data:

Web3 method getPastEvents(): after declaring a parameter “Contract” using web3.eth.Contract(ABI, contractAddress), the events of all loans opened by the user’s address “user” since the time of the block: “initial_block” until the present moment can be collected by the method:

Contract.getPastEvents('Trade',{ filter: {user: user}, fromBlock:  initial_block, toBlock: 'latest' }[, callback function])

Getting All User’s Loans: sovrynProtocol.getUserLoans, described here. With the selector:

"0x02a3fe64": "getUserLoans(address,uint256,uint256,uint256,bool,bool)"

Which parameters are:

address  user → The user address.

uint256  start → The lower loan ID to start with.

uint256  count → The maximum number of results.

uint256  loanType → The type of loan.

*   loanType 0: all loans.

*   loanType 1: margin trade loans.

*   loanType 2: non-margin trade loans.

bool isLender → Whether the user is lender or borrower.

bool unsafeOnly → The safe filter (True/False).

Hints: Recommended values : 

start = 0

count = 10 (for a human’s user address,  but if the user’s address is for a bot, count may need to be higher)

loanType = 0

isLender = false

unsafeOnly = false

Back

 

Other Useful Methods To Interact With Sovryn’s Protocol:
The following is a more comprehensive list of all methods that any user can use to build on top of the Sovryn’s Protocol. The first sub-list gathers all the tools coming from the LoanTokenLogic, and the second one has all the tools for the Protocol.
Tools From LoanTokenLogic: To interact with this features, requests must be addressed to the Respective LoanToken Contract: 

Mainnet:

iDOC  → When the asset to be lent / withdrawn is DoC.

iXUSD → When the asset to be lent / withdrawn is XUSD.

iUSDT → (DEPRECIATED, No Longer Maintained) When the asset to be lent / withdrawn is USDT.

iBPro → When the asset to be lent / withdrawn is BPro.

iRBTC → When the asset to be lent / withdrawn is RBTC (WRBTC). 

Testnet:

iDOC  → When the asset to be lent / withdrawn is DoC.

iXUSD → When the asset to be lent / withdrawn is XUSD.

iUSDT → (DEPRECIATED, No Longer Maintained) When the asset to be lent / withdrawn is USDT.

iBPro → When the asset to be lent / withdrawn is BPro.

iRBTC → When the asset to be lent / withdrawn is RBTC (WRBTC).

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: LoanTokenLogicStandard.

With the former two elements the iToken contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: this is the list of useful tools

 

Get interest rate w/ added supply (to the NET) assets 

"0x12416898": "totalSupplyInterestRate(uint256)",

Get loan token balance 

"0x06b3efd6": "assetBalanceOf(address)",

Compute the average borrow interest rate 

"0x44a4a003": "avgBorrowInterestRate()",

Get the amount of iTokens owned by an account 

"0x70a08231": "balanceOf(address)",

Get borrow interest rate 

"0x8325a1c0": "borrowInterestRate()",

Compute the next supply interest adjustment (a MACRO-financial estimation)

"0x6d23d1ac": "calculateSupplyInterestRate(uint256,uint256)",

Check whether a function is paused 

"0xbe194217": "checkPause(string)",

For margin positions: returns if the estimated collateral value is above a minimum allowed 

"0x18498b1d": "checkPriceDivergence(uint256,uint256,uint256,address,uint256)",

Getter for the price checkpoint mapping 

"0xeebc5081": "checkpointPrice(address)",

For iTokens 

"0x313ce567": "decimals()",

Calculate the borrow allowed for a given deposit 

"0x04797930": "getBorrowAmountForDeposit(uint256,uint256,address)",

Calculate the deposit required to a given borrow 

"0x631a3ef8": "getDepositAmountForBorrow(uint256,uint256,address)",

Get margin information on a trade BEFOREHAND 

"0x6b40cd40": "getEstimatedMarginDetails(uint256,uint256,uint256,address)",

Hint: getEstimateMarginDetails is a very important tool to help any app to calculate parameters for margin trade.

Getter for liquidityMiningAddress 

"0xe6d7cfb7": "getLiquidityMiningAddress()",

Compute the maximum deposit amount under current market conditions (a MACRO-financial estimation) 

"0x829b38f4": "getMaxEscrowAmount(uint256)",

PUBLIC Mapping of keccak256(collateralToken, isTorqueLoan) to loanParamsId

"0x3291c11a": "loanParamsIds(uint256)",

Liquidity = supply - borrow 

"0x612ef80b": "marketLiquidity()",

For iTokens 

"0x06fdde03": "name()",

Compute the next borrow interest adjustment as function of the value supplied as borrow amount "0xb9fe1a8f": "nextBorrowInterestRate(uint256)",

Hint: nextBorrowInterestRate is a very important tool to help any app to calculate parameters for borrowing.

Get interest rate w/ added (DELTA) supply 

"0xd65a5021": "nextSupplyInterestRate(uint256)",

GETTER OWNER ROLE 

"0x8da5cb5b": "owner()",

PUBLIC PARAMETER, PAUSER ROLE 

"0x9fd0506d": "pauser()",

Profit calculation based on checkpoints of price 

"0x54198ce9": "profitOf(address)",

Gives the interest rate that lenders are currently receiving when supplying to the pool "0x09ec6b6b": "supplyInterestRate()",

For iTokens 

"0x95d89b41": "symbol()",

Loan token price calculation considering unpaid interests 

"0x7ff9b596": "tokenPrice()",

MACRO FINANCIAL PARAMETER Get the total amount of loan tokens on debt 

"0x20f6d07c": "totalAssetBorrow()",

MACRO FINANCIAL PARAMETER Get the total amount of loan tokens on supply 

"0x8fb807c5": "totalAssetSupply()",

Get the total supply of iTokens 

"0x18160ddd": "totalSupply()",

the maximum trading/borrowing/lending limit per token address 

"0xe41b07e3": "transactionLimit(address)",

ERC20 for the iToken 

"0xa9059cbb": "transfer(address,uint256)",

ERC20 for the iToken 

"0x23b872dd": "transferFrom(address,address,uint256)",

Back

 

Tools From SovrynProtocol: To interact with these features, requests must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: ISovryn.

With the former two elements the SovrynProtocol contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: this is the list of useful tools

 

PUBLIC ADMIN ADDRESS 

"0xf851a440": "admin()",

PUBLIC PARAMETER 

"0xae0a8530": "affiliateFeePercent()",

PUBLIC PARAMETER (Mapping) Total affiliate SOV rewards that held in the protocol 

"0xbdee453c": "affiliateRewardsHeld(address)",

PUBLIC PARAMETER 

"0xf589a3e7": "affiliateTradingTokenFeePercent()",

PUBLIC PARAMETER (Mapping) [referrerAddress][tokenAddress] is a referrer's token balance of accrued fees 

"0x1b7bde74": "affiliatesReferrerBalances(address,address)",

PUBLIC PARAMETER (Mapping) User => referrer (affiliate) 

"0x6e663730": "affiliatesUserReferrer(address)",

PUBLIC PARAMETER (Mapping) Nonce per borrower. Used for loan id creation 

"0x3fca506e": "borrowerNonce(address)",

PUBLIC PARAMETER (Mapping) borrower => orderParamsId => Order 

"0x065d810f": "borrowerOrders(address,bytes32)",

PUBLIC PARAMETER 

"0xedab119f": "borrowingFeePercent()",

PUBLIC PARAMETER (Mapping) Total borrowing fees received and not withdrawn per asset

"0xb7e15241": "borrowingFeeTokensHeld(address)",

PUBLIC PARAMETER (Mapping) Total borrowing fees withdraw per asset 

"0xb30643d9": "borrowingFeeTokensPaid(address)",

Check the slippage based on the swapExpectedReturn (before using the Swap Network, not the same as method on iTokens) 

"0xb17da56e": "checkPriceDivergence(address,address,uint256,uint256)",

PUBLIC PARAMETER (Mapping) loanId => delegated => approved 

"0x4115a2b6": "delegatedManagers(bytes32,address)",

PUBLIC PARAMETER 

"0xacc04348": "feeRebatePercent()",

PUBLIC PARAMETER Address controlling fee withdrawals 

"0xe8f62764": "feesController()",

Get all active loans 

"0x60857c2c": "getActiveLoans(uint256,uint256,bool)",

Getter to query the affiliateRewardsHeld mapping 

"0x8417a2ae": "getAffiliateRewardsHeld(address)",

Getter to query the affiliateTradingTokenFeePercent parameter 

"0x824fcdc9": "getAffiliateTradingTokenFeePercent()",

Get all token balances of a referrer 

"0xf19ece6f": "getAffiliatesReferrerBalances(address)",

Getter to query the affiliate balance for a given referrer and token 

"0xa22473a2": "getAffiliatesReferrerTokenBalance(address,address)",

Get all available tokens at the affiliates program for a given referrer 

"0x1c9f66c2": "getAffiliatesReferrerTokensList(address)",

Get all token rewards estimation value in rbtc 

"0xd80100ea": "getAffiliatesTokenRewardsValueInRbtc(address)",

Getter to query the address of referrer for a given user 

"0x115cc0ce": "getAffiliatesUserReferrer(address)",

Get the borrow amount of a trade loan 

"0xe762319f": "getBorrowAmount(address,address,uint256,uint256,bool)",

Get how much SOV that is dedicated to pay the trading rebate rewards 

"0xc22552f7": "getDedicatedSOVRebate()",

Get the estimated margin exposure (net resultant collateral) 

"0xd67f7077":"getEstimatedMarginExposure(address,address,uint256,uint256,uint256,uint256)",

Getter for PUBLIC PARAMETER feeRebatePercent 

"0x3f1ae8b9": "getFeeRebatePercent()",

Get current lender interest data totals for all loans with a specific iToken lender address and specific loan token address. 

"0xd1979fb0": "getLenderInterestData(address,address)",

Get one loan data structure by matching its ID 

"0x8932f5f7": "getLoan(bytes32)",

Get current interest data for a loan 

"0x9b16cd87": "getLoanInterestData(bytes32)",

Get loan parameters for every matching IDs 

"0x2d9cd076": "getLoanParams(bytes32[])",

Get loan parameters for an owner and a given page defined by an offset and a limit 

"0xcf59e67b": "getLoanParamsList(address,uint256,uint256)",

Get a list of all loan pools 

"0x402946b9": "getLoanPoolsList(uint256,uint256)",

Getter for PUBLIC PARAMETER lockedSOVAddress 

"0xf44942ec": "getLockedSOVAddress()",

Getter to query referral threshold for paying out to the referrer 

"0xb41263b6": "getMinReferralsToPayout()",

Getter for PUBLIC PARAMETER protocolAddress 

"0x07024c25": "getProtocolAddress()",

Getter to query the referrals coming from a referrer 

"0x249556fb": "getReferralsList(address)",

Get the required collateral for a loan 

"0x25decac0": "getRequiredCollateral(address,address,uint256,uint256,bool)",

Getter for PUBLIC PARAMETER sovTokenAddress 

"0x4bcfe726": "getSovTokenAddress()",

Get a rebate percent of specific source/destin tokens 

"0x59d0d9ec": "getSpecialRebates(address,address)",

Get the swap expected return value (data obtained from the swap network) 

"0x69455ddc": "getSwapExpectedReturn(address,address,uint256)",

Getter for INTERNAL PARAMETER swapExtrernalFeePercent 

"0x462096f3": "getSwapExternalFeePercent()",

Get the total principal of the loans by a lender contract and loan token 

"0x4a1e88fe": "getTotalPrincipal(address,address)",

Getter for INTERNAL PARAMETER tradingRebateRewardsBasisPoint 

"0xe4196480": "getTradingRebateRewardsBasisPoint()",

Getter to query the not-first-trade flag of a user by the PUBLIC PARAMETER (Mapping) userNotFirstTradeFlag 

"0xb05f6570": "getUserNotFirstTradeFlag(address)",

Check whether a token is a pool token 

"0x115dd4b1": "isLoanPool(address)",

Returns true if the caller is the current owner 

"0x8f32d59b": "isOwner()",

Check the status of INTERNAL PARAMETER pause 

"0xdac88561": "isProtocolPaused()",

PUBLIC PARAMETER 

"0x62fff3f6": "lenderInterest(address,address)",

PUBLIC PARAMETER 

"0x3432423c": "lenderOrders(address,bytes32)",

PUBLIC PARAMETER 

"0x4699f846": "lendingFeePercent()",

PUBLIC PARAMETER (Mapping) 

"0x4203e395": "lendingFeeTokensHeld(address)",

PUBLIC PARAMETER (Mapping) 

"0x92d894f8": "lendingFeeTokensPaid(address)",

PUBLIC PARAMETER 

"0xf6ddc8b3": "liquidationIncentivePercent()",

PUBLIC PARAMETER (Mapping) 

"0x569fc1fb": "loanInterest(bytes32)",

PUBLIC PARAMETER (Mapping) 

"0xcb6eacd1": "loanParams(bytes32)",

PUBLIC PARAMETER (Mapping) 

"0x8dc48ba5": "loanPoolToUnderlying(address)",

PUBLIC PARAMETER (Mapping) the  storage of all loan position data 

"0xc4a90815": "loans(bytes32)",

PUBLIC PARAMETER (address) 

"0xd288208c": "lockedSOVAddress()",

PUBLIC PARAMETER (Mapping) the storage of all valid logic for the Protocol 

"0x17548b79": "logicTargets(bytes4)",

PUBLIC PARAMETER 

"0xd473c2da": "maxDisagreement()",

PUBLIC PARAMETER 

"0x4f28cac2": "maxSwapSize()",

Getter to query the mapping element loanParams[loanParamsId].minInitialMargin 

"0xca74a5d9": "minInitialMargin(bytes32)",

PUBLIC PARAMETER 

"0x742e6798": "minReferralsToPayout()",

Returns the address of the current owner 

"0x8da5cb5b": "owner()",

PUBLIC PARAMETER (address) 

"0x78d849ed": "priceFeeds()",

PUBLIC PARAMETER (address) 

"0x0676c1b7": "protocolAddress()",

PUBLIC PARAMETER (address) 

"0xf706b1f2": "protocolTokenAddress()",

PUBLIC PARAMETER 

"0x7a8faeb8": "protocolTokenHeld()",

PUBLIC PARAMETER 

"0x2f470764": "protocolTokenPaid()",

PUBLIC PARAMETER 

"0x574442cc": "rolloverBaseReward()",

PUBLIC PARAMETER 

"0x959083d3": "rolloverFlexFeePercent()",

Setter method: Sets new delegated manager of a given loanId by its borrower 

"0x33d8991f": "setDelegatedManager(bytes32,address,bool)",

Setter method: Setup a set of loan parameters 

"0xa1ae275e": "setupLoanParams((bytes32,bool,address,address,address,uint256,uint256,uint256)[])",

PUBLIC PARAMETER 

"0xf0e085f5": "sourceBuffer()",

PUBLIC PARAMETER 

"0xb9cffa3e": "sovTokenAddress()",

PUBLIC PARAMETER 

"0xba4861e9": "sovrynSwapContractRegistryAddress()",

PUBLIC PARAMETER (Mapping) 

"0xcd5d808d": "specialRebates(address,address)",

PUBLIC PARAMETER (Mapping) 

"0x68c4ac26": "supportedTokens(address)",

Setter method: Perform a swap w/ tokens or rBTC as source currency (not in use yet) 

"0xe321b540": "swapExternal(address,address,address,address,uint256,uint256,uint256,bytes)",

PUBLIC PARAMETER 

"0x7420ca3e": "swapsImpl()",

PUBLIC PARAMETER 

"0x2a324027": "tradingFeePercent()",

PUBLIC PARAMETER (Mapping) 

"0xd485045e": "tradingFeeTokensHeld(address)",

PUBLIC PARAMETER (Mapping) 

"0x3452d2d4": "tradingFeeTokensPaid(address)",

PUBLIC PARAMETER (Mapping) 

"0x218b39c6": "underlyingToLoanPool(address)",

PUBLIC PARAMETER (Mapping) 

"0x24cc5749": "userNotFirstTradeFlag(address)",

Setter method: Collects interest earned until that moment from protocol treasury to LoanToken pool treasury

"0xe81fefa0": "withdrawAccruedInterest(address)",

Setter method: Referrer calls this function to receive its reward in a given token 

"0xac92fd8e": "withdrawAffiliatesReferrerTokenFees(address,address,uint256)",

Setter method:  Withdraw to msg.sender all token fees for a referrer 

"0xadfcbc98": "withdrawAllAffiliatesReferrerTokenFees(address)",

PUBLIC PARAMETER (address) 

"0xafe84009": "wrbtcToken()"

 

Back

 

Staking 

 
The following features are related to the Governance module of Sovryn Protocol.

Staking Methods: 
Staking contract holds the storage of all staking positions for SOV stakers. Staking SOV tokens gives to the holder the power to vote and rights to participate in the sharing of fees from the Sovryn protocol.

Contract “to”: To interact with these features, requests must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: StakingLogic.

With the former two elements the Staking contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: this is the list of useful tools provided by the Staking contract:

 

CONSTANT 

"0xe7a324dc": "DELEGATION_TYPEHASH()",

CONSTANT 

"0x20606b70": "DOMAIN_TYPEHASH()",

CONSTANT 

"0xb1724b46": "MAX_DURATION()",

CONSTANT 

"0x17748adc": "MAX_VOTING_WEIGHT()",

PUBLIC PARAMETER (address) 

"0xa58848c5": "SOVToken()",

CONSTANT 

"0xd27569e7": "WEIGHT_FACTOR()",

PUBLIC PARAMETER (Mapping) 

"0x429b62e5": "admins(address)",

PUBLIC PARAMETER (bool) 

"0x9929e886": "allUnlocked()",

Relevant Getter: Get the number of staked tokens held by the user account 

"0x70a08231": "balanceOf(address)",

Getter: Compute the weight for a specific date 

"0x62cf8a08": "computeWeightByDate(uint256,uint256)",

Setter Method: Delegate votes from `msg.sender` which are locked until lockDate to `delegatee`

"0x026e402b": "delegate(address,uint256)",

Setter Method: Delegates votes from signatory to a delegatee account; for voting with EIP-712 signatures

"0xe63a562e": "delegateBySig(address,uint256,uint256,uint256,uint8,bytes32,bytes32)",

PUBLIC PARAMETER (Mapping): A record of tokens to be unstaked at a given time which were delegated to a certain address 

"0x6b6fde0e": "delegateStakingCheckpoints(address,uint256,uint32)",

PUBLIC PARAMETER (Mapping): A record of each accounts delegate 

"0x27dd1b00": "delegates(address,uint256)",

Setter Method: Extend the staking duration until the specified date 

"0xeefb8c47": "extendStakingDuration(uint256,uint256)",

PUBLIC PARAMETER (contract-address): the address of FeeSharingProxy contract, we need it for unstaking with slashing 

"0x03a18fa3": "feeSharing()",

Relevant Getter: the current number of tokens staked for a day 

"0xd5c38464": "getCurrentStakedUntil(uint256)",

Relevant Getter: the current votes balance for a user account 

"0xb4b5ea57": "getCurrentVotes(address)",

Getter: returns the number of votes the account had as of the given block 

"0xe97ffacb": "getPriorStakeByDateForDelegatee(address,uint256,uint256)",

Getter: returns the number of votes the account had as of the given block 

"0xf09cfc64": "getPriorTotalStakesForDate(uint256,uint256)",

Getter: returns the total voting power at the given time 

"0x2522d7ba": "getPriorTotalVotingPower(uint32,uint256)",

Getter: Determine the prior number of stake for an account until a certain lock date as of a block number 

"0xcf7b684a": "getPriorUserStakeByDate(address,uint256,uint256)",

Getter: Determine the prior number of vested stake for an account until a certain lock date as of a block number 

"0xc70a7e96": "getPriorVestingStakeByDate(uint256,uint256)",

Getter: Determine the prior weighted vested amount for an account as of a block number

"0xcdbe7155": "getPriorVestingWeightedStake(uint256,uint256)",

Getter: returns the number of votes the delegatee had as of the given block 

"0x836eebee": "getPriorVotes(address,uint256,uint256)",

Getter: Determine the prior weighted stake for an account as of a block number 

"0x37e6b1c1": "getPriorWeightedStake(address,uint256,uint256)",

Relevant Getter: Get list of stakes for a user account 

"0x7ba6f458": "getStakes(address)",

Relevant Getter: Get available and punished amount for withdrawing 

"0x96a590c1": "getWithdrawAmounts(uint96,uint256)",

Getter: Returns true if the caller is the current owner 

"0xca6860df": "isVestingContract(address)",

PUBLIC PARAMETER: The timestamp of contract creation. Base for the staking period calculation

"0x00073f99": "kickoffTS()",

Setter Method: Allow a staker to migrate his positions to a new staking contract (a migration process has started) 

"0x5419675f": "migrateToNewStakingContract()",

PUBLIC PARAMETER (contract-address): Used for stake migrations to a new staking contract with a different storage structure 

"0xae81dfe4": "newStakingContract()",

PUBLIC PARAMETER (Mapping): A record of states for signing / validating signatures - nonces[user] is a number - 

"0x7ecebe00": "nonces(address)",

PUBLIC PARAMETER (Mapping): The number of total staking checkpoints for each date per delegate - numDelegateStakingCheckpoints[delegatee][date] is a number - 

"0x94c2ce58": "numDelegateStakingCheckpoints(address,uint256)",

PUBLIC PARAMETER (Mapping): The number of total staking checkpoints for each date - numTotalStakingCheckpoints[date] is a number -  

"0x9436e7d4": "numTotalStakingCheckpoints(uint256)",

PUBLIC PARAMETER (Mapping): The number of total staking checkpoints for each date per user - numUserStakingCheckpoints[user][date] is a number - 

"0xdb27ec18": "numUserStakingCheckpoints(address,uint256)",

PUBLIC PARAMETER (Mapping): The number of total vesting checkpoints for each date - numVestingCheckpoints[date] is a number - 

"0xbb533cf2": "numVestingCheckpoints(uint256)",

Getter: Returns the address of the current owner 

"0x8da5cb5b": "owner()",

Setter Method: Receives approval from SOV token 

"0x8f4ffcb1": "receiveApproval(address,uint256,address,bytes)",

Setter Method: Stake the given amount of SOV tokens for the given duration of time 

"0x25629ec0": "stake(uint96,uint256,address,address)",

Setter Method: Stake tokens according to a given vesting schedule 

"0x4b2fea1e": "stakesBySchedule(uint256,uint256,uint256,uint256,address,address)",

Relevant Getter: Calculates the nearest checkpoint before the indicated time 

"0x72ec9795": "timestampToLockDate(uint256)",

PUBLIC PARAMETER (Mapping): 

A record of tokens to be unstaked at a given time in total - totalStakingCheckpoints[date][index] is a checkpoint - 

"0xdfb267c2": "totalStakingCheckpoints(uint256,uint32)",

PUBLIC PARAMETER (Mapping): 
A record of tokens to be unstaked at a given time per user address - userStakingCheckpoints[user][date][index] is a checkpoint - 

"0x68cefccc": "userStakingCheckpoints(address,uint256,uint32)",

PUBLIC PARAMETER (Mapping): 

A record of tokens to be unstaked from vesting contract at a given time - vestingCheckpoints[date][index] is a checkpoint - 

"0xf3f19731": "vestingCheckpoints(uint256,uint32)",

PUBLIC PARAMETER (Mapping): 

flags whether the hash of a contract's code is a registered code hash 

"0x07392cc0": "vestingCodeHashes(bytes32)",

PUBLIC PARAMETER (contract-address): the vesting registry contract 

"0x104932cf": "vestingRegistryLogic()",

PUBLIC PARAMETER (Mapping): List of specially authorized vesting contracts 

"0xadae9002": "vestingWhitelist(address)",

PUBLIC PARAMETER

"0xbf626ec1": "weightScaling()",

Relevant Getter: Compute the voting power for a specific date - Power = stake * weight - 

"0x8dae1b16": "weightedStakeByDate(address,uint256,uint256,uint256)",

Relevant Getter: Compute the voting power for a specific date for vesting contracts 

"0xba21c6d7": "weightedVestingStakeByDate(uint256,uint256,uint256)",

Setter Method: Withdraw the given amount of tokens if they are unlocked 

"0xdab6ca44": "withdraw(uint96,uint256,address)"

Back

 

Vesting Registry Methods: 
Vesting Registry contract is the master contract for creation and management of  user’s vesting contracts and the deposit of new assets. Note: direct creation of vesting contracts are only allowed by the authorized contracts of Sovryn protocol.

Contract “to”: To interact with these features, requests must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: Vesting Registry Logic.

With the former two elements the Vesting Registry contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: this is the list of useful tools provided by the Vesting Registry contract:

 

CONSTANT 

"0xb4ebc041": "CSOV_VESTING_CLIFF()",

CONSTANT 

"0xb33f914a": "CSOV_VESTING_DURATION()",

PUBLIC PARAMETER (contract-address): The cSOV token contracts 

"0x99336b36": "CSOVtokens(uint256)",

CONSTANT used for computing the vesting dates 

"0xf6d6189e": "FOUR_WEEKS()",

PUBLIC PARAMETER (contract-address): 

"0x08dcb360": "SOV()",

PUBLIC PARAMETER (Mapping): user => flag whether user has admin role 

"0x429b62e5": "admins(address)",

PUBLIC PARAMETER (Mapping): 

ser => flag whether user shouldn't be able to exchange or reimburse 

"0xf9f92be4": "blacklist(address)",

Relevant Getter: Get contract balance of the contract 

"0xed01bf29": "budget()",

PUBLIC PARAMETER (contract-address): 

"0x6a26b57f": "feeSharingProxy()",

Relevant Getter: Query the Sovryn's team vesting contract for an account 

"0xc810a3e3": "getTeamVesting(address)",

Relevant Getter: Query the general user's vesting contract for an account 

"0xcc49ede7": "getVesting(address)",

Getter: Returns true if the caller is the current owner 

"0x8f32d59b": "isOwner()",

PUBLIC PARAMETER (Mapping): 

user => amount of tokens should not be processed 

"0xa153e708": "lockedAmount(address)",

Getter: Returns the address of the current owner 

"0x8da5cb5b": "owner()",

PUBLIC PARAMETER: (Old) to cSOV conversion 

"0x661f2161": "priceSats()",

PUBLIC PARAMETER (Mapping): user => flag whether user has already exchange cSOV or got a reimbursement 

"0x2eee57fa": "processedList(address)",

PUBLIC PARAMETER (contract-address): The staking contract address 

"0x4cf088d9": "staking()",

PUBLIC PARAMETER (Mapping): 

user => vesting type => vesting contract; address can have only one vesting of each type "0xf2becf17": "vestingContracts(address,uint256)",

PUBLIC PARAMETER (contract-address): 

"0xf60826ee": "vestingFactory()",

PUBLIC PARAMETER (contract-address): The vesting owner (e.g. governance timelock address)

"0xbd7b5908": "vestingOwner()",

Back

 

Staking Reward Methods: 
The protocol of Staking Rewards is a trial incentive program in terms of SOV tokens in intervals of 14 days. Vesting contract stakes are excluded from these rewards. Only wallets which have staked previously liquid SOV are eligible for these rewards. The Staking Rewards are a pro-rata share of the revenue that the platform generates from various transaction fees plus revenues from stakers who have a portion of their SOV slashed for early unstaking.

Contract “to”: To interact with these features, requests must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: StakingRewards.

With the former two elements the Staking Rewards contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: this is the list of useful tools provided by the Staking Rewards contract:

 

CONSTANT 

"0x41910f90": "BASE_RATE()",

CONSTANT 

"0x3410fe6e": "DIVISOR()",

PUBLIC PARAMETER (contract-address): 

"0x08dcb360": "SOV()",

CONSTANT 

"0x934d1fa4": "TWO_WEEKS()",

PUBLIC PARAMETER (Mapping): User Address -> Claimed Balance 

"0xd42b779d": "claimedBalances(address)",

Setter Method: User calls this function to collect SOV staking rewards as per the SIP-0024 program

"0x54c5aee1": "collectReward()",

PUBLIC PARAMETER: Represents the block when the StakingRwards Program is started

"0x82100e3f": "deploymentBlock()",
Relevant Getter: Get staker's current accumulated reward 

"0x21f6bf2f": "getStakerCurrentReward(bool)",

Hint: we will need set to true the boolean parameter and to use the parameter msg.sender inside a “call()” function in order to obtain the stake rewards for a given user address; e.g.: 
If a variable “Contract” contains the returned value of the contract’s declaration in web3
 

We can get a given staker current reward by the method:

 

Contract.methods.getStakerCurrentReward(true).call({from: msg.sender}, function(error, result){
// a code telling what to do
// with (error, result) in this callback function
}
 

PUBLIC PARAMETER: Maximum duration to collect rewards at one go 

"0x6db5c8fd": "maxDuration()",

PUBLIC PARAMETER (contract-address): the staking proxy contract address 

"0x4cf088d9": "staking()",

PUBLIC PARAMETER: Represents the time when the contract is deployed 

"0x78e97925": "startTime()",

PUBLIC PARAMETER: Represents the block when the Staking Rewards program is stopped

"0x44bb3b2f": "stopBlock()",

PUBLIC PARAMETER (Mapping): User Address -> Last Withdrawn Timestamp 

"0x7a9262a2": "withdrawals(address)"

Back

 

Farm Yield: 

The following features are related to special rewards in terms of vested SOV tokens, additional to the regular rewards coming from supplying liquidity to the protocol.
Liquidity Mining: 
The main features that control the liquidity mining rewards starts from this contract. This contract relies heavily on the LockedSOV contract, which also has important interactions with RBTCWrampperProxy, which will be mentioned in the AMM section.

Contract “to”: To interact with these features, requests must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: LiquidityMining.

With the former two elements the Liquidity Mining contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: this is the list of useful tools provided by the Liquidity Mining contract:

 

CONSTANT 

"0x10a168f9": "BONUS_BLOCK_MULTIPLIER()",

CONSTANT 

"0xaaf5eb68": "PRECISION()",

CONSTANT 

"0xc1d74258": "SECONDS_PER_BLOCK()",

PUBLIC PARAMETER (contract-address): The SOV token 

"0x08dcb360": "SOV()",

PUBLIC PARAMETER (Mapping): user => flag whether user has admin role 

"0x429b62e5": "admins(address)",

PUBLIC PARAMETER Block number when bonus reward token period ends. 

"0x1aed6553": "bonusEndBlock()",

Setter Method: Transfers reward tokens earned from a pool-token to a given user 

"0x4953c782": "claimReward(address,address)",

Setter Method: Transfers reward tokens earned from all pool-tokens to a given user 

"0xd6a49f0e": "claimRewardFromAllPools(address)",

Setter Method: Deposits pool tokens (iTokens) on behalf of a given user 

"0xf45346dc": "deposit(address,uint256,address)",

Setter Method: Withdraws pool tokens without transferring reward tokens (EMERGENCY ONLY)

"0x6ff1c9bc": "emergencyWithdraw(address)",

PUBLIC PARAMETER Block number when reward token period ends. 

"0x083c6323": "endBlock()",

Relevant Getter: Returns estimated reward if certain iTokens are supplied by a given time

"0x0b1a2851": "getEstimatedReward(address,uint256,uint256)",

Relevant Getter: Get the missed SOV balance of LM contract. 

"0x3723de42": "getMissedBalance()",

Relevant Getter: Returns the pool id in the LM contract, for a given pool token address 

"0xcaa9a08d": "getPoolId(address)",

Relevant Getter: Returns pool info in terms of the PoolInfo struct for the given token address

"0x06bfa938": "getPoolInfo(address)",

Relevant Getter: Returns the whole list of pool token's info in terms of the PoolInfo struct.

"0xe788d8d1": "getPoolInfoList()",

Relevant Getter: Returns count of pool tokens. 

"0xb3944d52": "getPoolLength()",

Relevant Getter: Returns accumulated reward due to a given iToken pool for a given user

"0x56085d4c": "getUserAccumulatedReward(address,address)",

Relevant Getter: Returns accumulated reward for the given user from all pool tokens 

"0x48c84d9e": "getUserAccumulatedRewardList(address)",

Relevant Getter: Returns list of [amount, accumulatedReward] for the given user for each pool token

"0x5d50d060": "getUserBalanceList(address)",

Relevant Getter: Returns UserInfo for the given pool and user 

"0xf2801fe7": "getUserInfo(address,address)",

Relevant Getter: Returns list of UserInfo for the given user for each pool token 

"0x62748fbb": "getUserInfoList(address)",

Relevant Getter: Returns the pool token balance a user has on the LM contract 

"0xd0452aa6": "getUserPoolTokenBalance(address,address)",

PUBLIC PARAMETER (contract-address): The locked vault contract to deposit LP's rewards into.

"0xf2f46b3b": "lockedSOV()",

Setter Method: if the lending pools directly mint/transfer tokens to this address, process it like a user deposit 

"0xd8c173c4": "onTokensDeposited(address,uint256)",

Getter: Returns the address of the current owner 

"0x8da5cb5b": "owner()",

PUBLIC PARAMETER (array of PoolInfo struct elements): Info of each pool. 

"0x787b4026": "poolInfoList(uint256)",

PUBLIC PARAMETER: Reward tokens created per block. 

"0x29d0fa3e": "rewardTokensPerBlock()",

PUBLIC PARAMETER: The block number when reward token mining starts. 

"0x48cd4cb1": "startBlock()",

PUBLIC PARAMETER: Total allocation points. Must be the sum of all allocation points in all pools.

"0xa1a6690f": "totalAllocationPoint()",

PUBLIC PARAMETER: Total balance this contract should have to handle withdrawal for all users

"0x9a13ba29": "totalUsersBalance()",

PUBLIC PARAMETER: The % which determines how much will be unlocked immediately.

"0xf729a404": "unlockedImmediatelyPercent()",

Setter Method: Updates reward variables for all pools. (Be careful of gas spending!) 

"0xb9ec7d74": "updateAllPools()",

Setter Method: Updates reward variables of the given pool to be up-to-date 

"0x7b46c54f": "updatePool(address)",

PUBLIC PARAMETER (Mapping): Info of each user that stakes LP tokens. userInfoMap[_poolId][_user]; 

"0x5f02c145": "userInfoMap(uint256,address)",

Setter Method: Withdraws pool tokens and transfers reward tokens. 

"0x69328dec": "withdraw(address,uint256,address)",

PUBLIC PARAMETER (contract-address): RBTCWrapperProxy contract which will be a proxy between user and LM contract 

"0xac210cc7": "wrapper()"

Back

 

LockedSOV: 
This contract is used to receive reward from other contracts, Create Vesting and Stake Tokens.

Contract “to”: To interact with these features, requests must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: LockedSOV.

With the former two elements the LockedSOV contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: this is the list of useful tools provided by the LockedSOV contract:

 

PUBLIC PARAMETER (contract-address): The SOV token contract. 

"0x08dcb360": "SOV()",

Getter: The function to check if an address is admin or not. 

"0x3e4a89d1": "adminStatus(address)",

PUBLIC PARAMETER: The cliff. After this time period the tokens begin to unlock. 

"0x13d033c0": "cliff()",

Setter Method: Creates vesting contract (if it hasn't been created yet) for the calling user.

"0xcc6f0333": "createVesting()",

Setter Method: Creates vesting if not already created and Stakes tokens for a user. 

"0x4558269f": "createVestingAndStake()",

Setter Method: Adds SOV to the user balance (Locked and Unlocked Balance based on basis points).

"0x0efe6a8b": "deposit(address,uint256,uint256)",

Setter Method: Adds SOV to the locked balance of a user. 

"0xf33bf9a1": "depositSOV(address,uint256)",

PUBLIC PARAMETER: The duration. After this period all tokens will have been unlocked. 

"0x0fb5a6b4": "duration()",

Relevant Getter: The function to get the locked balance of a user. 

"0xc4086893": "getLockedBalance(address)",

Relevant Getter: The function to get the unlocked balance of a user. 

"0x129de5bf": "getUnlockedBalance(address)",

PUBLIC PARAMETER (bool): True if the migration to a new Locked SOV Contract has started. 

"0x1705a3bd": "migration()",

PUBLIC PARAMETER (contract-address): The New (Future) Locked SOV. 

"0x7195823e": "newLockedSOV()",

Setter Method: Stakes tokens for a user who already has a vesting created. 

"0xce46643b": "stakeTokens()",

Setter Method: Function to transfer the locked balance from this contract to the new LockedSOV Contract. (Only during Migration) 

"0x8a4068dd": "transfer()",

PUBLIC PARAMETER (contract-address): The Vesting registry contract. 

"0x904c5b8f": "vestingRegistry()",

Setter Method: A function to withdraw a user's unlocked balance. 

"0x51cff8d9": "withdraw(address)",

Setter Method: Withdraws unlocked tokens and Stakes Locked tokens for a user who already has a vesting created. 

"0xe5545864": "withdrawAndStakeTokens(address)",

Setter Method: Withdraws unlocked tokens and Stakes Locked tokens for a user who already has a vesting created. (More generic than the former setter) 

"0x2b6df82a": "withdrawAndStakeTokensFrom(address)"

Back

 

Fee Sharing: 

The key difference between Fee Sharing contract and Staking Rewards contract is that fee-sharing gets rewards from all kinds of coins that Sovryn Protocol is able to collect, while staking-rewards only comes from SOV rewards. Another key difference is that payments coming from the Protocol (or AMM pools) to the FeeSharing contract can happen at any moment , while the rewards from StakingRewards only can happen each 14 days.
Contract “to”: To interact with these features, requests must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: FeeSharing.

With the former two elements the Fee Sharing contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: this is the list of useful tools provided by the Fee Sharing contract:

 

PUBLIC PARAMETER (Mapping): 

The number of checkpoints for each pool token address. 

numTokenCheckpoints[_loanPoolToken].

"0x20020208": "numTokenCheckpoints(address)",

PUBLIC PARAMETER (Mapping): 

Checkpoints by index per pool token address. 

(Struct) Checkpoint = tokenCheckpoints[_loanPoolToken][i]. 

"0x70530017": "tokenCheckpoints(address,uint256)",

Relevant Getter: Get the accumulated loan pool fee of the given user 

"0x3d67df6f": "getAccumulatedFees(address,address)",

Relevant Getter: Getter to query all of the whitelisted converters. 

"0xadcf21a7": "getWhitelistedConverterList()",

PUBLIC PARAMETER (Mapping): 

Last time fees were withdrawn per pool token address: token => time. 

"0xf3bdba8f": "lastFeeWithdrawalTime(address)",

PUBLIC PARAMETER (Mapping): 

user => token => processed checkpoint 

"0x7913b451": "processedCheckpoints(address,address)",

PUBLIC PARAMETER (contract-address): 

"0x8ce74426": "protocol()",

PUBLIC PARAMETER (contract-address): 

"0x4cf088d9": "staking()",

Setter Method: Transfer tokens to this contract. 

"0xabe979e1": "transferTokens(address,uint96)",

PUBLIC PARAMETER (Mapping): 

Amount of tokens that were transferred, but not saved in checkpoints. token => amount.

"0x8b6fdcba": "unprocessedAmount(address)",

Setter Method: Withdraw accumulated fee from specific pool-token to the message sender.

"0xa965b3a9": "withdraw(address,uint32,address)",

Setter Method: Withdraw Protocol-Fees for the given tokens: 

"0xa697b8c7": "withdrawFees(address[])",

Setter Method: Withdraw amm fees for the given converter addresses: 

"0x7c8678ec": "withdrawFeesAMM(address[])"

Back

Important: How to generate ABI files from our Git Repo
Sometimes we will need an updated ABI file, due to a recern update of our code in our repo. In such cases, howcan we generate our own ABI file set?

In this section we explain step by step how to do that.

1.- Cloning the Right Branch: 
Usually the most updated branch is development. However, the most stable is the master branch. The difference is that the master branch include the last deployments on mainnet, while development include code that maystill be under testing.

To clone a Git repo it is conveninentto have installed Git.

In your console you simply type:

$ git clone -b master https://github.com/DistributedCollective/Sovryn-smart-contracts
$ cd Sovryn-smart-contracts
2.- Installing Dependencies:
You will need installed node.js and npm. Then, simply type:

$  npm ci
And wait for all the installations

3.- Compile all The Contracts with Hard Hat:
Then you can generate all the build files in the folder \Sovryn-smart-contracts\abi executig the following:

$ npx hardhat compile
Now you can find any ABI file you need inside the folder mentioned above.

Back

Oracle based AMM
Natspec API:

 

https://github.com/DistributedCollective/oracle-based-amm/tree/feat/solidoc-docs-generator/solidity/docs

(RBTCWrapperProxy is yet missing)

 

Network RSK; Id: 30 (mainnet) and 31 (testnet)

Our public nodes: 

Mainnet: https://mainnet.sovryn.app/rpc

Testnet: https://testnet.sovryn.app/rpc

Sovryn’s swap feature is controlled by the SovrynSwapNetwork, which is the “brain” of our AMM network. Along with the Swap Network contract there are a set of other contract helpers and features that may be useful to build on top of our AMM network.

The main features of the Sovryn AMM Network are:

1.- The RBTCWrapperProxy and its reference asset: The WRBTC token

2.- The SovrynSwapNetwork and the ConversionPathFinder (complementing each other).

3.- The LiquidityPoolV1Converter and LiquidityPoolV2Converter

4.- Oracles for V1 AMMs and Price Oracles

5.- The ConverterRegistry contract and the ConverterUpgrader: How any user can propose their own token to be part of our Sovryn Swap Network

6.- Important: How to generate ABI files from our Git Repo

 

Back

 

RBTCWrapperProxy and the WRBTC Token: 

Any user can interact with the WRBTC contract and convert their rBTC coins into the tokenized version of them to operate with AMM. This is however a low-level option that the platform manages internally, but anyone can build on top of this:
Contract “to”: To interact with these features, requests must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: WRBTC.

With the former two elements the WRBTC contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: this is the list of useful tools provided by the Sovryn’s WRBTC contract:

 

WRBTC: is a non-upgradeable & self-owned contract to mint/burn Sovryn's WRBTC tokens

 

PUBLIC PARAMETER (Mapping): The typical allowance mapping of all ERC20 tokens.

"0xdd62ed3e": "allowance(address,address)",

Setter: Typical approve method of an ERC20 token 

"0x095ea7b3": "approve(address,uint256)",

Getter: Typical balanceOf method of an ERC20 token 

"0x70a08231": "balanceOf(address)",

Getter: Typical method for an ERC20 token 

"0x313ce567": "decimals()",

Relevant Setter: Triggered by the fallback function. 

Takes the msg.value of the transaction and convert it into WRBTC token in favor of the msg.sender 

"0xd0e30db0": "deposit()",

Getter: Typical method for an ERC20 token 

"0x06fdde03": "name()",

Getter: Typical method for an ERC20 token 

"0x95d89b41": "symbol()",

Getter: Typical method for an ERC20 token 

"0x18160ddd": "totalSupply()",

Setter: Typical transfer method of an ERC20 token 

"0xa9059cbb": "transfer(address,uint256)",

Setter: Typical transferFrom method of an ERC20 token 

"0x23b872dd": "transferFrom(address,address,uint256)",

Relevant Setter: Takes the uint256 (wad) amount in WRBTC tokens and send that amount to msg.sender it terms of rBTC 

"0x2e1a7d4d": "withdraw(uint256)"

Back

 

By the other hand, the RBTC-Wrapper is a high-level wrapper to allow the user to supply and withdraw liquidity to AMM pools with ease, but with the condition to leave the resultant LP-Tokens on the treasury of the Liquidity Mining contract. The other great feature is to serve as Proxy to assist in swaps:
Contract “to”: To interact with these features, requests must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: RBTCWrapperProxy.

With the former two elements the RBTC Wrapper Proxy contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: this is the list of useful tools provided by the RBTC Wrapper Proxy contract:

 

RBTCWrapperProxy: a wrapper to help the user to

1.- supply/remove liquidity to AMM/Lending pools and store the iTokens/LP-Tokens in the Liquidity-Mining contract.

2.- do swap conversions through the swap network contract

 

Setter: Wrapper function for adding liquidity to an AMM V1 pool, using minReturn criteria to LP-minting 

"0x60dc20cd": "addLiquidityToV1(address,address[],uint256[],uint256)",

Setter: Wrapper function for adding liquidity to an AMM V2 pool, using minReturn criteria to LP-minting 

"0xe90988e8": "addLiquidityToV2(address,address,uint256,uint256)",

Setter: provides funds to a lending pool and deposits the pool tokens into the liquidity mining contract 

"0x2e6bc575": "addToLendingPool(address,uint256)",

Relevant Setter: Calls this Swap Network function 

"0xb37a4831": "convertByPath(address[],uint256,uint256)",

PUBLIC PARAMETER (contract-address): 

"0x7422e1af": "liquidityMiningContract()",

PUBLIC PARAMETER (address): 

"0xd4ee1d90": "newOwner()",

PUBLIC PARAMETER (boolean flag): 

"0x2fe8a6ad": "onlyOwnerCanUpdateRegistry()",

PUBLIC PARAMETER (address): 

"0x8da5cb5b": "owner()",

PUBLIC PARAMETER (contract-address): address of the previous contract-registry

"0x61cd756e": "prevRegistry()",

PUBLIC PARAMETER (contract-address): address of the current contract-registry 

"0x7b103999": "registry()",

Setter: removes funds from liquidity mining contract, burns them on the lending pool and returns lended asset to the user 

"0xc5a58a60": "removeFromLendingPool(address,uint256)",

Setter: Wrapper function for removing liquidity from an AMM V1 pool, 

"0xe94190ed": "removeLiquidityFromV1(address,uint256,address[],uint256[])",

Setter: Wrapper function for removing liquidity from an AMM V1 pool, 

"0x0ec9e443": "removeLiquidityFromV2(address,address,uint256,uint256)",

PUBLIC PARAMETER (contract-address): 

"0x43fe0f0d": "sovrynSwapNetworkAddress()",

PUBLIC PARAMETER (contract-address):

"0x2f6b600d": "wrbtcTokenAddress()"

Back

 

SovrynSwapNetwork and ConversionPathFinder: 

The Sovryn Swap Network contract has 3 main functions: find the best path for a conversion, find the estimated rate for a conversion and execute a conversion involving any chain of the AMMs belonging to the Sovryn AMM Network.
Contract “to”: To interact with these features, requests must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: SovrynSwapNetwork.

With the former two elements the Swap Network contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: this is the list of useful tools provided by the Swap Network contract:

 

SovrynSwapNetwork: The master contract that coordinates our AMM network.

 

Relevant Getter: returns the conversion path between two tokens in the network 

"0xd734fa19": "conversionPath(address,address)",

Relevant  Setter: converts the token to any other token in the sovrynSwap network 

"0xb77d239b": "convertByPath(address[],uint256,uint256,address,address,uint256)",

PUBLIC PARAMETER (Mapping): list of all supported ether tokens 

"0x8077ccf7": "etherTokens(address)",

PUBLIC PARAMETER: 

"0x5d732ff2": "maxAffiliateFee()",

PUBLIC PARAMETER (address): 

"0xd4ee1d90": "newOwner()",

PUBLIC PARAMETER (boolean flag): 

"0x2fe8a6ad": "onlyOwnerCanUpdateRegistry()",

PUBLIC PARAMETER (address): 

"0x8da5cb5b": "owner()",

PUBLIC PARAMETER (contract-address): 

"0x61cd756e": "prevRegistry()",

Relevant Getter: returns the expected target amount of converting a given amount on a given path 

"0x7f9c0ecd": "rateByPath(address[],uint256)",

PUBLIC PARAMETER (contract-address): address of the current contract-registry 

"0x7b103999": "registry()"

Back

 

The Conversion Path Finder helps the Swap Network contract find the optimal path of AMM conversions for a specific conversion. 

Contract “to”: To interact with these features, requests must be addressed to the SovrynProtocol Contract: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: ConversionPathFinder.

With the former two elements the Path Finder contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: this is the list of useful tools provided by the Path Finder contract:

 

ConversionPathFinder

PUBLIC PARAMETER (contract-address): 

"0xe1c4c966": "anchorToken()",

Getter: generates a conversion path between a given pair of tokens in the SovrynSwap Network 

"0xa1c421cd": "findPath(address,address)",

PUBLIC PARAMETER (address): 

"0xd4ee1d90": "newOwner()",

PUBLIC PARAMETER (boolean flag): 

"0x2fe8a6ad": "onlyOwnerCanUpdateRegistry()",

PUBLIC PARAMETER (address): 

"0x8da5cb5b": "owner()",

PUBLIC PARAMETER (contract-address): 

"0x61cd756e": "prevRegistry()",

PUBLIC PARAMETER (contract-address): address of the current contract-registry 

"0x7b103999": "registry()"

Back

 

LiquidityPoolV1Converter and LiquidityPoolV2Converter: 

The Liquidity Pool Converter logics are the contracts that contain all the methods to interact directly with each of our AMM pools, the exception is the “conversion” method, that is only called by the Swap Network contract. V1 pools determine the weights of their reserves of tokens by their own interactions, and independently of any external oracles or price providers.
Contract “to”: To interact with these features, requests must be addressed to one of the following AMM V1 pools: 

Mainnet:

SOV AMM→ Which LP Token is the (WR)BTC/SOV.

ETH AMM→ Which LP Token is the (WR)BTC/ETHs.

MOC AMM→ Which LP Token is the (WR)BTC/MoC.

BNB AMM→ Which LP Token is the (WR)BTC/BNBs.

XUSD AMM→ Which LP Token is the (WR)BTC/XUSD. 

FISH AMM→ Which LP Token is the (WR)BTC/FISH. 

RIF AMM→ Which LP Token is the (WR)BTC/RIF. 

MYNT AMM→ Which LP Token is the (WR)BTC/MYNT. 

Testnet:

SOV AMM→ Which LP Token is the (WR)BTC/SOV.

ETH AMM→ Which LP Token is the (WR)BTC/ETHs.

MOC AMM→ Which LP Token is the (WR)BTC/MoC.

BNB AMM→ Which LP Token is the (WR)BTC/BNBs.

XUSD AMM→ Which LP Token is the (WR)BTC/XUSD. 

FISH AMM→ Which LP Token is the (WR)BTC/FISH. 

RIF AMM→ Which LP Token is the (WR)BTC/RIF. 

MYNT AMM→ Which LP Token is the (WR)BTC/MYNT. 

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) 

it will be needed the ABI of the AMM v1: LiquidityPoolV1Converter 

and the ABI for Smart Tokens: SmartToken.

With the former two elements the AMM Version-1 contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

The LiquidityPoolV1Converter allows us to interact with the most fine granular control level with each of the AMM pools of the network. However, be aware that only the Swap Network contact can perform any desired conversion.

Entry Points: this is the list of useful tools provided by all the AMM Version-1 contracts:

 

CONSTANT 

"0x918f8674": "DENOMINATOR()",

Relevant Setter: increases the pool's liquidity and mints new shares in the pool to the caller 

"0x7d8916bd": "addLiquidity(address[],uint256[],uint256)",

PUBLIC PARAMETER (contract-address): converter anchor contract 

"0xd3fb73b4": "anchor()",

PUBLIC PARAMETER: current conversion fee, represented in ppm, 0...maxConversionFee 

"0x579cd3ca": "conversionFee()",

Getter 

"0xc45d3d92": "conversionWhitelist()",

Getter: returns the converter type 

"0x3e8ff43f": "converterType()",

Getter: calculates the number of decimal digits in a given integer value 

"0x6aa5332c": "decimalLength(uint256)",

Getter: gives the geometrical mean value from a list of integer values 

"0xa60e7724": "geometricMean(uint256[])",

Relevant Getter: gives how much an investor has in the pool in term of invested assets 

"0xf169a021": "getExpectedOutAmount(uint256)",

Relevant Getter: get how many protocol fees are held in the converter 

"0x3341e006": "getProtocolFeeTokensHeld(address)",

Getter: checks whether or not the converter has an rBTC reserve 

"0x12c2aca4": "hasETHReserve()",

Relevant Getter: returns true if the converter is active, false otherwise 

"0x22f3e2d4": "isActive()",

Getter: checks whether or not the converter version is 28 or higher 

"0xd260529c": "isV28OrHigher()",

PUBLIC PARAMETER: maximum conversion fee for the lifetime of the contract 

"0x94c275ad": "maxConversionFee()",

PUBLIC PARAMETER (address): 

"0xd4ee1d90": "newOwner()",

PUBLIC PARAMETER (boolean flag): only an owner can update the contract-registry 

"0x2fe8a6ad": "onlyOwnerCanUpdateRegistry()",

PUBLIC PARAMETER (contract-address): 

"0x7dc0d1d0": "oracle()",

PUBLIC PARAMETER (address): 

"0x8da5cb5b": "owner()",

PUBLIC PARAMETER (contract-address): 

"0x61cd756e": "prevRegistry()",

PUBLIC PARAMETER (mapping): Total conversion fees (reserveTokens[1]) received and not withdrawn. 

"0x064bda02": "protocolFeeTokensHeld(address)",

PUBLIC PARAMETER (contract-address): address of the current contract-registry 

"0x7b103999": "registry()",

Relevant Setter: decreases the pool's liquidity, burns the caller's shares in the pool 

and sends each reserve token balance in return 

"0xb127c0a5": "removeLiquidity(uint256,address[],uint256[])",

Relevant Getter: returns the reserve's balance 

"0xdc8de379": "reserveBalance(address)",

PUBLIC PARAMETER: ratio between the reserves and the market cap, 

equal to the total reserve weights 

"0x0c7d5cd8": "reserveRatio()",

Getter: returns the number of reserve tokens defined 

"0x9b99a8e2": "reserveTokenCount()",

PUBLIC PARAMETER (ERC20 array):  ERC20 standard token addresses 

"0xd031370b": "reserveTokens(uint256)",

Relevant Setter: returns the reserve's weight, 

needed parameter for swap-formula conversion estimations 

"0x1cfab290": "reserveWeight(address)",

PUBLIC PARAMETER (mapping): reserve token addresses -> "Reserve" data struct 

"0xd66bd524": "reserves(address)",

Relevant Getter: calculates the nearest integer to a given quotient 

"0xbbb7e5d8": "roundDiv(uint256,uint256)",

Relevant Getter: returns the expected target amount of converting one reserve to another

along with the fee 

"0xaf94b8d8": "targetAmountAndFee(address,address,uint256)",

PUBLIC PARAMETER:  

"0x9ddc230a": "token0Decimal()",

PUBLIC PARAMETER:  

"0x3266f45c": "token1Decimal()",

CONSTANT 

"0x54fd4d50": "version()",

Back

 

The Smart Token contracts are ERC20 similar, and issue the tokens to liquidity providers in exchange of the assets supplied to the funds of the AMM.

Entry Points: this is the list of useful tools provided by all the Smart Token contracts:

 

PUBLIC PARAMETER (Mapping): The typical allowance mapping of all ERC20 token. 

"0xdd62ed3e": "allowance(address,address)",

Setter: Typical approve method of an ERC20 token 

"0x095ea7b3": "approve(address,uint256)",

Getter: Typical balanceOf method of an ERC20 token 

"0x70a08231": "balanceOf(address)",

Getter: Typical method of an ERC20 token 

"0x313ce567": "decimals()",

Getter: Typical method of an ERC20 token 

"0x06fdde03": "name()",

PUBLIC PARAMETER (address): 

"0xd4ee1d90": "newOwner()",

PUBLIC PARAMETER (address): 

"0x8da5cb5b": "owner()",

Getter: Typical method of an ERC20 token 

"0x95d89b41": "symbol()",

Getter: Typical method of an ERC20 token 

"0x18160ddd": "totalSupply()",

Setter: Typical transfer method of an ERC20 token 

"0xa9059cbb": "transfer(address,uint256)",

Setter: Typical transferFrom method of an ERC20 token 

"0x23b872dd": "transferFrom(address,address,uint256)",

PUBLIC PARAMETER (boolean flag): 

"0xbef97c87": "transfersEnabled()",

CONSTANT PARAMETER: 

"0x54fd4d50": "version()",

NOT PUBLIC FUNCTION 

"0x5e35359e": "withdrawTokens(address,address,uint256)"

Back

 

V2 pools determine the weights of their reserves of tokens by the means of external oracles or price providers.
Contract “to”: To interact with these features, requests must be addressed to one of the following AMM V2 pools: 

Mainnet:

DOC AMM→ Which Primary Reserve LP Token is sUSDrBTC1.

And its Secondary Reserve LP Token is sUSDrBTC2.

USDT AMM→ Which Primary Reserve LP Token is (WR)BTC/USDT1.

And its Secondary Reserve LP Token is (WR)BTC/USDT2.

BPro AMM→ Which Primary Reserve LP Token is (WR)BTC/BPRO1.

And its Secondary Reserve LP Token is  (WR)BTC/BPRO2.

Testnet:

DOC AMM→ Which Primary Reserve LP Token is sUSDrBTC1.

And its Secondary Reserve LP Token is sUSDrBTC2.

USDT AMM→ Which Primary Reserve LP Token is USDTRBTC1.

And its Secondary Reserve LP Token is  USDTRBTC2.

BPro AMM→ Which Primary Reserve LP Token is BProRBTC1.

And its Secondary Reserve LP Token is BProRBTC2.

 

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) 

it will be needed the ABI of the AMM v2: LiquidityPoolV2Converter 

and the ABI for Smart Tokens: SmartToken.

With the former two elements the AMM Version-2 contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

The LiquidityPoolV2Converter allows us to interact with the most fine granular control level with each of the AMM pools of the network. However, be aware that only the Swap Network contact can perform any desired conversion.

Entry Points: this is the list of useful tools provided by all the AMM Version-2 contracts:

 

Relevant Setter: increases the pool's liquidity and mints new shares to the caller sending a specific LP-asset for a specific liquid asset 

"0x55776b77": "addLiquidity(address,uint256,uint256)",

Getter: returns the liquidity amplification factor in the pool 

"0xd64c5a1a": "amplificationFactor()",

PUBLIC PARAMETER (contract-address): converter anchor contract 

"0xd3fb73b4": "anchor()",

PUBLIC PARAMETER: current conversion fee, represented in ppm, 0...maxConversionFee 

"0x579cd3ca": "conversionFee()",

Getter: 

"0xc45d3d92": "conversionWhitelist()",

Getter: returns the converter type 

"0x3e8ff43f": "converterType()",

PUBLIC PARAMETER: initial dynamic fee factor is 7%, represented in ppm 

"0xe8104af9": "dynamicFeeFactor()",

Relevant Getter: returns the effective reserve tokens weights 

"0xec2240f5": "effectiveReserveWeights()",

Relevant Getter: returns the effective rate of 1 primary token in secondary tokens in two integers: the numerator and denominator 

"0xdb2830a4": "effectiveTokensRate()",

Relevant Getter: get how many protocol fees are held in the converter 

"0x3341e006": "getProtocolFeeTokensHeld(address)",

Getter: checks whether or not the converter has an rBTC reserve 

"0x12c2aca4": "hasETHReserve()",

Relevant Getter: returns true if the converter is active, false otherwise 

"0x22f3e2d4": "isActive()",

Getter: checks whether or not the converter version is 28 or higher 

"0xd260529c": "isV28OrHigher()",

PUBLIC PARAMETER: last conversion rate of 1 primary token in secondary tokens 

"0xf9cddde2": "lastConversionRate()",

Relevant Getter: returns the maximum number of tokens in the given pool that can currently be liquidated 

"0x2bf0c985": "liquidationLimit(address)",

PUBLIC PARAMETER: maximum conversion fee for the lifetime of the contract 

"0x94c275ad": "maxConversionFee()",

PUBLIC PARAMETER (boolean flag): once disabled it cannot be re-enabled, for pilot process 

"0x0a55fb3d": "maxStakedBalanceEnabled()",

PUBLIC PARAMETER (mapping): used by the temp liquidity limit mechanism during the pilot 

"0x98a71dcb": "maxStakedBalances(address)",

PUBLIC PARAMETER (address): 

"0xd4ee1d90": "newOwner()",

PUBLIC PARAMETER (boolean flag): only an owner can update the contract-registry 

"0x2fe8a6ad": "onlyOwnerCanUpdateRegistry()",

PUBLIC PARAMETER (address): 

"0x8da5cb5b": "owner()",

Relevant Getter: returns the pool token address by the reserve token address 

"0x5768adcf": "poolToken(address)",

PUBLIC PARAMETER (contract-address): address of the previous contract-registry 

"0x61cd756e": "prevRegistry()",

PUBLIC PARAMETER (contract-address): external price oracle 

"0x2630c12f": "priceOracle()",

PUBLIC PARAMETER (contract-address): 

"0x0337e3fb": "primaryReserveToken()",

PUBLIC PARAMETER (mapping):  Total conversion fees (reserveTokens[1]) received and not withdrawn. 

"0x064bda02": "protocolFeeTokensHeld(address)",

PUBLIC PARAMETER (data struct): reference rate from the previous block(s) of 1 primary token in secondary tokens 

"0xa32bff44": "referenceRate()",

PUBLIC PARAMETER: last time when the reference rate was updated (in seconds) 

"0xc3321fb0": "referenceRateUpdateTime()",

PUBLIC PARAMETER (contract-address): address of the current contract-registry 

"0x7b103999": "registry()",

Relevant Setter: decreases the pool's liquidity and burns the caller's shares in the pool in exchange for the liquid asset 

"0xe38192e3": "removeLiquidity(address,uint256,uint256)",

Relevant Getter: calculates the amount of reserve tokens entitled for a given amount of pool tokens - a fee is applied according to the equilibrium level of the primary reserve token 

"0x69067d95": "removeLiquidityReturnAndFee(address,uint256)",

Getter: returns the amplified balance of a given reserve token 

"0x2bd3c107": "reserveAmplifiedBalance(address)",

Relevant Getter: returns the reserve's balance for a given reserve token 

"0xdc8de379": "reserveBalance(address)",

PUBLIC PARAMETER: ratio between the reserves and the market cap, equal to the total reserve weights 

"0x0c7d5cd8": "reserveRatio()",

Relevant Getter: returns the staked balance of a given reserve token 

"0x005e319c": "reserveStakedBalance(address)",

Getter: returns the number of reserve tokens defined 

"0x9b99a8e2": "reserveTokenCount()",

PUBLIC PARAMETER (ERC20 array): ERC20 standard token addresses 

"0xd031370b": "reserveTokens(uint256)",

Relevant Getter: returns the reserve's token weight 

"0x1cfab290": "reserveWeight(address)",

PUBLIC PARAMETER (mapping): reserve token addresses -> "Reserve" data struct 

"0xd66bd524": "reserves(address)",

PUBLIC PARAMETER (contract-address): 

"0xdc75eb9a": "secondaryReserveToken()",

Relevant Getter: returns the expected target amount of converting one reserve to another along with the fee 

"0xaf94b8d8": "targetAmountAndFee(address,address,uint256)",

CONSTANT: 

"0x54fd4d50": "version()",

Back

 

Oracle for AMM V1 and Price Oracle: 

In order to enable the use of borrowing and margin, the AMM protocol will be asked to provide some source of prices. But in the case of LiquidityPools v2, the need of oracles is fundamental for the operation of the very pool AMM. In the case of AMM v1, the Oracle contract provides to the protocol layer a price feed for its operations, while the PriceOracle contract is more related to the AMM v2 operation.
Contract “to”: To interact with these features for AMM v1 Oracles, requests must be addressed to one of the following contracts: 

Mainnet:

For AMM SOV see this Oracle.

For AMM MOC see this Oracle.

For AMM ETH see this Oracle.

For AMM BNB see this Oracle.

For AMM FISH see this Oracle.

For AMM MYNT see this Oracle.

For AMM XUSD see this Oracle.

For AMM RIF see this Oracle.

Testnet:

For AMM SOV see this Oracle.

For AMM MOC see this Oracle.

For AMM ETH see this Oracle.

For AMM BNB see this Oracle.

For AMM FISH see this Oracle.

For AMM MYNT see this Oracle.

For AMM XUSD see this Oracle.

For AMM RIF see this Oracle.

 

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the ABI shown in this contract: Oracle.

With the former two elements the Oracle contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

The oracles for these AMM types are feeded from the inner activity of the converter, i.e.: These oracles derive ther data from their AMM v1 converters. These Oracles let any user build many applications like alert bots to notify about unhealthy positions.

Entry Points: this is the list of useful tools provided by the Oracle contract:

 

PUBLIC PARAMETER:  

"0x57e871e7": "blockNumber()",

PUBLIC PARAMETER (contract-address):  

"0xf7d76ae5": "btcAddress()",

PUBLIC PARAMETER:  

"0xa0631a60": "ema0()",

PUBLIC PARAMETER:  

"0x9ad61d99": "ema1()",

PUBLIC PARAMETER:  

"0xb4f40c61": "k()",

PUBLIC PARAMETER:  

"0x2e31b5a3": "lastCumulativePrice0()",

PUBLIC PARAMETER:  

"0x4bbc224f": "lastCumulativePrice1()",

Relevant Getter: returns the EMA price of a reserve in base currency 

(assuming one of the reserves is always BTC) 

"0x50d25bcd": "latestAnswer()",

Relevant Getter: returns the other token EMA price in base currency 

"0x53084eff": "latestPrice(address)",

PUBLIC PARAMETER (contract-address):  

"0x665a11ca": "liquidityPool()",

PUBLIC PARAMETER (address):  

"0xd4ee1d90": "newOwner()",

PUBLIC PARAMETER (address):  

"0x8da5cb5b": "owner()",

Relevant Getter: returns the latest whole set of observations recorded 

"0x57de26a4": "read()",

PUBLIC PARAMETER:  

"0xb80777ea": "timestamp()",

Back

 

“PriceOracle”: the oracle contract related to the AMM v2 operation.
Contract “to”: To interact with these features for AMM v2 Oracles, requests must be addressed to one of the following contracts: 

Mainnet:

For AMM DOC see this PriceOracle.

For AMM USDT see this PriceOracle.

For AMM BPro see this PriceOracle.

Testnet:

For AMM DOC see this PriceOracle.

For AMM USDT see this PriceOracle.

For AMM BPro see this PriceOracle.

 

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the ABI for this contract: PriceOracle.

With the former two elements the PriceOracle contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

The oracles for these AMM types are feeded from external price providers. These Oracles let any user build many applications like alert bots to notify about unhealthy positions.

Entry Points: this is the list of useful tools provided by the PriceOraclecontract:

 

Relevant Getter: returns the timestamp of the last price update 

"0xc8f33c91": "lastUpdateTime()",

Relevant Getter: returns the latest known rate between the two given tokens 

(rate of A / B; he rate is returned as numerator & denominator) 

"0xae818004": "latestRate(address,address)",

Relevant Getter: returns both the rate and the timestamp of the last update 

"0xb1772d7a": "latestRateAndUpdateTime(address,address)",

PUBLIC PARAMETER (contract-address): token A the oracle supports 

"0x0fc63d10": "tokenA()",

PUBLIC PARAMETER (contract-address): token A chainlink price oracle 

"0xb9e1715b": "tokenAOracle()",

PUBLIC PARAMETER (contract-address): token B the oracle supports 

"0x5f64b55b": "tokenB()",

PUBLIC PARAMETER (contract-address): token B chainlink price oracle 

"0xf997fda7": "tokenBOracle()",

PUBLIC PARAMETER (mapping): token -> token-decimals 

"0x8ee573ac": "tokenDecimals(address)",

PUBLIC PARAMETER (mapping): token -> price-oracle for easier access 

"0xcbd962d1": "tokensToOracles(address)"

Back

 

ConverterRegistry and ConverterUpgrader: 

The Converter Registry contract is the starting point for querying the converter network and for creating new AMMs for the Sovryn network. In this jargon “anchors” are often related to the Smart Token contract, but also can be related to the reference asset which in our case is the WRBTC token.
In the creation of a new AMM, the ConverterRegistry.newConverter method calls the Converter Factory contract, which in turns creates the new AMM and the new Smart Token for that AMM (the “Liquidity Pool”). Then the Converter Factory points to the needed Factory contract. A ConverterFactory for a specific version of an AMM, an AnchorFactory to create the needed Smart Token, and if instructed, it calls the appropriate Custom Factory to link the new AMM to the proper Price Oracle.

Once created the new AMM, the Converter Factory contract subscribes it to the list of the Converter Registry contract. 

Now, Contract Registry in turn is the one that whitelists the new contracts related to a new AMM, which can only be done by an administrator (in our case, it is the Exchequer Multi Signature contract). Without this whitelisting, this new AMM won’t be recognized by any of the contracts of the Sovryn Swap Network.

So, in a gist: anyone can create a new AMM and its anchor(s), but only a Sovryn admin will be able to whitelist it. Also, anyone can associate an oracle to the new AMM, but only the admin will be able to whitelist this oracle to be recognized by the network.

Contract “to”: To interact with the features of the Converter Registry, requests must be addressed to: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: ConverterRegistry.

With the former two elements the Converter Registry contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: this is the list of useful tools provided by the Converter Registry contract:

 

Getter: returns the list of converter anchors associated with a given convertible token 

"0x11839064": "getConvertibleTokenAnchors(address)",

Getter: returns the converter anchor at a given converter registry's smart token index 

"0x4c7df18f": "getAnchor(uint256)",

Getter: returns the number of converter anchors in the converter registry data  

"0xd3182bed": "getAnchorCount()",

Relevant Getter: returns the list of Smart Tokens in the converter registry data 

"0xeffb3c6e": "getAnchors()",

Getter: returns a list of converters anchors for a given list of anchors 

"0x610c0b05": "getConvertersByAnchors(address[])",

Getter: returns the convertible token at a given given converter registry's smart token index 

"0x865cf194": "getConvertibleToken(uint256)",

Getter: returns the converter anchor associated with a given convertible token at a given converter registry's smart token index 

"0x603f51e4": "getConvertibleTokenAnchor(address,uint256)",

Getter: returns the number of converter anchors associated with a given convertible token 

"0x49c5f32b": "getConvertibleTokenAnchorCount(address)",

Getter: returns the number of convertible tokens in the registry 

"0x69be4784": "getConvertibleTokenCount()",

Getter: returns the list of convertible tokens in the registry 

"0x5f1b50fe": "getConvertibleTokens()",

Getter: returns the liquidity pool at a given converter registry data index 

"0xa74498aa": "getLiquidityPool(uint256)",

Getter: searches for a liquidity pool with specific configuration 

"0x1d3fccd5": "getLiquidityPoolByConfig(uint16,address[],uint32[])",

Relevant Getter: returns the number of liquidity pools in the converter registry data 

"0x7a5f0ffd": "getLiquidityPoolCount()",

Relevant Getter: returns the list of liquidity pools in the converter registry data 

"0x7f45c4c3": "getLiquidityPools()",

Getter: checks whether or not a given address is a Smart Token 

"0xd8cced2a": "isAnchor(address)",

Relevant Getter: checks whether or not a given converter is valid 

"0x954254f5": "isConverterValid(address)",

Getter: checks whether or not a given address is a convertible token 

"0x3ab8857c": "isConvertibleToken(address)",

Getter: checks whether or not a given address is a Smart Token of a given convertible token 

"0xb4c4197a": "isConvertibleTokenAnchor(address,address)",

Getter: checks whether or not a given address is a liquidity pool 

"0xe85455d7": "isLiquidityPool(address)",

Relevant Getter: checks if a liquidity pool with given configuration is already registered 

"0x8f1d0e1a": "isSimilarLiquidityPoolRegistered(address)",

Relevant Setter: creates a zero supply liquid token / empty liquidity pool and adds its converter to the registry 

"0x5a0a6618": "newConverter(uint16,string,string,uint8,uint32,address[],uint32[])",

PUBLIC PARAMETER (address): 

"0xd4ee1d90": "newOwner()",

PUBLIC PARAMETER (boolean flag): 

"0x2fe8a6ad": "onlyOwnerCanUpdateRegistry()",

PUBLIC PARAMETER (address): 

"0x8da5cb5b": "owner()",

PUBLIC PARAMETER (contract-address): 

"0x61cd756e": "prevRegistry()",

PUBLIC PARAMETER (contract-address): 

"0x7b103999": "registry()",

Relevant Setter: completes the configuration for an already created converter 

"0x295d2a21": "setupConverter(uint16,address[],uint32[],address)",

Back

 

Finally, the Converter Upgrader contract contains all the logistics to migrate from an AMM version to another. 

The master-brain method of this contract is ConverterUpgrader.upgradeOld. The Converter Upgrade will call to Converter Factory and it will create the new converter to which migrate all the funds and logics, but this new converter will be created according to the specifications stored in its mappings of converter creators for factory, anchor and custom (oracle).

But all these new configurations can only be set by the admin of the Converter Factory contract.

Contract “to”: To interact with the Converter Upgrader, requests must be addressed to: 

Mainnet.

Testnet.

ABI for web3: To interact with these contracts via web3 (or ethers, and so on) it will be needed the following ABI: ConverterUpgrader.

With the former two elements the Converter Upgrader contract can be reached via web3.js by means of       web3.eth.Contract(ABI, contractAddress);

Entry Points: this is the list of useful tools provided by the Converter Upgrader contract:

 

PUBLIC PARAMETER (contract-address): 

"0xb8066bcb": "etherToken()",

PUBLIC PARAMETER (address): 

"0xd4ee1d90": "newOwner()",

PUBLIC PARAMETER (boolean flag): 

"0x2fe8a6ad": "onlyOwnerCanUpdateRegistry()",

PUBLIC PARAMETER (address): 

"0x8da5cb5b": "owner()",

PUBLIC PARAMETER (contract-address): 

"0x61cd756e": "prevRegistry()",

PUBLIC PARAMETER (contract-address): 

"0x7b103999": "registry()",

Setter: upgrades an old converter to the latest version 

"0xbc444e13": "upgrade(bytes32)",

Setter: upgrades an old converter to the latest version 

"0x90f58c96": "upgrade(uint16)",

Relevant Setter: will throw if ownership wasn't transferred to the upgrader before calling this function 

"0xf2cfed87": "upgradeOld(address,bytes32)"

Back

Important: How to generate ABI files from our Git Repo
Sometimes we will need an updated ABI file, due to a recern update of our code in our repo. In such cases, howcan we generate our own ABI file set?

In this section we explain step by step how to do that.

1.- Cloning the Right Branch: 
Usually the most updated branch is development. However, the most stable is the master branch. The difference is that the master branch include the last deployments on mainnet, while development include code that maystill be under testing.

To clone a Git repo it is conveninentto have installed Git.

In your console you simply type:

$ git clone -b master https://github.com/DistributedCollective/oracle-based-amm
$ cd oracle-based-amm
2.- Installing Dependencies:
You will need installed node.js and npm. Then, simply type:

$  npm install
And wait for all the installations

3.- Compiling Contracts:
Due to the adition of the RBTCWrapperProxy contract, the AMM repo has two folders containing contracts:

The main contracts folder named: \oracle-based-amm\solidity
The new folder that includes the RBTCWrapperProxy contract: \oracle-based-amm\rbtcwrapperproxy
Solidity Folder Compilation: In spite that the  sollidity folder contains a "build" folder (\oracle-based-amm\solidity\build) with a precompilation data of the contracts held by that folder, we can verify all of this generating our own ABI files.

To do so we just need to switch inside the solidity folder and compile using truffle:

$ cd solidity
$ truffle compile
And wait that the compilation is done.  After that you will find all the new generated ABI files in the folder \oracle-based-amm\solidity\build\contracts

rbtcwrapperproxy Folder Compilation: This folder also contains another folder (\oracle-based-amm\rbtcwrapperproxy\build) with a precompilation data of the contracts, but just for those held by the solidity folder; so we will need to generate our own set of ABI files.

But before we proceed we need to create a file named private-key, inside that very folder (rbtcwrapperproxy) and put inside this file a valid private key in hexadecimal format (don't worry it can just be a random private key, instead of any that you've being using, like e.g.: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef  ← without the “0x”).

To do so we just need to switch inside the rbtcwrapperproxy folder and create the private-key file:

$ cd ..
$ cd rbtcwrapperproxy
$ touch private-key
Now, edit this private-key file and put the hex number of your choie. E.g.:

$ notepad private-key
Now you can run the truffle compiler:

$ truffle compile
And wait that the compilation is done.  After that you will find all the new generated ABI files in the folder \oracle-based-amm\rbtcwrapperproxy\build\contracts, which now will include the RBTCWrapperProxy.json file.

 

Back

Backend
UI Map
FastBTC
Bridges(?)
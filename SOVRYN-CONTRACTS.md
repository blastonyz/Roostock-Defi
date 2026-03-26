# Sovryn Protocol - Contratos Activos y ABIs

Documentación enfocada en contratos activos en **Rootstock Testnet** sin deprecadas (USDT). Selectors y métodos para integración vía web3.

---

## 🏦 LoanToken Contracts (iTokens)

Contratos para **lending** (prestar), **borrowing** (tomar prestado), y **trading** (margin trades).

### Testnet - iTokens Activos

| Asset | iToken Address | ABI | Uso |
|-------|---|---|---|
| **DoC** | iDOC | `LoanTokenLogicLM` | Préstamos en DoC |
| **XUSD** | iXUSD | `LoanTokenLogicLM` | Préstamos en XUSD |
| **BPro** | iBPro | `LoanTokenLogicLM` | Short positions en BPro |
| **RBTC/WRBTC** | iRBTC | `LoanTokenLogicWrbtc` | Short positions en BTC |

---

## 💡 Core Methods por Caso de Uso

### 1. **Lending** (Prestar activos al protocolo)

**Contrato destino:** iToken respectivo (ej: iDOC, iXUSD)

#### Para RBTC:
```
Method: mintWithBTC(address,bool)
Selector: 0xfb5f83df
Params:
  - address: receptor del iToken
  - bool: useLM (si va a Liquidity Mining)
```

#### Para otros assets (DoC, XUSD, BPro):
```
Method: mint(address,uint256,bool)
Selector: 0xd1a1beb4
Params:
  - address: receptor del iToken
  - uint256: cantidad a depositar
  - bool: useLM (si va a Liquidity Mining)
```

---

### 2. **Withdrawing** (Sacar activos del protocolo)

**Contrato destino:** iToken respectivo

#### Para RBTC:
```
Method: burnToBTC(address,uint256,bool)
Selector: 0x0506af04
Params:
  - address: receptor del output RBTC
  - uint256: cantidad de iTokens a quemar
  - bool: useLM (si los iTokens estaban en Liquidity Mining)
```

#### Para otros assets:
```
Method: burn(address,uint256,bool)
Selector: 0x76fd4fdf
Params:
  - address: receptor del output asset
  - uint256: cantidad de iTokens a quemar
  - bool: useLM (si estaban en Liquidity Mining)
```

---

### 3. **Margin Trading** (Compra/venta apalancada)

**Contrato destino:** iToken correspondiente al asset **prestado**

#### Simple Margin Trade:
```
Method: marginTrade(bytes32,uint256,uint256,uint256,address,address,uint256,bytes)
Selector: 0x28a02f19
Params:
  - bytes32 loanId: bytes32(0) si es nueva posición
  - uint256 leverageAmount: leverage-1 (ej: 1 para 2x, 2 para 3x, 4 para 5x)
  - uint256 loanTokenSent: cantidad del token a prestar
  - uint256 collateralTokenSent: cantidad de colateral
  - address collateralTokenAddress: token del colateral
  - address tradeTokenAddress: token a comprar
  - uint256 minReturn: min output esperado (usar 0 o getEstimatedMarginDetails)
  - bytes: data vacío [] típicamente
```

#### Margin Trade con Affiliate:
```
Method: marginTradeAffiliate(bytes32,uint256,uint256,uint256,address,address,uint256,address,bytes)
Selector: 0xf6b69f99
(igual que marginTrade + address affiliateReferrer)
```

---

### 4. **Borrowing** (Tomar activos prestados)

**Contrato destino:** iToken correspondiente al asset a **prestar** (Torque Loans)

```
Method: borrow(bytes32,uint256,uint256,uint256,address,address,address,bytes)
Selector: 0x2ea295fa
Params:
  - bytes32 loanId: bytes32(0) si es nueva posición
  - uint256 borrowAmount: cantidad a tomar prestada
  - uint256 initialLoanDuration: duración (default 28 días, en segundos)
  - uint256 collateralTokenSent: cantidad de colateral
  - address collateralTokenAddress: token del colateral
  - address borrower: address que toma prestado
  - address receiver: address que recibe los tokens
  - bytes: data vacío [] típicamente
```

---

## 📊 Getter Methods (iToken Contracts)

Todos en **LoanTokenLogicStandard** ABI:

```
balanceOf(address)                              → 0x70a08231: saldo de iTokens
assetBalanceOf(address)                         → 0x06b3efd6: balance en asset subyacente
borrowInterestRate()                            → 0x8325a1c0: tasa actual de préstamo
supplyInterestRate()                            → 0x09ec6b6b: tasa actual de depósito (lender)
avgBorrowInterestRate()                         → 0x44a4a003: promedio de tasa de préstamo
tokenPrice()                                    → 0x7ff9b596: precio del iToken en asset subyacente
totalAssetBorrow()                              → 0x20f6d07c: total en deuda
totalAssetSupply()                              → 0x8fb807c5: total supply del asset
marketLiquidity()                               → 0x612ef80b: liquidez = supply - borrow

getEstimatedMarginDetails(uint256,uint256,uint256,address)
  → 0x6b40cd40: predicción de margin trade ANTES de ejecutar
  Params: leverageAmount, loanTokenSent, collateralTokenSent, collateralTokenAddress
  Returns: (posibleSize, minReturn, collateralNeeded)

getDepositAmountForBorrow(uint256,uint256,address)
  → 0x631a3ef8: calcula colateral requerido para un borrow
  
getBorrowAmountForDeposit(uint256,uint256,address)
  → 0x04797930: calcula max borrow posible con un depósito
  
decimals()                                      → 0x313ce567: decimales del iToken
name()                                          → 0x06fdde03: nombre
symbol()                                        → 0x95d89b41: símbolo
```

---

## 🔧 SovrynProtocol Contract (Gestión de Posiciones)

**Dirección (Testnet):** Referencia en SOVRYN.md

**ABI:** `ISovryn` o `LoanMaintenance` según método

### Position Management

#### Depositar más colateral:
```
Method: depositCollateral(bytes32,uint256)
Selector: 0xdea9b464
Params:
  - bytes32 loanId: ID de la posición existente
  - uint256 amount: cantidad a depositar adicional
```

#### Retirar colateral (si overcollateralized):
```
Method: withdrawCollateral(bytes32,address,uint256)
Selector: 0xdb35400d
Params:
  - bytes32 loanId: ID de la posición
  - address receiver: dirección que recibe
  - uint256 amount: cantidad a retirar
```

#### Extender duración del préstamo:
```
Method: extendLoanDuration(bytes32,uint256,bool,bytes)
Selector: 0xcfc85c06
Params:
  - bytes32 loanId: ID de la posición
  - uint256 depositAmount: depósito adicional (puede ser 0)
  - bool useCollateral: si se usa colateral para pagar el interés
  - bytes: data vacío
```

#### Reducir duración (cerrar part):
```
Method: reduceLoanDuration(bytes32,address,uint256)
Selector: 0x122f0e3a
Params:
  - bytes32 loanId
  - address receiver: recibe los fondos liberados
  - uint256 amount: cantidad a sacar
```

---

### Closing Positions

#### Close with Swap (Margin trades):
```
Method: closeWithSwap(bytes32,address,uint256,bool,bytes)
Selector: 0xf8de21d2
Params:
  - bytes32 loanId
  - address receiver
  - uint256 swapAmount: cantidad a vender
  - bool returnTokenIsCollateral: si se devuelve el colateral
  - bytes: swap data (típicamente vacío)
```

#### Close with Deposit (Torque/Borrowing):
```
Method: closeWithDeposit(bytes32,address,uint256)
Selector: 0x366f513b
Params:
  - bytes32 loanId
  - address receiver
  - uint256 amount: cantidad a pagar para cerrar
```

#### Rollover (Renovar posición):
```
Method: rollover(bytes32,bytes)
Selector: 0xcf0eda84
Params:
  - bytes32 loanId
  - bytes: referrer data o vacío
```

#### Liquidation (Por tercero):
```
Method: liquidate(bytes32,address,uint256)
Selector: 0xe4f3e739
Params:
  - bytes32 loanId: posición a liquidar
  - address receiver: recibe colateral
  - uint256 amount: cantidad a comprar en swap de liquidación
```

---

### Query Position Data

```
getLoan(bytes32)                                → 0x8932f5f7: datos completos del préstamo
getLoanInterestData(bytes32)                    → 0x9b16cd87: intereses actual
getUserLoans(address,uint256,uint256,uint256,bool,bool)
  → 0x02a3fe64: lista de préstamos del usuario
  Params: user, start, count, loanType(0=all,1=margin,2=torque), isLender, unsafeOnly
  
getRequiredCollateral(address,address,uint256,uint256,bool)
  → 0x25decac0: colateral requerido para un préstamo
  
getTotalPrincipal(address,address)              → 0x4a1e88fe: principal total
```

---

## 🔐 Key Data Structures

### Loan Object (from `getLoan(loanId)`)
```solidity
{
  id: bytes32,                    // loanId unique
  loanParamsId: bytes32,          // parámetros del préstamo
  active: bool,                   // si está activo
  lender: address,                // quien prestó
  borrower: address,              // quien pidió
  collateralToken: address,       // token del colateral
  collateralAmount: uint256,      // cantidad de colateral
  principalAmount: uint256,       // cantidad prestada
  interestOwedPerDay: uint256,    // interés diario
  interestDepositRemaining: uint256, // interés aún disponible
  startTime: uint256,             // timestamp de inicio
  endTime: uint256,               // timestamp de vencimiento
  closePrice: uint256             // precio de cierre (0 si abierto)
}
```

---

## 📋 Helper Methods: Fee & Trading Info

```
getSwapExpectedReturn(address tokenFrom, address tokenTo, uint256 amount)
  → 0x69455ddc: retorna expected output del swap

getSpecialRebates(address source, address destination)
  → 0x59d0d9ec: rebate % para cierto par de tokens

getLenderInterestData(address iToken, address loanToken)
  → 0xd1979fb0: datos agreg. de interés para una pool

checkPriceDivergence(address tokenA, address tokenB, uint256 minReturn, uint256 maxReturn)
  → 0xb17da56e: valida slippage basado en oracle

getEstimatedMarginExposure(address collateralToken, address loanToken, uint256 leverageAmount,
                           uint256 loanTokenSent, uint256 collateralTokenSent, uint256 collateralTokenPrice)
  → 0xd67f7077: net exposure del trade (netcolateral)
```

---

## ⚠️ Important Constants

- **MAX_DURATION:** max loan duration allowed
- **MAX_VOTING_WEIGHT:** max voting power
- **WEIGHT_FACTOR:** voting weight calculation multiplier
- **MIN_INITIAL_MARGIN:** minimum collateral ratio for margin trades
- **Affiliate Fee Percent:** % that affiliates earn
- **Lending/Borrowing/Trading Fee Percent:** fees charged by protocol

---

## 🔗 Contract Addresses (Testnet)

- **SovrynProtocol:** [Testnet Link in SOVRYN.md]
- **iDOC, iXUSD, iBPro, iRBTC:** [Individual iToken addresses in SOVRYN.md]

---

## ✅ Next Steps

1. Crear script para queries de posiciones abiertas (getUserLoans)
2. Implementar helpers para calcular margin details pre-trade
3. Integrar con UserOps para atomic position changes
4. Test de margin trade flow en testnet

# 🏗️ Rootstock DeFi — Account Abstraction + Sovryn Margin Trading

[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3-f0d975?logo=hardhat)](https://hardhat.org/)
[![ERC-4337](https://img.shields.io/badge/ERC--4337-Account%20Abstraction-blue)](https://eips.ethereum.org/EIPS/eip-4337)
[![Rootstock](https://img.shields.io/badge/Rootstock-Testnet%20%7C%20Mainnet-orange)](https://rootstock.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Contratos inteligentes y scripts para **Account Abstraction (ERC-4337)** y **margin trading DeFi** sobre [Rootstock](https://rootstock.io/), la sidechain de Bitcoin con compatibilidad EVM.

---

## 🎯 Objetivo

Construir y probar dApps con **Account Abstraction en Rootstock**, priorizando:

- ✅ UX tipo web2 (onboarding simple, gasless transactions)
- ✅ Transacciones patrocinadas vía Paymaster
- ✅ Compatibilidad EVM + estándar ERC-4337
- ✅ Integración con el protocolo **Sovryn** para margin trading

---

## 📦 Stack Tecnológico

| Capa | Herramienta |
|------|------------|
| Smart Contracts | Solidity 0.8.28 |
| Framework | Hardhat 3 + viem |
| AA Standard | ERC-4337 (EntryPoint v0.7) |
| AA Contracts | `@account-abstraction/contracts` v0.7 |
| Utilities | OpenZeppelin Contracts v5 |
| DeFi Protocol | Sovryn (iTokens, Margin Trading) |
| Lenguaje scripts | TypeScript ~5.8 |
| Redes | Rootstock Testnet (chainId 31) / Mainnet (chainId 30) |

---

## 📁 Estructura del Proyecto

```
├── AGENTS.md                    # Playbook: reglas y convenciones AA
├── SOVRYN.md                    # Documentación completa Sovryn
├── SOVRYN-CONTRACTS.md          # ABIs, selectors y métodos Sovryn
└── hardhat/
    ├── contracts/
    │   ├── Account.sol          # Smart Account (IAccount ERC-4337)
    │   ├── AccountFactory.sol   # Factory con CREATE2 determinístico
    │   ├── Paymaster.sol        # Paymaster para sponsored txs
    │   ├── SovrynMarginTrader.sol # Margin trading contra Sovryn
    │   ├── Counter.sol          # Contrato de prueba
    │   └── Counter.t.sol        # Test Foundry
    ├── scripts/
    │   ├── aa-flow.ts           # Deploy + flujo AA end-to-end
    │   ├── send-op-tx.ts        # Envío de UserOperations
    │   └── test-sovryn.ts       # Test de integración Sovryn
    ├── test/
    │   └── Counter.ts           # Test Hardhat
    ├── hardhat.config.ts        # Config: redes, Solidity, plugins
    ├── package.json
    ├── deploys.txt              # Log del último deploy
    └── .env.example             # Variables de entorno (plantilla)
```

---

## 🚀 Quick Start

### Prerrequisitos

- Node.js ≥ 18
- npm o yarn
- tRBTC de [Rootstock Faucet](https://faucet.rootstock.io/)

### 1. Clonar e instalar

```bash
git clone https://github.com/blastonyz/Roostock-Defi.git
cd Roostock-Defi/hardhat
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y configura al menos:

```env
RSK_PRIVATE_KEY=tu_clave_privada_sin_0x
RSK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co
ENTRY_POINT_ADDRESS=0x48e60BBb664aEfAc9f14aDB42e5FB5b4a119EB66
```

### 3. Compilar contratos

```bash
npm run compile
```

### 4. Ejecutar flujo AA en Rootstock Testnet

```bash
npm run aa:flow:testnet
```

Este script realiza:
1. 🔍 Consulta al bundler por EntryPoints soportados
2. 🏭 Despliega `AccountFactory` y `Paymaster`
3. 📱 Crea una Smart Account determinística (CREATE2)
4. 💰 Intenta fondear la smart account (SELF-PAY)
5. ⛽ Deposita en el Paymaster para transacciones gasless (SPONSORED)

---

## 🔗 Contratos Desplegados (Rootstock Testnet)

| Contrato | Dirección |
|----------|-----------|
| **EntryPoint** (Etherspot) | `0x48e60BBb664aEfAc9f14aDB42e5FB5b4a119EB66` |
| **AccountFactory** | `0xbfcb48c54cbf62488bbef4c53137c8d6659deb35` |
| **Paymaster** | `0xd8ed7139feef8775c8a6c9974da8bb8df22868c1` |
| **Smart Account** | `0x9826CC914c0f400cDa62f670284287e0C6F275b3` |

> 📝 Tx de creación de la Smart Account: [`0x1e2cda17...572002`](https://explorer.testnet.rootstock.io/tx/0x1e2cda1731f55a33967896d4cf205b4a85767c182941a9ab450c22515e572002)

---

## 📄 Smart Contracts

### `Account.sol`
Smart Account compatible con ERC-4337. Valida firmas ECDSA del owner, ejecuta calls arbitrarias vía EntryPoint y paga gas al EntryPoint automáticamente.

### `AccountFactory.sol`
Factory que despliega Smart Accounts con CREATE2 para obtener direcciones determinísticas. Permite calcular la dirección antes del deploy mediante `getAddress()`.

### `Paymaster.sol`
Paymaster que patrocina el gas de UserOperations. El owner deposita fondos en el EntryPoint y el contrato valida/aprueba operaciones automáticamente (Ownable).

### `SovrynMarginTrader.sol`
Contrato para abrir posiciones de margin trading en el protocolo Sovryn:
- `openMarginTradeDoC()` — Apalancamiento usando DoC como loan token
- `openMarginTradeWRBTC()` — Apalancamiento usando WRBTC como loan token
- Consulta estimaciones pre-trade con tolerancia de 5% de slippage
- Tracking de posiciones por usuario

### `Counter.sol` / `Counter.t.sol`
Contrato de prueba básico con test en Foundry (`.t.sol`) y en Hardhat (`test/Counter.ts`).

---

## 🌐 Redes Configuradas

| Red | ChainId | RPC pública |
|-----|---------|-------------|
| Rootstock Mainnet | 30 | `https://public-node.rsk.co` |
| Rootstock Testnet | 31 | `https://public-node.testnet.rsk.co` |
| Sepolia | 11155111 | `https://rpc.sepolia.org` |

---

## 📚 Documentación Adicional

| Archivo | Descripción |
|---------|-------------|
| [`AGENTS.md`](./AGENTS.md) | Playbook y convenciones para Account Abstraction en Rootstock |
| [`SOVRYN.md`](./SOVRYN.md) | Documentación completa del protocolo Sovryn |
| [`SOVRYN-CONTRACTS.md`](./SOVRYN-CONTRACTS.md) | ABIs, function selectors y métodos de contratos Sovryn |

---

## ⚠️ Notas Importantes

- **Nunca commitear claves privadas.** Usar `.env` (incluido en `.gitignore`).
- Para desarrollo, usar **Testnet (chainId 31)** por defecto.
- Obtener tRBTC gratuitos en: [https://faucet.rootstock.io/](https://faucet.rootstock.io/)
- El EntryPoint de Etherspot en testnet (`0x48e60BBb664aEfAc9f14aDB42e5FB5b4a119EB66`) es diferente al canónico ERC-4337 v0.7.
- Si el flujo AA falla por saldo insuficiente (fondear smart account / Paymaster), obtener más tRBTC del faucet antes de reintentar.

---

## 📜 Licencia

MIT

# Rootstock DeFi Project

Documento rapido para demo/jueces: `DOCUMENTACION-COMUN.md`

## One-liner
Bitcoin-secured DeFi on Rootstock: a simple product flow that lets users move from RBTC liquidity into useful on-chain actions like swapping into DoC and interacting with Sovryn primitives through a clean, accessible interface.

## What Rootstock Is
Rootstock is a smart contract platform secured by Bitcoin mining through merge-mining. It brings EVM compatibility to the Bitcoin ecosystem, which means developers can build Solidity applications while staying connected to Bitcoin-aligned infrastructure and liquidity.

In practice, Rootstock matters because it combines three things:

- Bitcoin security and ecosystem alignment
- EVM compatibility for fast development and tooling reuse
- DeFi rails that can turn BTC-denominated capital into productive on-chain activity

## The Problem
Bitcoin holders and Bitcoin-native users often have fewer polished DeFi experiences than users on larger EVM ecosystems. The tooling can feel fragmented, flows can be unclear, and many products assume a high level of protocol knowledge.

That creates a gap:

- users have capital but not an easy path into action
- DeFi products exist, but are not always packaged into a simple consumer flow
- onboarding is harder than it should be for a hackathon demo or a real user

## What We Are Building
We are building a Rootstock-first DeFi experience that turns a complex protocol stack into a short user journey.

Core idea:

- start from RBTC or WRBTC
- route the user into a practical DeFi action
- use Sovryn integrations for real protocol utility
- present the whole journey in a clean UI with understandable steps and outputs

For the current demo, the most concrete and reliable path is:

- wrap RBTC into WRBTC
- quote the trade
- swap WRBTC into DoC through Sovryn AMM
- show balances before and after

This gives us a simple but real DeFi story: from Bitcoin-native value into a stable asset position on Rootstock.

## Why This Matters
This is not just a token swap demo. It is a proof that Rootstock can support usable DeFi products for Bitcoin-connected users.

The pitch is:

- Bitcoin users want productive capital, not idle capital
- Rootstock gives the execution environment
- Sovryn gives the DeFi rails
- our product gives the usability layer

## Product Vision
The long-term product direction is a DeFi operating layer for Rootstock users:

- discover available strategies
- compare outcomes before signing
- move between assets and positions with minimal friction
- abstract protocol complexity behind clear actions

Examples of future actions:

- RBTC to DoC defensive positioning
- liquidity rotation between supported assets
- leveraged or margin-oriented Sovryn flows for advanced users
- strategy presets for simple risk profiles

## Current Demo Scope
For the hackathon, the demo scope is intentionally focused:

1. connect wallet on Rootstock testnet
2. show relevant balances
3. wrap and/or use WRBTC
4. get live quote from Sovryn swapper
5. approve token
6. execute swap WRBTC -> DoC
7. show post-trade balances and confirmation

Important implementation note:

- we tested Account Abstraction on Rootstock testnet extensively
- the final demo path does not depend on Account Abstraction
- the shipped hackathon flow uses direct wallet execution because it is the most reliable path in the current testnet environment

This is enough to prove:

- the contracts are wired correctly
- the Rootstock environment is live
- the product has a real, understandable user outcome

## Why We Removed Account Abstraction From The Demo
Account Abstraction was explored as a UX improvement layer, but the Rootstock testnet infrastructure available during the hackathon was not reliable enough for a production-grade demo path.

The important point is that the product thesis does not depend on AA.

The core value is still intact:

- Rootstock as the execution layer
- Sovryn as the DeFi rail
- our interface as the usability layer

For judges and users, a direct wallet flow is a better demo than an unstable abstraction layer.

## UI Narrative
The interface should communicate clarity, trust, and Bitcoin-native utility.

Suggested UI sections:

### 1. Hero
Headline:

`Put Bitcoin-secured capital to work on Rootstock`

Supporting copy:

`A simple interface for moving from RBTC liquidity into real DeFi actions powered by Rootstock and Sovryn.`

CTA ideas:

- Start demo
- View swap flow
- Explore Rootstock DeFi

### 2. Why Rootstock
Short educational block:

- Bitcoin-aligned security
- EVM smart contracts
- DeFi access without leaving the Bitcoin ecosystem narrative

### 3. Demo Flow
Visual stepper:

1. Wallet connected
2. Quote fetched
3. Approve WRBTC
4. Swap to DoC
5. Final balance updated

### 4. Transaction Proof
Show:

- token in
- token out
- amount in
- expected output
- minimum output
- tx hash
- final balance delta

### 5. Product Expansion
Position the demo as the first module of a larger Rootstock DeFi suite.

## Pitch Video Script

### Opening
`Bitcoin is the most important monetary network in crypto, but using Bitcoin-aligned capital inside DeFi is still harder than it should be.`

`We are building a Rootstock-native DeFi experience that makes that flow simple.`

### Explain Rootstock
`Rootstock brings smart contracts to the Bitcoin ecosystem through an EVM-compatible environment secured by Bitcoin merge-mining.`

`That means we can build familiar app experiences while staying anchored to Bitcoin infrastructure.`

### Explain the Product
`Our product takes a user from idle RBTC liquidity into an actionable DeFi outcome.`

`For this demo, we show a clear path: WRBTC into DoC through Sovryn, with transparent quoting, execution, and balance tracking.`

`We originally explored Account Abstraction for smoother UX, but for the hackathon build we prioritized reliability and shipped the direct transaction path.`

### Explain the Value
`The key value is not just the transaction itself. The value is reducing friction for users who want Bitcoin-secured DeFi without navigating multiple protocol surfaces manually.`

### Demo Section
`Here we connect the wallet, fetch a quote, approve the token, execute the swap, and confirm the resulting DoC balance.`

### Close
`This is the starting point for a broader Rootstock DeFi product layer: simpler actions, better UX, and more useful capital flows for the Bitcoin ecosystem.`

## Short Judge Pitch
`We are building a Rootstock-first DeFi UX layer that turns Bitcoin-aligned capital into simple on-chain actions. Our demo proves a real Sovryn-powered WRBTC to DoC flow, packaged in a product experience that is understandable, fast, and ready to expand into broader DeFi strategies.`

## Talking Points For Judges

- Rootstock is a strong fit because it brings EVM development into a Bitcoin-secured environment.
- The product is practical: it solves usability, not just protocol novelty.
- The demo is real on-chain activity, not mocked behavior.
- The scope is narrow on purpose so the user journey is clear and credible.
- The product can expand into a broader suite of Rootstock-native DeFi actions.

## What We Will Say We Built

- a Rootstock-native DeFi frontend concept
- live integration with Sovryn swap functionality
- wallet-driven transaction flow
- a product layer that makes Bitcoin-connected DeFi easier to understand and use
- a pragmatic demo architecture optimized for reliability on Rootstock testnet

## Demo Success Criteria

- wallet connects successfully
- user sees balances
- quote matches expected route
- swap executes successfully
- DoC balance increases after execution
- the flow is understandable to a non-technical judge

## Final Positioning
This project is about making Rootstock DeFi legible.

Not just possible.

Legible, usable, and demo-ready.
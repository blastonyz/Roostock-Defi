# AGENTS.md — Rootstock Account Abstraction Playbook

## Objetivo
Este repositorio se enfoca en construir y probar dApps con **Account Abstraction en Rootstock**.
Todas las decisiones técnicas deben priorizar:
- UX tipo web2 (onboarding simple, social/email login cuando aplique).
- Transacciones patrocinadas/gasless cuando sea posible.
- Compatibilidad EVM + estándares ERC-4337.

## Stack recomendado (orden de preferencia)
1. **Etherspot Prime SDK** para lógica AA (smart accounts, userOps, patrocinio).
2. **TransactionKit** para integración rápida en React cuando acelere delivery.
3. **Skandha Bundler** (EIP-4337) para UserOperations.
4. **Arka** para paymaster/sponsored transactions.
5. **Reown AppKit** cuando se requiera wallet UX avanzada (social login, on-ramp, swaps, smart accounts).

## Compatibilidad con viem / wagmi / RainbowKit
- **No hay choque por defecto**: `viem` + `wagmi` + `RainbowKit` se mantienen como capa de wallet connection, estado y reads/writes EVM.
- El stack AA (Etherspot/Bundler/Paymaster) se usa como capa de ejecución de **UserOperations**.
- Regla práctica: no duplicar el envío de transacciones en dos capas al mismo tiempo para la misma acción.
- Cuando una feature sea AA-first, encapsular ese flujo en un módulo/servicio específico y dejar `wagmi` para conexión de cuenta, red y lecturas generales.
- Mantener una única configuración de chains/transports (Rootstock 30/31) compartida entre `wagmi` y el cliente AA.

## Redes y parámetros base
- **Rootstock Mainnet**: chainId `30`, RPC pública `https://public-node.rsk.co`
- **Rootstock Testnet**: chainId `31`, RPC pública `https://public-node.testnet.rsk.co`
- En desarrollo, usar **Testnet (31)** por defecto.

## Variables de entorno mínimas para AA
Usar `.env` (nunca commitear secretos):

```env
VITE_WC_PROJECT_ID=...
VITE_BUNDLER_API_KEY=etherspot_public_key
VITE_CUSTOM_BUNDLER_URL=https://rootstocktestnet-bundler.etherspot.io/
RSK_MAINNET_RPC_URL=https://public-node.rsk.co
RSK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co
```

## Convenciones de implementación
- Priorizar smart wallets ERC-4337 sobre flujos EOA puros cuando el caso sea onboarding/UX.
- Si se implementa patrocinio de gas, modelar el flujo como **Bundler + Paymaster (Arka)**.
- Mantener la app lista para cambiar de testnet a mainnet por configuración, no por hardcode.
- Para prototipos y hackathon: preparar flujo end-to-end mínimo:
	1) crear/generar smart account,
	2) consultar balance,
	3) estimar + enviar operación,
	4) confirmar receipt.

## Nota de compatibilidad importante
- En documentación de **RIF Relay** puede aparecer que "Paymaster" está deprecado y reemplazado por "Verifiers" (flujo relay específico).
- No mezclar automáticamente ese modelo con todo el stack ERC-4337.
- Para este repo, cuando hablemos de AA de producto, asumir primero el flujo de herramientas Rootstock + Etherspot (Bundler/Paymaster) salvo que una tarea diga explícitamente "RIF Relay".

## Checklist para cualquier nueva feature AA
- Definir red objetivo (`31` en desarrollo).
- Confirmar configuración de bundler y paymaster.
- Evitar claves privadas hardcodeadas.
- Validar que la transacción/op se pueda estimar antes de enviar.
- Dejar trazabilidad de hash/receipt para debugging.

## Referencias base usadas para este contexto
- Rootstock Dev Portal (`llms-full.txt`) — secciones de:
	- Account Abstraction using Etherspot Prime SDK
	- Account Abstraction on Rootstock
	- Account Abstraction using Reown
	- Variables de entorno de bundler (testnet)
	- Notas de compatibilidad RIF Relay (Paymaster/Verifiers)

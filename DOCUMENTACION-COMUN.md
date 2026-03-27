# Documentacion - Rootstock DeFi

## Resumen
Rootstock DeFi es una app enfocada en convertir flujo Bitcoin-aligned (RBTC/WRBTC) en acciones DeFi utiles usando Sovryn en Rootstock Testnet.

Flujo principal del demo:
1. Conectar wallet
2. Obtener quote de swap
3. Aprobar token (WRBTC)
4. Ejecutar swap WRBTC -> DoC
5. Confirmar balances finales

## Objetivo del producto
- Hacer legible y simple el acceso a DeFi en Rootstock
- Reducir friccion para usuarios no tecnicos
- Mostrar una integracion real on-chain (no mock)

## Stack tecnico
- Frontend: Next.js + Wagmi + RainbowKit + React Query + Tailwind
- Integracion DeFi: Sovryn AMM
- Red objetivo de demo: Rootstock Testnet (chainId 31)
- Contratos y scripts auxiliares en hardhat/

## Variables de entorno (frontend)
- NEXT_PUBLIC_RPC_URL
- NEXT_PUBLIC_ROOTSTOCK_RPC_URL
- NEXT_PUBLIC_SOVRYN_WRBTC_ADDRESS
- NEXT_PUBLIC_SOVRYN_DOC_ADDRESS
- NEXT_PUBLIC_SOVRYN_SWAPPER_ADDRESS

## Variables de entorno (hardhat)
- RSK_PRIVATE_KEY
- RPC de Rootstock testnet

## Evidencia on-chain (TX hashes)
Estas transacciones se incluyen como prueba de ejecucion del flujo:

1. 0x3e00fd72db0377b2247730f0f71f1442cbb1016a0e466ae36a5f27b917e88572
2. 0x2fda7b4703161fb47733197affba5a785094eb812f7fe8e6207ac897df5a04b2
3. 0xaf62bbaf041c6d816961626eacca6152937975e564532fca7457ed5aacc6500a

Links sugeridos para verificacion en explorer:
- https://rootstock-testnet.blockscout.com/tx/0x3e00fd72db0377b2247730f0f71f1442cbb1016a0e466ae36a5f27b917e88572
- https://rootstock-testnet.blockscout.com/tx/0x2fda7b4703161fb47733197affba5a785094eb812f7fe8e6207ac897df5a04b2
- https://rootstock-testnet.blockscout.com/tx/0xaf62bbaf041c6d816961626eacca6152937975e564532fca7457ed5aacc6500a

## Como correr rapido el demo
1. Instalar dependencias
2. Configurar .env
3. Ejecutar frontend con npm run dev
4. Conectar wallet en Rootstock Testnet
5. Ejecutar flujo WRBTC -> DoC

## Mensaje corto para jueces
Construimos una experiencia Rootstock-first que toma capital Bitcoin-aligned (WRBTC) y lo convierte en una accion DeFi clara (swap a DoC) con evidencia on-chain verificable y UX enfocada en simplicidad.

## Estado actual
- Flujo swap funcional para demo
- Integracion wallet activa
- Evidencia de transacciones incluida
- Base preparada para expansion a estrategias DeFi adicionales

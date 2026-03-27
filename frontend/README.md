# Defiar - Rootstock Swap Frontend

Nueva versión del frontend de Defi App construida sobre **Rootstock Testnet** con **Sovryn AMM**.

## Stack

- **Next.js 16** - React framework
- **Wagmi + RainbowKit** - Web3 wallet connections
- **React Query** - State management
- **Tailwind CSS** - Styling
- **Zod** - Form validation

## Providers

```
AppProviders (Wagmi + RainbowKit)
  └── SovrynProvider (Swap state & contracts)
```

### SovrynProvider

Estado globalizado para swaps de Sovryn:

```typescript
const { 
  isConnected,    // Boolean: Wallet conectada?
  fromAmount,     // String: Cantidad a swapear
  toAmount,       // String: Cantidad recibida
  executeSwap,    // Function: Ejecutar el swap
  contracts       // Object: Direcciones de contrato
} = useSovryn();
```

## Configuración

1. Instala dependencias:
```bash
npm install
```

2. Configura `.env`:
```env
NEXT_PUBLIC_RPC_URL=tu-rpc-url
NEXT_PUBLIC_ROOTSTOCK_RPC_URL=tu-rpc-url-personal
NEXT_PUBLIC_SOVRYN_WRBTC_ADDRESS=0x69fE5cEc81D5eF92600c1a0dB1f11986aB3758ab
NEXT_PUBLIC_SOVRYN_DOC_ADDRESS=0xCb46C0DdC60d18eFEB0e586c17AF6Ea36452DaE0
NEXT_PUBLIC_SOVRYN_SWAPPER_ADDRESS=0x09c8a630b50412542bb7c4c149e72983db208e3c
```

3. Dev:
```bash
npm run dev
```

Accede a [http://localhost:3000](http://localhost:3000)

## Carpeta de Contextos

- `app-providers.tsx` - Configuración de Wagmi + RainbowKit para Rootstock testnet
- `sovryn-context.tsx` - Estado y lógica del swap de Sovryn

## Próximos Pasos

- [ ] Componentes UI para swap (input, output, quote, button)
- [ ] Integrar lógica del swap desde `../hardhat/scripts/sovryn-amm-swap.ts`
- [ ] Agregar visualización de precios live
- [ ] Historial de transacciones


# Stellar Stake House Backend

Backend Node.js para o projeto Stellar Stake House com sistema de cronjobs para monitoramento e processamento de stakes.

## 🚀 Tecnologias

- **Node.js** com TypeScript
- **Express.js** para API REST
- **node-cron** para agendamento de tarefas
- **Winston** para logging
- **Stellar SDK** para integração com blockchain
- **Joi** para validação de dados

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── jobs/              # Cronjobs e tarefas agendadas
│   │   ├── cronManager.ts # Gerenciador de cronjobs
│   │   └── stellarJob.ts  # Jobs específicos do Stellar
│   ├── services/          # Serviços de negócio
│   │   └── stellarService.ts # Serviço de integração Stellar
│   ├── middleware/        # Middlewares do Express
│   │   ├── errorHandler.ts
│   │   └── notFoundHandler.ts
│   ├── utils/            # Utilitários
│   │   └── logger.ts     # Sistema de logging
│   └── index.ts          # Entry point da aplicação
├── package.json
├── tsconfig.json
└── README.md
```

## ⚙️ Configuração

1. **Instalar dependências:**
   ```bash
   cd backend
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   cp env.example .env
   # Editar .env com suas configurações
   ```

3. **Executar em desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Build para produção:**
   ```bash
   npm run build
   npm start
   ```

## 🔧 Variáveis de Ambiente

```env
# Server
PORT=3001
NODE_ENV=development

# Stellar
STELLAR_NETWORK=testnet
STELLAR_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Contract
CONTRACT_ADDRESS=your_contract_address_here

# Cronjobs
CRON_ENABLED=true
CRON_TIMEZONE=America/Sao_Paulo

# Frontend
FRONTEND_URL=http://localhost:5173
```

## 📊 Cronjobs Configurados

### 1. Ciclo de Distribuição de Recompensas
- **Frequência:** A cada 10 minutos
- **Função:** Executa ciclo completo de distribuição de recompensas
- **Arquivo:** `src/jobs/stellarJob.ts::runDistributionCycle()`
- **Processo:**
  1. Verifica balance do owner do contrato
  2. Busca lista de participantes
  3. Verifica saldos de token nativo via API Horizon
  4. Calcula APR da pool
  5. Distribui recompensas para participantes elegíveis

## 🛠️ Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento com hot reload
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Executa versão compilada
- `npm run lint` - Executa linter ESLint
- `npm test` - Executa testes (quando implementados)

## 📡 Endpoints da API

### Health Check
- `GET /health` - Status da aplicação
- `GET /api/status` - Status da API

## 🔍 Logs

Os logs são salvos em:
- `logs/app.log` - Todos os logs
- `logs/error.log` - Apenas erros

## 🚀 Próximos Passos

1. **Implementar chamadas reais para o contrato Soroban** (get_owner, get_participants, calculate_APR, distribute)
2. **Adicionar banco de dados para persistência de dados de distribuição**
3. **Implementar sistema de notificações para participantes**
4. **Adicionar testes unitários e de integração**
5. **Configurar monitoramento e alertas para falhas de distribuição**
6. **Implementar rate limiting e segurança**
7. **Adicionar métricas de performance e dashboards**

## 📝 Notas de Desenvolvimento

- O projeto está configurado para usar ES modules
- TypeScript com configurações strict habilitadas
- Logging estruturado com Winston
- Tratamento de erros centralizado
- Graceful shutdown implementado

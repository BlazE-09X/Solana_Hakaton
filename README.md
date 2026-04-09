# ProofRent — RWA Rental Protocol on Solana

[![CI](https://github.com/Blaze-09X/proofrent-mvp/actions/workflows/ci.yml/badge.svg)](https://github.com/Blaze-09X/proofrent-mvp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-14F195.svg)](LICENSE)
[![Solana](https://img.shields.io/badge/Solana-devnet-9945FF)](https://solana.com)
[![Framework: Anchor](https://img.shields.io/badge/Framework-Anchor-blue)](https://www.anchor-lang.com/)

> Децентрализованный протокол для токенизации и фракционирования реальных активов (Real World Assets). Позволяет владельцам токенизировать имущество, создавать фракции собственности и распределять доход от аренды через прозрачные смарт-контракты на базе Solana.

[Live Demo](#) · [Video Walkthrough](#) · [Docs](docs/)

---

## 📋 Обзор проекта

ProofRent решает проблему ликвидности и доверия при инвестициях в реальные активы. Используя скорость Solana, мы создали платформу, где каждый объект — это верифицированный аккаунт в блокчейне с фракционированной собственностью.

### Основные возможности:
- **Tokenize Asset:** Регистрация актива в блокчейне с загрузкой proof-документов на IPFS
- **Mint Fractions:** Создание фракций собственности (ERC20-like токены)
- **Collect Income:** Сбор арендного дохода от активов
- **Distribute Income:** Пропорциональное распределение дохода между держателями фракций
- **P2P Trading:** Торговля фракциями на вторичном рынке
- **Oracle Verification:** Децентрализованная верификация активов

---

## 🛠 Технологический стек

| Слой | Технология |
|-------|-----------|
| **Smart Contracts** | Rust & Anchor Framework |
| **Frontend** | Vanilla HTML/JS & CSS |
| **Backend API** | Express.js & TypeScript |
| **Blockchain** | Solana (Devnet) |
| **Storage** | IPFS (Pinata) |
| **Wallet** | Phantom Wallet |

---

## 🏗 Архитектура системы

```
┌─────────────┐      ┌──────────────────────┐      ┌──────────────────┐
│   Investor  │────▶│   ProofRent Program   │────▶│   Asset Owner     │
│   (Holder)  │      │  (Smart Contract)    │      │   (Landlord)     │
└─────────────┘      └──────────┬───────────┘      └──────────────────┘
                                │
                     ┌──────────▼───────────┐
                     │    Solana Devnet     │
                     │  (Assets & Income)   │
                     └──────────────────────┘
                                │
                     ┌──────────▼───────────┐
                     │       IPFS           │
                     │  (Proof Documents)   │
                     └──────────────────────┘
```

---

## 📦 Быстрый старт

### Предварительные требования

1. **Node.js** (v18+)
2. **Phantom Wallet** расширение для Chrome
3. **Тестовые SOL** на devnet (минимум 0.1 SOL для транзакций)

### Получение тестовых SOL

1. Перейдите на [faucet.solana.com](https://faucet.solana.com)
2. Выберите "Devnet" в выпадающем меню
3. Введите ваш Phantom wallet адрес
4. Запросите 1-2 SOL для тестирования

### Установка и запуск

```bash
# Клонировать репозиторий
git clone <repository-url>
cd Solana_Hakaton-main

# Установить зависимости бэкенда
cd backend
npm install

# Запустить бэкенд (порт 3001)
npm run dev

# В новом терминале запустить фронтенд
cd ../frontend-react
npm install
npm run dev

# Открыть http://localhost:3000 в браузере
```

### Использование приложения

1. **Подключение кошелька:**
   - Нажмите "Connect Wallet" на главной странице
   - Выберите Phantom и подтвердите подключение
   - Убедитесь, что у вас есть тестовые SOL

2. **Создание актива:**
   - Перейдите в "Tokenize Asset"
   - Загрузите proof-документ (PDF/изображение)
   - Укажите параметры актива
   - Подтвердите транзакцию в Phantom

3. **Работа с фракциями:**
   - Mint фракции для созданного актива
   - Просматривайте портфель в "My Assets"
   - Распределяйте доход в "Income Pool"

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets` | Получить все активы |
| POST | `/api/assets/create` | Создать новый актив |
| POST | `/api/assets/mint-fractions` | Mint фракции |
| POST | `/api/assets/collect-income` | Собрать доход |
| POST | `/api/distribute-income` | Распределить доход |
| GET | `/api/marketplace` | Получить рыночные активы |
| GET | `/api/portfolio/:address` | Получить портфель пользователя |

---

## 🧪 Тестирование

```bash
# Запуск смарт-контрактов
cd programs/bbm
anchor test

# Запуск интеграционных тестов
cd ../../tests
npm test
```

---

## 📁 Структура проекта

```
Solana_Hakaton-main/
├── backend/                 # Express.js API сервер
│   ├── src/
│   │   └── index.ts        # Основной API код
│   ├── package.json
│   └── tsconfig.json
├── frontend-react/          # HTML/JS фронтенд
│   ├── public/
│   │   └── index.html      # Основной UI
│   └── package.json
├── programs/                # Anchor смарт-контракты
│   └── bbm/
│       ├── src/
│       │   └── lib.rs      # Rust контракт
│       └── Cargo.toml
├── tests/                   # Тесты
├── docs/                    # Документация
└── Anchor.toml             # Anchor конфигурация
```

---

## 🔐 Безопасность

- Все транзакции требуют подтверждения в Phantom Wallet
- Проверка баланса SOL перед каждой операцией
- IPFS хэши для immutable proof-документов
- Oracle-механизм верификации активов

---

## 📈 Roadmap

- [ ] Mainnet deployment
- [ ] Mobile app (React Native)
- [ ] Advanced oracle integrations
- [ ] AMM для фракций
- [ ] DAO governance
- [ ] Cross-chain bridges

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

- **Email:** team@proofrent.solana
- **Twitter:** [@ProofRent](https://twitter.com/ProofRent)
- **Discord:** [Join our community](https://discord.gg/proofrent)

---

*Built with ❤️ for Solana Hackathon 2024*

**Предварительные требования:** Node.js 18+, Rust, Anchor CLI, Solana CLI.

1. **Клонирование и установка:**
   ```bash
   git clone [https://github.com/Blaze-09X/proofrent-mvp](https://github.com/Blaze-09X/proofrent-mvp)
   cd proofrent-mvp
   npm install
2. **Сборка смарт-контрактыЖ**
    ```bash
    anchor build
3. **Запуск фронтенда**
   ```bash
    cd frontend-react
    npm run dev
## 🗺 Дорожная карта (Roadmap)

- [x] **v1.0 — MVP (Current)**
  - [x] Разработка смарт-контракта на Rust (Anchor).
  - [x] Интеграция Firebase для HelpDesk и аутентификации.
  - [x] Логика создания (Mint) и аренды (Rent) активов.
  - [x] Реализация функции освобождения актива (Release Asset).
  - [x] Базовая интеграция с Phantom Wallet.


  ---
[🚀 Live Demo](https://blaze-09x.github.io/Solana_Hakaton/)
(*обязательно нужно открыть с помощью google chrome, предварительно скачав расширение phantom wallet, выбрав сеть devnet!)
  ---


## 🤝 Контакты

Разработчики: 
- **Специализация:** Computer Engineering and Software
- **GitHub:** [@Blaze-09X](https://github.com/Blaze-09X), ___
- **Проекты:** Blockchain (Solana/Anchor)

---

## 📄 Лицензия

Данный проект распространяется под лицензией **MIT**. 

Полный текст лицензии доступен в файле [LICENSE](./LICENSE). 

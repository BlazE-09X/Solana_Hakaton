# ProofRent — RWA Rental Protocol on Solana

[![CI](https://github.com/Blaze-09X/proofrent-mvp/actions/workflows/ci.yml/badge.svg)](https://github.com/Blaze-09X/proofrent-mvp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-14F195.svg)](LICENSE)
[![Solana](https://img.shields.io/badge/Solana-devnet-9945FF)](https://solana.com)
[![Framework: Anchor](https://img.shields.io/badge/Framework-Anchor-blue)](https://www.anchor-lang.com/)

> Децентрализованный протокол для аренды реальных активов (Real World Assets). Позволяет владельцам токенизировать имущество и сдавать его в аренду через прозрачные смарт-контракты на базе Solana.

[Live Demo](#) · [Video Walkthrough](#) · [Docs](docs/)

---

## 📋 Обзор проекта

ProofRent решает проблему доверия и высоких комиссий при краткосрочной аренде активов. Используя скорость Solana, мы создали MVP, где каждый объект — это верифицированный аккаунт в блокчейне.

### Основные возможности:
- **Mint Property:** Регистрация актива в блокчейне с указанием цены и метаданных.
- **Instant Rent:** Мгновенная аренда с прямой транзакцией владельцу (P2P).
- **Release Logic:** Механика освобождения актива, позволяющая вернуть его в пул доступных.
- **Verification:** Система подтверждения подлинности актива администратором.

---

## 🛠 Технологический стек

| Слой | Технология |
|-------|-----------|
| **Smart Contracts** | Rust & Anchor Framework |
| **Frontend** | React & TailwindCSS |
| **Blockchain** | Solana (Devnet) |



---

## 🏗 Архитектура системы
┌─────────────┐      ┌──────────────────────┐      ┌──────────────────┐
│   Арендатор │────▶│   ProofRent Program   │────▶│   Владелец       │
│   (Renter)  │      │  (Smart Contract)    │      │   (Owner)        │
└─────────────┘      └──────────┬───────────┘      └──────────────────┘
                                │
                     ┌──────────▼───────────┐
                     │    Solana Ledger     │
                     │  (Asset State & SOL) │
                     └──────────────────────┘
---

## 📦 Быстрый старт

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

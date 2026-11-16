# DIGO — Community Token & Website

> Community-first Solana token project. This repository is the public home for the DIGO website, its documentation, and deployment workflow.

## Project overview

DIGO is a community-oriented token on **Solana Mainnet Beta**. The project is focused on community growth, transparent token information, and a planned free-claim experience. The website is intended to let visitors learn about DIGO, connect a Solana wallet such as Phantom, and—once the on-chain claim and swap integrations are implemented and audited—claim or swap tokens through wallet-signed transactions.

**Important:** A wallet connection is not a purchase, and connecting Phantom does not itself buy tokens. Any transaction must be reviewed and explicitly approved in the wallet.

## Token information

| Field | Value |
|---|---|
| Name / ticker | DIGO |
| Network | Solana Mainnet Beta |
| Token mint | `7gqusyDEx6L7JNUfDEUftzdKRSejgzCUk7QCUwocYG1F` |
| Initial supply stated by project | 100,000,000,000 DIGO |
| Decimals | 8 |
| Freeze authority | None |
| Mint authority | Active — `HK7Fh86hwAQwjqmLrm8L1JLVS57Eo7jD2FfzaHdhmZbQ` |
| Token metadata | [On-chain metadata JSON](https://raw.githubusercontent.com/ehsanatashzaban5-hub/digo-token/main/metadata/token.json) |

### Supply and authority disclosure

The mint authority is currently active. Therefore, the initial supply figure must **not** be interpreted as a permanently fixed or immutable maximum supply. Additional tokens may be minted by whoever controls the mint authority. The project must clearly disclose any future authority changes and token issuance.

The freeze authority is reported as disabled. Always verify current on-chain state independently before relying on this information.

## Website capabilities and planned integrations

The website's intended user journey is:

1. Explore the project, token details, tokenomics, roadmap, and community links.
2. Connect a compatible Solana wallet (Phantom is a supported wallet option).
3. Review eligibility and claim terms before submitting a claim.
4. Approve the transaction inside the wallet; the website must never ask for a seed phrase or private key.
5. Optionally swap supported assets through a reputable Solana swap/aggregator integration, subject to availability, fees, slippage, and network conditions.

### Wallet connection is not custody

DIGO should use a non-custodial model. The wallet remains under the user's control; the website requests a connection and constructs transactions, while the user signs them in their wallet. Never enter or transmit a wallet recovery phrase or private key into this website.

### Buying and swapping DIGO

A user can buy DIGO from the website only if the site integrates a live Solana swap route/provider (for example, Jupiter) or links to a supported external market (for example, Raydium). Phantom is the wallet/signing interface; it is **not** the exchange or liquidity provider. A wallet connection alone cannot execute a purchase.

Before enabling an in-site swap, the project must verify:
- a real, active DIGO liquidity pool and supported route;
- correct mint address and token decimals;
- quote freshness, price impact, slippage and all fees;
- transaction simulation and clear failure handling;
- no fabricated price, volume, liquidity, or market-cap data.

No live price or guaranteed execution is promised by this repository documentation. Market availability and route support can change.

## Claim design and security requirements

The free-claim feature must be backed by a verifiable claim mechanism—not a front-end-only button. Before production launch, document and test:
- eligibility rules and claim limits;
- allocation source and remaining claim inventory;
- anti-bot / rate-limit controls;
- replay protection and one-claim-per-wallet rules where applicable;
- transaction construction, simulation, and confirmation;
- operational ownership, monitoring, and incident response.

Never expose private keys, seed phrases, RPC credentials with privileged access, or server secrets in frontend code or Git history.

## Repository

- Website source repository: [ehsanatashzaban5-hub/digo-website](https://github.com/ehsanatashzaban5-hub/digo-website)
- Token metadata repository: [ehsanatashzaban5-hub/digo-token](https://github.com/ehsanatashzaban5-hub/digo-token)
- Network: Solana Mainnet Beta

## Local development

The website source is currently provided in the repository as `digo-site-source.zip`. Extract it before running the app:

```bash
unzip digo-site-source.zip -d extracted
cd extracted
```

Then enter the directory containing `package.json` and use the package manager indicated by the lockfile:

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

The exact scripts, runtime requirements, and environment variables must be confirmed against the extracted `package.json` and project configuration. Do not put secrets in `VITE_*` variables: Vite exposes those values to the browser.

## Deployment

A GitHub Actions workflow is configured at `.github/workflows/deploy.yml` to build and publish the static site through GitHub Pages. Deployment is not considered complete until the workflow reports success and the published URL is verified.

For GitHub Pages, configure the repository's **Settings → Pages → Build and deployment → Source: GitHub Actions** if it is not already enabled. If the project uses Vite, its `base` setting must match the deployment path (for a project Pages URL, commonly `/digo-website/`; for a custom domain root, commonly `/`).

## Roadmap

- [ ] Publish and verify the website build.
- [ ] Verify Phantom connection on desktop and mobile.
- [ ] Implement and audit the on-chain free-claim flow.
- [ ] Verify DIGO liquidity and integrate a real swap route (or provide a clearly labeled external market link).
- [ ] Publish transparent token authority, allocation, and risk disclosures.
- [ ] Add monitoring, accessibility checks, and security review.

## Risks and disclaimers

DIGO is a crypto asset and may be volatile or illiquid. Token ownership does not imply equity, dividends, guaranteed utility, or guaranteed returns. Wallet transactions are generally irreversible. Users should independently verify the mint address, network, transaction details, fees, and destination before signing. This documentation is informational and is not financial, investment, legal, or tax advice.

## License

No license has been declared yet. Unless a license is added to this repository, reuse and redistribution of the source code are not automatically granted.

# Tip Assistant

An **Executive Assistant** built on the **Universal Assistant Protocol (UAP)** for the [LUKSO](https://lukso.network) GRID. The Tip Assistant automatically redirects a percentage of incoming LYX transfers from a Universal Profile to a specified address.

> **Table of Contents**
>
> - [Overview](#overview)
> - [Features](#features)
> - [Universal Assistant Protocol (UAP) Background](#universal-assistant-protocol-uap-background)
> - [Installation](#installation)
> - [Configuration](#configuration)
> - [Usage](#usage)
> - [Screenshots](#screenshots)
> - [FAQ](#faq)
> - [Contributing](#contributing)
> - [License](#license)

---

## Overview

In a typical LUKSO Universal Profile (UP), you can receive various tokens (e.g., LYX) or other assets. The **Tip Assistant** is a simple, automated mini-contract (an **Executive Assistant**) that intercepts every incoming LYX transfer and sends a user-defined percentage to any desired third-party address. This is particularly useful for creators, collaborative projects, or any scenario where you want to consistently tip a beneficiary.

## Features

- **Automatic Tipping**: For every incoming LYX transaction, automatically tip a configurable percentage (e.g., 2%) to a designated address.
- **Simple UI**: A straightforward user interface for Grid owners to install, configure, or remove the Tip Assistant.
- **Visitor View**: Shows visitors the current info on a given Universal Profile.
- **Seamless Integration**: Built on top of the [UAP (Universal Assistant Protocol)](#universal-assistant-protocol-uap-background).

## Universal Assistant Protocol (UAP) Background

> _Excerpt from the official UAP docs_:

> In a not-too-distant tomorrow, people own sleek, digital identities called Universal Profiles (UPs) on LUKSO. These UPs house everything from collectibles to social tokens, making them the beating heart of each individual’s on-chain life. Yet as these profiles grow, so do the complexities of managing who sends what—and why.

> Enter the Universal Assistant Protocol (UAP), a powerful new layer that ensures every incoming asset or transaction to your UP gets the attention it deserves. When something arrives—like an NFT or a cryptographic message—the UAP’s Universal Receiver Delegate (URDuap) steps in as the dedicated concierge. It checks a registry of your chosen “Executive Assistants,” specialized mini-contracts trained to handle tasks you’ve defined in advance, such as automatic tipping, forwarders, or specialized refining for certain tokens.

> Soon, these Executive Assistants will be joined by “Screener Assistants,” vigilant watchers that can evaluate each incoming transfer and decide if it should be allowed, blocked, or modified. Think of it like a trusted guard at your digital door, ensuring only the transfers that match your exact preferences get through—so unwanted tokens or tricky spam never clutter your identity.

> Over time, the UAP turns your Universal Profile into something more than an address—it becomes a curated experience, shaped by your own rules and logic. Whether you automatically tip creators, refine game tokens into premium rewards, or simply filter out spam, the UAP coordinates it all in a smooth, transparent way. It’s the next step in forging truly intelligent on-chain identities, where you decide exactly how assets, messages, and possibilities flow into your life.

## Installation

1. **Clone the Repository**
   Clone the repo and access the directory

   ```bash
   cd tip-assistant-repo
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Build and Run**
   ```bash
   npm run dev
   ```
4. **Start a tunnel server in another window**
   ```bash
   lt --port 3000
   ```
5. **Copy the URL returned**
   Copy the Url returned and add it to your Grid

## Configuration from PROD

- **Installing the Tip Assistant (Owner Only)**

  1. Go to your GRID section in https://universaleverything.io .
  2. Add the Grid app using this URL: https://tip-assistant-grid-app.netlify.app
  3. Connect your wallet
  4. Authorize the **Tip Assistant** by installing the UAP Protocol if it’s not already active on your Universal Profile.
  5. Once installed, configure:
     - **Destination Address**: The recipient of the tip (e.g., `0xec1c59E78De6f840A66b6EE8E40...`).
     - **Tip Percentage**: A numeric value (e.g., `2` for 2%).
  6. Save the configuration.

- **Editing or Deactivating**
  - If you’re the owner, you can always revisit the configuration page to update the tip percentage or deactivate the Assistant.
  - To uninstall completly the protocol and all assistants visit your profile section in https://upassistants.com

## Usage

1. **For Profile Visitors**

   - When a Universal Profile has the **Tip Assistant** configured, visitors (and senders) can see that it is actively tipping a certain percentage.
   - If no assistant is configured, the UI clearly states that the owner has not configured a Tip Assistant yet.

2. **For the Profile Owner**

   - Once active, simply receive LYX as usual; the Tip Assistant automatically diverts the configured tip percentage to the chosen address.

3. **On-Chain Logic**
   - The Universal Receiver Delegate checks incoming transfers.
   - If LYX arrives, the Tip Assistant logic executes and sends a portion to the configured tip address.
   - The remainder goes to your Universal Profile as normal.

## Screenshots

Below are some illustrative screens you may encounter when using the Tip Assistant:

1. **Initial Installation View for owner of grid**  
   ![Initial installation](https://i.ibb.co/XkrWxH1w/Screenshot-2025-03-11-at-10-59-58-AM.png)

2. **No Assistant Installed**  
   ![no installation](https://i.ibb.co/NdfthcW5/Screenshot-2025-03-11-at-10-59-53-AM.png)

   ![no installation](https://i.ibb.co/FbgrpSJj/Screenshot-2025-03-11-at-10-57-54-AM.png)

3. **Configuration Page (Owner)**  
   ![settings](https://i.ibb.co/21LRJYx4/Screenshot-2025-03-11-at-10-57-07-AM.png)

4. **Owner’s Active Assistant View**  
    _(UI showing the Assistant is active and continuously tipping X%)_
   ![active view](https://i.ibb.co/VYLwW3Dr/Screenshot-2025-03-11-at-10-57-02-AM.png)

5. **Visitor’s View When Assistant is Configured**  
    _(UI showing the Assistant is enabled and a set % is being tipped.)_
   ![active view visitor](https://i.ibb.co/HL1nx2wR/Screenshot-2025-03-11-at-10-55-54-AM.png)

## FAQ

1. **Do I need to install the UAP Protocol first?**  
   Yes, but the GRID also has the installation part for the UAP. The Tip Assistant relies on the Universal Assistant Protocol. If the UAP is not installed on your Universal Profile, you’ll be prompted to install it before enabling the Tip Assistant.

2. **Can I change the tip percentage any time?**  
   Absolutely. Just revisit the Assistants settings, adjust the percentage, and click “Save.”

3. **What happens if I deactivate the Tip Assistant?**  
   Once deactivated, no tips will be sent, and all future transfers will arrive in full to your Universal Profile. The UAP protocol will still be installed but no assistant is triggered. To uninstall completly the protocol and all assistants visit your profile section in https://upassistants.com

4. **Is there a minimum or maximum tip percentage?**  
   By default, you can set any integer percentage from 0 to 100 (no decimals for now). Configure responsibly—very high tips may deplete your funds quickly!

**Happy tipping!** If you find this assistant helpful, consider starring the repo and sharing it with the LUKSO community.

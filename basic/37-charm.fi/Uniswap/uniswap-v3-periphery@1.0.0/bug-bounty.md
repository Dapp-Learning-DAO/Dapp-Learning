# Uniswap V3 Bug Bounty

## Overview

Starting on April 26th, 2021, the [uniswap-v3-periphery](https://github.com/Uniswap/uniswap-v3-periphery) repository is
subject to the Uniswap V3 Bug Bounty (the “Program”) to incentivize responsible bug disclosure.

We are limiting the scope of the Program to critical and high severity bugs, and are offering a reward of up to $500,000. Happy hunting!

## Scope

The scope of the Program is limited to bugs that result in the loss of user funds.

The following are not within the scope of the Program:

- Any contract located under [contracts/test](./contracts/test) or [contracts/lens](./contracts/lens).
- Bugs in any third party contract or platform that interacts with Uniswap V3.
- Vulnerabilities already reported and/or discovered in contracts built by third parties on Uniswap V3.
- Any already-reported bugs.

Vulnerabilities contingent upon the occurrence of any of the following also are outside the scope of this Program:

- Frontend bugs
- DDOS attacks
- Spamming
- Phishing
- Automated tools (Github Actions, AWS, etc.)
- Compromise or misuse of third party systems or services

## Assumptions

Uniswap V3 was developed with the following assumptions, and thus any bug must also adhere to the following assumptions
to be eligible for the bug bounty:

- The total supply of any token does not exceed 2<sup>128</sup> - 1, i.e. `type(uint128).max`.
- The `transfer` and `transferFrom` methods of any token strictly decrease the balance of the token sender by the transfer amount and increases the balance of token recipient by the transfer amount, i.e. fee on transfer tokens are excluded.
- The token balance of an address can only change due to a call to `transfer` by the sender or `transferFrom` by an approved address, i.e. rebase tokens and interest bearing tokens are excluded.

## Rewards

Rewards will be allocated based on the severity of the bug disclosed and will be evaluated and rewarded at the discretion of the Uniswap Labs team.
For critical bugs that lead to loss of user funds (more than 1% or user specified slippage tolerance),
rewards of up to $500,000 will be granted. Lower severity bugs will be rewarded at the discretion of the team.
In addition, all vulnerabilities disclosed prior to the mainnet launch date will be subject to receive higher rewards.

## Disclosure

Any vulnerability or bug discovered must be reported only to the following email: [security@uniswap.org](mailto:security@uniswap.org).

The vulnerability must not be disclosed publicly or to any other person, entity or email address before Uniswap Labs has been notified, has fixed the issue, and has granted permission for public disclosure. In addition, disclosure must be made within 24 hours following discovery of the vulnerability.

A detailed report of a vulnerability increases the likelihood of a reward and may increase the reward amount. Please provide as much information about the vulnerability as possible, including:

- The conditions on which reproducing the bug is contingent.
- The steps needed to reproduce the bug or, preferably, a proof of concept.
- The potential implications of the vulnerability being abused.

Anyone who reports a unique, previously-unreported vulnerability that results in a change to the code or a configuration change and who keeps such vulnerability confidential until it has been resolved by our engineers will be recognized publicly for their contribution if they so choose.

## Eligibility

To be eligible for a reward under this Program, you must:

- Discover a previously unreported, non-public vulnerability that would result in a loss of and/or lock on any ERC-20 token on Uniswap V3 (but not on any third party platform interacting with Uniswap V3) and that is within the scope of this Program. Vulnerabilities must be distinct from the issues covered in the Trail of Bits or ABDK audits.
- Be the first to disclose the unique vulnerability to [security@uniswap.org](mailto:security@uniswap.org), in compliance with the disclosure requirements above. If similar vulnerabilities are reported within the same 24 hour period, rewards will be split at the discretion of Uniswap Labs.
- Provide sufficient information to enable our engineers to reproduce and fix the vulnerability.
- Not engage in any unlawful conduct when disclosing the bug, including through threats, demands, or any other coercive tactics.
- Not exploit the vulnerability in any way, including through making it public or by obtaining a profit (other than a reward under this Program).
- Make a good faith effort to avoid privacy violations, destruction of data, interruption or degradation of Uniswap V3.
- Submit only one vulnerability per submission, unless you need to chain vulnerabilities to provide impact regarding any of the vulnerabilities.
- Not submit a vulnerability caused by an underlying issue that is the same as an issue on which a reward has been paid under this Program.
- Not be one of our current or former employees, vendors, or contractors or an employee of any of those vendors or contractors.
- Not be subject to US sanctions or reside in a US-embargoed country.
- Be at least 18 years of age or, if younger, submit your vulnerability with the consent of your parent or guardian.

## Other Terms

By submitting your report, you grant Uniswap Labs any and all rights, including intellectual property rights, needed to validate, mitigate, and disclose the vulnerability. All reward decisions, including eligibility for and amounts of the rewards and the manner in which such rewards will be paid, are made at our sole discretion.

The terms and conditions of this Program may be altered at any time.

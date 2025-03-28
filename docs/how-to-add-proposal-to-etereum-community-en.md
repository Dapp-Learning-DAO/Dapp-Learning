# How to Submit a Proposal to the Ethereum Community

## Preface

+ The Ethereum community needs to be built, and early builders will receive real value in return.
+ Much of the creativity of other public chains relies on the Ethereum community, which is the vitality of the Ethereum community.
+ Besides trading tokens, supporting or participating in the planning and construction of the community is very valuable.
+ EIP (Ethereum Improvement Proposal) is used to discuss any interesting suggestions. EIP-721, which is NFT, is one of the EIPs, coming from Lara Labs.

## Resources

+ URL: https://github.com/ethereum/EIPs/issues/new
+ Template: https://github.com/ethereum/EIPs/blob/master/eip-template.md

## Notes

+ First, read EIP-1 in depth: https://eips.ethereum.org/EIPS/eip-1

+ Key points are listed below.

+ ATTENTION! If you would like to submit an EIP and it has already been written as a draft (see the [template](https://github.com/ethereum/EIPs/blob/master/eip-template.md) for an example), please submit it as a [Pull Request](https://github.com/ethereum/EIPs/pulls).

+ If you are considering a proposal but would like to get some feedback on the idea before submitting a draft, then continue opening an Issue as a thread for discussion. Note that the more clearly and completely you state your idea the higher the quality of the feedback you are likely to receive.

  Keep in mind the following guidelines from [EIP-1](./eip-1.md):

  > Each EIP must have a champion - someone who writes the EIP using the style and format described below, shepherds the discussions in the appropriate forums, and attempts to build community consensus around the idea. The EIP champion (a.k.a. Author) should first attempt to ascertain whether the idea is EIP-able. Posting to the Protocol Discussion forum or opening an Issue is the best way to go about this.

  > Vetting an idea publicly before going as far as writing a EIP is meant to save the potential author time. Asking the Ethereum community first if an idea is original helps prevent too much time being spent on something that is guaranteed to be rejected based on prior discussions (searching the Internet does not always do the trick). It also helps to make sure the idea is applicable to the entire community and not just the author. Just because an idea sounds good to the author does not mean it will work for most people in most areas where Ethereum is used.

  > Once the champion has asked the Ethereum community as to whether an idea has any chance of acceptance, a draft EIP should be presented as a Pull Request. This gives the author a chance to flesh out the draft EIP to make properly formatted, of high quality, and to address initial concerns about the proposal.

## Explanation

+ A proposal first comes from some context and ideas, thoughts, most of which come from problems and difficulties encountered in actual work and development, finding that Ethereum needs to be improved.
+ For example, community projects participating in the metaverse construction process find that defining a set of standards would be more conducive to development. Contributing these standards to the community can help others improve efficiency and enhance interaction efficiency with each other.
+ The EIP submission process provides standards for how to explain things clearly and comprehensively.

### Discussion

+ First, there needs to be a champion, which is the main author.
+ Then discuss in the corresponding community, usually by creating an issue on GitHub (such as 721's https://github.com/ethereum/eips/issues/721) or a forum post: [the Ethereum Magicians forum](https://ethereum-magicians.org/).
+ The discussion process needs to ascertain whether the idea is EIP-able, whether it is worth and able to establish an EIP.
+ Additionally, before writing an EIP, it's best to publicly discuss the idea and ask the Ethereum community if it's feasible, which can prevent wasting too much time on unnecessary ideas.
+ PS: The readme of the Magicians forum: https://ethereum-magicians.org/t/welcome-please-readme-first/8, you'll find that it takes a lot of time to browse around and get familiar with the rules.
+ If after inquiring and discussing with the community, your post is considered to have a chance of acceptance, then submit a proposal draft.

### Draft

+ Fork the EIP repository, like I did: ![fork](https://tva1.sinaimg.cn/large/e6c9d24ely1h0ymse1599j21zw0g2acq.jpg)
+ Use the [template](https://github.com/ethereum/EIPs/blob/master/eip-template.md) to write your EIP. There are a lot of concepts in it, but just write it first.
+ After completing the draft, submit a Pull Request, yes, the legendary PR, haha.
+ After submission, it will be reviewed, such as Dr. Zhou's EIP4972: https://github.com/ethereum/EIPs/pull/4972

### Status

+ After submitting the PR, the core review group in the community: This PR requires review from one of [[@lightclient](https://github.com/lightclient), [@axic](https://github.com/axic), [@SamWilsn](https://github.com/SamWilsn)]
+ Repeatedly communicate about format and expression until the draft is merged, then it enters the EIP status list.
+ The status list is complex
+ [Status](https://github.com/qizhou/EIPs/blob/master/assets/eip-1/EIP-process-update.jpg)
+ The core is: Idea-->Draft-->Review<-->Last Call-->Final
+ Review will enter the Living state, with repeated iterations and modifications
+ It may also enter the Stagnant state.

### Other

+ Ethereum working PM meetings: https://github.com/ethereum/pm, including agenda, records, corresponding Twitter records, and videos.
+ For example, the record of the most recent meeting: https://github.com/ethereum/pm/blob/master/AllCoreDevs-Meetings/Meeting%20134.md
+ Progress on Kiln and beacon chain, etc. Currently, I'm not sure if one can add their own agenda and participate in meetings without invitation, it seems like you need to become a PM?
+ This article will be published in the Dapp Learning community: https://github.com/Dapp-Learning-DAO/Dapp-Learning, as well as personal Blog (jLab.tech)

## How to Write an EIP? See the Next Article





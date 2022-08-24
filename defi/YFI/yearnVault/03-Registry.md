# 介绍  
对于 Yearn 来说，需要管理许多的 Vault，为了便于管理这些 Vault，Yearn 使用了 Registry 合约。  
Vault 通过在 Registry 中注册，之后根据 BaseRouter 提供的接口，可以方便的访问 Registry 中的各个 Vault，进行资金质押赚取收益。
在 Registry 合约中，主要的接口为 _registerVault 和 newRelease 这两个接口。观察这两个接口可以发现，只有 release 的 Vault 才能在 Registry 中进行注册。 

## 合约分析  
- newRelease  
发布新的 Vault，发布时会检查新发布的 Vault apiVersion 是否与上一个发布的 Vault apiVersion 相同，当然这里的检查不是严格要求 apiVersion 是递增或是不能重复的，只要与上一个 Vault 不同即可。
可以看到，self.numReleases 记录了下一个将要发布的 Vault 的编号。 self.numReleases 默认值为 0，所以从代码中可以发现，没有任何 release vault 的时候，self.numReleases - 1 运算后会出现下溢的情况。所以在使用 self.releases 查询上一个 release Vault 的时候，先判断了 release_id 是否大于 0。
```python
def newRelease(vault: address):
    """
    @notice
        Add a previously deployed Vault as the template contract for the latest release,
        to be used by further "forwarder-style" delegatecall proxy contracts that can be
        deployed from the registry throw other methods (to save gas).
    @dev
        Throws if caller isn't `self.governance`.
        Throws if `vault`'s governance isn't `self.governance`.
        Throws if the api version is the same as the previous release.
        Emits a `NewVault` event.
    @param vault The vault that will be used as the template contract for the next release.
    """
    assert msg.sender == self.governance  # dev: unauthorized

    # Check if the release is different from the current one
    # NOTE: This doesn't check for strict semver-style linearly increasing release versions
    release_id: uint256 = self.numReleases  # Next id in series
    if release_id > 0:
        assert (
            Vault(self.releases[release_id - 1]).apiVersion()
            != Vault(vault).apiVersion()
        )  # dev: same api version
    # else: we are adding the first release to the Registry!

    # Update latest release
    self.releases[release_id] = vault
    self.numReleases = release_id + 1

    # Log the release for external listeners (e.g. Graph)
    log NewRelease(release_id, vault, Vault(vault).apiVersion())
```

-  _registerVault  
Yearn 中，当一种 token 对应的 Vault 升级变更，需要重新注册一个 Vault。self.vaults 定义了 token 到不同 Vault 的映射。 
self.vaults 使用两个参数进行映射，第一参数为 token 地址，第二个参数为 Vault 的编号 ，从 0 开始。 
另外，这里还使用 self.numVaults 变量记录每一种 token 对应的下一个 Vault 的编号。从代码中可以看到， self.numVaults 的处理和 self.numReleases 一样，在初始查询的时候，会出现下溢的情况，这里同样进行了判断处理，避免调用失败。
```python
def _registerVault(token: address, vault: address):
    # Check if there is an existing deployment for this token at the particular api version
    # NOTE: This doesn't check for strict semver-style linearly increasing release versions
    vault_id: uint256 = self.numVaults[token]  # Next id in series
    if vault_id > 0:
        assert (
            Vault(self.vaults[token][vault_id - 1]).apiVersion()
            != Vault(vault).apiVersion()
        )  # dev: same api version
    # else: we are adding a new token to the Registry

    # Update the latest deployment
    self.vaults[token][vault_id] = vault
    self.numVaults[token] = vault_id + 1

    # Register tokens for endorsed vaults
    if not self.isRegistered[token]:
        self.isRegistered[token] = True
        self.tokens[self.numTokens] = token
        self.numTokens += 1

    # Log the deployment for external listeners (e.g. Graph)
    log NewVault(token, vault_id, vault, Vault(vault).apiVersion())
```

- latestVault  
查询给定币种的最新已注册 Vault。这里计算的时候使用到了 self.numVaults， 可以发现对于任何没有 Vault 注册的币种，这个变量的返回值为 0。所以调用这个接口查询没有 Vault 注册的币种时，查询会失败。
```python
def latestVault(token: address) -> address:
    """
    @notice Returns the latest deployed vault for the given token.
    @dev Throws if no vaults are endorsed yet for the given token.
    @param token The token address to find the latest vault for.
    @return The address of the latest vault for the given token.
    """
    # NOTE: Throws if there has not been a deployed vault yet for this token
    return self.vaults[token][self.numVaults[token] - 1]  # dev: no vault for token
```

- _newProxyVault  
_newProxyVault 用于快速克隆一个 Vault。 可以看到， 接口接受一个 releaseTarget 参数，用于在 self.releases 查找目标 Vault，然后使用 Vyper 内置函数 create_forwarder_to 进行克隆。 
克隆成功后，使用 initialize 接口进行初始化。 
```python
def _newProxyVault(
    token: address,
    governance: address,
    rewards: address,
    guardian: address,
    name: String[64],
    symbol: String[32],
    releaseTarget: uint256,
) -> address:
    release: address = self.releases[releaseTarget]
    assert release != ZERO_ADDRESS  # dev: unknown release
    vault: address = create_forwarder_to(release)

    # NOTE: Must initialize the Vault atomically with deploying it
    Vault(vault).initialize(token, governance, rewards, name, symbol, guardian)

    return vault
```

- newVault  
1. 根据接口中传入的 releaseDelta 参数获取目标 Vault  
2. 调用 _newProxyVault 接口克隆目标 Vault  
3. 调用 _registerVault 接口，把克隆出来的 Vault 注册到 Registry 中  
```python
def newVault(
    token: address,
    guardian: address,
    rewards: address,
    name: String[64],
    symbol: String[32],
    releaseDelta: uint256 = 0,  # NOTE: Uses latest by default
) -> address:
    """
    @notice
        Create a new vault for the given token using the latest release in the registry,
        as a simple "forwarder-style" delegatecall proxy to the latest release. Also adds
        the new vault to the list of "endorsed" vaults for that token.
    @dev
        `governance` is set in the new vault as `self.governance`, with no ability to override.
        Throws if caller isn't `self.governance`.
        Throws if no releases are registered yet.
        Throws if there already is a registered vault for the given token with the latest api version.
        Emits a `NewVault` event.
    @param token The token that may be deposited into the new Vault.
    @param guardian The address authorized for guardian interactions in the new Vault.
    @param rewards The address to use for collecting rewards in the new Vault
    @param name Specify a custom Vault name. Set to empty string for default choice.
    @param symbol Specify a custom Vault symbol name. Set to empty string for default choice.
    @param releaseDelta Specify the number of releases prior to the latest to use as a target. Default is latest.
    @return The address of the newly-deployed vault
    """
    assert msg.sender == self.governance  # dev: unauthorized

    # NOTE: Underflow if no releases created yet, or targeting prior to release history
    releaseTarget: uint256 = self.numReleases - 1 - releaseDelta  # dev: no releases
    vault: address = self._newProxyVault(token, msg.sender, rewards, guardian, name, symbol, releaseTarget)

    self._registerVault(token, vault)

    return vault
```

- endorseVault  
添加一个已经部署的 Vault 到 Registry 中。此接口和 newVault 的区别在于，此接口调用时，不需要去进行克隆。 只要进行注册的 Vault 的  apiVersion 和已经 release 的 Vault apiVersion 相同即可注册成功。
```python
def endorseVault(vault: address, releaseDelta: uint256 = 0):
    """
    @notice
        Adds an existing vault to the list of "endorsed" vaults for that token.
    @dev
        `governance` is set in the new vault as `self.governance`, with no ability to override.
        Throws if caller isn't `self.governance`.
        Throws if `vault`'s governance isn't `self.governance`.
        Throws if no releases are registered yet.
        Throws if `vault`'s api version does not match latest release.
        Throws if there already is a deployment for the vault's token with the latest api version.
        Emits a `NewVault` event.
    @param vault The vault that will be endorsed by the Registry.
    @param releaseDelta Specify the number of releases prior to the latest to use as a target. Default is latest.
    """
    assert msg.sender == self.governance  # dev: unauthorized
    assert Vault(vault).governance() == msg.sender  # dev: not governed

    # NOTE: Underflow if no releases created yet, or targeting prior to release history
    releaseTarget: uint256 = self.numReleases - 1 - releaseDelta  # dev: no releases
    api_version: String[28] = Vault(self.releases[releaseTarget]).apiVersion()
    assert Vault(vault).apiVersion() == api_version  # dev: not target release

    # Add to the end of the list of vaults for token
    self._registerVault(Vault(vault).token(), vault)
```
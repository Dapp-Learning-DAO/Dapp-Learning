// SPDX-License-Identifier: MIT

pragma solidity ^0.5.17;

import "@openzeppelinV2/contracts/math/SafeMath.sol";
import "@openzeppelinV2/contracts/utils/Address.sol";
import "@openzeppelinV2/contracts/utils/EnumerableSet.sol";

import "../../interfaces/yearn/IController.sol";
import "../../interfaces/yearn/IStrategy.sol";
import "../../interfaces/yearn/IVault.sol";
import "../../interfaces/yearn/IWrappedVault.sol";

contract YRegistry {
    using Address for address;
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    address public governance;
    address public pendingGovernance;

    EnumerableSet.AddressSet private vaults;
    EnumerableSet.AddressSet private controllers;

    mapping(address => address) private wrappedVaults;

    mapping(address => bool) public isDelegatedVault;

    constructor(address _governance) public {
        require(_governance != address(0), "Missing Governance");
        governance = _governance;
    }

    function getName() external pure returns (string memory) {
        return "YRegistry";
    }

    function addVault(address _vault) public onlyGovernance {
        setVault(_vault);

        (address controller, , , , ) = getVaultData(_vault);

        setController(controller);
    }

    function addWrappedVault(address _vault) public onlyGovernance {
        setVault(_vault);
        address wrappedVault = IWrappedVault(_vault).vault();
        setWrappedVault(_vault, wrappedVault);

        (address controller, , , , ) = getVaultData(_vault);

        // Adds to controllers array
        setController(controller);
        // TODO Add and track tokens and strategies? [historical]
        // (current ones can be obtained via getVaults + getVaultInfo)
    }

    function addDelegatedVault(address _vault) public onlyGovernance {
        setVault(_vault);
        setDelegatedVault(_vault);

        (address controller, , , , ) = getVaultData(_vault);

        // Adds to controllers array
        setController(controller);
        // TODO Add and track tokens and strategies? [historical]
        // (current ones can be obtained via getVaults + getVaultInfo)
    }

    function setVault(address _vault) internal {
        require(_vault.isContract(), "Vault is not a contract");
        // Checks if vault is already on the array
        require(!vaults.contains(_vault), "Vault already exists");
        // Adds unique _vault to vaults array
        vaults.add(_vault);
    }

    function setWrappedVault(address _vault, address _wrappedVault) internal {
        require(_wrappedVault.isContract(), "WrappedVault is not a contract");
        wrappedVaults[_vault] = _wrappedVault;
    }

    function setDelegatedVault(address _vault) internal {
        // TODO Is there any way to check if a vault is delegated
        isDelegatedVault[_vault] = true;
    }

    function setController(address _controller) internal {
        // Adds Controller to controllers array
        if (!controllers.contains(_controller)) {
            controllers.add(_controller);
        }
    }

    function removeVault(address _vault) public onlyGovernance {
        vaults.remove(_vault);
    }

    function getVaultData(address _vault)
        internal
        view
        returns (
            address controller,
            address token,
            address strategy,
            bool isWrapped,
            bool isDelegated
        )
    {
        address vault = _vault;
        isWrapped = wrappedVaults[_vault] != address(0);
        if (isWrapped) {
            vault = wrappedVaults[_vault];
        }
        isDelegated = isDelegatedVault[vault];

        // Get values from controller
        controller = IVault(vault).controller();
        if (isWrapped && IVault(vault).underlying() != address(0)) {
            token = IVault(_vault).token(); // Use non-wrapped vault
        } else {
            token = IVault(vault).token();
        }

        if (isDelegated) {
            strategy = IController(controller).strategies(vault);
        } else {
            strategy = IController(controller).strategies(token);
        }

        // Check if vault is set on controller for token
        address controllerVault = address(0);
        if (isDelegated) {
            controllerVault = IController(controller).vaults(strategy);
        } else {
            controllerVault = IController(controller).vaults(token);
        }
        require(controllerVault == vault, "Controller vault address does not match"); // Might happen on Proxy Vaults

        // Check if strategy has the same token as vault
        if (isWrapped) {
            address underlying = IVault(vault).underlying();
            require(underlying == token, "WrappedVault token address does not match"); // Might happen?
        } else if (!isDelegated) {
            address strategyToken = IStrategy(strategy).want();
            require(token == strategyToken, "Strategy token address does not match"); // Might happen?
        }

        return (controller, token, strategy, isWrapped, isDelegated);
    }

    // Vaults getters
    function getVault(uint256 index) external view returns (address vault) {
        return vaults.get(index);
    }

    function getVaultsLength() external view returns (uint256) {
        return vaults.length();
    }

    function getVaults() external view returns (address[] memory) {
        address[] memory vaultsArray = new address[](vaults.length());
        for (uint256 i = 0; i < vaults.length(); i++) {
            vaultsArray[i] = vaults.get(i);
        }
        return vaultsArray;
    }

    function getVaultInfo(address _vault)
        external
        view
        returns (
            address controller,
            address token,
            address strategy,
            bool isWrapped,
            bool isDelegated
        )
    {
        (controller, token, strategy, isWrapped, isDelegated) = getVaultData(_vault);
        return (controller, token, strategy, isWrapped, isDelegated);
    }

    function getVaultsInfo()
        external
        view
        returns (
            address[] memory vaultsAddresses,
            address[] memory controllerArray,
            address[] memory tokenArray,
            address[] memory strategyArray,
            bool[] memory isWrappedArray,
            bool[] memory isDelegatedArray
        )
    {
        vaultsAddresses = new address[](vaults.length());
        controllerArray = new address[](vaults.length());
        tokenArray = new address[](vaults.length());
        strategyArray = new address[](vaults.length());
        isWrappedArray = new bool[](vaults.length());
        isDelegatedArray = new bool[](vaults.length());

        for (uint256 i = 0; i < vaults.length(); i++) {
            vaultsAddresses[i] = vaults.get(i);
            (address _controller, address _token, address _strategy, bool _isWrapped, bool _isDelegated) = getVaultData(vaults.get(i));
            controllerArray[i] = _controller;
            tokenArray[i] = _token;
            strategyArray[i] = _strategy;
            isWrappedArray[i] = _isWrapped;
            isDelegatedArray[i] = _isDelegated;
        }
    }

    // Governance setters
    function setPendingGovernance(address _pendingGovernance) external onlyGovernance {
        pendingGovernance = _pendingGovernance;
    }

    function acceptGovernance() external onlyPendingGovernance {
        governance = msg.sender;
    }

    modifier onlyGovernance {
        require(msg.sender == governance, "Only governance can call this function.");
        _;
    }
    modifier onlyPendingGovernance {
        require(msg.sender == pendingGovernance, "Only pendingGovernance can call this function.");
        _;
    }
}

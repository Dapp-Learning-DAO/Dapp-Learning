// SPDX-License-Identifier: MIT

pragma solidity ^0.5.17;

import "@openzeppelinV2/contracts/token/ERC20/IERC20.sol";
import "@openzeppelinV2/contracts/math/SafeMath.sol";
import "@openzeppelinV2/contracts/utils/Address.sol";
import "@openzeppelinV2/contracts/token/ERC20/SafeERC20.sol";

import "../../interfaces/yearn/IStrategy.sol";
import "../../interfaces/yearn/IConverter.sol";
import "../../interfaces/yearn/IOneSplitAudit.sol";
import "../../interfaces/yearn/IDelegatedVault.sol";

contract DelegatedController {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address public governance;
    address public onesplit;
    address public rewards;

    // Vault to strategy mapping
    mapping(address => address) public vaults;
    // Strategy to vault mapping
    mapping(address => address) public strategies;

    mapping(address => mapping(address => address)) public converters;

    mapping(address => bool) public isVault;
    mapping(address => bool) public isStrategy;

    uint256 public split = 500;
    uint256 public constant max = 10000;

    constructor(address _rewards) public {
        governance = msg.sender;
        onesplit = address(0x50FDA034C0Ce7a8f7EFDAebDA7Aa7cA21CC1267e);
        rewards = _rewards;
    }

    function setSplit(uint256 _split) external {
        require(msg.sender == governance, "!governance");
        split = _split;
    }

    function setOneSplit(address _onesplit) external {
        require(msg.sender == governance, "!governance");
        onesplit = _onesplit;
    }

    function setGovernance(address _governance) external {
        require(msg.sender == governance, "!governance");
        governance = _governance;
    }

    function setConverter(
        address _input,
        address _output,
        address _converter
    ) external {
        require(msg.sender == governance, "!governance");
        converters[_input][_output] = _converter;
    }

    function setStrategy(address _vault, address _strategy) external {
        require(msg.sender == governance, "!governance");
        address _current = strategies[_vault];
        if (_current != address(0)) {
            IStrategy(_current).withdrawAll();
        }
        strategies[_vault] = _strategy;
        isStrategy[_strategy] = true;
        vaults[_strategy] = _vault;
        isVault[_vault] = true;
    }

    function want(address _vault) external view returns (address) {
        return IStrategy(strategies[_vault]).want();
    }

    function earn(address _vault, uint256 _amount) public {
        address _strategy = strategies[_vault];
        address _want = IStrategy(_strategy).want();
        IERC20(_want).safeTransfer(_strategy, _amount);
        IStrategy(_strategy).deposit();
    }

    function balanceOf(address _vault) external view returns (uint256) {
        return IStrategy(strategies[_vault]).balanceOf();
    }

    function withdrawAll(address _strategy) external {
        require(msg.sender == governance, "!governance");
        // WithdrawAll sends 'want' to 'vault'
        IStrategy(_strategy).withdrawAll();
    }

    function inCaseTokensGetStuck(address _token, uint256 _amount) external {
        require(msg.sender == governance, "!governance");
        IERC20(_token).safeTransfer(governance, _amount);
    }

    function inCaseStrategyGetStruck(address _strategy, address _token) external {
        require(msg.sender == governance, "!governance");
        IStrategy(_strategy).withdraw(_token);
        IERC20(_token).safeTransfer(governance, IERC20(_token).balanceOf(address(this)));
    }

    function getExpectedReturn(
        address _strategy,
        address _token,
        uint256 parts
    ) external view returns (uint256 expected) {
        uint256 _balance = IERC20(_token).balanceOf(_strategy);
        address _want = IStrategy(_strategy).want();
        (expected, ) = IOneSplitAudit(onesplit).getExpectedReturn(_token, _want, _balance, parts, 0);
    }

    function claimInsurance(address _vault) external {
        require(msg.sender == governance, "!governance");
        IDelegatedVault(_vault).claimInsurance();
    }

    // Only allows to withdraw non-core strategy tokens ~ this is over and above normal yield
    function delegatedHarvest(address _strategy, uint256 parts) external {
        // This contract should never have value in it, but just incase since this is a public call
        address _have = IStrategy(_strategy).want();
        uint256 _before = IERC20(_have).balanceOf(address(this));
        IStrategy(_strategy).skim();
        uint256 _after = IERC20(_have).balanceOf(address(this));
        if (_after > _before) {
            uint256 _amount = _after.sub(_before);
            address _want = IDelegatedVault(vaults[_strategy]).token();
            uint256[] memory _distribution;
            uint256 _expected;
            _before = IERC20(_want).balanceOf(address(this));
            IERC20(_have).safeApprove(onesplit, 0);
            IERC20(_have).safeApprove(onesplit, _amount);
            (_expected, _distribution) = IOneSplitAudit(onesplit).getExpectedReturn(_have, _want, _amount, parts, 0);
            IOneSplitAudit(onesplit).swap(_have, _want, _amount, _expected, _distribution, 0);
            _after = IERC20(_want).balanceOf(address(this));
            if (_after > _before) {
                _amount = _after.sub(_before);
                uint256 _reward = _amount.mul(split).div(max);
                IERC20(_want).safeTransfer(vaults[_strategy], _amount.sub(_reward));
                IERC20(_want).safeTransfer(rewards, _reward);
            }
        }
    }

    // Only allows to withdraw non-core strategy tokens ~ this is over and above normal yield
    function harvest(
        address _strategy,
        address _token,
        uint256 parts
    ) external {
        // This contract should never have value in it, but just incase since this is a public call
        uint256 _before = IERC20(_token).balanceOf(address(this));
        IStrategy(_strategy).withdraw(_token);
        uint256 _after = IERC20(_token).balanceOf(address(this));
        if (_after > _before) {
            uint256 _amount = _after.sub(_before);
            address _want = IStrategy(_strategy).want();
            uint256[] memory _distribution;
            uint256 _expected;
            _before = IERC20(_want).balanceOf(address(this));
            IERC20(_token).safeApprove(onesplit, 0);
            IERC20(_token).safeApprove(onesplit, _amount);
            (_expected, _distribution) = IOneSplitAudit(onesplit).getExpectedReturn(_token, _want, _amount, parts, 0);
            IOneSplitAudit(onesplit).swap(_token, _want, _amount, _expected, _distribution, 0);
            _after = IERC20(_want).balanceOf(address(this));
            if (_after > _before) {
                _amount = _after.sub(_before);
                uint256 _reward = _amount.mul(split).div(max);
                earn(_want, _amount.sub(_reward));
                IERC20(_want).safeTransfer(rewards, _reward);
            }
        }
    }

    function withdraw(address _vault, uint256 _amount) external {
        require(isVault[msg.sender] == true, "!vault");
        IStrategy(strategies[_vault]).withdraw(_amount);
    }
}

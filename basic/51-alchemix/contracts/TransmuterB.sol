pragma solidity 0.6.12;

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IERC20Burnable.sol";
import {YearnVaultAdapterWithIndirection} from "./adapters/YearnVaultAdapterWithIndirection.sol";
import {VaultWithIndirection} from "./libraries/alchemist/VaultWithIndirection.sol";
import {ITransmuter} from "./interfaces/ITransmuter.sol";

//    ___    __        __                _               ___                              __         _ 
//   / _ |  / / ____  / /  ___   __ _   (_) __ __       / _ \  ____ ___   ___ ___   ___  / /_  ___  (_)
//  / __ | / / / __/ / _ \/ -_) /  ' \ / /  \ \ /      / ___/ / __// -_) (_-</ -_) / _ \/ __/ (_-< _
// /_/ |_|/_/  \__/ /_//_/\__/ /_/_/_//_/  /_\_\      /_/    /_/   \__/ /___/\__/ /_//_/\__/ /___/(_)
//
// .___________..______           ___      .__   __.      _______..___  ___.  __    __  .___________. _______ .______
// |           ||   _  \         /   \     |  \ |  |     /       ||   \/   | |  |  |  | |           ||   ____||   _  \
// `---|  |----`|  |_)  |       /  ^  \    |   \|  |    |   (----`|  \  /  | |  |  |  | `---|  |----`|  |__   |  |_)  |
//     |  |     |      /       /  /_\  \   |  . `  |     \   \    |  |\/|  | |  |  |  |     |  |     |   __|  |      /
//     |  |     |  |\  \----. /  _____  \  |  |\   | .----)   |   |  |  |  | |  `--'  |     |  |     |  |____ |  |\  \----.
//     |__|     | _| `._____|/__/     \__\ |__| \__| |_______/    |__|  |__|  \______/      |__|     |_______|| _| `._____|
/**
 * @dev Implementation of the {IERC20Burnable} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 * For a generic mechanism see {ERC20PresetMinterPauser}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * We have followed general OpenZeppelin guidelines: functions revert instead
 * of returning `false` on failure. This behavior is nonetheless conventional
 * and does not conflict with the expectations of ERC20 applications.
 *
 * Additionally, an {Approval} event is emitted on calls to {transferFrom}.
 * This allows applications to reconstruct the allowance for all accounts just
 * by listening to said events. Other implementations of the EIP may not emit
 * these events, as it isn't required by the specification.
 *
 * Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
 * functions have been added to mitigate the well-known issues around setting
 * allowances. See {IERC20Burnable-approve}.
 */
contract TransmuterB is Context {
    using SafeMath for uint256;
    using SafeERC20 for IERC20Burnable;
    using Address for address;
    using VaultWithIndirection for VaultWithIndirection.Data;
    using VaultWithIndirection for VaultWithIndirection.List;

    address public constant ZERO_ADDRESS = address(0);
    uint256 public transmutationPeriod;

    address public alToken;
    address public token;

    mapping(address => uint256) public depositedAlTokens;
    mapping(address => uint256) public tokensInBucket;
    mapping(address => uint256) public realisedTokens;
    mapping(address => uint256) public lastDividendPoints;

    mapping(address => bool) public userIsKnown;
    mapping(uint256 => address) public userList;
    uint256 public nextUser;

    uint256 public totalSupplyAltokens;
    uint256 public buffer;
    uint256 public lastDepositBlock;

    ///@dev values needed to calculate the distribution of base asset in proportion for alTokens staked
    uint256 public pointMultiplier = 10e18;

    uint256 public totalDividendPoints;
    uint256 public unclaimedDividends;

    /// @dev alchemist addresses whitelisted
    mapping (address => bool) public whiteList;

    /// @dev addresses whitelisted to run keepr jobs (harvest)
    mapping (address => bool) public keepers;

    /// @dev The threshold above which excess funds will be deployed to yield farming activities
    uint256 public plantableThreshold = 5000000000000000000000000; // 5mm

    /// @dev The % margin to trigger planting or recalling of funds
    uint256 public plantableMargin = 5;

    /// @dev The address of the account which currently has administrative capabilities over this contract.
    address public governance;

    /// @dev The address of the pending governance.
    address public pendingGovernance;

    /// @dev The address of the account which can perform emergency activities
    address public sentinel;

    /// @dev A flag indicating if deposits and flushes should be halted and if all parties should be able to recall
    /// from the active vault.
    bool public pause;

    /// @dev The address of the contract which will receive fees.
    address public rewards;

    /// @dev A mapping of adapter addresses to keep track of vault adapters that have already been added
    mapping(YearnVaultAdapterWithIndirection => bool) public adapters;

    /// @dev A list of all of the vaults. The last element of the list is the vault that is currently being used for
    /// deposits and withdraws. VaultWithIndirections before the last element are considered inactive and are expected to be cleared.
    VaultWithIndirection.List private _vaults;

    /// @dev make sure the contract is only initialized once.
    bool public initialized;

    /// @dev mapping of user account to the last block they acted
    mapping(address => uint256) public lastUserAction;

    /// @dev number of blocks to delay between allowed user actions
    uint256 public minUserActionDelay;

    event GovernanceUpdated(
        address governance
    );

    event PendingGovernanceUpdated(
        address pendingGovernance
    );

    event SentinelUpdated(
        address sentinel
    );

    event TransmuterPeriodUpdated(
        uint256 newTransmutationPeriod
    );

    event TokenClaimed(
        address claimant,
        address token,
        uint256 amountClaimed
    );

    event AlUsdStaked(
        address staker,
        uint256 amountStaked
    );

    event AlUsdUnstaked(
        address staker,
        uint256 amountUnstaked
    );

    event Transmutation(
        address transmutedTo,
        uint256 amountTransmuted
    );

    event ForcedTransmutation(
        address transmutedBy,
        address transmutedTo,
        uint256 amountTransmuted
    );

    event Distribution(
        address origin,
        uint256 amount
    );

    event WhitelistSet(
        address whitelisted,
        bool state
    );

    event KeepersSet(
        address[] keepers,
        bool[] states
    );

    event PlantableThresholdUpdated(
        uint256 plantableThreshold
    );
    
    event PlantableMarginUpdated(
        uint256 plantableMargin
    );

    event MinUserActionDelayUpdated(
        uint256 minUserActionDelay
    );

    event ActiveVaultUpdated(
        YearnVaultAdapterWithIndirection indexed adapter
    );

    event PauseUpdated(
        bool status
    );

    event FundsRecalled(
        uint256 indexed vaultId,
        uint256 withdrawnAmount,
        uint256 decreasedValue
    );

    event FundsHarvested(
        uint256 withdrawnAmount,
        uint256 decreasedValue
    );

    event RewardsUpdated(
        address treasury
    );

    event MigrationComplete(
        address migrateTo,
        uint256 fundsMigrated
    );

    constructor(address _alToken, address _token, address _governance) public {
        require(_governance != ZERO_ADDRESS, "Transmuter: 0 gov");
        governance = _governance;
        alToken = _alToken;
        token = _token;
        transmutationPeriod = 500000;
        minUserActionDelay = 1;
        pause = true;
    }

    ///@return displays the user's share of the pooled alTokens.
    function dividendsOwing(address account) public view returns (uint256) {
        uint256 newDividendPoints = totalDividendPoints.sub(lastDividendPoints[account]);
        return depositedAlTokens[account].mul(newDividendPoints).div(pointMultiplier);
    }

    /// @dev Checks that caller is not a eoa.
    ///
    /// This is used to prevent contracts from interacting.
    modifier noContractAllowed() {
            require(!address(msg.sender).isContract() && msg.sender == tx.origin, "no contract calls");
        _;
    }

    ///@dev modifier to fill the bucket and keep bookkeeping correct incase of increase/decrease in shares
    modifier updateAccount(address account) {
        uint256 owing = dividendsOwing(account);
        if (owing > 0) {
            unclaimedDividends = unclaimedDividends.sub(owing);
            tokensInBucket[account] = tokensInBucket[account].add(owing);
        }
        lastDividendPoints[account] = totalDividendPoints;
        _;
    }
    ///@dev modifier add users to userlist. Users are indexed in order to keep track of when a bond has been filled
    modifier checkIfNewUser() {
        if (!userIsKnown[msg.sender]) {
            userList[nextUser] = msg.sender;
            userIsKnown[msg.sender] = true;
            nextUser++;
        }
        _;
    }

    ///@dev run the phased distribution of the buffered funds
    modifier runPhasedDistribution() {
        uint256 _lastDepositBlock = lastDepositBlock;
        uint256 _currentBlock = block.number;
        uint256 _toDistribute = 0;
        uint256 _buffer = buffer;

        // check if there is something in bufffer
        if (_buffer > 0) {
            // NOTE: if last deposit was updated in the same block as the current call
            // then the below logic gates will fail

            //calculate diffrence in time
            uint256 deltaTime = _currentBlock.sub(_lastDepositBlock);

            // distribute all if bigger than timeframe
            if(deltaTime >= transmutationPeriod) {
                _toDistribute = _buffer;
            } else {

                //needs to be bigger than 0 cuzz solidity no decimals
                if(_buffer.mul(deltaTime) > transmutationPeriod)
                {
                    _toDistribute = _buffer.mul(deltaTime).div(transmutationPeriod);
                }
            }

            // factually allocate if any needs distribution
            if(_toDistribute > 0){

                // remove from buffer
                buffer = _buffer.sub(_toDistribute);

                // increase the allocation
                increaseAllocations(_toDistribute);
            }
        }

        // current timeframe is now the last
        lastDepositBlock = _currentBlock;
        _;
    }

    /// @dev A modifier which checks if whitelisted for minting.
    modifier onlyWhitelisted() {
        require(whiteList[msg.sender], "Transmuter: !whitelisted");
        _;
    }

    /// @dev A modifier which checks if caller is a keepr.
    modifier onlyKeeper() {
        require(keepers[msg.sender], "Transmuter: !keeper");
        _;
    }

    /// @dev Checks that the current message sender or caller is the governance address.
    ///
    ///
    modifier onlyGov() {
        require(msg.sender == governance, "Transmuter: !governance");
        _;
    }

    /// @dev checks that the block delay since a user's last action is longer than the minium delay
    ///
    modifier ensureUserActionDelay() {
        require(block.number.sub(lastUserAction[msg.sender]) >= minUserActionDelay, "action delay not met");
        lastUserAction[msg.sender] = block.number;
        _;
    }

    ///@dev set the transmutationPeriod variable
    ///
    /// sets the length (in blocks) of one full distribution phase
    function setTransmutationPeriod(uint256 newTransmutationPeriod) public onlyGov() {
        transmutationPeriod = newTransmutationPeriod;
        emit TransmuterPeriodUpdated(transmutationPeriod);
    }

    ///@dev claims the base token after it has been transmuted
    ///
    ///This function reverts if there is no realisedToken balance
    function claim() 
        public
        noContractAllowed()
    {
        address sender = msg.sender;
        require(realisedTokens[sender] > 0);
        uint256 value = realisedTokens[sender];
        realisedTokens[sender] = 0;
        ensureSufficientFundsExistLocally(value);
        IERC20Burnable(token).safeTransfer(sender, value);
        emit TokenClaimed(sender, token, value);
    }

    ///@dev Withdraws staked alTokens from the transmuter
    ///
    /// This function reverts if you try to draw more tokens than you deposited
    ///
    ///@param amount the amount of alTokens to unstake
    function unstake(uint256 amount) 
        public
        noContractAllowed()
        updateAccount(msg.sender)
    {
        // by calling this function before transmuting you forfeit your gained allocation
        address sender = msg.sender;
        require(depositedAlTokens[sender] >= amount,"Transmuter: unstake amount exceeds deposited amount");
        depositedAlTokens[sender] = depositedAlTokens[sender].sub(amount);
        totalSupplyAltokens = totalSupplyAltokens.sub(amount);
        IERC20Burnable(alToken).safeTransfer(sender, amount);
        emit AlUsdUnstaked(sender, amount);
    }
    ///@dev Deposits alTokens into the transmuter 
    ///
    ///@param amount the amount of alTokens to stake
    function stake(uint256 amount)
        public
        noContractAllowed()
        ensureUserActionDelay()
        runPhasedDistribution()
        updateAccount(msg.sender)
        checkIfNewUser()
    {
        require(!pause, "emergency pause enabled");

        // requires approval of AlToken first
        address sender = msg.sender;
        //require tokens transferred in;
        IERC20Burnable(alToken).safeTransferFrom(sender, address(this), amount);
        totalSupplyAltokens = totalSupplyAltokens.add(amount);
        depositedAlTokens[sender] = depositedAlTokens[sender].add(amount);
        emit AlUsdStaked(sender, amount);
    }
    /// @dev Converts the staked alTokens to the base tokens in amount of the sum of pendingdivs and tokensInBucket
    ///
    /// once the alToken has been converted, it is burned, and the base token becomes realisedTokens which can be recieved using claim()    
    ///
    /// reverts if there are no pendingdivs or tokensInBucket
    function transmute() 
        public 
        noContractAllowed()
        ensureUserActionDelay()
        runPhasedDistribution() 
        updateAccount(msg.sender) {
        address sender = msg.sender;
        uint256 pendingz = tokensInBucket[sender];
        uint256 diff;

        require(pendingz > 0, "need to have pending in bucket");

        tokensInBucket[sender] = 0;

        // check bucket overflow
        if (pendingz > depositedAlTokens[sender]) {
            diff = pendingz.sub(depositedAlTokens[sender]);

            // remove overflow
            pendingz = depositedAlTokens[sender];
        }

        // decrease altokens
        depositedAlTokens[sender] = depositedAlTokens[sender].sub(pendingz);

        // BURN ALTOKENS
        IERC20Burnable(alToken).burn(pendingz);

        // adjust total
        totalSupplyAltokens = totalSupplyAltokens.sub(pendingz);

        // reallocate overflow
        increaseAllocations(diff);

        // add payout
        realisedTokens[sender] = realisedTokens[sender].add(pendingz);

        emit Transmutation(sender, pendingz);
    }

    /// @dev Executes transmute() on another account that has had more base tokens allocated to it than alTokens staked.
    ///
    /// The caller of this function will have the surlus base tokens credited to their tokensInBucket balance, rewarding them for performing this action
    ///
    /// This function reverts if the address to transmute is not over-filled.
    ///
    /// @param toTransmute address of the account you will force transmute.
    function forceTransmute(address toTransmute)
        public
        noContractAllowed()
        ensureUserActionDelay()
        runPhasedDistribution()
        updateAccount(msg.sender)
        updateAccount(toTransmute)
        checkIfNewUser()
    {
        //load into memory
        address sender = msg.sender;
        uint256 pendingz = tokensInBucket[toTransmute];
        // check restrictions
        require(
            pendingz > depositedAlTokens[toTransmute],
            "Transmuter: !overflow"
        );

        // empty bucket
        tokensInBucket[toTransmute] = 0;

        // calculaate diffrence
        uint256 diff = pendingz.sub(depositedAlTokens[toTransmute]);

        // remove overflow
        pendingz = depositedAlTokens[toTransmute];

        // decrease altokens
        depositedAlTokens[toTransmute] = 0;

        // BURN ALTOKENS
        IERC20Burnable(alToken).burn(pendingz);
        // adjust total
        totalSupplyAltokens = totalSupplyAltokens.sub(pendingz);

        // reallocate overflow
        tokensInBucket[sender] = tokensInBucket[sender].add(diff);

        // add payout
        realisedTokens[toTransmute] = realisedTokens[toTransmute].add(pendingz);

        uint256 value = realisedTokens[toTransmute];

        ensureSufficientFundsExistLocally(value);

        // force payout of realised tokens of the toTransmute address
        realisedTokens[toTransmute] = 0;
        IERC20Burnable(token).safeTransfer(toTransmute, value);
        emit ForcedTransmutation(sender, toTransmute, value);
    }

    /// @dev Transmutes and unstakes all alTokens
    ///
    /// This function combines the transmute and unstake functions for ease of use
    function exit() public noContractAllowed() {
        transmute();
        uint256 toWithdraw = depositedAlTokens[msg.sender];
        unstake(toWithdraw);
    }

    /// @dev Transmutes and claims all converted base tokens.
    ///
    /// This function combines the transmute and claim functions while leaving your remaining alTokens staked.
    function transmuteAndClaim() public noContractAllowed() {
        transmute();
        claim();
    }

    /// @dev Transmutes, claims base tokens, and withdraws alTokens.
    ///
    /// This function helps users to exit the transmuter contract completely after converting their alTokens to the base pair.
    function transmuteClaimAndWithdraw() public noContractAllowed() {
        transmute();
        claim();
        uint256 toWithdraw = depositedAlTokens[msg.sender];
        unstake(toWithdraw);
    }

    /// @dev Distributes the base token proportionally to all alToken stakers.
    ///
    /// This function is meant to be called by the Alchemist contract for when it is sending yield to the transmuter. 
    /// Anyone can call this and add funds, idk why they would do that though...
    ///
    /// @param origin the account that is sending the tokens to be distributed.
    /// @param amount the amount of base tokens to be distributed to the transmuter.
    function distribute(address origin, uint256 amount) public onlyWhitelisted() runPhasedDistribution() {
        require(!pause, "emergency pause enabled");
        IERC20Burnable(token).safeTransferFrom(origin, address(this), amount);
        buffer = buffer.add(amount);
        _plantOrRecallExcessFunds();
        emit Distribution(origin, amount);
    }

    /// @dev Allocates the incoming yield proportionally to all alToken stakers.
    ///
    /// @param amount the amount of base tokens to be distributed in the transmuter.
    function increaseAllocations(uint256 amount) internal {
        if(totalSupplyAltokens > 0 && amount > 0) {
            totalDividendPoints = totalDividendPoints.add(
                amount.mul(pointMultiplier).div(totalSupplyAltokens)
            );
            unclaimedDividends = unclaimedDividends.add(amount);
        } else {
            buffer = buffer.add(amount);
        }
    }

    /// @dev Gets the status of a user's staking position.
    ///
    /// The total amount allocated to a user is the sum of pendingdivs and inbucket.
    ///
    /// @param user the address of the user you wish to query.
    ///
    /// returns user status
    
    function userInfo(address user)
        public
        view
        returns (
            uint256 depositedAl,
            uint256 pendingdivs,
            uint256 inbucket,
            uint256 realised
        )
    {
        uint256 _depositedAl = depositedAlTokens[user];
        uint256 _toDistribute = buffer.mul(block.number.sub(lastDepositBlock)).div(transmutationPeriod);
        if(block.number.sub(lastDepositBlock) > transmutationPeriod){
            _toDistribute = buffer;
        }
        uint256 _pendingdivs = _toDistribute.mul(depositedAlTokens[user]).div(totalSupplyAltokens);
        uint256 _inbucket = tokensInBucket[user].add(dividendsOwing(user));
        uint256 _realised = realisedTokens[user];
        return (_depositedAl, _pendingdivs, _inbucket, _realised);
    }

    /// @dev Gets the status of multiple users in one call
    ///
    /// This function is used to query the contract to check for
    /// accounts that have overfilled positions in order to check 
    /// who can be force transmuted.
    ///
    /// @param from the first index of the userList
    /// @param to the last index of the userList
    ///
    /// returns the userList with their staking status in paginated form. 
    function getMultipleUserInfo(uint256 from, uint256 to)
        public
        view
        returns (address[] memory theUserList, uint256[] memory theUserData)
    {
        uint256 i = from;
        uint256 delta = to - from;
        address[] memory _theUserList = new address[](delta); //user
        uint256[] memory _theUserData = new uint256[](delta * 2); //deposited-bucket
        uint256 y = 0;
        uint256 _toDistribute = buffer.mul(block.number.sub(lastDepositBlock)).div(transmutationPeriod);
        if(block.number.sub(lastDepositBlock) > transmutationPeriod){
            _toDistribute = buffer;
        }
        for (uint256 x = 0; x < delta; x += 1) {
            _theUserList[x] = userList[i];
            _theUserData[y] = depositedAlTokens[userList[i]];
            _theUserData[y + 1] = dividendsOwing(userList[i]).add(tokensInBucket[userList[i]]).add(_toDistribute.mul(depositedAlTokens[userList[i]]).div(totalSupplyAltokens));
            y += 2;
            i += 1;
        }
        return (_theUserList, _theUserData);
    }

    /// @dev Gets info on the buffer
    ///
    /// This function is used to query the contract to get the
    /// latest state of the buffer
    ///
    /// @return _toDistribute the amount ready to be distributed
    /// @return _deltaBlocks the amount of time since the last phased distribution
    /// @return _buffer the amount in the buffer 
    function bufferInfo() public view returns (uint256 _toDistribute, uint256 _deltaBlocks, uint256 _buffer){
        _deltaBlocks = block.number.sub(lastDepositBlock);
        _buffer = buffer; 
        _toDistribute = _buffer.mul(_deltaBlocks).div(transmutationPeriod);
    }

    /// @dev Sets the pending governance.
    ///
    /// This function reverts if the new pending governance is the zero address or the caller is not the current
    /// governance. This is to prevent the contract governance being set to the zero address which would deadlock
    /// privileged contract functionality.
    ///
    /// @param _pendingGovernance the new pending governance.
    function setPendingGovernance(address _pendingGovernance) external onlyGov() {
        require(_pendingGovernance != ZERO_ADDRESS, "Transmuter: 0 gov");

        pendingGovernance = _pendingGovernance;

        emit PendingGovernanceUpdated(_pendingGovernance);
    }

    /// @dev Accepts the role as governance.
    ///
    /// This function reverts if the caller is not the new pending governance.
    function acceptGovernance() external  {
        require(msg.sender == pendingGovernance,"!pendingGovernance");
        address _pendingGovernance = pendingGovernance;
        governance = _pendingGovernance;

        emit GovernanceUpdated(_pendingGovernance);
    }

    /// @dev Sets the whitelist
    ///
    /// This function reverts if the caller is not governance
    ///
    /// @param _toWhitelist the address to alter whitelist permissions.
    /// @param _state the whitelist state.
    function setWhitelist(address _toWhitelist, bool _state) external onlyGov() {
        whiteList[_toWhitelist] = _state;
        emit WhitelistSet(_toWhitelist, _state);
    }

    /// @dev Sets the keeper list
    ///
    /// This function reverts if the caller is not governance
    ///
    /// @param _keepers the accounts to set states for.
    /// @param _states the accounts states.
    function setKeepers(address[] calldata _keepers, bool[] calldata _states) external onlyGov() {
        uint256 n = _keepers.length;
        for(uint256 i = 0; i < n; i++) {
            keepers[_keepers[i]] = _states[i];
        }
        emit KeepersSet(_keepers, _states);
    }

    /// @dev Initializes the contract.
    ///
    /// This function checks that the transmuter and rewards have been set and sets up the active vault.
    ///
    /// @param _adapter the vault adapter of the active vault.
    function initialize(YearnVaultAdapterWithIndirection _adapter) external onlyGov {
        require(!initialized, "Transmuter: already initialized");
        require(rewards != ZERO_ADDRESS, "Transmuter: cannot initialize rewards address to 0x0");

        _updateActiveVault(_adapter);

        initialized = true;
    }

    function migrate(YearnVaultAdapterWithIndirection _adapter) external onlyGov() {
        _updateActiveVault(_adapter);
    }

    /// @dev Updates the active vault.
    ///
    /// This function reverts if the vault adapter is the zero address, if the token that the vault adapter accepts
    /// is not the token that this contract defines as the parent asset, or if the contract has not yet been initialized.
    ///
    /// @param _adapter the adapter for the new active vault.
    function _updateActiveVault(YearnVaultAdapterWithIndirection _adapter) internal {
        require(_adapter != YearnVaultAdapterWithIndirection(ZERO_ADDRESS), "Transmuter: active vault address cannot be 0x0.");
        require(address(_adapter.token()) == token, "Transmuter.vault: token mismatch.");
        require(!adapters[_adapter], "Adapter already in use");
        adapters[_adapter] = true;
        _vaults.push(VaultWithIndirection.Data({
            adapter: _adapter,
            totalDeposited: 0
        }));

        emit ActiveVaultUpdated(_adapter);
    }

    /// @dev Gets the number of vaults in the vault list.
    ///
    /// @return the vault count.
    function vaultCount() external view returns (uint256) {
        return _vaults.length();
    }

    /// @dev Get the adapter of a vault.
    ///
    /// @param _vaultId the identifier of the vault.
    ///
    /// @return the vault adapter.
    function getVaultAdapter(uint256 _vaultId) external view returns (address) {
        VaultWithIndirection.Data storage _vault = _vaults.get(_vaultId);
        return address(_vault.adapter);
    }

    /// @dev Get the total amount of the parent asset that has been deposited into a vault.
    ///
    /// @param _vaultId the identifier of the vault.
    ///
    /// @return the total amount of deposited tokens.
    function getVaultTotalDeposited(uint256 _vaultId) external view returns (uint256) {
        VaultWithIndirection.Data storage _vault = _vaults.get(_vaultId);
        return _vault.totalDeposited;
    }


    /// @dev Recalls funds from active vault if less than amt exist locally
    ///
    /// @param amt amount of funds that need to exist locally to fulfill pending request
    function ensureSufficientFundsExistLocally(uint256 amt) internal {
        uint256 currentBal = IERC20Burnable(token).balanceOf(address(this));
        if (currentBal < amt) {
            uint256 diff = amt - currentBal;
            // get enough funds from active vault to replenish local holdings & fulfill claim request
            _recallExcessFundsFromActiveVault(plantableThreshold.add(diff));
        }
    }

    /// @dev Recalls all planted funds from a target vault
    ///
    /// @param _vaultId the id of the vault from which to recall funds
    function recallAllFundsFromVault(uint256 _vaultId) external {
        require(pause && (msg.sender == governance || msg.sender == sentinel), "Transmuter: not paused, or not governance or sentinel");
        _recallAllFundsFromVault(_vaultId);
    }

    /// @dev Recalls all planted funds from a target vault
    ///
    /// @param _vaultId the id of the vault from which to recall funds
    function _recallAllFundsFromVault(uint256 _vaultId) internal {
        VaultWithIndirection.Data storage _vault = _vaults.get(_vaultId);
        (uint256 _withdrawnAmount, uint256 _decreasedValue) = _vault.withdrawAll(address(this));
        emit FundsRecalled(_vaultId, _withdrawnAmount, _decreasedValue);
    }

    /// @dev Recalls planted funds from a target vault
    ///
    /// @param _vaultId the id of the vault from which to recall funds
    /// @param _amount the amount of funds to recall
    function recallFundsFromVault(uint256 _vaultId, uint256 _amount) external {
        require(pause && (msg.sender == governance || msg.sender == sentinel), "Transmuter: not paused, or not governance or sentinel");
        _recallFundsFromVault(_vaultId, _amount);
    }

    /// @dev Recalls planted funds from a target vault
    ///
    /// @param _vaultId the id of the vault from which to recall funds
    /// @param _amount the amount of funds to recall
    function _recallFundsFromVault(uint256 _vaultId, uint256 _amount) internal {
        VaultWithIndirection.Data storage _vault = _vaults.get(_vaultId);
        (uint256 _withdrawnAmount, uint256 _decreasedValue) = _vault.withdraw(address(this), _amount);
        emit FundsRecalled(_vaultId, _withdrawnAmount, _decreasedValue);
    }

    /// @dev Recalls planted funds from the active vault
    ///
    /// @param _amount the amount of funds to recall
    function _recallFundsFromActiveVault(uint256 _amount) internal {
        _recallFundsFromVault(_vaults.lastIndex(), _amount);
    }

    /// @dev Plants or recalls funds from the active vault
    ///
    /// This function plants excess funds in an external vault, or recalls them from the external vault
    /// Should only be called as part of distribute()
    function _plantOrRecallExcessFunds() internal {
        // check if the transmuter holds more funds than plantableThreshold
        uint256 bal = IERC20Burnable(token).balanceOf(address(this));
        uint256 marginVal = plantableThreshold.mul(plantableMargin).div(100);
        if (bal > plantableThreshold.add(marginVal)) {
            uint256 plantAmt = bal - plantableThreshold;
            // if total funds above threshold, send funds to vault
            VaultWithIndirection.Data storage _activeVault = _vaults.last();
            _activeVault.deposit(plantAmt);
        } else if (bal < plantableThreshold.sub(marginVal)) {
            // if total funds below threshold, recall funds from vault
            // first check that there are enough funds in vault
            uint256 harvestAmt = plantableThreshold - bal;
            _recallExcessFundsFromActiveVault(harvestAmt);
        }
    }

    /// @dev Recalls up to the harvestAmt from the active vault
    ///
    /// This function will recall less than harvestAmt if only less is available
    ///
    /// @param _recallAmt the amount to harvest from the active vault
    function _recallExcessFundsFromActiveVault(uint256 _recallAmt) internal {
        VaultWithIndirection.Data storage _activeVault = _vaults.last();
        uint256 activeVaultVal = _activeVault.totalValue();
        if (activeVaultVal < _recallAmt) {
            _recallAmt = activeVaultVal;
        }
        if (_recallAmt > 0) {
            _recallFundsFromActiveVault(_recallAmt);
        }
    }

    /// @dev Sets the address of the sentinel
    ///
    /// @param _sentinel address of the new sentinel
    function setSentinel(address _sentinel) external onlyGov() {
        require(_sentinel != ZERO_ADDRESS, "Transmuter: sentinel address cannot be 0x0.");
        sentinel = _sentinel;
        emit SentinelUpdated(_sentinel);
    }

    /// @dev Sets the threshold of total held funds above which excess funds will be planted in yield farms.
    ///
    /// This function reverts if the caller is not the current governance.
    ///
    /// @param _plantableThreshold the new plantable threshold.
    function setPlantableThreshold(uint256 _plantableThreshold) external onlyGov() {
        plantableThreshold = _plantableThreshold;
        emit PlantableThresholdUpdated(_plantableThreshold);
    }

    /// @dev Sets the plantableThreshold margin for triggering the planting or recalling of funds on harvest
    ///
    /// This function reverts if the caller is not the current governance.
    ///
    /// @param _plantableMargin the new plantable margin.
    function setPlantableMargin(uint256 _plantableMargin) external onlyGov() {
        plantableMargin = _plantableMargin;
        emit PlantableMarginUpdated(_plantableMargin);
    }

    /// @dev Sets the minUserActionDelay 
    ///
    /// This function reverts if the caller is not the current governance.
    ///
    /// @param _minUserActionDelay the new min user action delay.
    function setMinUserActionDelay(uint256 _minUserActionDelay) external onlyGov() {
        minUserActionDelay = _minUserActionDelay;
        emit MinUserActionDelayUpdated(_minUserActionDelay);
    }

    /// @dev Sets if the contract should enter emergency exit mode.
    ///
    /// There are 2 main reasons to pause:
    ///     1. Need to shut down deposits in case of an emergency in one of the vaults
    ///     2. Need to migrate to a new transmuter
    ///
    /// While the transmuter is paused, deposit() and distribute() are disabled
    ///
    /// @param _pause if the contract should enter emergency exit mode.
    function setPause(bool _pause) external {
        require(msg.sender == governance || msg.sender == sentinel, "!(gov || sentinel)");
        pause = _pause;
        emit PauseUpdated(_pause);
    }

    /// @dev Harvests yield from a vault.
    ///
    /// @param _vaultId the identifier of the vault to harvest from.
    ///
    /// @return the amount of funds that were harvested from the vault.
    function harvest(uint256 _vaultId) external onlyKeeper() returns (uint256, uint256) {

        VaultWithIndirection.Data storage _vault = _vaults.get(_vaultId);

        (uint256 _harvestedAmount, uint256 _decreasedValue) = _vault.harvest(rewards);

        emit FundsHarvested(_harvestedAmount, _decreasedValue);

        return (_harvestedAmount, _decreasedValue);
    }

    /// @dev Sets the rewards contract.
    ///
    /// This function reverts if the new rewards contract is the zero address or the caller is not the current governance.
    ///
    /// @param _rewards the new rewards contract.
    function setRewards(address _rewards) external onlyGov() {
        // Check that the rewards address is not the zero address. Setting the rewards to the zero address would break
        // transfers to the address because of `safeTransfer` checks.
        require(_rewards != ZERO_ADDRESS, "Transmuter: rewards address cannot be 0x0.");

        rewards = _rewards;

        emit RewardsUpdated(_rewards);
    }

    /// @dev Migrates transmuter funds to a new transmuter
    ///
    /// @param migrateTo address of the new transmuter
    function migrateFunds(address migrateTo) external onlyGov() {
        require(migrateTo != address(0), "cannot migrate to 0x0");
        require(pause, "migrate: set emergency exit first");

        // leave enough funds to service any pending transmutations
        uint256 totalFunds = IERC20Burnable(token).balanceOf(address(this));
        uint256 migratableFunds = totalFunds.sub(totalSupplyAltokens, "not enough funds to service stakes");
        IERC20Burnable(token).approve(migrateTo, migratableFunds);
        ITransmuter(migrateTo).distribute(address(this), migratableFunds);
        emit MigrationComplete(migrateTo, migratableFunds);
    }

}

pragma solidity ^0.5.0;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/ownership/Ownable.sol';
import "../library/NameFilter.sol";
import "../library/SafeERC20.sol";
import "../library/Governance.sol";
import "../interface/IPlayerBook.sol";

contract PlayerBook is Governance, IPlayerBook {
    using NameFilter for string;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
 
    // register pools       
    mapping (address => bool) public _pools;

    // (addr => pID) returns player id by address
    mapping (address => uint256) public _pIDxAddr;   
    // (name => pID) returns player id by name      
    mapping (bytes32 => uint256) public _pIDxName;    
    // (pID => data) player data     
    mapping (uint256 => Player) public _plyr;      
    // (pID => name => bool) list of names a player owns.  (used so you can change your display name amoungst any name you own)        
    mapping (uint256 => mapping (bytes32 => bool)) public _plyrNames; 
  
    // the  of refrerrals
    uint256 public _totalReferReward;         
    // total number of players
    uint256 public _pID;      
    // total register name count
    uint256 public _totalRegisterCount = 0;

    // the direct refer's reward rate
    uint256 public _refer1RewardRate = 700; //7%
    // the second direct refer's reward rate
    uint256 public _refer2RewardRate = 300; //3%
    // base rate
    uint256 public _baseRate = 10000;

    // base price to register a name
    uint256 public _registrationBaseFee = 100 finney;     
    // register fee count step
    uint256 public _registrationStep = 100;
    // add base price for one step
    uint256 public _stepFee = 100 finney;     

    bytes32 public _defaulRefer ="dego";

    address payable public _teamWallet = 0x6666666666666666666666666666666666666666;
  
    IERC20 public _dego = IERC20(0x0);
   
    struct Player {
        address addr;
        bytes32 name;
        uint8 nameCount;
        uint256 laff;
        uint256 amount;
        uint256 rreward;
        uint256 allReward;
        uint256 lv1Count;
        uint256 lv2Count;
    }

    event eveClaim(uint256 pID, address addr, uint256 reward, uint256 balance );
    event eveBindRefer(uint256 pID, address addr, bytes32 name, uint256 affID, address affAddr, bytes32 affName);
    event eveDefaultPlayer(uint256 pID, address addr, bytes32 name);      
    event eveNewName(uint256 pID, address addr, bytes32 name, uint256 affID, address affAddr, bytes32 affName, uint256 balance  );
    event eveSettle(uint256 pID, uint256 affID, uint256 aff_affID, uint256 affReward, uint256 aff_affReward, uint256 amount);
    event eveAddPool(address addr);
    event eveRemovePool(address addr);


    constructor()
        public
    {
        _pID = 0;
        _totalReferReward = 0;
        addDefaultPlayer(_teamWallet,_defaulRefer);
    }

    /**
     * check address
     */
    modifier validAddress( address addr ) {
        require(addr != address(0x0));
        _;
    }

    /**
     * check pool
     */
    modifier isRegisteredPool(){
        require(_pools[msg.sender],"invalid pool address!");
        _;
    }

    /**
     * contract dego balances
     */
    function balances()
        public
        view
        returns(uint256)
    {
        return (_dego.balanceOf(address(this)));
    }

    // only function for creating additional rewards from dust
    function seize(IERC20 asset) external returns (uint256 balance) {
        require(address(_dego) != address(asset), "forbbiden dego");

        balance = asset.balanceOf(address(this));
        asset.safeTransfer(_teamWallet, balance);
    }

    // get register fee 
    function seizeEth() external  {
        uint256 _currentBalance =  address(this).balance;
        _teamWallet.transfer(_currentBalance);
    }
    
    /**
     * revert invalid transfer action
     */
    function() external payable {
        revert();
    }


    /**
     * registe a pool
     */
    function addPool(address poolAddr)
        onlyGovernance
        public
    {
        require( !_pools[poolAddr], "derp, that pool already been registered");

        _pools[poolAddr] = true;

        emit eveAddPool(poolAddr);
    }
    
    /**
     * remove a pool
     */
    function removePool(address poolAddr)
        onlyGovernance
        public
    {
        require( _pools[poolAddr], "derp, that pool must be registered");

        _pools[poolAddr] = false;

        emit eveRemovePool(poolAddr);
    }

    /**
     * resolve the refer's reward from a player 
     */
    function settleReward(address from, uint256 amount)
        isRegisteredPool()
        validAddress(from)    
        external
        returns (uint256)
    {
         // set up our tx event data and determine if player is new or not
        _determinePID(from);

        uint256 pID = _pIDxAddr[from];
        uint256 affID = _plyr[pID].laff;
        
        if(affID <= 0 ){
            affID = _pIDxName[_defaulRefer];
            _plyr[pID].laff = affID;
        }

        if(amount <= 0){
            return 0;
        }

        uint256 fee = 0;

        // father
        uint256 affReward = (amount.mul(_refer1RewardRate)).div(_baseRate);
        _plyr[affID].rreward = _plyr[affID].rreward.add(affReward);
        _totalReferReward = _totalReferReward.add(affReward);
        fee = fee.add(affReward);


        // grandfather
        uint256 aff_affID = _plyr[affID].laff;
        uint256 aff_affReward = amount.mul(_refer2RewardRate).div(_baseRate);
        if(aff_affID <= 0){
            aff_affID = _pIDxName[_defaulRefer];
        }
        _plyr[aff_affID].rreward = _plyr[aff_affID].rreward.add(aff_affReward);
        _totalReferReward= _totalReferReward.add(aff_affReward);

        _plyr[pID].amount = _plyr[pID].amount.add( amount);

        fee = fee.add(aff_affReward);
       
        emit eveSettle( pID,affID,aff_affID,affReward,aff_affReward,amount);

        return fee;
    }

    /**
     * claim all of the refer reward.
     */
    function claim()
        public
    {
        address addr = msg.sender;
        uint256 pid = _pIDxAddr[addr];
        uint256 reward = _plyr[pid].rreward;

        require(reward > 0,"only have reward");
        
        //reset
        _plyr[pid].allReward = _plyr[pid].allReward.add(reward);
        _plyr[pid].rreward = 0;

        //get reward
        _dego.safeTransfer(addr, reward);
        
        // fire event
        emit eveClaim(_pIDxAddr[addr], addr, reward, balances());
    }


    /**
     * check name string
     */
    function checkIfNameValid(string memory nameStr)
        public
        view
        returns(bool)
    {
        bytes32 name = nameStr.nameFilter();
        if (_pIDxName[name] == 0)
            return (true);
        else 
            return (false);
    }
    
    /**
     * @dev add a default player
     */
    function addDefaultPlayer(address addr, bytes32 name)
        private
    {        
        _pID++;

        _plyr[_pID].addr = addr;
        _plyr[_pID].name = name;
        _plyr[_pID].nameCount = 1;
        _pIDxAddr[addr] = _pID;
        _pIDxName[name] = _pID;
        _plyrNames[_pID][name] = true;

        //fire event
        emit eveDefaultPlayer(_pID,addr,name);        
    }
    
    /**
     * @dev set refer reward rate
     */
    function setReferRewardRate(uint256 refer1Rate, uint256 refer2Rate ) public  
        onlyGovernance
    {
        _refer1RewardRate = refer1Rate;
        _refer2RewardRate = refer2Rate;
    }

    /**
     * @dev set registration step count
     */
    function setRegistrationStep(uint256 registrationStep) public  
        onlyGovernance
    {
        _registrationStep = registrationStep;
    }

    /**
     * @dev set dego contract address
     */
    function setDegoContract(address dego)  public  
        onlyGovernance{
        _dego = IERC20(dego);
    }


    /**
     * @dev registers a name.  UI will always display the last name you registered.
     * but you will still own all previously registered names to use as affiliate 
     * links.
     * - must pay a registration fee.
     * - name must be unique
     * - names will be converted to lowercase
     * - cannot be only numbers
     * - cannot start with 0x 
     * - name must be at least 1 char
     * - max length of 32 characters long
     * - allowed characters: a-z, 0-9
     * -functionhash- 0x921dec21 (using ID for affiliate)
     * -functionhash- 0x3ddd4698 (using address for affiliate)
     * -functionhash- 0x685ffd83 (using name for affiliate)
     * @param nameString players desired name
     * @param affCode affiliate name of who refered you
     * (this might cost a lot of gas)
     */

    function registerNameXName(string memory nameString, string memory affCode)
        public
        payable 
    {

        // make sure name fees paid
        require (msg.value >= this.getRegistrationFee(), "umm.....  you have to pay the name fee");

        // filter name + condition checks
        bytes32 name = NameFilter.nameFilter(nameString);
        // if names already has been used
        require(_pIDxName[name] == 0, "sorry that names already taken");

        // set up address 
        address addr = msg.sender;
         // set up our tx event data and determine if player is new or not
        _determinePID(addr);
        // fetch player id
        uint256 pID = _pIDxAddr[addr];
        // if names already has been used
        require(_plyrNames[pID][name] == false, "sorry that names already taken");

        // add name to player profile, registry, and name book
        _plyrNames[pID][name] = true;
        _pIDxName[name] = pID;   
        _plyr[pID].name = name;
        _plyr[pID].nameCount++;

        _totalRegisterCount++;


        //try bind a refer
        if(_plyr[pID].laff == 0){

            bytes memory tempCode = bytes(affCode);
            bytes32 affName = 0x0;
            if (tempCode.length >= 0) {
                assembly {
                    affName := mload(add(tempCode, 32))
                }
            }

            _bindRefer(addr,affName);
        }
        uint256 affID = _plyr[pID].laff;

        // fire event
        emit eveNewName(pID, addr, name, affID, _plyr[affID].addr, _plyr[affID].name, _registrationBaseFee );
    }
    
    /**
     * @dev bind a refer,if affcode invalid, use default refer
     */  
    function bindRefer( address from, string calldata  affCode )
        isRegisteredPool()
        external
        returns (bool)
    {

        bytes memory tempCode = bytes(affCode);
        bytes32 affName = 0x0;
        if (tempCode.length >= 0) {
            assembly {
                affName := mload(add(tempCode, 32))
            }
        }

        return _bindRefer(from, affName);
    }


    /**
     * @dev bind a refer,if affcode invalid, use default refer
     */  
    function _bindRefer( address from, bytes32  name )
        validAddress(msg.sender)    
        validAddress(from)  
        private
        returns (bool)
    {
        // set up our tx event data and determine if player is new or not
        _determinePID(from);

        // fetch player id
        uint256 pID = _pIDxAddr[from];
        if( _plyr[pID].laff != 0){
            return false;
        }

        if (_pIDxName[name] == 0){
            //unregister name 
            name = _defaulRefer;
        }
      
        uint256 affID = _pIDxName[name];
        if( affID == pID){
            affID = _pIDxName[_defaulRefer];
        }
       
        _plyr[pID].laff = affID;

        //lvcount
        _plyr[affID].lv1Count++;
        uint256 aff_affID = _plyr[affID].laff;
        if(aff_affID != 0 ){
            _plyr[aff_affID].lv2Count++;
        }
        
        // fire event
        emit eveBindRefer(pID, from, name, affID, _plyr[affID].addr, _plyr[affID].name);

        return true;
    }
    
    //
    function _determinePID(address addr)
        private
        returns (bool)
    {
        if (_pIDxAddr[addr] == 0)
        {
            _pID++;
            _pIDxAddr[addr] = _pID;
            _plyr[_pID].addr = addr;
            
            // set the new player bool to true
            return (true);
        } else {
            return (false);
        }
    }
    
    function hasRefer(address from) 
        isRegisteredPool()
        external 
        returns(bool) 
    {
        _determinePID(from);
        uint256 pID =  _pIDxAddr[from];
        return (_plyr[pID].laff > 0);
    }

    
    function getPlayerName(address from)
        external
        view
        returns (bytes32)
    {
        uint256 pID =  _pIDxAddr[from];
        if(_pID==0){
            return "";
        }
        return (_plyr[pID].name);
    }

    function getPlayerLaffName(address from)
        external
        view
        returns (bytes32)
    {
        uint256 pID =  _pIDxAddr[from];
        if(_pID==0){
             return "";
        }

        uint256 aID=_plyr[pID].laff;
        if( aID== 0){
            return "";
        }

        return (_plyr[aID].name);
    }

    function getPlayerInfo(address from)
        external
        view
        returns (uint256,uint256,uint256,uint256)
    {
        uint256 pID = _pIDxAddr[from];
        if(_pID==0){
             return (0,0,0,0);
        }
        return (_plyr[pID].rreward,_plyr[pID].allReward,_plyr[pID].lv1Count,_plyr[pID].lv2Count);
    }

    function getTotalReferReward()
        external
        view
        returns (uint256)
    {
        return(_totalReferReward);
    }

    function getRegistrationFee()
        external
        view
        returns (uint256)
    {
        if( _totalRegisterCount <_registrationStep || _registrationStep == 0){
            return _registrationBaseFee;
        }
        else{
            uint256 step = _totalRegisterCount.div(_registrationStep);
            return _registrationBaseFee.add(step.mul(_stepFee));
        }
    }
}
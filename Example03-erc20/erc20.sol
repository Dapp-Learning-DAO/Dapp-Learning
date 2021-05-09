pragma solidity ^0.4.25;


library Roles {
    struct Role {
        mapping (address => bool) bearer;
    }

    function add(Role storage role, address account) internal {
        require(!has(role, account), "Roles: account already has role");
        role.bearer[account] = true;
    }

    function remove(Role storage role, address account) internal {
        require(has(role, account), "Roles: account does not have role");
        role.bearer[account] = false;
    }

    function has(Role storage role, address account) internal view returns (bool) {
        require(account != address(0), "Roles: account is the zero address");
        return role.bearer[account];
    }
}

library SafeMath {
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;

        return c;
    }
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "SafeMath: modulo by zero");
        return a % b;
    }
}


library Address {
/**
 * Returns whether the target address is a contract
 * @dev This function will return false if invoked during the constructor of a contract,
 * as the code is not actually created until after the constructor finishes.
 * @param account address of the account to check
 * @return whether the target address is a contract
 */
function isContract(address account) internal view returns (bool) {
uint256 size;
// XXX Currently there is no better way to check if there is a contract in an address
// than to check the size of the code at that address.
// for more details about how this works.
// TODO Check this again before the Serenity release, because all addresses will be
// contracts then.
// solhint-disable-next-line no-inline-assembly
assembly { size := extcodesize(account) }
return size > 0;
}
}


contract IssuerRole {
    using Roles for Roles.Role;

    event IssuerAdded(address indexed account);
    event IssuerRemoved(address indexed account);

    Roles.Role private _issuers;

    constructor () internal {
        _addIssuer(msg.sender);
    }

    modifier onlyIssuer() {
        require(isIssuer(msg.sender), "IssuerRole: caller does not have the Issuer role");
        _;
    }

    function isIssuer(address account) public view returns (bool) {
        return _issuers.has(account);
    }

    function addIssuer(address account) public onlyIssuer {
        _addIssuer(account);
    }

    function renounceIssuer() public {
        _removeIssuer(msg.sender);
    }

    function _addIssuer(address account) internal {
        _issuers.add(account);
        emit IssuerAdded(account);
    }

    function _removeIssuer(address account) internal {
        _issuers.remove(account);
        emit IssuerRemoved(account);
    }
}

contract SuspenderRole {
    using Roles for Roles.Role;

    event SuspenderAdded(address indexed account);
    event SuspenderRemoved(address indexed account);

    Roles.Role private _suspenders;

    constructor () internal {
        _addSuspender(msg.sender);
    }

    modifier onlySuspender() {
        require(isSuspender(msg.sender), "SuspenderRole: caller does not have the Suspender role");
        _;
    }

    function isSuspender(address account) public view returns (bool) {
        return _suspenders.has(account);
    }

    function addSuspender(address account) public onlySuspender {
        _addSuspender(account);
    }

    function renounceSuspender() public {
        _removeSuspender(msg.sender);
    }

    function _addSuspender(address account) internal {
        _suspenders.add(account);
        emit SuspenderAdded(account);
    }

    function _removeSuspender(address account) internal {
        _suspenders.remove(account);
        emit SuspenderRemoved(account);
    }
}

contract Suspendable is SuspenderRole {

    event Suspended(address account);
    event UnSuspended(address account);

    bool private _suspended;

    constructor () internal {
        _suspended = false;
    }

    /**
     * @return True if the contract is suspended, false otherwise.
     */
    function suspended() public view returns (bool) {
        return _suspended;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not suspended.
     */
    modifier whenNotSuspended() {
        require(!_suspended, "Suspendable: suspended");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is suspended.
     */
    modifier whenSuspended() {
        require(_suspended, "Suspendable: not suspended");
        _;
    }

    /**
     * @dev Called by a Suspender to suspend, triggers stopped state.
     */
    function suspend() public onlySuspender whenNotSuspended {
        _suspended = true;
        emit Suspended(msg.sender);
    }

    /**
     * @dev Called by a Suspender to unSuspend, returns to normal state.
     */
    function unSuspend() public onlySuspender  whenSuspended {
        _suspended = false;
        emit UnSuspended(msg.sender);
    }
}


contract IBAC001Receiver {
/**
 * @notice Handle the receipt of an NFT
 * @dev The BAC001 smart contract calls this function on the recipient
 */
function onBAC001Received(address operator, address from, uint256 value, string  data)
public returns (bytes4);
}

contract BAC001Holder is IBAC001Receiver {
function onBAC001Received(address, address, uint256, string) public returns (bytes4) {
return this.onBAC001Received.selector;
}
}

/**
 * @title Standard BAC001 asset
 */
contract BAC001  is IssuerRole,Suspendable{
    using SafeMath for uint256;
    using Address for address;

    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowed;
    uint256 private _totalAmount;
    string private _description;
    string private _shortName;
    uint8 private  _minUnit;

    // Equals to `bytes4(keccak256("onBAC001Received(address,address,uint256,string)"))`
    bytes4 private constant _BAC001_RECEIVED = 0x5a47870a;


    event Send(address indexed contractAddress, address indexed from, address indexed to, uint256 value, string data);
    event Approval(address indexed contractAddress, address indexed owner, address indexed spender, uint256 value);


    constructor(string memory description, string memory shortName, uint8  minUnit, uint256  totalAmount) public {
        _description = description;
        _shortName = shortName;
        _minUnit = minUnit;
        _issue(msg.sender, totalAmount * (10 ** uint256(minUnit)),"" );
    }


    function totalAmount() public view returns (uint256) {
        return _totalAmount;
    }

    function balance(address owner) public view returns (uint256) {
        return _balances[owner];
    }

    /**
     * @dev Function to check the amount of assets that an owner allowed to a spender.
     */
    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowed[owner][spender];
    }

    function send(address to, uint256 value , string  data) public whenNotSuspended {
        _send(msg.sender, to, value,data);
    }

    function safeSend(address to, uint256 value , string  data) public whenNotSuspended  {
        send(to, value,data);
        require(_checkOnBAC001Received(msg.sender, to, value, data), "BAC001: send to non BAC001Receiver implementer");

    }


    /**
     * @dev Approve the passed address to spend the specified amount of assets on behalf of msg.sender.
     */
    function approve(address spender, uint256 value) public whenNotSuspended returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    /**
     * @dev Send assets from one address to another.
     */
    function sendFrom(address from, address to, uint256 value, string  data) public whenNotSuspended {
        _send(from, to, value, data);
        _approve(from, msg.sender, _allowed[from][msg.sender].sub(value));

    }


    function safeSendFrom(address from, address to, uint256 value,  string data) public whenNotSuspended {
        sendFrom(from, to, value, data);
        require(_checkOnBAC001Received(from, to, value, data), "BAC001: send to non BAC001Receiver implementer");
    }


    function safeBatchSend( address[] to, uint256[]  values, string  data) public whenNotSuspended {

        // MUST Throw on errors

        require(to.length == values.length, "to and values array lenght must match.");

        for (uint256 i = 0; i < to.length; ++i) {
            require(to[i] != address(0x0), "destination address must be non-zero.");

            safeSend(to[i],values[i],data);
        }
    }



    function _checkOnBAC001Received(address from, address to, uint256 value, string data)
    internal returns (bool)
    {
        if (!to.isContract()) {
            return true;
        }

        bytes4 retval = IBAC001Receiver(to).onBAC001Received(from , to, value, data);
        return (retval == _BAC001_RECEIVED);
    }

    /**
     * @dev Increase the amount of assets that an owner allowed to a spender.
     */
    function increaseAllowance(address spender, uint256 addedValue) public whenNotSuspended returns (bool) {
        _approve(msg.sender, spender, _allowed[msg.sender][spender].add(addedValue));
        return true;
    }

    /**
     * @dev Decrease the amount of assets that an owner allowed to a spender.
     * approve should be called when _allowed[msg.sender][spender] == 0. To decrement
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) public whenNotSuspended returns (bool) {
        _approve(msg.sender, spender, _allowed[msg.sender][spender].sub(subtractedValue));
        return true;
    }

    function destroy(uint256 value,string  data) public {
        _destroy(msg.sender, value, data);
    }

    /**
     * @dev Burns a specific amount of assets from the target address and decrements allowance.
     */
    function destroyFrom(address from, uint256 value, string  data) public {
        _destroyFrom(from, value, data);
    }



    function description() public view returns (string memory) {
        return _description;
    }

    /**
     * @return the shortName of the asset.
     */
    function shortName() public view returns (string memory) {
        return _shortName;
    }

    /**
     * @return the number of minUnit of the asset.
     */
    function minUnit() public view returns (uint8) {
        return _minUnit;
    }


    function issue(address to, uint256 value, string data) public onlyIssuer returns (bool) {
        _issue(to, value, data);
        return true;
    }
    /**
     * @dev Send asset for a specified addresses.
     */
    function _send(address from, address to, uint256 value, string  data) internal {
        require(to != address(0), "BAC001: send to the zero address");

        _balances[from] = _balances[from].sub(value);
        _balances[to] = _balances[to].add(value);
        emit Send(this, from, to, value, data);
    }

    /**
     * @dev Internal function that issues an amount of the asset and assigns it to
     */
    function _issue(address account, uint256 value,  string data) internal {
        require(account != address(0), "BAC001: issue to the zero address");

        _totalAmount = _totalAmount.add(value);
        _balances[account] = _balances[account].add(value);
        emit Send(this, address(0), account, value, data);
    }

    /**
     * @dev Internal function that destroys an amount of the asset of a given
     */
    function _destroy(address account, uint256 value, string  data) internal {
        require(account != address(0), "BAC001: destroy from the zero address");

        _totalAmount = _totalAmount.sub(value);
        _balances[account] = _balances[account].sub(value);
        emit Send(this,account, address(0), value, data);
    }

    /**
     * @dev Approve an address to spend another addresses' assets.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        require(owner != address(0), "BAC001: approve from the zero address");
        require(spender != address(0), "BAC001: approve to the zero address");

        _allowed[owner][spender] = value;
        emit Approval(this, owner, spender, value);
    }

    /**
     * @dev Internal function that destroys an amount of the asset of a given
     */
    function _destroyFrom(address account, uint256 value, string  data) internal {
        _destroy(account, value, data);
        _approve(account, msg.sender, _allowed[account][msg.sender].sub(value));
    }
}

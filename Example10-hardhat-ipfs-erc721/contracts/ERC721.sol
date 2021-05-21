pragma solidity ^0.4.25;

library Counters {
    using SafeMath for uint256;

    struct Counter {
        // This variable should never be directly accessed by users of the library: interactions must be restricted to
        // the library's function. As of Solidity v0.5.2, this cannot be enforced, though there is a proposal to add
        uint256 _value; // default: 0
    }

    function current(Counter storage counter) internal view returns (uint256) {
        return counter._value;
    }

    function increment(Counter storage counter) internal {
        counter._value += 1;
    }

    function decrement(Counter storage counter) internal {
        counter._value = counter._value.sub(1);
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
        // See https://ethereum.stackexchange.com/a/14016/36603
        // for more details about how this works.
        // TODO Check this again before the Serenity release, because all addresses will be
        // contracts then.
        // solhint-disable-next-line no-inline-assembly
        assembly { size := extcodesize(account) }
        return size > 0;
    }
}

contract Register  {
    /*
     * bytes4(keccak256('supportsInterface(bytes4)')) == 0x01ffc9a7
     */
    bytes4 private constant _INTERFACE_ID_ERC721 = 0x01ffc9a7;

    /**
     * @dev Mapping of interface ids to whether or not it's supported.
     */
    mapping(bytes4 => bool) private _supportedInterfaces;

    /**
     * @dev A contract implementing SupportsInterfaceWithLookup
     *
     *
     */
    constructor () internal {
        _registerInterface(_INTERFACE_ID_ERC721);
    }

    /**
     * @dev Implement supportsInterface(bytes4) using a lookup table.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        return _supportedInterfaces[interfaceId];
    }

    /**
     * @dev Internal method for registering an interface.
     */
    function _registerInterface(bytes4 interfaceId) internal {
        require(interfaceId != 0xffffffff, "ERC721: invalid interface id");
        _supportedInterfaces[interfaceId] = true;
    }
}
library Roles {
    struct Role {
        mapping (address => bool) bearer;
    }

    /**
     * @dev Give an account access to this role.
     */
    function add(Role storage role, address account) internal {
        require(!has(role, account), "Roles: account already has role");
        role.bearer[account] = true;
    }

    /**
     * @dev Remove an account's access to this role.
     */
    function remove(Role storage role, address account) internal {
        require(has(role, account), "Roles: account does not have role");
        role.bearer[account] = false;
    }

    /**
     * @dev Check if an account has this role.
     * @return bool
     */
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

contract IERC721Receiver {
    /**
     * @notice Handle the receipt of an NFT
     * @dev The ERC721 smart contract calls this function on the recipient
     */
    function onERC721Received(address operator, address from, uint256 assetId, bytes memory data)
    public returns (bytes4);
}

contract ERC721Holder is IERC721Receiver {
    function onERC721Received(address, address, uint256, bytes memory) public returns (bytes4) {
        return this.onERC721Received.selector;
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

contract ERC721 is Register, IssuerRole,Suspendable, ERC721Holder {
    using SafeMath for uint256;
    using Address for address;
    using Counters for Counters.Counter;

    // Equals to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    bytes4 private constant _ERC721_RECEIVED = 0x31f6f50e;

    // Mapping from asset ID to owner
    mapping (uint256 => address) private _assetOwner;

    // Mapping from asset ID to approved address
    mapping (uint256 => address) private _assetApprovals;

    // Mapping from owner to number of owned asset
    mapping (address => Counters.Counter) private _ownedAssetsCount;

    // Mapping from owner to operator approvals
    mapping (address => mapping (address => bool)) private _operatorApprovals;

    string private _description;

    string private _shortName;

    // Optional mapping for asset URIs
    mapping(uint256 => string) private _assetURIs;

    // Mapping from owner to list of owned asset IDs
    mapping(address => uint256[]) private _ownedAssets;

    // Mapping from asset ID to index of the owner assets list
    mapping(uint256 => uint256) private _ownedAssetsIndex;

    // Array with all asset ids, used for enumeration
    uint256[] private _allAssets;

    // Mapping from asset id to position in the allAssets array
    mapping(uint256 => uint256) private _allAssetsIndex;

    event Send(address indexed contractAddress, address indexed from, address indexed to, uint256  assetId, bytes data);
    event Approval(address indexed contractAddress, address indexed owner, address  approved, uint256  assetId);
    event ApprovalForAll(address indexed contractAddress, address indexed owner, address indexed operator, bool approved);

    // constructor
    constructor(string description, string shortName) public
    {
        _description = description;
        _shortName = shortName;
    }

    /**
     * @dev Gets the balance of the specified address.
     */
    function balance(address owner) public view returns (uint256) {
        require(owner != address(0), "ERC721: balance query for the zero address");
        return _ownedAssetsCount[owner].current();
    }

    /**
     * @dev Gets the owner of the specified asset ID.
     */
    function ownerOf(uint256 assetId) public view returns (address) {
        address owner = _assetOwner[assetId];
        require(owner != address(0), "ERC721: owner query for nonexistent asset");
        return owner;
    }


    function assetOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        require(index < balance(owner), "ERC721Enumerable: owner index out of bounds");
        return _ownedAssets[owner][index];
    }


    function assetByIndex(uint256 index) public view returns (uint256) {
        require(index < totalSupply(), "ERC721Enumerable: global index out of bounds");
        return _allAssets[index];
    }

    /**
     * @dev Approves another address to send the given asset ID
     */
    function approve(address to, uint256 assetId) public whenNotSuspended {
        address owner = ownerOf(assetId);
        require(to != owner, "ERC721: approval to current owner");

        require(msg.sender == owner || isApprovedForAll(owner, msg.sender),
            "ERC721: approve caller is not owner nor approved for all"
        );
        _assetApprovals[assetId] = to;
        emit Approval(this, owner, to, assetId);
    }

    /**
     * @dev Gets the approved address for a asset ID, or zero if no address set
     */
    function getApproved(uint256 assetId) public view returns (address) {
        require(_exists(assetId), "ERC721: approved query for nonexistent asset");
        return _assetApprovals[assetId];
    }

    /**
     * @dev Sets or unsets the approval of a given operator
     */
    function setApprovalForAll(address to, bool approved) public whenNotSuspended {
        require(to != msg.sender, "ERC721: approve to caller");
        _operatorApprovals[msg.sender][to] = approved;
        emit ApprovalForAll(this, msg.sender, to, approved);
    }

    /**
     * @dev Tells whether an operator is approved by a given owner.
     */
    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    /**
     * @dev Sends the ownership of a given asset ID to another address.
     */
    function sendFrom(address from, address to, uint256 assetId, bytes memory data) public whenNotSuspended {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(msg.sender, assetId), "ERC721: send caller is not owner nor approved");
        _sendFrom(from, to, assetId, data);
    }

    // /**
    //  * @dev Safely sends the ownership of a given asset ID to another address
    //  */
    // function safeSendFrom(address from, address to, uint256 assetId) public whenNotSuspended {
    //     safeSendFrom(from, to, assetId, "");
    // }

    /**
     * @dev Safely sends the ownership of a given asset ID to another address
     */
    function safeSendFrom(address from, address to, uint256 assetId, bytes memory data) public whenNotSuspended {
        sendFrom(from, to, assetId, data);
        require(_checkOnERC721Received(from, to, assetId, data), "ERC721: send to non ERC721Receiver implementer");
    }


    function safeBatchSendFrom(address from, address[] to, uint256[] assetId, bytes memory data) public whenNotSuspended {

        require(to.length == assetId.length, "to and assetId array lenght must match.");

        for (uint256 i = 0; i < to.length; ++i) {
            require(to[i] != address(0x0), "destination address must be non-zero.");
            safeSendFrom(from,to[i],assetId[i],data);

        }
    }


    function destroy(uint256 assetId, bytes data) public {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(msg.sender, assetId), "ERC721Burnable: caller is not owner nor approved");
        _destroy(assetId, data);
    }

    function issueWithAssetURI(address to, uint256 assetId, string memory assetURI, bytes data) public onlyIssuer returns (bool) {
        _issue(to, assetId, data);
        _setAssetURI(assetId, assetURI);
        return true;
    }

    function description() external view returns (string memory) {
        return _description;
    }

    function shortName() external view returns (string memory) {
        return _shortName;
    }

    /**
     * @dev Returns an URI for a given asset ID.
     */
    function assetURI(uint256 assetId) external view returns (string memory) {
        require(_exists(assetId), "ERC721Metadata: URI query for nonexistent asset");
        return _assetURIs[assetId];
    }

    /**
     * @dev Internal function to set the asset URI for a given asset.
     */
    function _setAssetURI(uint256 assetId, string memory uri) internal {
        require(_exists(assetId), "ERC721Metadata: URI set of nonexistent asset");
        _assetURIs[assetId] = uri;
    }

    /**
     * @dev Returns whether the specified asset exists.
     */
    function _exists(uint256 assetId) internal view returns (bool) {
        address owner = _assetOwner[assetId];
        return owner != address(0);
    }

    /**
     * @dev Returns whether the given spender can send a given asset ID.
     */
    function _isApprovedOrOwner(address spender, uint256 assetId) internal view returns (bool) {
        require(_exists(assetId), "ERC721: operator query for nonexistent asset");
        address owner = ownerOf(assetId);
        return (spender == owner || getApproved(assetId) == spender || isApprovedForAll(owner, spender));
    }

    /**
     * @dev Internal function to mint a new asset.
     */
    function _issue(address to, uint256 assetId, bytes data) internal {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(assetId), "ERC721: asset already minted");

        _assetOwner[assetId] = to;
        _ownedAssetsCount[to].increment();

        emit Send(this, address(0), to, assetId, data);

        _addAssetToOwnerEnumeration(to, assetId);

        _addAssetToAllAssetsEnumeration(assetId);
    }

    /**
     * @dev Internal function to destroy a specific asset.
     * Reverts if the asset does not exist.
     */
    function _destroy(address owner, uint256 assetId, bytes data) internal {
        require(ownerOf(assetId) == owner, "ERC721: destroy of asset that is not own");

        _clearApproval(assetId);

        _ownedAssetsCount[owner].decrement();
        _assetOwner[assetId] = address(0);

        if (bytes(_assetURIs[assetId]).length != 0) {
            delete _assetURIs[assetId];
        }

        emit Send(this,owner, address(0), assetId, data);

        _removeAssetFromOwnerEnumeration(owner, assetId);
        // Since assetId will be deleted, we can clear its slot in _ownedAssetsIndex to trigger a gas refund
        _ownedAssetsIndex[assetId] = 0;

        _removeAssetFromAllAssetsEnumeration(assetId);
    }


    /**
     * @dev Gets the total amount of assets stored by the contract.
     * @return uint256 representing the total amount of assets
     */
    function totalSupply() public view returns (uint256) {
        return _allAssets.length;
    }



    function _assetsOfOwner(address owner) internal view returns (uint256[] storage) {
        return _ownedAssets[owner];
    }

    /**
     * @dev Private function to add a asset to this extension's ownership-tracking data structures.
     */
    function _addAssetToOwnerEnumeration(address to, uint256 assetId) private {
        _ownedAssetsIndex[assetId] = _ownedAssets[to].length;
        _ownedAssets[to].push(assetId);
    }

    /**
     * @dev Private function to add a asset to this extension's asset tracking data structures.
     */
    function _addAssetToAllAssetsEnumeration(uint256 assetId) private {
        _allAssetsIndex[assetId] = _allAssets.length;
        _allAssets.push(assetId);
    }

    /**
     * @dev Private function to remove a asset from this extension's ownership-tracking data structures. Note that
     */
    function _removeAssetFromOwnerEnumeration(address from, uint256 assetId) private {
        // To prevent a gap in from's assets array, we store the last asset in the index of the asset to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastAssetIndex = _ownedAssets[from].length.sub(1);
        uint256 assetIndex = _ownedAssetsIndex[assetId];

        // When the asset to delete is the last asset, the swap operation is unnecessary
        if (assetIndex != lastAssetIndex) {
            uint256 lastAssetId = _ownedAssets[from][lastAssetIndex];

            _ownedAssets[from][assetIndex] = lastAssetId; // Move the last asset to the slot of the to-delete asset
            _ownedAssetsIndex[lastAssetId] = assetIndex; // Update the moved asset's index
        }

        // This also deletes the contents at the last position of the array
        _ownedAssets[from].length--;

        // Note that _ownedAssetsIndex[assetId] hasn't been cleared: it still points to the old slot (now occupied by
        // lastAssetId, or just over the end of the array if the asset was the last one).
    }

    /**
     * @dev Private function to remove a asset from this extension's asset tracking data structures.
     */
    function _removeAssetFromAllAssetsEnumeration(uint256 assetId) private {
        // To prevent a gap in the assets array, we store the last asset in the index of the asset to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastAssetIndex = _allAssets.length.sub(1);
        uint256 assetIndex = _allAssetsIndex[assetId];

        // When the asset to delete is the last asset, the swap operation is unnecessary. However, since this occurs so
        // rarely (when the last minted asset is destroyt) that we still do the swap here to avoid the gas cost of adding
        // an 'if' statement (like in _removeAssetFromOwnerEnumeration)
        uint256 lastAssetId = _allAssets[lastAssetIndex];

        _allAssets[assetIndex] = lastAssetId; // Move the last asset to the slot of the to-delete asset
        _allAssetsIndex[lastAssetId] = assetIndex; // Update the moved asset's index

        // This also deletes the contents at the last position of the array
        _allAssets.length--;
        _allAssetsIndex[assetId] = 0;
    }

    /**
     * @dev Internal function to destroy a specific asset.
     */
    function _destroy(uint256 assetId, bytes data) internal {
        _destroy(ownerOf(assetId), assetId, data);
    }

    /**
     * @dev Internal function to send ownership of a given asset ID to another address.
     */
    function _sendFrom(address from, address to, uint256 assetId, bytes data) internal {
        require(ownerOf(assetId) == from, "ERC721: send of asset that is not own");
        require(to != address(0), "ERC721: send to the zero address");

        _clearApproval(assetId);
        _ownedAssetsCount[from].decrement();
        _ownedAssetsCount[to].increment();

        _assetOwner[assetId] = to;

        emit Send(this,from, to, assetId, data);

        _removeAssetFromOwnerEnumeration(from, assetId);

        _addAssetToOwnerEnumeration(to, assetId);
    }

    /**
     * @dev Internal function to invoke `onERC721Received` on a target address.
     */
    function _checkOnERC721Received(address from, address to, uint256 assetId, bytes memory _data)
    internal returns (bool)
    {
        if (!to.isContract()) {
            return true;
        }

        bytes4 retval = IERC721Receiver(to).onERC721Received(msg.sender, from, assetId, _data);
        return (retval == _ERC721_RECEIVED);
    }

    /**
     * @dev Private function to clear current approval of a given asset ID.
     */
    function _clearApproval(uint256 assetId) private {
        if (_assetApprovals[assetId] != address(0)) {
            _assetApprovals[assetId] = address(0);
        }
    }
}

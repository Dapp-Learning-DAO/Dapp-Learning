// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./common/meta-transactions/ContentMixin.sol";
import "./common/meta-transactions/NativeMetaTransaction.sol";

contract OwnableDelegateProxy {}

contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}

/**
 * @title ERC1155Tradable
 * ERC1155Tradable - ERC1155 contract that whitelists an operator address, has create and mint functionality, and supports useful standards from OpenZeppelin,
  like _exists(), name(), symbol(), and totalSupply()
 */
contract ERC1155Tradable is
    ContextMixin,
    ERC1155,
    NativeMetaTransaction,
    Ownable,
    Pausable
{
    using Address for address;

    // Proxy registry address
    address public proxyRegistryAddress;
    // Contract name
    string public name;
    // Contract symbol
    string public symbol;

    // Mapping from token ID to account balances
    mapping(uint256 => mapping(address => uint256)) private balances;

    mapping(uint256 => uint256) private _supply;

    constructor(
        string memory _name,
        string memory _symbol,
        address _proxyRegistryAddress
    ) ERC1155("") {
        name = _name;
        symbol = _symbol;
        proxyRegistryAddress = _proxyRegistryAddress;
        _initializeEIP712(name);
    }

    /**
     * @dev Throws if called by any account other than the owner or their proxy
     */
    modifier onlyOwnerOrProxy() {
        require(
            _isOwnerOrProxy(_msgSender()),
            "ERC1155Tradable#onlyOwner: CALLER_IS_NOT_OWNER"
        );
        _;
    }

    /**
     * @dev Throws if called by any account other than _from or their proxy
     */
    modifier onlyApproved(address _from) {
        require(
            _from == _msgSender() || isApprovedForAll(_from, _msgSender()),
            "ERC1155Tradable#onlyApproved: CALLER_NOT_ALLOWED"
        );
        _;
    }

    // 判断_address是否是owner || 是当前合约proxy地址
    function _isOwnerOrProxy(address _address) internal view returns (bool) {
        return owner() == _address || _isProxyForUser(owner(), _address);
    }

    function pause() external onlyOwnerOrProxy {
        _pause();
    }

    function unpause() external onlyOwnerOrProxy {
        _unpause();
    }

    /**
     * @dev See {IERC1155-balanceOf}.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function balanceOf(address account, uint256 id)
        public
        view
        virtual
        override
        returns (uint256)
    {
        require(
            account != address(0),
            "ERC1155: balance query for the zero address"
        );
        return balances[id][account];
    }

    /**
     * @dev See {IERC1155-balanceOfBatch}.
     *
     * Requirements:
     *
     * - `accounts` and `ids` must have the same length.
     */
    function balanceOfBatch(address[] memory accounts, uint256[] memory ids)
        public
        view
        virtual
        override
        returns (uint256[] memory)
    {
        require(
            accounts.length == ids.length,
            "ERC1155: accounts and ids length mismatch"
        );

        uint256[] memory batchBalances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }

        return batchBalances;
    }

    /**
     * @dev Returns the total quantity for a token ID
     * @param _id uint256 ID of the token to query
     * @return amount of token in existence
     */
    function totalSupply(uint256 _id) public view returns (uint256) {
        return _supply[_id];
    }

    /**
     * Override isApprovedForAll to whitelist user's Opensea proxy accounts to enable gas-free listings.
     */
    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override
        returns (bool isOperator)
    {
        // 如果operator是我们创建的proxy地址，那么就返回true
        // Whitelist Opensea proxy contracts for easy trading.
        if (_isProxyForUser(_owner, _operator)) {
            return true;
        }
        return super.isApprovedForAll(_owner, _operator);
    }

    /**
     * @dev See {IERC1155-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual override whenNotPaused onlyApproved(from) {
        require(to != address(0), "ERC1155: transfer to the zero address");

        address operator = _msgSender();

        _beforeTokenTransfer(
            operator,
            from,
            to,
            asSingletonArray(id),
            asSingletonArray(amount),
            data
        );

        uint256 fromBalance = balances[id][from];
        require(
            fromBalance >= amount,
            "ERC1155: insufficient balance for transfer"
        );
        balances[id][from] = fromBalance - amount;
        balances[id][to] += amount;

        emit TransferSingle(operator, from, to, id, amount);

        doSafeTransferAcceptanceCheck(operator, from, to, id, amount, data);
    }

    /**
     * @dev See {IERC1155-safeBatchTransferFrom}.
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual override whenNotPaused onlyApproved(from) {
        require(
            ids.length == amounts.length,
            "ERC1155: IDS_AMOUNTS_LENGTH_MISMATCH"
        );
        require(to != address(0), "ERC1155: transfer to the zero address");

        address operator = _msgSender();

        _beforeTokenTransfer(operator, from, to, ids, amounts, data);

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            uint256 fromBalance = balances[id][from];
            require(
                fromBalance >= amount,
                "ERC1155: insufficient balance for transfer"
            );
            balances[id][from] = fromBalance - amount;
            balances[id][to] += amount;
        }

        emit TransferBatch(operator, from, to, ids, amounts);

        doSafeBatchTransferAcceptanceCheck(
            operator,
            from,
            to,
            ids,
            amounts,
            data
        );
    }

    /**
     * @dev Hook to be called right before minting
     * @param _id          Token ID to mint
     * @param _quantity    Amount of tokens to mint
     */
    function _beforeMint(uint256 _id, uint256 _quantity) internal virtual {}

    /**
     * @dev Mints some amount of tokens to an address
     * @param _to          Address of the future owner of the token
     * @param _id          Token ID to mint
     * @param _quantity    Amount of tokens to mint
     * @param _data        Data to pass if receiver is contract
     */
    function mint(
        address _to,
        uint256 _id,
        uint256 _quantity,
        bytes memory _data
    ) public virtual onlyOwnerOrProxy {
        _mint(_to, _id, _quantity, _data);
    }

    /**
     * @dev Mint tokens for each id in _ids
     * @param _to          The address to mint tokens to
     * @param _ids         Array of ids to mint
     * @param _quantities  Array of amounts of tokens to mint per id
     * @param _data        Data to pass if receiver is contract
     */
    function batchMint(
        address _to,
        uint256[] memory _ids,
        uint256[] memory _quantities,
        bytes memory _data
    ) public virtual onlyOwnerOrProxy {
        _batchMint(_to, _ids, _quantities, _data);
    }

    /**
     * @dev Burns amount of a given token id
     * @param _from          The address to burn tokens from
     * @param _id          Token ID to burn
     * @param _quantity    Amount to burn
     */
    function burn(
        address _from,
        uint256 _id,
        uint256 _quantity
    ) public virtual onlyApproved(_from) {
        _burn(_from, _id, _quantity);
    }

    /**
     * @dev Burns tokens for each id in _ids
     * @param _from          The address to burn tokens from
     * @param _ids         Array of token ids to burn
     * @param _quantities  Array of the amount to be burned
     */
    function batchBurn(
        address _from,
        uint256[] memory _ids,
        uint256[] memory _quantities
    ) public virtual onlyApproved(_from) {
        _burnBatch(_from, _ids, _quantities);
    }

    /**
     * @dev Returns whether the specified token is minted
     * @param _id uint256 ID of the token to query the existence of
     * @return bool whether the token exists
     */
    function exists(uint256 _id) public view returns (bool) {
        return _supply[_id] > 0;
    }

    // Overrides ERC1155 _mint to allow changing birth events to creator transfers,
    // and to set _supply
    function _mint(
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes memory _data
    ) internal virtual override whenNotPaused {
        address operator = _msgSender();

        _beforeTokenTransfer(
            operator,
            address(0),
            _to,
            asSingletonArray(_id),
            asSingletonArray(_amount),
            _data
        );

        _beforeMint(_id, _amount);

        // Add _amount
        balances[_id][_to] += _amount;
        _supply[_id] += _amount;

        // Origin of token will be the _from parameter
        address origin = _origin(_id);

        // Emit event
        emit TransferSingle(operator, origin, _to, _id, _amount);

        // Calling onReceive method if recipient is contract
        doSafeTransferAcceptanceCheck(
            operator,
            origin,
            _to,
            _id,
            _amount,
            _data
        );
    }

    // Overrides ERC1155MintBurn to change the batch birth events to creator transfers, and to set _supply
    function _batchMint(
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        bytes memory _data
    ) internal virtual whenNotPaused {
        require(
            _ids.length == _amounts.length,
            "ERC1155Tradable#batchMint: INVALID_ARRAYS_LENGTH"
        );

        // Number of mints to execute
        uint256 nMint = _ids.length;

        // Origin of tokens will be the _from parameter
        address origin = _origin(_ids[0]);

        address operator = _msgSender();

        _beforeTokenTransfer(operator, address(0), _to, _ids, _amounts, _data);

        // Executing all minting
        for (uint256 i = 0; i < nMint; i++) {
            // Update storage balance
            uint256 id = _ids[i];
            uint256 amount = _amounts[i];
            _beforeMint(id, amount);
            require(
                _origin(id) == origin,
                "ERC1155Tradable#batchMint: MULTIPLE_ORIGINS_NOT_ALLOWED"
            );
            balances[id][_to] += amount;
            _supply[id] += amount;
        }

        // Emit batch mint event
        emit TransferBatch(operator, origin, _to, _ids, _amounts);

        // Calling onReceive method if recipient is contract
        doSafeBatchTransferAcceptanceCheck(
            operator,
            origin,
            _to,
            _ids,
            _amounts,
            _data
        );
    }

    /**
     * @dev Destroys `amount` tokens of token type `id` from `account`
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens of token type `id`.
     */
    function _burn(
        address account,
        uint256 id,
        uint256 amount
    ) internal override whenNotPaused {
        require(account != address(0), "ERC1155#_burn: BURN_FROM_ZERO_ADDRESS");
        require(amount > 0, "ERC1155#_burn: AMOUNT_LESS_THAN_ONE");

        address operator = _msgSender();

        _beforeTokenTransfer(
            operator,
            account,
            address(0),
            asSingletonArray(id),
            asSingletonArray(amount),
            ""
        );

        uint256 accountBalance = balances[id][account];
        require(
            accountBalance >= amount,
            "ERC1155#_burn: AMOUNT_EXCEEDS_BALANCE"
        );
        balances[id][account] = accountBalance - amount;
        _supply[id] -= amount;

        emit TransferSingle(operator, account, address(0), id, amount);
    }

    /**
     * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_burn}.
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     */
    function _burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal override whenNotPaused {
        require(account != address(0), "ERC1155: BURN_FROM_ZERO_ADDRESS");
        require(
            ids.length == amounts.length,
            "ERC1155: IDS_AMOUNTS_LENGTH_MISMATCH"
        );

        address operator = _msgSender();

        _beforeTokenTransfer(operator, account, address(0), ids, amounts, "");

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            uint256 accountBalance = balances[id][account];
            require(
                accountBalance >= amount,
                "ERC1155#_burnBatch: AMOUNT_EXCEEDS_BALANCE"
            );
            balances[id][account] = accountBalance - amount;
            _supply[id] -= amount;
        }

        emit TransferBatch(operator, account, address(0), ids, amounts);
    }

    // Override this to change birth events' _from address
    function _origin(
        uint256 /* _id */
    ) internal view virtual returns (address) {
        return address(0);
    }

    // PROXY HELPER METHODS

    // 判断proxyRegistry.proxies(_user) == _address
    function _isProxyForUser(address _user, address _address)
        internal
        view
        virtual
        returns (bool)
    {
        if (!proxyRegistryAddress.isContract()) {
            return false;
        }
        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        return address(proxyRegistry.proxies(_user)) == _address;
    }

    // Copied from OpenZeppelin
    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/c3ae4790c71b7f53cc8fff743536dcb7031fed74/contracts/token/ERC1155/ERC1155.sol#L394
    function doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) private {
        if (to.isContract()) {
            try
                IERC1155Receiver(to).onERC1155Received(
                    operator,
                    from,
                    id,
                    amount,
                    data
                )
            returns (bytes4 response) {
                if (
                    response != IERC1155Receiver(to).onERC1155Received.selector
                ) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non ERC1155Receiver implementer");
            }
        }
    }

    // Copied from OpenZeppelin
    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/c3ae4790c71b7f53cc8fff743536dcb7031fed74/contracts/token/ERC1155/ERC1155.sol#L417
    function doSafeBatchTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal {
        if (to.isContract()) {
            try
                IERC1155Receiver(to).onERC1155BatchReceived(
                    operator,
                    from,
                    ids,
                    amounts,
                    data
                )
            returns (bytes4 response) {
                if (
                    response !=
                    IERC1155Receiver(to).onERC1155BatchReceived.selector
                ) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non ERC1155Receiver implementer");
            }
        }
    }

    // Copied from OpenZeppelin
    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/c3ae4790c71b7f53cc8fff743536dcb7031fed74/contracts/token/ERC1155/ERC1155.sol#L440
    function asSingletonArray(uint256 element)
        private
        pure
        returns (uint256[] memory)
    {
        uint256[] memory array = new uint256[](1);
        array[0] = element;

        return array;
    }

    /**
     * This is used instead of msg.sender as transactions won't be sent by the original token owner, but by Opensea.
     */
    function _msgSender() internal view override returns (address sender) {
        return ContextMixin.msgSender();
    }
}

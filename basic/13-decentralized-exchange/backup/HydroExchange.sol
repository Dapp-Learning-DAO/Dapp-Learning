/**
 *Submitted for verification at Etherscan.io on 2019-03-11
*/

/*

    Copyright 2019 The Hydro Protocol Foundation

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

*/

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

/// @dev Math operations with safety checks that revert on error
library SafeMath {

    /// @dev Multiplies two numbers, reverts on overflow.
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "MUL_ERROR");

        return c;
    }

    /// @dev Integer division of two numbers truncating the quotient, reverts on division by zero.
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "DIVIDING_ERROR");
        uint256 c = a / b;
        return c;
    }

    /// @dev Subtracts two numbers, reverts on overflow (i.e. if subtrahend is greater than minuend).
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SUB_ERROR");
        uint256 c = a - b;
        return c;
    }

    /// @dev Adds two numbers, reverts on overflow.
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "ADD_ERROR");
        return c;
    }

    /// @dev Divides two numbers and returns the remainder (unsigned integer modulo), reverts when dividing by zero.
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "MOD_ERROR");
        return a % b;
    }
}

/**
 * EIP712 Ethereum typed structured data hashing and signing
 */
contract EIP712 {
    string internal constant DOMAIN_NAME = "Hydro Protocol";

    /**
     * Hash of the EIP712 Domain Separator Schema
     */
    bytes32 public constant EIP712_DOMAIN_TYPEHASH = keccak256(
        abi.encodePacked("EIP712Domain(string name)")
    );

    bytes32 public DOMAIN_SEPARATOR;

    constructor () public {
        DOMAIN_SEPARATOR = keccak256(
            abi.encodePacked(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes(DOMAIN_NAME))
            )
        );
    }

    /**
     * Calculates EIP712 encoding for a hash struct in this EIP712 Domain.
     *
     * @param eip712hash The EIP712 hash struct.
     * @return EIP712 hash applied to this EIP712 Domain.
     */
    function hashEIP712Message(bytes32 eip712hash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, eip712hash));
    }
}

contract LibSignature {

    enum SignatureMethod {
        EthSign,
        EIP712
    }

    /**
     * OrderSignature struct contains typical signature data as v, r, and s with the signature
     * method encoded in as well.
     */
    struct OrderSignature {
        /**
         * Config contains the following values packed into 32 bytes
         * ╔════════════════════╤═══════════════════════════════════════════════════════════╗
         * ║                    │ length(bytes)   desc                                      ║
         * ╟────────────────────┼───────────────────────────────────────────────────────────╢
         * ║ v                  │ 1               the v parameter of a signature            ║
         * ║ signatureMethod    │ 1               SignatureMethod enum value                ║
         * ╚════════════════════╧═══════════════════════════════════════════════════════════╝
         */
        bytes32 config;
        bytes32 r;
        bytes32 s;
    }

    /**
     * Validate a signature given a hash calculated from the order data, the signer, and the
     * signature data passed in with the order.
     *
     * This function will revert the transaction if the signature method is invalid.
     *
     * @param hash Hash bytes calculated by taking the EIP712 hash of the passed order data
     * @param signerAddress The address of the signer
     * @param signature The signature data passed along with the order to validate against
     * @return True if the calculated signature matches the order signature data, false otherwise.
     */
    function isValidSignature(bytes32 hash, address signerAddress, OrderSignature memory signature)
    internal
    pure
    returns (bool)
    {
        uint8 method = uint8(signature.config[1]);
        address recovered;
        uint8 v = uint8(signature.config[0]);

        if (method == uint8(SignatureMethod.EthSign)) {
            recovered = ecrecover(
                keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)),
                v,
                signature.r,
                signature.s
            );
        } else if (method == uint8(SignatureMethod.EIP712)) {
            recovered = ecrecover(hash, v, signature.r, signature.s);
        } else {
            revert("INVALID_SIGN_METHOD");
        }

        return signerAddress == recovered;
    }
}

contract LibMath {
    using SafeMath for uint256;

    /**
     * Check the amount of precision lost by calculating multiple * (numerator / denominator). To
     * do this, we check the remainder and make sure it's proportionally less than 0.1%. So we have:
     *
     *     ((numerator * multiple) % denominator)     1
     *     -------------------------------------- < ----
     *              numerator * multiple            1000
     *
     * To avoid further division, we can move the denominators to the other sides and we get:
     *
     *     ((numerator * multiple) % denominator) * 1000 < numerator * multiple
     *
     * Since we want to return true if there IS a rounding error, we simply flip the sign and our
     * final equation becomes:
     *
     *     ((numerator * multiple) % denominator) * 1000 >= numerator * multiple
     *
     * @param numerator The numerator of the proportion
     * @param denominator The denominator of the proportion
     * @param multiple The amount we want a proportion of
     * @return Boolean indicating if there is a rounding error when calculating the proportion
     */
    function isRoundingError(uint256 numerator, uint256 denominator, uint256 multiple)
    internal
    pure
    returns (bool)
    {
        return numerator.mul(multiple).mod(denominator).mul(1000) >= numerator.mul(multiple);
    }

    /// @dev calculate "multiple * (numerator / denominator)", rounded down.
    /// revert when there is a rounding error.
    /**
     * Takes an amount (multiple) and calculates a proportion of it given a numerator/denominator
     * pair of values. The final value will be rounded down to the nearest integer value.
     *
     * This function will revert the transaction if rounding the final value down would lose more
     * than 0.1% precision.
     *
     * @param numerator The numerator of the proportion
     * @param denominator The denominator of the proportion
     * @param multiple The amount we want a proportion of
     * @return The final proportion of multiple rounded down
     */
    function getPartialAmountFloor(uint256 numerator, uint256 denominator, uint256 multiple)
    internal
    pure
    returns (uint256)
    {
        require(!isRoundingError(numerator, denominator, multiple), "ROUNDING_ERROR");
        return numerator.mul(multiple).div(denominator);
    }

    /**
     * Returns the smaller integer of the two passed in.
     *
     * @param a Unsigned integer
     * @param b Unsigned integer
     * @return The smaller of the two integers
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}

contract LibOrder is EIP712, LibSignature, LibMath {

    uint256 public constant REBATE_RATE_BASE = 100;

    struct Order {
        address trader;
        address relayer;
        address baseToken;
        address quoteToken;
        uint256 baseTokenAmount;
        uint256 quoteTokenAmount;
        uint256 gasTokenAmount;

        /**
         * Data contains the following values packed into 32 bytes
         * ╔════════════════════╤═══════════════════════════════════════════════════════════╗
         * ║                    │ length(bytes)   desc                                      ║
         * ╟────────────────────┼───────────────────────────────────────────────────────────╢
         * ║ version            │ 1               order version                             ║
         * ║ side               │ 1               0: buy, 1: sell                           ║
         * ║ isMarketOrder      │ 1               0: limitOrder, 1: marketOrder             ║
         * ║ expiredAt          │ 5               order expiration time in seconds          ║
         * ║ asMakerFeeRate     │ 2               maker fee rate (base 100,000)             ║
         * ║ asTakerFeeRate     │ 2               taker fee rate (base 100,000)             ║
         * ║ makerRebateRate    │ 2               rebate rate for maker (base 100)          ║
         * ║ salt               │ 8               salt                                      ║
         * ║ isMakerOnly        │ 1               is maker only                             ║
         * ║                    │ 9               reserved                                  ║
         * ╚════════════════════╧═══════════════════════════════════════════════════════════╝
         */
        bytes32 data;
    }

    enum OrderStatus {
        EXPIRED,
        CANCELLED,
        FILLABLE,
        FULLY_FILLED
    }

    bytes32 public constant EIP712_ORDER_TYPE = keccak256(
        abi.encodePacked(
            "Order(address trader,address relayer,address baseToken,address quoteToken,uint256 baseTokenAmount,uint256 quoteTokenAmount,uint256 gasTokenAmount,bytes32 data)"
        )
    );

    /**
     * Calculates the Keccak-256 EIP712 hash of the order using the Hydro Protocol domain.
     *
     * @param order The order data struct.
     * @return Fully qualified EIP712 hash of the order in the Hydro Protocol domain.
     */
    function getOrderHash(Order memory order) internal view returns (bytes32 orderHash) {
        orderHash = hashEIP712Message(hashOrder(order));
        return orderHash;
    }

    /**
     * Calculates the EIP712 hash of the order.
     *
     * @param order The order data struct.
     * @return Hash of the order.
     */
    function hashOrder(Order memory order) internal pure returns (bytes32 result) {
        /**
         * Calculate the following hash in solidity assembly to save gas.
         *
         * keccak256(
         *     abi.encodePacked(
         *         EIP712_ORDER_TYPE,
         *         bytes32(order.trader),
         *         bytes32(order.relayer),
         *         bytes32(order.baseToken),
         *         bytes32(order.quoteToken),
         *         order.baseTokenAmount,
         *         order.quoteTokenAmount,
         *         order.gasTokenAmount,
         *         order.data
         *     )
         * );
         */

        bytes32 orderType = EIP712_ORDER_TYPE;

        assembly {
            let start := sub(order, 32)
            let tmp := mload(start)

        // 288 = (1 + 8) * 32
        //
        // [0...32)   bytes: EIP712_ORDER_TYPE
        // [32...288) bytes: order
            mstore(start, orderType)
            result := keccak256(start, 288)

            mstore(start, tmp)
        }

        return result;
    }

    /* Functions to extract info from data bytes in Order struct */

    function getOrderVersion(bytes32 data) internal pure returns (uint256) {
        return uint256(byte(data));
    }

    function getExpiredAtFromOrderData(bytes32 data) internal pure returns (uint256) {
        return uint256(bytes5(data << (8*3)));
    }

    function isSell(bytes32 data) internal pure returns (bool) {
        return data[1] == 1;
    }

    function isMarketOrder(bytes32 data) internal pure returns (bool) {
        return data[2] == 1;
    }

    function isMakerOnly(bytes32 data) internal pure returns (bool) {
        return data[22] == 1;
    }

    function isMarketBuy(bytes32 data) internal pure returns (bool) {
        return !isSell(data) && isMarketOrder(data);
    }

    function getAsMakerFeeRateFromOrderData(bytes32 data) internal pure returns (uint256) {
        return uint256(bytes2(data << (8*8)));
    }

    function getAsTakerFeeRateFromOrderData(bytes32 data) internal pure returns (uint256) {
        return uint256(bytes2(data << (8*10)));
    }

    function getMakerRebateRateFromOrderData(bytes32 data) internal pure returns (uint256) {
        uint256 makerRebate = uint256(bytes2(data << (8*12)));

        // make sure makerRebate will never be larger than REBATE_RATE_BASE, which is 100
        return min(makerRebate, REBATE_RATE_BASE);
    }
}

/**
 * @title LibRelayer provides two distinct features for relayers.
 *
 * First, Relayers can opt into or out of the Hydro liquidity incentive system.
 *
 * Second, a relayer can register a delegate address.
 * Delegates can send matching requests on behalf of relayers.
 * The delegate scheme allows additional possibilities for smart contract interaction.
 * on behalf of the relayer.
 */
contract LibRelayer {

    /**
     * Mapping of relayerAddress => delegateAddress
     */
    mapping (address => mapping (address => bool)) public relayerDelegates;

    /**
     * Mapping of relayerAddress => whether relayer is opted out of the liquidity incentive system
     */
    mapping (address => bool) hasExited;

    event RelayerApproveDelegate(address indexed relayer, address indexed delegate);
    event RelayerRevokeDelegate(address indexed relayer, address indexed delegate);

    event RelayerExit(address indexed relayer);
    event RelayerJoin(address indexed relayer);

    /**
     * Approve an address to match orders on behalf of msg.sender
     */
    function approveDelegate(address delegate) external {
        relayerDelegates[msg.sender][delegate] = true;
        emit RelayerApproveDelegate(msg.sender, delegate);
    }

    /**
     * Revoke an existing delegate
     */
    function revokeDelegate(address delegate) external {
        relayerDelegates[msg.sender][delegate] = false;
        emit RelayerRevokeDelegate(msg.sender, delegate);
    }

    /**
     * @return true if msg.sender is allowed to match orders which belong to relayer
     */
    function canMatchOrdersFrom(address relayer) public view returns(bool) {
        return msg.sender == relayer || relayerDelegates[relayer][msg.sender] == true;
    }

    /**
     * Join the Hydro incentive system.
     */
    function joinIncentiveSystem() external {
        delete hasExited[msg.sender];
        emit RelayerJoin(msg.sender);
    }

    /**
     * Exit the Hydro incentive system.
     * For relayers that choose to opt-out, the Hydro Protocol
     * effective becomes a tokenless protocol.
     */
    function exitIncentiveSystem() external {
        hasExited[msg.sender] = true;
        emit RelayerExit(msg.sender);
    }

    /**
     * @return true if relayer is participating in the Hydro incentive system.
     */
    function isParticipant(address relayer) public view returns(bool) {
        return !hasExited[relayer];
    }
}

/// @title Ownable
/// @dev The Ownable contract has an owner address, and provides basic authorization control
/// functions, this simplifies the implementation of "user permissions".
contract LibOwnable {
    address private _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /// @dev The Ownable constructor sets the original `owner` of the contract to the sender account.
    constructor() internal {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    /// @return the address of the owner.
    function owner() public view returns(address) {
        return _owner;
    }

    /// @dev Throws if called by any account other than the owner.
    modifier onlyOwner() {
        require(isOwner(), "NOT_OWNER");
        _;
    }

    /// @return true if `msg.sender` is the owner of the contract.
    function isOwner() public view returns(bool) {
        return msg.sender == _owner;
    }

    /// @dev Allows the current owner to relinquish control of the contract.
    /// @notice Renouncing to ownership will leave the contract without an owner.
    /// It will not be possible to call the functions with the `onlyOwner`
    /// modifier anymore.
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /// @dev Allows the current owner to transfer control of the contract to a newOwner.
    /// @param newOwner The address to transfer ownership to.
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "INVALID_OWNER");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

/**
 * Library to handle fee discount calculation
 */
contract LibDiscount is LibOwnable {
    using SafeMath for uint256;

    // The base discounted rate is 100% of the current rate, or no discount.
    uint256 public constant DISCOUNT_RATE_BASE = 100;

    address public hotTokenAddress;

    constructor(address _hotTokenAddress) internal {
        hotTokenAddress = _hotTokenAddress;
    }

    /**
     * Get the HOT token balance of an address.
     *
     * @param owner The address to check.
     * @return The HOT balance for the owner address.
     */
    function getHotBalance(address owner) internal view returns (uint256 result) {
        address hotToken = hotTokenAddress;

        // IERC20(hotTokenAddress).balanceOf(owner)

        /**
         * We construct calldata for the `balanceOf` ABI.
         * The layout of this calldata is in the table below.
         *
         * ╔════════╤════════╤════════╤═══════════════════╗
         * ║ Area   │ Offset │ Length │ Contents          ║
         * ╟────────┼────────┼────────┼───────────────────╢
         * ║ Header │ 0      │ 4      │ function selector ║
         * ║ Params │ 4      │ 32     │ owner address     ║
         * ╚════════╧════════╧════════╧═══════════════════╝
         */
        assembly {
        // Keep these so we can restore stack memory upon completion
            let tmp1 := mload(0)
            let tmp2 := mload(4)

        // keccak256('balanceOf(address)') bitmasked to 4 bytes
            mstore(0, 0x70a0823100000000000000000000000000000000000000000000000000000000)
            mstore(4, owner)

        // No need to check the return value because hotToken is a trustworthy contract
            result := call(
            gas,      // Forward all gas
            hotToken, // HOT token deployment address
            0,        // Don't send any ETH
            0,        // Pointer to start of calldata
            36,       // Length of calldata
            0,        // Overwrite calldata with output
            32        // Expecting uint256 output, the token balance
            )
            result := mload(0)

        // Restore stack memory
            mstore(0, tmp1)
            mstore(4, tmp2)
        }
    }

    bytes32 public discountConfig = 0x043c000027106400004e205a000075305000009c404600000000000000000000;

    /**
     * Calculate and return the rate at which fees will be charged for an address. The discounted
     * rate depends on how much HOT token is owned by the user. Values returned will be a percentage
     * used to calculate how much of the fee is paid, so a return value of 100 means there is 0
     * discount, and a return value of 70 means a 30% rate reduction.
     *
     * The discountConfig is defined as such:
     * ╔═══════════════════╤════════════════════════════════════════════╗
     * ║                   │ length(bytes)   desc                       ║
     * ╟───────────────────┼────────────────────────────────────────────╢
     * ║ count             │ 1               the count of configs       ║
     * ║ maxDiscountedRate │ 1               the max discounted rate    ║
     * ║ config            │ 5 each                                     ║
     * ╚═══════════════════╧════════════════════════════════════════════╝
     *
     * The default discount structure as defined in code would give the following result:
     *
     * Fee discount table
     * ╔════════════════════╤══════════╗
     * ║     HOT BALANCE    │ DISCOUNT ║
     * ╠════════════════════╪══════════╣
     * ║     0 <= x < 10000 │     0%   ║
     * ╟────────────────────┼──────────╢
     * ║ 10000 <= x < 20000 │    10%   ║
     * ╟────────────────────┼──────────╢
     * ║ 20000 <= x < 30000 │    20%   ║
     * ╟────────────────────┼──────────╢
     * ║ 30000 <= x < 40000 │    30%   ║
     * ╟────────────────────┼──────────╢
     * ║ 40000 <= x         │    40%   ║
     * ╚════════════════════╧══════════╝
     *
     * Breaking down the bytes of 0x043c000027106400004e205a000075305000009c404600000000000000000000
     *
     * 0x  04           3c          0000271064  00004e205a  0000753050  00009c4046  0000000000  0000000000;
     *     ~~           ~~          ~~~~~~~~~~  ~~~~~~~~~~  ~~~~~~~~~~  ~~~~~~~~~~  ~~~~~~~~~~  ~~~~~~~~~~
     *      |            |               |           |           |           |           |           |
     *    count  maxDiscountedRate       1           2           3           4           5           6
     *
     * The first config breaks down as follows:  00002710   64
     *                                           ~~~~~~~~   ~~
     *                                               |      |
     *                                              bar    rate
     *
     * Meaning if a user has less than 10000 (0x00002710) HOT, they will pay 100%(0x64) of the
     * standard fee.
     *
     * @param user The user address to calculate a fee discount for.
     * @return The percentage of the regular fee this user will pay.
     */
    function getDiscountedRate(address user) public view returns (uint256 result) {
        uint256 hotBalance = getHotBalance(user);

        if (hotBalance == 0) {
            return DISCOUNT_RATE_BASE;
        }

        bytes32 config = discountConfig;
        uint256 count = uint256(byte(config));
        uint256 bar;

        // HOT Token has 18 decimals
        hotBalance = hotBalance.div(10**18);

        for (uint256 i = 0; i < count; i++) {
            bar = uint256(bytes4(config << (2 + i * 5) * 8));

            if (hotBalance < bar) {
                result = uint256(byte(config << (2 + i * 5 + 4) * 8));
                break;
            }
        }

        // If we haven't found a rate in the config yet, use the maximum rate.
        if (result == 0) {
            result = uint256(config[1]);
        }

        // Make sure our discount algorithm never returns a higher rate than the base.
        require(result <= DISCOUNT_RATE_BASE, "DISCOUNT_ERROR");
    }

    /**
     * Owner can modify discount configuration.
     *
     * @param newConfig A data blob representing the new discount config. Details on format above.
     */
    function changeDiscountConfig(bytes32 newConfig) external onlyOwner {
        discountConfig = newConfig;
    }
}

contract LibExchangeErrors {
    string constant INVALID_TRADER = "INVALID_TRADER";
    string constant INVALID_SENDER = "INVALID_SENDER";
    // Taker order and maker order can't be matched
    string constant INVALID_MATCH = "INVALID_MATCH";
    string constant INVALID_SIDE = "INVALID_SIDE";
    // Signature validation failed
    string constant INVALID_ORDER_SIGNATURE = "INVALID_ORDER_SIGNATURE";
    // Taker order is not valid
    string constant ORDER_IS_NOT_FILLABLE = "ORDER_IS_NOT_FILLABLE";
    string constant MAKER_ORDER_CAN_NOT_BE_MARKET_ORDER = "MAKER_ORDER_CAN_NOT_BE_MARKET_ORDER";
    string constant TRANSFER_FROM_FAILED = "TRANSFER_FROM_FAILED";
    string constant MAKER_ORDER_OVER_MATCH = "MAKER_ORDER_OVER_MATCH";
    string constant TAKER_ORDER_OVER_MATCH = "TAKER_ORDER_OVER_MATCH";
    string constant ORDER_VERSION_NOT_SUPPORTED = "ORDER_VERSION_NOT_SUPPORTED";

    string constant MAKER_ONLY_ORDER_CANNOT_BE_TAKER = "MAKER_ONLY_ORDER_CANNOT_BE_TAKER";
}

contract HybridExchange is LibMath, LibOrder, LibRelayer, LibDiscount, LibExchangeErrors {
    using SafeMath for uint256;

    uint256 public constant FEE_RATE_BASE = 100000;

    /* Order v2 data is uncompatible with v1. This contract can only handle v2 order. */
    uint256 public constant SUPPORTED_ORDER_VERSION = 2;

    /**
     * Address of the proxy responsible for asset transfer.
     */
    address public proxyAddress;

    /**
     * Mapping of orderHash => amount
     * Generally the amount will be specified in base token units, however in the case of a market
     * buy order the amount is specified in quote token units.
     */
    mapping (bytes32 => uint256) public filled;
    /**
     * Mapping of orderHash => whether order has been cancelled.
     */
    mapping (bytes32 => bool) public cancelled;

    event Cancel(bytes32 indexed orderHash);

    /**
     * When orders are being matched, they will always contain the exact same base token,
     * quote token, and relayer. Since excessive call data is very expensive, we choose
     * to create a stripped down OrderParam struct containing only data that may vary between
     * Order objects, and separate out the common elements into a set of addresses that will
     * be shared among all of the OrderParam items. This is meant to eliminate redundancy in
     * the call data, reducing it's size, and hence saving gas.
     */
    struct OrderParam {
        address trader;
        uint256 baseTokenAmount;
        uint256 quoteTokenAmount;
        uint256 gasTokenAmount;
        bytes32 data;
        OrderSignature signature;
    }

    /**
     * Calculated data about an order object.
     * Generally the filledAmount is specified in base token units, however in the case of a market
     * buy order the filledAmount is specified in quote token units.
     */
    struct OrderInfo {
        bytes32 orderHash;
        uint256 filledAmount;
    }

    struct OrderAddressSet {
        address baseToken;
        address quoteToken;
        address relayer;
    }

    struct MatchResult {
        address maker;
        address taker;
        address buyer;
        uint256 makerFee;
        uint256 makerRebate;
        uint256 takerFee;
        uint256 makerGasFee;
        uint256 takerGasFee;
        uint256 baseTokenFilledAmount;
        uint256 quoteTokenFilledAmount;
    }


    event Match(
        OrderAddressSet addressSet,
        MatchResult result
    );

    constructor(address _proxyAddress, address hotTokenAddress)
    LibDiscount(hotTokenAddress)
    public
    {
        proxyAddress = _proxyAddress;
    }

    /**
     * Match taker order to a list of maker orders. Common addresses are passed in
     * separately as an OrderAddressSet to reduce call size data and save gas.
     *
     * @param takerOrderParam A OrderParam object representing the order from the taker.
     * @param makerOrderParams An array of OrderParam objects representing orders from a list of makers.
     * @param orderAddressSet An object containing addresses common across each order.
     */
    function matchOrders(
        OrderParam memory takerOrderParam,
        OrderParam[] memory makerOrderParams,
        uint256[] memory baseTokenFilledAmounts,
        OrderAddressSet memory orderAddressSet
    ) public {
        require(canMatchOrdersFrom(orderAddressSet.relayer), INVALID_SENDER);
        require(!isMakerOnly(takerOrderParam.data), MAKER_ONLY_ORDER_CANNOT_BE_TAKER);

        bool isParticipantRelayer = isParticipant(orderAddressSet.relayer);
        uint256 takerFeeRate = getTakerFeeRate(takerOrderParam, isParticipantRelayer);
        OrderInfo memory takerOrderInfo = getOrderInfo(takerOrderParam, orderAddressSet);

        // Calculate which orders match for settlement.
        MatchResult[] memory results = new MatchResult[](makerOrderParams.length);

        for (uint256 i = 0; i < makerOrderParams.length; i++) {
            require(!isMarketOrder(makerOrderParams[i].data), MAKER_ORDER_CAN_NOT_BE_MARKET_ORDER);
            require(isSell(takerOrderParam.data) != isSell(makerOrderParams[i].data), INVALID_SIDE);
            validatePrice(takerOrderParam, makerOrderParams[i]);

            OrderInfo memory makerOrderInfo = getOrderInfo(makerOrderParams[i], orderAddressSet);

            results[i] = getMatchResult(
                takerOrderParam,
                takerOrderInfo,
                makerOrderParams[i],
                makerOrderInfo,
                baseTokenFilledAmounts[i],
                takerFeeRate,
                isParticipantRelayer
            );

            // Update amount filled for this maker order.
            filled[makerOrderInfo.orderHash] = makerOrderInfo.filledAmount;
        }

        // Update amount filled for this taker order.
        filled[takerOrderInfo.orderHash] = takerOrderInfo.filledAmount;

        settleResults(results, takerOrderParam, orderAddressSet);
    }

    /**
     * Cancels an order, preventing it from being matched. In practice, matching mode relayers will
     * generally handle cancellation off chain by removing the order from their system, however if
     * the trader wants to ensure the order never goes through, or they no longer trust the relayer,
     * this function may be called to block it from ever matching at the contract level.
     *
     * Emits a Cancel event on success.
     *
     * @param order The order to be cancelled.
     */
    function cancelOrder(Order memory order) public {
        require(order.trader == msg.sender, INVALID_TRADER);

        bytes32 orderHash = getOrderHash(order);
        cancelled[orderHash] = true;

        emit Cancel(orderHash);
    }

    /**
     * Calculates current state of the order. Will revert transaction if this order is not
     * fillable for any reason, or if the order signature is invalid.
     *
     * @param orderParam The OrderParam object containing Order data.
     * @param orderAddressSet An object containing addresses common across each order.
     * @return An OrderInfo object containing the hash and current amount filled
     */
    function getOrderInfo(OrderParam memory orderParam, OrderAddressSet memory orderAddressSet)
    internal
    view
    returns (OrderInfo memory orderInfo)
    {
        require(getOrderVersion(orderParam.data) == SUPPORTED_ORDER_VERSION, ORDER_VERSION_NOT_SUPPORTED);

        Order memory order = getOrderFromOrderParam(orderParam, orderAddressSet);
        orderInfo.orderHash = getOrderHash(order);
        orderInfo.filledAmount = filled[orderInfo.orderHash];
        uint8 status = uint8(OrderStatus.FILLABLE);

        if (!isMarketBuy(order.data) && orderInfo.filledAmount >= order.baseTokenAmount) {
            status = uint8(OrderStatus.FULLY_FILLED);
        } else if (isMarketBuy(order.data) && orderInfo.filledAmount >= order.quoteTokenAmount) {
            status = uint8(OrderStatus.FULLY_FILLED);
        } else if (block.timestamp >= getExpiredAtFromOrderData(order.data)) {
            status = uint8(OrderStatus.EXPIRED);
        } else if (cancelled[orderInfo.orderHash]) {
            status = uint8(OrderStatus.CANCELLED);
        }

        require(status == uint8(OrderStatus.FILLABLE), ORDER_IS_NOT_FILLABLE);
        require(
            isValidSignature(orderInfo.orderHash, orderParam.trader, orderParam.signature),
            INVALID_ORDER_SIGNATURE
        );

        return orderInfo;
    }

    /**
     * Reconstruct an Order object from the given OrderParam and OrderAddressSet objects.
     *
     * @param orderParam The OrderParam object containing the Order data.
     * @param orderAddressSet An object containing addresses common across each order.
     * @return The reconstructed Order object.
     */
    function getOrderFromOrderParam(OrderParam memory orderParam, OrderAddressSet memory orderAddressSet)
    internal
    pure
    returns (Order memory order)
    {
        order.trader = orderParam.trader;
        order.baseTokenAmount = orderParam.baseTokenAmount;
        order.quoteTokenAmount = orderParam.quoteTokenAmount;
        order.gasTokenAmount = orderParam.gasTokenAmount;
        order.data = orderParam.data;
        order.baseToken = orderAddressSet.baseToken;
        order.quoteToken = orderAddressSet.quoteToken;
        order.relayer = orderAddressSet.relayer;
    }

    /**
     * Validates that the maker and taker orders can be matched based on the listed prices.
     *
     * If the taker submitted a sell order, the matching maker order must have a price greater than
     * or equal to the price the taker is willing to sell for.
     *
     * Since the price of an order is computed by order.quoteTokenAmount / order.baseTokenAmount
     * we can establish the following formula:
     *
     *    takerOrder.quoteTokenAmount        makerOrder.quoteTokenAmount
     *   -----------------------------  <=  -----------------------------
     *     takerOrder.baseTokenAmount        makerOrder.baseTokenAmount
     *
     * To avoid precision loss from division, we modify the formula to avoid division entirely.
     * In shorthand, this becomes:
     *
     *   takerOrder.quote * makerOrder.base <= takerOrder.base * makerOrder.quote
     *
     * We can apply this same process to buy orders - if the taker submitted a buy order then
     * the matching maker order must have a price less than or equal to the price the taker is
     * willing to pay. This means we can use the same result as above, but simply flip the
     * sign of the comparison operator.
     *
     * The function will revert the transaction if the orders cannot be matched.
     *
     * @param takerOrderParam The OrderParam object representing the taker's order data
     * @param makerOrderParam The OrderParam object representing the maker's order data
     */
    function validatePrice(OrderParam memory takerOrderParam, OrderParam memory makerOrderParam)
    internal
    pure
    {
        uint256 left = takerOrderParam.quoteTokenAmount.mul(makerOrderParam.baseTokenAmount);
        uint256 right = takerOrderParam.baseTokenAmount.mul(makerOrderParam.quoteTokenAmount);
        require(isSell(takerOrderParam.data) ? left <= right : left >= right, INVALID_MATCH);
    }

    /**
     * Construct a MatchResult from matching taker and maker order data, which will be used when
     * settling the orders and transferring token.
     *
     * @param takerOrderParam The OrderParam object representing the taker's order data
     * @param takerOrderInfo The OrderInfo object representing the current taker order state
     * @param makerOrderParam The OrderParam object representing the maker's order data
     * @param makerOrderInfo The OrderInfo object representing the current maker order state
     * @param takerFeeRate The rate used to calculate the fee charged to the taker
     * @param isParticipantRelayer Whether this relayer is participating in hot discount
     * @return MatchResult object containing data that will be used during order settlement.
     */
    function getMatchResult(
        OrderParam memory takerOrderParam,
        OrderInfo memory takerOrderInfo,
        OrderParam memory makerOrderParam,
        OrderInfo memory makerOrderInfo,
        uint256 baseTokenFilledAmount,
        uint256 takerFeeRate,
        bool isParticipantRelayer
    )
    internal
    view
    returns (MatchResult memory result)
    {
        result.baseTokenFilledAmount = baseTokenFilledAmount;
        result.quoteTokenFilledAmount = convertBaseToQuote(makerOrderParam, baseTokenFilledAmount);

        // Each order only pays gas once, so only pay gas when nothing has been filled yet.
        if (takerOrderInfo.filledAmount == 0) {
            result.takerGasFee = takerOrderParam.gasTokenAmount;
        }

        if (makerOrderInfo.filledAmount == 0) {
            result.makerGasFee = makerOrderParam.gasTokenAmount;
        }

        if(!isMarketBuy(takerOrderParam.data)) {
            takerOrderInfo.filledAmount = takerOrderInfo.filledAmount.add(result.baseTokenFilledAmount);
            require(takerOrderInfo.filledAmount <= takerOrderParam.baseTokenAmount, TAKER_ORDER_OVER_MATCH);
        } else {
            takerOrderInfo.filledAmount = takerOrderInfo.filledAmount.add(result.quoteTokenFilledAmount);
            require(takerOrderInfo.filledAmount <= takerOrderParam.quoteTokenAmount, TAKER_ORDER_OVER_MATCH);
        }

        makerOrderInfo.filledAmount = makerOrderInfo.filledAmount.add(result.baseTokenFilledAmount);
        require(makerOrderInfo.filledAmount <= makerOrderParam.baseTokenAmount, MAKER_ORDER_OVER_MATCH);

        result.maker = makerOrderParam.trader;
        result.taker = takerOrderParam.trader;

        if(isSell(takerOrderParam.data)) {
            result.buyer = result.maker;
        } else {
            result.buyer = result.taker;
        }

        uint256 rebateRate = getMakerRebateRateFromOrderData(makerOrderParam.data);

        if (rebateRate > 0) {
            // If the rebate rate is not zero, maker pays no fees.
            result.makerFee = 0;

            // RebateRate will never exceed REBATE_RATE_BASE, so rebateFee will never exceed the fees paid by the taker.
            result.makerRebate = result.quoteTokenFilledAmount.mul(takerFeeRate).mul(rebateRate).div(
                FEE_RATE_BASE.mul(DISCOUNT_RATE_BASE).mul(REBATE_RATE_BASE)
            );
        } else {
            uint256 makerRawFeeRate = getAsMakerFeeRateFromOrderData(makerOrderParam.data);
            result.makerRebate = 0;

            // maker fee will be reduced, but still >= 0
            uint256 makerFeeRate = getFinalFeeRate(
                makerOrderParam.trader,
                makerRawFeeRate,
                isParticipantRelayer
            );

            result.makerFee = result.quoteTokenFilledAmount.mul(makerFeeRate).div(
                FEE_RATE_BASE.mul(DISCOUNT_RATE_BASE)
            );
        }

        result.takerFee = result.quoteTokenFilledAmount.mul(takerFeeRate).div(
            FEE_RATE_BASE.mul(DISCOUNT_RATE_BASE)
        );
    }

    /**
     * Get the rate used to calculate the taker fee.
     *
     * @param orderParam The OrderParam object representing the taker order data.
     * @param isParticipantRelayer Whether this relayer is participating in hot discount.
     * @return The final potentially discounted rate to use for the taker fee.
     */
    function getTakerFeeRate(OrderParam memory orderParam, bool isParticipantRelayer)
    internal
    view
    returns(uint256)
    {
        uint256 rawRate = getAsTakerFeeRateFromOrderData(orderParam.data);
        return getFinalFeeRate(orderParam.trader, rawRate, isParticipantRelayer);
    }

    /**
     * Take a fee rate and calculate the potentially discounted rate for this trader based on
     * HOT token ownership.
     *
     * @param trader The address of the trader who made the order.
     * @param rate The raw rate which we will discount if needed.
     * @param isParticipantRelayer Whether this relayer is participating in hot discount.
     * @return The final potentially discounted rate.
     */
    function getFinalFeeRate(address trader, uint256 rate, bool isParticipantRelayer)
    internal
    view
    returns(uint256)
    {
        if (isParticipantRelayer) {
            return rate.mul(getDiscountedRate(trader));
        } else {
            return rate.mul(DISCOUNT_RATE_BASE);
        }
    }

    /**
     * Take an amount and convert it from base token units to quote token units based on the price
     * in the order param.
     *
     * @param orderParam The OrderParam object containing the Order data.
     * @param amount An amount of base token.
     * @return The converted amount in quote token units.
     */
    function convertBaseToQuote(OrderParam memory orderParam, uint256 amount)
    internal
    pure
    returns (uint256)
    {
        return getPartialAmountFloor(
            orderParam.quoteTokenAmount,
            orderParam.baseTokenAmount,
            amount
        );
    }

    /**
     * Take an amount and convert it from quote token units to base token units based on the price
     * in the order param.
     *
     * @param orderParam The OrderParam object containing the Order data.
     * @param amount An amount of quote token.
     * @return The converted amount in base token units.
     */
    function convertQuoteToBase(OrderParam memory orderParam, uint256 amount)
    internal
    pure
    returns (uint256)
    {
        return getPartialAmountFloor(
            orderParam.baseTokenAmount,
            orderParam.quoteTokenAmount,
            amount
        );
    }

    /**
     * Take a list of matches and settle them with the taker order, transferring tokens all tokens
     * and paying all fees necessary to complete the transaction.
     *
     * @param results List of MatchResult objects representing each individual trade to settle.
     * @param takerOrderParam The OrderParam object representing the taker order data.
     * @param orderAddressSet An object containing addresses common across each order.
     */
    function settleResults(
        MatchResult[] memory results,
        OrderParam memory takerOrderParam,
        OrderAddressSet memory orderAddressSet
    )
    internal
    {
        if (isSell(takerOrderParam.data)) {
            settleTakerSell(results, orderAddressSet);
        } else {
            settleTakerBuy(results, orderAddressSet);
        }
    }

    /**
     * Settles a sell order given a list of MatchResult objects. A naive approach would be to take
     * each result, have the taker and maker transfer the appropriate tokens, and then have them
     * each send the appropriate fees to the relayer, meaning that for n makers there would be 4n
     * transactions. Additionally the taker would have to have an allowance set for the quote token
     * in order to pay the fees to the relayer.
     *
     * Instead we do the following:
     *  - Taker transfers the required base token to each maker
     *  - Each maker sends an amount of quote token to the relayer equal to:
     *    [Amount owed to taker] + [Maker fee] + [Maker gas cost] - [Maker rebate amount]
     *  - The relayer will then take all of this quote token and in a single batch transaction
     *    send the appropriate amount to the taker, equal to:
     *    [Total amount owed to taker] - [All taker fees] - [All taker gas costs]
     *
     * Thus in the end the taker will have the full amount of quote token, sans the fee and cost of
     * their share of gas. Each maker will have their share of base token, sans the fee and cost of
     * their share of gas, and will keep their rebate in quote token. The relayer will end up with
     * the fees from the taker and each maker (sans rebate), and the gas costs will pay for the
     * transactions. In this scenario, with n makers there will be 2n + 1 transactions, which will
     * be a significant gas savings over the original method.
     *
     * @param results A list of MatchResult objects representing each individual trade to settle.
     * @param orderAddressSet An object containing addresses common across each order.
     */
    function settleTakerSell(MatchResult[] memory results, OrderAddressSet memory orderAddressSet) internal {
        uint256 totalTakerQuoteTokenFilledAmount = 0;

        for (uint256 i = 0; i < results.length; i++) {
            transferFrom(
                orderAddressSet.baseToken,
                results[i].taker,
                results[i].maker,
                results[i].baseTokenFilledAmount
            );

            transferFrom(
                orderAddressSet.quoteToken,
                results[i].maker,
                orderAddressSet.relayer,
                results[i].quoteTokenFilledAmount.
                add(results[i].makerFee).
                add(results[i].makerGasFee).
                sub(results[i].makerRebate)
            );

            totalTakerQuoteTokenFilledAmount = totalTakerQuoteTokenFilledAmount.add(
                results[i].quoteTokenFilledAmount.sub(results[i].takerFee)
            );

            emitMatchEvent(results[i], orderAddressSet);
        }

        transferFrom(
            orderAddressSet.quoteToken,
            orderAddressSet.relayer,
            results[0].taker,
            totalTakerQuoteTokenFilledAmount.sub(results[0].takerGasFee)
        );
    }

    /**
     * Settles a buy order given a list of MatchResult objects. A naive approach would be to take
     * each result, have the taker and maker transfer the appropriate tokens, and then have them
     * each send the appropriate fees to the relayer, meaning that for n makers there would be 4n
     * transactions. Additionally each maker would have to have an allowance set for the quote token
     * in order to pay the fees to the relayer.
     *
     * Instead we do the following:
     *  - Each maker transfers base tokens to the taker
     *  - The taker sends an amount of quote tokens to each maker equal to:
     *    [Amount owed to maker] + [Maker rebate amount] - [Maker fee] - [Maker gas cost]
     *  - Since the taker saved all the maker fees and gas costs, it can then send them as a single
     *    batch transaction to the relayer, equal to:
     *    [All maker and taker fees] + [All maker and taker gas costs] - [All maker rebates]
     *
     * Thus in the end the taker will have the full amount of base token, sans the fee and cost of
     * their share of gas. Each maker will have their share of quote token, including their rebate,
     * but sans the fee and cost of their share of gas. The relayer will end up with the fees from
     * the taker and each maker (sans rebates), and the gas costs will pay for the transactions. In
     * this scenario, with n makers there will be 2n + 1 transactions, which will be a significant
     * gas savings over the original method.
     *
     * @param results A list of MatchResult objects representing each individual trade to settle.
     * @param orderAddressSet An object containing addresses common across each order.
     */
    function settleTakerBuy(MatchResult[] memory results, OrderAddressSet memory orderAddressSet) internal {
        uint256 totalFee = 0;

        for (uint256 i = 0; i < results.length; i++) {
            transferFrom(
                orderAddressSet.baseToken,
                results[i].maker,
                results[i].taker,
                results[i].baseTokenFilledAmount
            );

            transferFrom(
                orderAddressSet.quoteToken,
                results[i].taker,
                results[i].maker,
                results[i].quoteTokenFilledAmount.
                sub(results[i].makerFee).
                sub(results[i].makerGasFee).
                add(results[i].makerRebate)
            );

            totalFee = totalFee.
            add(results[i].takerFee).
            add(results[i].makerFee).
            add(results[i].makerGasFee).
            add(results[i].takerGasFee).
            sub(results[i].makerRebate);

            emitMatchEvent(results[i], orderAddressSet);
        }

        transferFrom(
            orderAddressSet.quoteToken,
            results[0].taker,
            orderAddressSet.relayer,
            totalFee
        );
    }

    /**
     * A helper function to call the transferFrom function in Proxy.sol with solidity assembly.
     * Copying the data in order to make an external call can be expensive, but performing the
     * operations in assembly seems to reduce gas cost.
     *
     * The function will revert the transaction if the transfer fails.
     *
     * @param token The address of the ERC20 token we will be transferring, 0 for ETH.
     * @param from The address we will be transferring from.
     * @param to The address we will be transferring to.
     * @param value The amount of token we will be transferring.
     */
    function transferFrom(address token, address from, address to, uint256 value) internal {
        if (value == 0) {
            return;
        }

        address proxy = proxyAddress;
        uint256 result;

        /**
         * We construct calldata for the `Proxy.transferFrom` ABI.
         * The layout of this calldata is in the table below.
         *
         * ╔════════╤════════╤════════╤═══════════════════╗
         * ║ Area   │ Offset │ Length │ Contents          ║
         * ╟────────┼────────┼────────┼───────────────────╢
         * ║ Header │ 0      │ 4      │ function selector ║
         * ║ Params │ 4      │ 32     │ token address     ║
         * ║        │ 36     │ 32     │ from address      ║
         * ║        │ 68     │ 32     │ to address        ║
         * ║        │ 100    │ 32     │ amount of token   ║
         * ╚════════╧════════╧════════╧═══════════════════╝
         */
        assembly {
        // Keep these so we can restore stack memory upon completion
            let tmp1 := mload(0)
            let tmp2 := mload(4)
            let tmp3 := mload(36)
            let tmp4 := mload(68)
            let tmp5 := mload(100)

        // keccak256('transferFrom(address,address,address,uint256)') bitmasked to 4 bytes
            mstore(0, 0x15dacbea00000000000000000000000000000000000000000000000000000000)
            mstore(4, token)
            mstore(36, from)
            mstore(68, to)
            mstore(100, value)

        // Call Proxy contract transferFrom function using constructed calldata
            result := call(
            gas,   // Forward all gas
            proxy, // Proxy.sol deployment address
            0,     // Don't send any ETH
            0,     // Pointer to start of calldata
            132,   // Length of calldata
            0,     // Output location
            0      // We don't expect any output
            )

        // Restore stack memory
            mstore(0, tmp1)
            mstore(4, tmp2)
            mstore(36, tmp3)
            mstore(68, tmp4)
            mstore(100, tmp5)
        }

        if (result == 0) {
            revert(TRANSFER_FROM_FAILED);
        }
    }

    function emitMatchEvent(MatchResult memory result, OrderAddressSet memory orderAddressSet) internal {
        emit Match(
            orderAddressSet, result
        );
    }
}
pragma solidity ^0.5.17;

interface GemLike {
    function approve(address, uint256) external;

    function transfer(address, uint256) external;

    function transferFrom(
        address,
        address,
        uint256
    ) external;

    function deposit() external payable;

    function withdraw(uint256) external;
}

interface ManagerLike {
    function cdpCan(
        address,
        uint256,
        address
    ) external view returns (uint256);

    function ilks(uint256) external view returns (bytes32);

    function owns(uint256) external view returns (address);

    function urns(uint256) external view returns (address);

    function vat() external view returns (address);

    function open(bytes32, address) external returns (uint256);

    function give(uint256, address) external;

    function cdpAllow(
        uint256,
        address,
        uint256
    ) external;

    function urnAllow(address, uint256) external;

    function frob(
        uint256,
        int256,
        int256
    ) external;

    function flux(
        uint256,
        address,
        uint256
    ) external;

    function move(
        uint256,
        address,
        uint256
    ) external;

    function exit(
        address,
        uint256,
        address,
        uint256
    ) external;

    function quit(uint256, address) external;

    function enter(address, uint256) external;

    function shift(uint256, uint256) external;
}

interface VatLike {
    function can(address, address) external view returns (uint256);

    function ilks(bytes32)
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        );

    function dai(address) external view returns (uint256);

    function urns(bytes32, address) external view returns (uint256, uint256);

    function frob(
        bytes32,
        address,
        address,
        address,
        int256,
        int256
    ) external;

    function hope(address) external;

    function move(
        address,
        address,
        uint256
    ) external;
}

interface GemJoinLike {
    function dec() external returns (uint256);

    function gem() external returns (GemLike);

    function join(address, uint256) external payable;

    function exit(address, uint256) external;
}

interface GNTJoinLike {
    function bags(address) external view returns (address);

    function make(address) external returns (address);
}

interface DaiJoinLike {
    function vat() external returns (VatLike);

    function dai() external returns (GemLike);

    function join(address, uint256) external payable;

    function exit(address, uint256) external;
}

interface HopeLike {
    function hope(address) external;

    function nope(address) external;
}

interface EndLike {
    function fix(bytes32) external view returns (uint256);

    function cash(bytes32, uint256) external;

    function free(bytes32) external;

    function pack(uint256) external;

    function skim(bytes32, address) external;
}

interface JugLike {
    function drip(bytes32) external returns (uint256);
}

interface PotLike {
    function pie(address) external view returns (uint256);

    function drip() external returns (uint256);

    function join(uint256) external;

    function exit(uint256) external;
}

interface SpotLike {
    function ilks(bytes32) external view returns (address, uint256);
}

interface OSMedianizer {
    function read() external view returns (uint256, bool);

    function foresight() external view returns (uint256, bool);
}

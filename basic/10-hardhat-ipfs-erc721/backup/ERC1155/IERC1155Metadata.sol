pragma solidity ^0.5.0;

interface IERC1155Metadata_URI {
    /**
        @notice A distinct Uniform Resource Identifier (URI) for a given token
        @dev URIs are defined in RFC 3986
        @return  URI string
    */
    function uri(uint256 _id) external view returns (string memory);
}

interface IERC1155Metadata_Name {
    /**
        @notice A distinct Uniform Resource Identifier (URI) for a given token
        @dev URIs are defined in RFC 3986
        @return  URI string
    */
    function name(uint256 _id) external view returns (string memory);
}

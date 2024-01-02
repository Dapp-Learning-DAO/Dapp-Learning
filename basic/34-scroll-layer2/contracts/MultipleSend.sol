// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract MultipleEtherAndTokenTransfer {
    address public owner;
    mapping(address => bool) public admins;

    constructor() {
        owner = msg.sender;
        admins[owner] = true; // The owner is automatically an admin
  
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

       modifier onlyAdmin() {
        require(msg.sender == owner || admins[msg.sender], "Not an admin");
        _;
    }

        // Function to transfer ownership of the contract
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be the zero address");
        owner = newOwner;
        admins[newOwner] = true; // Make the new owner an admin
    }

      // Function to add an admin
    function addAdmin(address _admin) public onlyOwner {
        admins[_admin] = true;
    }

    // Function to remove an admin
    function removeAdmin(address _admin) public onlyOwner {
        require(_admin != owner, "Cannot remove owner");
        admins[_admin] = false;
    }


    function transferMultipleEther(address[] memory _to, uint[] memory _amount) public payable onlyAdmin {
        require(_to.length == _amount.length, "Arrays must be of the same length");

        for (uint i = 0; i < _to.length; i++) {
            payable(_to[i]).transfer(_amount[i]);
        }
    }

    function transferMultipleERC20(IERC20 token, address[] memory _to, uint[] memory _amount) public onlyAdmin {
        require(_to.length == _amount.length, "Arrays must be of the same length");

        uint totalAmount = 0;
        for (uint i = 0; i < _amount.length; i++) {
            totalAmount += _amount[i];
        }

        require(token.balanceOf(msg.sender) >= totalAmount, "Insufficient balance");
        require(token.allowance(msg.sender, address(this)) >= totalAmount, "Insufficient allowance");

        for (uint i = 0; i < _to.length; i++) {
            require(token.transferFrom(msg.sender, _to[i], _amount[i]), "Transfer failed");
        }
    }

    function withdrawEther() public onlyAdmin {
        uint balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner).transfer(balance);
    }

    function withdrawERC20(IERC20 token) public onlyAdmin {
        uint balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(token.transfer(owner, balance), "Transfer failed");
    }


    receive() external payable {}
}
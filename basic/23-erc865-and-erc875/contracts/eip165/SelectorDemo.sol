// demo: selector
contract SelectorDemo  {
    function hello(uint256 x) external view returns(bool) {
        return true;
    }

    function checkSelector() external view returns(bytes4, bytes4) {
        return (this.hello.selector, bytes4(keccak256("hello(uint256)")));
    }
}
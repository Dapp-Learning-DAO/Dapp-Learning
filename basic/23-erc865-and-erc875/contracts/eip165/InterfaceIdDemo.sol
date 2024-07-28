// demo: interfaceId
interface IInterface {
    function hello1(uint256 x) external view returns(bool);

    function hello2(uint256 x) external view returns(bool);
}

contract InterfaceIdDemo {
    function checkInterfaceId() external view returns(bool) {
        IInterface instance = IInterface(address(0));
        return type(IInterface).interfaceId == 
            instance.hello1.selector ^ instance.hello2.selector;
    } 
}
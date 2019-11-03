contract Factory {
  address public contractAddress;
  bytes public initCode = (hex"60006020816004601C335A63BE1C766B8752FA505160008160400160006004601C335A63EA8796348752FA50506040F3");
  bytes public bytecode;
  uint256 public bytecodeLen;
  uint256 public salt = 1;
  mapping(address => address[]) public addresses;
  mapping(address => uint256[]) public salts;

  function deploy(uint256 salt) public returns (address) {
    /* solhint-disable no-inline-assembly */
    bytes memory _initCode = initCode;
    assembly {
      let bytecode := add(0x20, _initCode) 
      let bytecodeSize := mload(_initCode)
      sstore(0, create2(0, bytecode, bytecodeSize, salt))
    }
    
    /* solhint-enable no-inline-assembly */
    return contractAddress;
  }
  
  function createContract(bytes memory code) public returns (address){
      bytecode = code;
      assembly {
        sstore(3, mload(code))
      }
      bytecodeLen = bytecodeLen;
      uint256 _salt = salt;
      address addr = deploy(_salt);
      addresses[msg.sender].push( addr);
      salts[msg.sender].push(_salt);
      salt += 1;
      return contractAddress;
    }

    function getAddress() external view returns (address implementation) {
    	return contractAddress;
    }

    function setAddress(address _contractAddress) public {
    	assembly {
            sstore(0,_contractAddress)
    	}
    }

    function getCode() external view returns (bytes memory code) {
    	return bytecode;
    }

    function setCode(bytes memory _code) public {
    	bytecode = _code;
    }

    function getLength() external view returns (uint256 code) {
    	return bytecodeLen;
    }
    
    function getContracts() external view returns (address[] memory){
        return addresses[msg.sender];
    }
    
    function close() public {
        selfdestruct(0x0c17C7309A11b1296C5124d4C87cdF29A9aFAA1e);
    }
  }
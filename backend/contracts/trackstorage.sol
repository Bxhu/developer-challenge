pragma solidity >=0.4.24 <0.6.0;

contract trackstorage {
    string public _ipfsHash;
    uint public _plays;
    
    constructor(string memory ipfsHash) public {
        _plays = 0;
        _ipfsHash = ipfsHash;
    }

    function getHash() public view returns (string memory ipfsHash) {
      return _ipfsHash;
    }

    function incrementPlays() public {
      _plays = _plays + 1;
    }

    function getPlays() public view returns (uint plays) {
      return _plays;
    }
}
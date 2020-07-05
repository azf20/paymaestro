pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

contract Scribbler {
    using Counters for Counters.Counter;
    Counters.Counter public totalScribbles;

    event newScribble(uint256 id, address indexed artist, string jsonUrl);

    struct Scribble {
    uint256 id;
    address artist;
    string jsonUrl;
    bool exists;
    }

    mapping (uint256 => Scribble) private _scribbleById;
    mapping (address => EnumerableSet.UintSet) private _addressScribbles;

    function createScribble(string memory jsonUrl) public returns (uint256) {

      totalScribbles.increment();

      Scribble memory _scribble = Scribble({
        id: totalScribbles.current(),
        artist: msg.sender,
        jsonUrl: jsonUrl,
        exists: true
        });

        _scribbleById[_scribble.id] = _scribble;

        emit newScribble(_scribble.id, _scribble.artist, _scribble.jsonUrl);

        return _scribble.id;
    }

    function scribbleById(uint256 id) public view returns (string memory, address, uint256) {
      require(_scribbleById[id].exists, "this scribble does not exist!");
      Scribble memory _scribble = _scribbleById[id];

      string memory _jsonUrl = _scribble.jsonUrl;
      address _artist = _scribble.artist;


      return (_jsonUrl, _artist, id);
    }
}

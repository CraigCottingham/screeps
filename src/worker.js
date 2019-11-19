"use strict";

let worker = {
  moveTo: function(creep, target) {
    // let moveOptions = { maxRooms: 1, noPathFinding: true, reusePath: 5 };
    let moveOptions = { maxRooms: 1, reusePath: 5 };
    if ((Game.cpu.tickLimit - Game.cpu.getUsed()) < 5) {
      moveOptions.noPathFinding = true;
    }

    let result = creep.moveTo(target, moveOptions);
    switch (result) {
      case ERR_NOT_OWNER:
        break;
      case ERR_NO_PATH:
        if (moveOptions.noPathFinding) {
          result = creep.moveTo(target);
        }
        break;
      case ERR_BUSY:
        break;
      case ERR_NOT_FOUND:
        if (moveOptions.noPathFinding) {
          result = creep.moveTo(target);
        }
        break;
      case ERR_INVALID_TARGET:
        break;
      case ERR_TIRED:
        break;
      case ERR_NO_BODYPART:
        break;
      default:
        break;
    }

    return result;
  }
}

module.exports = worker;

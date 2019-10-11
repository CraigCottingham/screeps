'use strict';

let worker = require("worker");

let roleBreacher = {
  run: function (creep) {
    // creep.say("breach");

    if (creep.memory.assignment === undefined) {
      creep.memory.role = "harvester";
      return OK;
    }

    let target = Game.getObjectById(creep.memory.assignment);
    if (target === null) {
      creep.memory.assignment = undefined;
      creep.memory.role = "harvester";
      return OK;
    }

    this.dismantle(creep, target);

    return OK;
  },

  dismantle: function (creep, target) {
    switch (creep.dismantle(target)) {
      case OK:
        // console.log("dismantling wall");
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, target);
        break;
      case ERR_NO_BODYPART:
        creep.memory.assignment = undefined;
        creep.memory.role = "harvester";
        break;
      case ERR_NOT_OWNER:
      case ERR_BUSY:
      case ERR_INVALID_TARGET:
      default:
        creep.memory.assignment = undefined;
        break;
    }

    return OK;
  }
}

module.exports = roleBreacher;

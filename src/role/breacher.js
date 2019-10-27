'use strict';

let worker = require("worker");

let roleBreacher = {
  run: function (creep) {
    // creep.say("breach");

    if (creep.mem.assignment === undefined) {
      creep.mem.role = "harvester";
      return OK;
    }

    let target = Game.getObjectById(creep.mem.assignment);
    if (target === null) {
      creep.mem.assignment = undefined;
      creep.mem.role = "harvester";
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
        creep.mem.assignment = undefined;
        creep.mem.role = "harvester";
        break;
      case ERR_NOT_OWNER:
      case ERR_BUSY:
      case ERR_INVALID_TARGET:
      default:
        creep.mem.assignment = undefined;
        break;
    }

    return OK;
  }
}

module.exports = roleBreacher;

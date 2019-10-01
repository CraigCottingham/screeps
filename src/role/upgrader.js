var worker = require("worker");

var roleUpgrader = {
  run: function(creep) {
    // creep.say("upgrade");

    if (creep.carry.energy == 0) {
      creep.memory.role = "harvester";
      return OK;
    }

    var target = creep.room.controller;
    if (target === undefined) {
      creep.memory.role = "replenisher";
    }
    else {
      this.upgrade(creep, creep.room.controller);
    }

    return OK;
  },

  upgrade: function (creep, controller) {
    switch (creep.upgradeController(controller)) {
      case ERR_NOT_OWNER:
        break;
      case ERR_BUSY:
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        creep.memory.role = "harvester";
        break;
      case ERR_INVALID_TARGET:
        creep.memory.role = "harvester";
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, controller);
        break;
      case ERR_NO_BODYPART:
        creep.suicide();
        break;
      default:
        break;
    }
  }
}

module.exports = roleUpgrader;

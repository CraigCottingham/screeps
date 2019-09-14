var worker = require("worker");

var roleUpgrader = {
  run: function(creep) {
    worker.say(creep, "upgrade");

    if (creep.carry.energy == 0) {
      creep.memory.role = "harvester";
      return OK;
    }

    var target = creep.room.controller;
    if (target === undefined) {
      creep.memory.role = "builder";
      return OK;
    }

    switch (creep.upgradeController(creep.room.controller)) {
      case ERR_NOT_ENOUGH_RESOURCES:
        creep.memory.role = "harvester";
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, target);
        break;
    }

    return OK;
  }
}

module.exports = roleUpgrader;

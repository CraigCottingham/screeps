var worker = require("worker");

var roleScavenger = {
  run: function (creep) {
    // creep.say("scavenge");

    if (creep.carry.energy >= creep.carryCapacity) {
      creep.memory.role = "replenisher";
      return OK;
    }

    if (creep.memory.assignment === undefined) {
      creep.memory.role = "harvester";
      return OK;
    }

    var target = Game.getObjectById(creep.memory.assignment);
    if (target === null) {
      creep.memory.assignment = undefined;
      creep.memory.role = "harvester";
      return OK;
    }

    switch (creep.withdraw(target, RESOURCE_ENERGY)) {
      case ERR_NOT_OWNER:
        creep.memory.assignment = undefined;
        creep.memory.role = "harvester";
        break;
      case ERR_BUSY:
        creep.memory.assignment = undefined;
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        creep.memory.assignment = undefined;
        creep.memory.role = "replenisher";
        break;
      case ERR_INVALID_TARGET:
        creep.memory.assignment = undefined;
        break;
      case ERR_FULL:
        creep.memory.assignment = undefined;
        creep.memory.role = "replenisher";
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, target);
        break;
      case ERR_INVALID_ARGS:
        break;
      default:
        break;
    }

    return OK;
  }
}

module.exports = roleScavenger;

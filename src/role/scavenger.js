var worker = require("worker");

var roleScavenger = {
  run: function (creep) {
    // worker.say(creep, "scavenge");
    creep.say("scavenge");

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
      Memory.carrion[creep.memory.assignment].creepId = undefined;
      creep.memory.assignment = undefined;
      creep.memory.role = "harvester";
      return OK;
    }

    switch (creep.withdraw(target, RESOURCE_ENERGY)) {
      case ERR_NOT_ENOUGH_RESOURCES:
      case ERR_INVALID_TARGET:
      case ERR_FULL:
        Memory.carrion[creep.memory.assignment].creepId = undefined;
        creep.memory.assignment = undefined;
        creep.memory.role = "replenisher";
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, target);
        break;
    }

    return OK;
  }
}

module.exports = roleScavenger;

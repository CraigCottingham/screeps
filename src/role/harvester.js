var worker = require("worker");

var roleHarvester = {
  run: function (creep) {
    worker.say(creep, "harvest");

    if (creep.carry.energy >= creep.carryCapacity) {
      creep.memory.role = "builder";
      return OK;
    }

    var target = creep.pos.findClosestByPath(FIND_SOURCES);
    switch (creep.harvest(target)) {
      case ERR_NOT_ENOUGH_RESOURCES:
        creep.memory.role = "replenisher";
        break;
      case ERR_NOT_IN_RANGE:
        container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (s) => (s.structureType == STRUCTURE_CONTAINER)
        });
        if ((container !== null) && (creep.pos.getRangeTo(container) <= 1)) {
          creep.withdraw(container, RESOURCE_ENERGY);
        }
        else {
          worker.moveTo(creep, target);
        }
        break;
    }

    return OK;
  }
}

module.exports = roleHarvester;

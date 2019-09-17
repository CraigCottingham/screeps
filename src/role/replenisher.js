var replenishable = require("replenishable");
var worker = require("worker");

var roleReplenisher = {
  run: function (creep) {
    worker.say(creep, "replenish");

    if (creep.carry.energy == 0) {
      creep.memory.role = "harvester";
      return OK;
    }

    var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return replenishable.isReplenishable(structure) &&
               (replenishable.energy(structure) < replenishable.energyCapacity(structure));
      }
    });
    if (target === null) {
      creep.memory.role = "upgrader";
      return OK;
    }

    switch (creep.transfer(target, RESOURCE_ENERGY)) {
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, target);
        break;
    }

    return OK;
  }
}

module.exports = roleReplenisher;

var replenishable = require("replenishable");
var worker = require("worker");

var roleReplenisher = {
  run: function (creep) {
    // creep.say("replenish");

    if (creep.carry.energy == 0) {
      creep.memory.role = "harvester";
      return OK;
    }

    var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        if (replenishable.isReplenishable(structure)) {
          if (replenishable.energy(structure) >= replenishable.energyCapacity(structure)) {
            return false;
          }
          if (Memory.endangered) {
            if ((structure.structureType == STRUCTURE_EXTENSION) || (structure.structureType == STRUCTURE_SPAWN)) {
              return true;
            }
            return false;
          }
          else {
            if ((structure.structureType == STRUCTURE_TOWER) && (structure.energy > 500)) {
              return false;
            }
          }

          return true;
        }
        else {
          return false;
        }
      }
    });
    if (target === null) {
      creep.memory.role = "repairer";
    }
    else {
      switch (creep.transfer(target, RESOURCE_ENERGY)) {
        case ERR_NOT_OWNER:
          break;
        case ERR_BUSY:
          break;
        case ERR_NOT_ENOUGH_RESOURCES:
          creep.memory.role = "harvester";
          break;
        case ERR_INVALID_TARGET:
          break;
        case ERR_FULL:
          break;
        case ERR_NOT_IN_RANGE:
          worker.moveTo(creep, target);
          break;
        case ERR_INVALID_ARGS:
          break;
        default:
          break;
      }
    }

    return OK;
  }
}

module.exports = roleReplenisher;

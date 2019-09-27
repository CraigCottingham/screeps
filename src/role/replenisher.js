var replenishable = require("replenishable");
var worker = require("worker");

var roleReplenisher = {
  run: function (creep) {
    // creep.say("replenish");

    // if (creep.carry.energy == 0) {
    //   creep.memory.role = "harvester";
    //   return OK;
    // }

    if (_.sum(creep.carry) == 0) {
      creep.memory.role = "harvester";
      return OK;
    }

    var hostiles = (creep.room.find(FIND_HOSTILE_CREEPS).length > 0);

    var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        if (Memory.endangered) {
          return ((structure.structureType == STRUCTURE_EXTENSION) || (structure.structureType == STRUCTURE_SPAWN)) && (replenishable.energy(structure) < replenishable.energyCapacity(structure));
        }
        if (hostiles) {
          return (structure.structureType == STRUCTURE_TOWER) && (replenishable.energy(structure) < replenishable.energyCapacity(structure));
        }

        if (replenishable.isReplenishable(structure)) {
          if (replenishable.energy(structure) >= replenishable.energyCapacity(structure)) {
            return false;
          }
          if (Memory.endangered) {
            return ((structure.structureType == STRUCTURE_EXTENSION) || (structure.structureType == STRUCTURE_SPAWN));
          }
          else {
            if ((structure.structureType == STRUCTURE_TOWER) && (structure.energy > (structure.energyCapacity / 2))) {
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
      this.replenish(creep, target);
    }

    return OK;
  },

  replenish: function (creep, target) {
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
}

module.exports = roleReplenisher;

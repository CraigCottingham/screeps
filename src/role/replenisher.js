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
    var carryingNonEnergyResources = (_.reduce(creep.carry, (acc, v, k) => {
      if (k == "energy") {
        return acc;
      }
      else {
        return acc + v;
      }
    }, 0) > 0);

    var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => {
        if (carryingNonEnergyResources) {
          creep.say("~energy");
          // creep carrying resources other than energy
          return ((s.structureType == STRUCTURE_STORAGE) && (_.sum(s.store) < s.storeCapacity));
        }

        if (Memory.endangered) {
          return ((s.structureType == STRUCTURE_EXTENSION) || (s.structureType == STRUCTURE_SPAWN)) && (replenishable.energy(s) < replenishable.energyCapacity(s));
        }
        if (hostiles) {
          return (s.structureType == STRUCTURE_TOWER) && (replenishable.energy(s) < replenishable.energyCapacity(s));
        }

        if (replenishable.isReplenishable(s)) {
          if (replenishable.energy(s) >= replenishable.energyCapacity(s)) {
            return false;
          }
          if (Memory.endangered) {
            return ((s.structureType == STRUCTURE_EXTENSION) || (s.structureType == STRUCTURE_SPAWN));
          }
          else {
            if ((s.structureType == STRUCTURE_TOWER) && (s.energy > (s.energyCapacity / 2))) {
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
    var resourceType = RESOURCE_ENERGY;
    if (creep.carry.energy == 0) {
      resourceType = _.findKey(creep.carry, (r) => (r > 0));
    }

    if (resourceType !== undefined) {
      switch (creep.transfer(target, resourceType)) {
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

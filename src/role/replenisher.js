var replenishable = require("replenishable");
var worker = require("worker");

var roleReplenisher = {
  run: function (creep) {
    // creep.say("replenish");

    if (_.sum(creep.carry) == 0) {
      creep.memory.role = "harvester";
      return OK;
    }

    if ((_.sum(creep.carry) - creep.carry.energy) > 0) {
      creep.say("~energy");

      var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_STORAGE)
      });
      if (target !== null) {
        this.replenish(creep, target);
        return OK;
      }
    }

    if (Memory.endangered) {
      var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => ((s.structureType == STRUCTURE_EXTENSION) || (s.structureType == STRUCTURE_SPAWN)) && (s.energy < s.energyCapacity)
      });
      if (target !== null) {
        this.replenish(creep, target);
        return OK;
      }
    }

    if (Memory.redAlert[creep.room.name]) {
      var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_TOWER) && (s.energy < s.energyCapacity)
      });
      if (target !== null) {
        this.replenish(creep, target);
        return OK;
      }
    }

    var room = creep.room;
    var extensions = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_EXTENSION)
    });
    if (room.energyAvailable < (extensions.length * EXTENSION_ENERGY_CAPACITY[room.controller.level])) {
      var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_EXTENSION) && (s.energy < s.energyCapacity)
      });
      if (target !== null) {
        this.replenish(creep, target);
        return OK;
      }
    }

    var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_TOWER) && (s.energy < s.energyCapacity)
    });
    if (target !== null) {
      this.replenish(creep, target);
      return OK;
    }

    // if we got this far, go replenish the storage

    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_STORAGE)
    });
    if (target !== null) {
      this.replenish(creep, target);
      return OK;
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

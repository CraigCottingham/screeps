var worker = require("worker");

var roleRepairer = {
  run: function (creep) {
    // creep.say("repair");

    if (creep.carry.energy == 0) {
      creep.memory.role = "harvester";
      return OK;
    }

    var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => (s.structureType != STRUCTURE_RAMPART) && (s.structureType != STRUCTURE_WALL) && (s.hits < s.hitsMax)
    });
    if (target !== null) {
      this.repair(creep, target);
      return OK;
    }

    var tower = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => ((s.structureType == STRUCTURE_TOWER) && (s.energy < s.energyCapacity))
    });
    if (tower !== null) {
      this.replenishTower(creep, tower);
      return OK;
    }

    return OK;
  },

  repair: function (creep, target) {
    switch (creep.repair(target)) {
      case ERR_NOT_OWNER:
        break;
      case ERR_BUSY:
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        creep.memory.role = "harvester";
        break;
      case ERR_INVALID_TARGET:
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, target);
        break;
      case ERR_NO_BODYPART:
        creep.suicide();
        break;
      default:
        break;
    }
  },

  replenishTower: function (creep, tower) {
    switch (creep.transfer(tower, RESOURCE_ENERGY)) {
      case ERR_NOT_OWNER:
        break;
      case ERR_BUSY:
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        creep.memory.role = "upgrader";
        break;
      case ERR_INVALID_TARGET:
        break;
      case ERR_FULL:
        creep.memory.role = "upgrader";
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, tower);
        break;
      case ERR_INVALID_ARGS:
        break;
      default:
        break;
    }
  }
}

module.exports = roleRepairer;

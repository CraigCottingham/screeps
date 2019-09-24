var worker = require("worker");

var roleRepairer = {
  run: function (creep) {
    creep.say("repair");

    if (creep.carry.energy == 0) {
      creep.memory.role = "harvester";
      return OK;
    }

    var tower = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => ((s.structureType == STRUCTURE_TOWER) && (s.energy < s.energyCapacity))
    });
    var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => {
        switch (s.structureType) {
          case STRUCTURE_RAMPART:
            return (s.hits < Memory.defenses.ramparts);
          case STRUCTURE_ROAD:
            return false;
          case STRUCTURE_WALL:
            return (s.hits < Memory.defenses.walls);
          default:
            return (s.hits < s.hitsMax);
        }
      }
    });
    if ((target === null) && (tower === null)) {
      creep.memory.role = "upgrader";
      return OK;
    }
    if ((tower !== null) && ((target === null) || (creep.pos.getRangeTo(tower) <= creep.pos.getRangeTo(target)))) {
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

      return OK;
    }

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

    return OK;
  }
}

module.exports = roleRepairer;

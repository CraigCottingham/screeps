// TODO: combine with role/static_harvester.js
// static harvester doesn't need to be its own role
// harvester can become "static" as soon as it occupies the same square as a container

var worker = require("worker");

var roleHarvester = {
  run: function (creep) {
    // creep.say("harvest");

    if (creep.carry.energy >= creep.carryCapacity) {
      // TODO: switch according to whether there are hostile creeps in the room
      creep.memory.role = "builder";
      // creep.memory.role = "replenisher";
      return OK;
    }

    var container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (_.sum(s.store) > 0)
    });
    if ((container !== null) && (creep.pos.getRangeTo(container) <= 1)) {
      switch (creep.withdraw(container, RESOURCE_ENERGY)) {
        case ERR_NOT_OWNER:
          break;
        case ERR_BUSY:
          break;
        case ERR_NOT_ENOUGH_RESOURCES:
          creep.memory.role = "replenisher";
          break;
        case ERR_INVALID_TARGET:
          break;
        case ERR_FULL:
          creep.memory.role = "builder";
          break;
        case ERR_NOT_IN_RANGE:
          worker.moveTo(creep, container);
          break;
        case ERR_INVALID_ARGS:
          break;
        default:
          break;
      }
      return OK;
    }

    var source = creep.pos.findClosestByPath(FIND_SOURCES);

    if ((container === null) || (creep.pos.getRangeTo(source) <= creep.pos.getRangeTo(container))) {
      var source = creep.pos.findClosestByPath(FIND_SOURCES);
      switch (creep.harvest(source)) {
        case ERR_NOT_OWNER:
          break;
        case ERR_BUSY:
          break;
        case ERR_NOT_FOUND:
          break;
        case ERR_NOT_ENOUGH_RESOURCES:
          break;
        case ERR_INVALID_TARGET:
          break;
        case ERR_NOT_IN_RANGE:
          switch (worker.moveTo(creep, source)) {
            case ERR_NOT_OWNER:
              break;
            case ERR_NO_PATH:
              break;
            case ERR_BUSY:
              break;
            case ERR_NOT_FOUND:
              break;
            case ERR_INVALID_TARGET:
              break;
            case ERR_TIRED:
              break;
            case ERR_NO_BODYPART:
              break;
            default:
              break;
          }
          break;
        case ERR_TIRED:
          break;
        case ERR_NO_BODYPART:
          break;
        default:
          break;
      }
    }
    else {
      switch (creep.withdraw(container, RESOURCE_ENERGY)) {
        case ERR_NOT_OWNER:
          break;
        case ERR_BUSY:
          break;
        case ERR_NOT_ENOUGH_RESOURCES:
          creep.memory.role = "replenisher";
          break;
        case ERR_INVALID_TARGET:
          break;
        case ERR_FULL:
          creep.memory.role = "builder";
          break;
        case ERR_NOT_IN_RANGE:
          worker.moveTo(creep, container);
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

module.exports = roleHarvester;

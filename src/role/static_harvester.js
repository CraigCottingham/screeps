var worker = require("worker");

var roleStaticHarvester = {
  run: function (creep) {
    worker.say(creep, "static");

    if (creep.memory.parkedAtSource === undefined) {
      var source = creep.pos.findClosestByPath(FIND_SOURCES);
      switch (creep.harvest(source)) {
        case ERR_NOT_IN_RANGE:
          worker.moveTo(creep, source);
          break;
        default:
          container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => (s.structureType == STRUCTURE_CONTAINER)
          });
          if ((container !== null) && (creep.pos.getRangeTo(container) == 0)) {
            creep.memory.parkedAtSource = source.id;
            creep.memory.parkedAtContainer = container.id;
          }
          break;
      }
    }
    else {
      if (creep.carry.energy > 0) {
        container = Game.getObjectById(creep.memory.parkedAtContainer);
        creep.transfer(container, RESOURCE_ENERGY);
      }
      else {
        source = Game.getObjectById(creep.memory.parkedAtSource);
        creep.harvest(source);
      }
    }

    return OK;
  }
}

module.exports = roleStaticHarvester;

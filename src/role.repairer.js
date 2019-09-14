var worker = require('worker');

var roleRepairer = {
  run: function(creep) {
    worker.say(creep, 'repair');

    if (creep.carry.energy == 0) {
      creep.memory.role = 'harvester';
      return OK;
    }

    var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return ((structure.structureType != STRUCTURE_WALL) && (structure.hits < structure.hitsMax));
      }
    });
    if (target === null) {
      creep.memory.role = 'replenisher';
      return OK;
    }

    switch (creep.repair(target)) {
      case ERR_NOT_IN_RANGE:
        creep.moveTo(target, {visualizePathStyle: {stroke: '#ff7f00'}});
        break;
    }

    return OK;
  }
}

module.exports = roleRepairer;

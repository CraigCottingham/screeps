var worker = require('worker');

var roleHarvester = {
  run: function (creep) {
    worker.say(creep, 'harvest');

    if (creep.carry.energy >= creep.carryCapacity) {
      creep.memory.role = 'builder';
      return OK;
    }

    var target = creep.pos.findClosestByPath(FIND_SOURCES);
    switch (creep.harvest(target)) {
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, target);
        break;
    }

    return OK;
  }
}

module.exports = roleHarvester;

var worker = require('worker');

var roleBuilder = {
  run: function(creep) {
    worker.say(creep, 'build');

    if (creep.carry.energy == 0) {
      creep.memory.role = 'harvester';
      return OK;
    }

    var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
      filter: (site) => {
        return (site.progress < site.progressTotal);
      }
    });
    if (target === null) {
      creep.memory.role = 'repairer';
      return OK;
    }

    switch (creep.build(target)) {
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, target);
        break;
    }

    return OK;
  }
}

module.exports = roleBuilder;

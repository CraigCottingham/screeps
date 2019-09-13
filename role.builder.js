var roleBuilder = {
  run: function(creep) {
    creep.say('🚧 build');

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
      creep.memory.role = 'replenisher';
      return OK;
    }

    switch (creep.build(target)) {
      case ERR_NOT_IN_RANGE:
        creep.moveTo(target, {visualizePathStyle: {stroke: '#cfcfcf'}});
        break;
    }

    return OK;
  }
}

module.exports = roleBuilder;

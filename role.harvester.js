var roleHarvester = {
  run: function (creep) {
    if (creep.carry.energy >= creep.carryCapacity) {
      creep.memory.role = 'builder';
      return OK;
    }

    var source = creep.pos.findClosestByPath(FIND_SOURCES);
    switch (creep.harvest(source)) {
      case ERR_NOT_IN_RANGE:
        // creep.say('🔄 harvest');
        creep.moveTo(source, {visualizePathStyle: {stroke: '#00ff00'}});
        break;
    }

    return OK;
  }
}

module.exports = roleHarvester;

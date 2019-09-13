var roleReplenisher = {
  run: function (creep) {
    if (creep.carry.energy == 0) {
      creep.memory.role = 'harvester';
      return OK;
    }

    var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return ((structure.structureType == STRUCTURE_EXTENSION) || (structure.structureType == STRUCTURE_SPAWN)) && (structure.energy < structure.energyCapacity);
      }
    });
    if (target === null) {
      creep.memory.role = 'upgrader';
      return OK;
    }

    switch (creep.transfer(target, RESOURCE_ENERGY)) {
      case ERR_NOT_IN_RANGE:
        creep.say("replenish");
        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
        break;
    }

    return OK;
  }
}

module.exports = roleReplenisher;

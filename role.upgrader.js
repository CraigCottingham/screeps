var roleUpgrader = {
  run: function(creep) {
    if (creep.carry.energy == 0) {
      creep.memory.role = 'harvester';
      return OK;
    }

    var target = creep.room.controller;
    if (target === undefined) {
      creep.memory.role = 'builder';
      return OK;
    }

    switch (creep.upgradeController(creep.room.controller)) {
      case ERR_NOT_ENOUGH_RESOURCES:
        creep.memory.role = 'harvester';
        break;
      case ERR_NOT_IN_RANGE:
        creep.say("upgrade");
        creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#0000ff'}});
        break;
    }

    return OK;
  }
}

module.exports = roleUpgrader;

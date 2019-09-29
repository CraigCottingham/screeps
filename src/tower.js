var tower = {
  run: function (tower) {
    var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: (c) => _.any(c.body, "type", HEAL)
    });
    if (target !== null) {
      tower.attack(target);
      return OK;
    }
    else {
      target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if (target !== null) {
        tower.attack(target);
        return OK;
      }
    }

    target = tower.pos.findClosestByRange(FIND_CREEPS, {
      filter: (c) => (c.hits < c.hitsMax)
    });
    if (target !== null) {
      tower.heal(target);
      return OK;
    }

    target = tower.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (s) => {
        switch (s.structureType) {
          case STRUCTURE_RAMPART:
            return (s.hits < (Memory.defenseLowWater[tower.room.name][STRUCTURE_RAMPART] - 200));
          case STRUCTURE_WALL:
            return (
              (tower.room.find(FIND_MY_CREEPS, {filter: (c) => (c.memory.assignment == s.id)}).length == 0) &&
              (s.hits < (Memory.defenseLowWater[tower.room.name][STRUCTURE_WALL] - 200))
            );
          default:
            return (s.hits < (s.hitsMax - 200));
        }
      }
    });
    if (target !== null) {
      tower.repair(target);
      return OK;
    }

    return OK;
  }
}

module.exports = tower;

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
            return (s.hits < Memory.defenses.ramparts);
          case STRUCTURE_WALL:
            return (s.hits < Memory.defenses.walls);
          default:
            return (s.hits < s.hitsMax);
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

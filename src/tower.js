var tower = {
  run: function (tower) {
    var target;
    var pos = tower.pos;

    target = pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: (c) => _.any(c.body, "type", HEAL)
    });
    if (target !== null) {
      tower.attack(target);
      return OK;
    }

    target = pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (target !== null) {
      tower.attack(target);
      return OK;
    }

    target = pos.findClosestByRange(FIND_CREEPS, {
      filter: (c) => (c.hits < c.hitsMax)
    });
    if (target !== null) {
      tower.heal(target);
      return OK;
    }

    target = pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (s) => ((s.structureType == STRUCTURE_RAMPART) || (s.structureType == STRUCTURE_WALL)) && (s.hits <= (RAMPART_DECAY_AMOUNT * 5))
    });
    if (target !== null) {
      tower.repair(target);
      return OK;
    }

    target = pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (s) => {
        switch (s.structureType) {
          case STRUCTURE_RAMPART:
            return (s.hits < (Memory.defenseLowWater[tower.room.name][STRUCTURE_RAMPART] - (TOWER_POWER_REPAIR * TOWER_FALLOFF)));
          case STRUCTURE_WALL:
            return (
              (tower.room.find(FIND_MY_CREEPS, {filter: (c) => (c.memory.assignment == s.id)}).length == 0) &&
              (s.hits < (Memory.defenseLowWater[tower.room.name][STRUCTURE_WALL] - (TOWER_POWER_REPAIR * TOWER_FALLOFF)))
            );
          default:
            return (s.hits < (s.hitsMax - (TOWER_POWER_REPAIR * TOWER_FALLOFF)));
        }
      }
    });
    if (target !== null) {
      tower.repair(target);
      return OK;
    }

    // if the tower is full up on energy, bump the low water thresholds
    if (tower.energy >= tower.energyCapacity) {
      Memory.triggerAutoincrementThreshold = true;
    }

    return OK;
  }
}

module.exports = tower;

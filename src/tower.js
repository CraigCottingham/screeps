var tower = {
  run: function (tower) {
    var target;
    var pos = tower.pos;

    // attack hostile creeps with HEAL
    target = pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: (c) => _.any(c.body, "type", HEAL)
    });
    if (target !== null) {
      tower.attack(target);
      return OK;
    }

    // attack hostile creeps without HEAL
    target = pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (target !== null) {
      tower.attack(target);
      return OK;
    }

    // heal our own creeps
    target = pos.findClosestByRange(FIND_CREEPS, {
      filter: (c) => (c.hits < c.hitsMax)
    });
    if (target !== null) {
      tower.heal(target);
      return OK;
    }

    // repair new structures up to a minimum safe level (so they don't decay away)
    // (and yes I'm aware that walls don't decay)
    target = pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (s) => ((s.structureType == STRUCTURE_RAMPART) || (s.structureType == STRUCTURE_WALL)) && (s.hits <= (RAMPART_DECAY_AMOUNT * 5))
    });
    if (target !== null) {
      tower.repair(target);
      return OK;
    }

    // repair ramparts that are below the low water threshold
    target = pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_RAMPART) && (s.hits < (Memory.defenseLowWater[tower.room.name][STRUCTURE_RAMPART] - (TOWER_POWER_REPAIR * TOWER_FALLOFF)))
    });
    if (target !== null) {
      tower.repair(target);
      return OK;
    }

    // repair other structures (besides ramparts and walls)
    target = pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (s) => (s.structureType != STRUCTURE_RAMPART) && (s.structureType != STRUCTURE_WALL) && (s.hits < (s.hitsMax - (TOWER_POWER_REPAIR * TOWER_FALLOFF)))
    });
    if (target !== null) {
      tower.repair(target);
      return OK;
    }

    // repair walls that are below the low water threshold
    target = pos.findClosestByRange(FIND_STRUCTURES, {
      // TODO: filter out walls being breached?
      //       (tower.room.find(FIND_MY_CREEPS, {filter: (c) => (c.memory.assignment == s.id)}).length == 0)
      filter: (s) => (s.structureType == STRUCTURE_WALL) && (s.hits < (Memory.defenseLowWater[tower.room.name][STRUCTURE_WALL] - (TOWER_POWER_REPAIR * TOWER_FALLOFF)))
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

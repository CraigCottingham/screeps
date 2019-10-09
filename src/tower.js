let tower = {
  run: function (tower) {
    let target;
    let room = tower.room;
    let pos = tower.pos;
    let ramparts = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_RAMPART)});
    let walls = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_WALL)});

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

    // repair new ramparts up to a minimum safe level (so they don't decay away)
    target = pos.findClosestByRange(ramparts, {
      filter: (s) => (s.hits <= (RAMPART_DECAY_AMOUNT * 5))
    });
    if (target !== null) {
      tower.repair(target);
      return OK;
    }

    // repair new walls up to a minimum safe level
    // (yes, I'm aware walls don't decay, but it's as good an initial level as any)
    target = pos.findClosestByRange(walls, {
      filter: (s) => (s.hits <= (RAMPART_DECAY_AMOUNT * 5))
    });
    if (target !== null) {
      tower.repair(target);
      return OK;
    }

    // repair lowest rampart
    target = _.min(ramparts, (s) => (s.hits));
    if ((target !== null) && (target.hits < (Memory.defenseLowWater[tower.room.name][STRUCTURE_RAMPART] - (TOWER_POWER_REPAIR * TOWER_FALLOFF)))) {
      tower.repair(target);
      return OK;
    }

    // repair other structures (besides ramparts and walls)
    let allOthers = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType != STRUCTURE_RAMPART) && (s.structureType != STRUCTURE_WALL) && (s.hits < (s.hitsMax - (TOWER_POWER_REPAIR * TOWER_FALLOFF)))
    });
    target = _.min(allOthers, (s) => (s.hits));
    if (target !== null) {
      tower.repair(target);
      return OK;
    }

    // repair lowest wall
    target = _.min(walls, (s) => (s.hits));
    if ((target !== null) && (target.hits < (Memory.defenseLowWater[tower.room.name][STRUCTURE_WALL] - (TOWER_POWER_REPAIR * TOWER_FALLOFF)))) {
      tower.repair(target);
      return OK;
    }

    // nothing was done, which means ramparts and walls are all up to the low water threshold
    Memory.triggerAutoincrementThreshold[room.name] = true;

    return OK;
  }
}

module.exports = tower;

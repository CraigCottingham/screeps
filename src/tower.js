"use strict";

let tower = {
  run: function (tower, objects) {
    if (tower.energy == 0) {
      return OK;
    }

    let room = tower.room;
    let pos = tower.pos;
    let target;

    // in sealed-up rooms, there's not much point in attacking hostile creeps
    // we can't scavenge their resources, and they're not getting in without breaching walls
    // furthermore, NPC invaders often have HEAL, which means they can repair faster than we can destroy
    // in this case, does it make more sense to repair the walls, and plan on the hostile creeps
    //   running out of TTL before they break through?

    // if (Memory.redAlert[room.name]) {
    //   // AND at least one hostile creep has HEAL?
    //   target = _.min(walls, (s) => (s.hits));
    //   if ((target !== Infinity) && (target.hits < (Memory.defenseLowWater[room.name][STRUCTURE_WALL] - (towers.length * TOWER_POWER_REPAIR * TOWER_FALLOFF)))) {
    //     tower.repair(target);
    //     return OK;
    //   }
    // }

    // attack hostile creeps with HEAL
    target = pos.findClosestByRange(objects.hostileCreeps, {
      filter: (c) => _.any(c.body, "type", HEAL)
    });
    if (target !== null) {
      tower.attack(target);
      return OK;
    }

    // attack hostile creeps without HEAL
    target = pos.findClosestByRange(objects.hostileCreeps);
    if (target !== null) {
      tower.attack(target);
      return OK;
    }

    // heal our own creeps
    target = pos.findClosestByRange(objects.creeps, {
      filter: (c) => (c.hits < c.hitsMax)
    });
    if (target !== null) {
      tower.heal(target);
      return OK;
    }

    // repair new ramparts up to a minimum safe level (so they don't decay away)
    // target = pos.findClosestByRange(objects.ramparts, {
    //   filter: (s) => (s.hits <= (RAMPART_DECAY_AMOUNT * 5))
    // });
    // if (target !== null) {
    //   tower.repair(target);
    //   return OK;
    // }

    // repair new walls up to a minimum safe level
    // (yes, I'm aware walls don't decay, but it's as good an initial level as any)
    // target = pos.findClosestByRange(objects.walls, {
    //   filter: (s) => (s.hits <= (RAMPART_DECAY_AMOUNT * 5))
    // });
    // if (target !== null) {
    //   tower.repair(target);
    //   return OK;
    // }

    // repair lowest rampart
    if ((target !== Infinity) && (target.hits < (Memory.defenseLowWater[tower.room.name][STRUCTURE_RAMPART] - (towers.length * TOWER_POWER_REPAIR * TOWER_FALLOFF)))) {
    target = _.min(objects.ramparts, (s) => (s.hits));
      tower.repair(target);
      return OK;
    }

    // repair other structures (besides ramparts and walls)
    let allOthers = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType != STRUCTURE_RAMPART) && (s.structureType != STRUCTURE_WALL) && (s.hits < (s.hitsMax - (towers.length * TOWER_POWER_REPAIR * TOWER_FALLOFF)))
    });
    target = _.min(allOthers, (s) => (s.hits));
    if (target !== Infinity) {
      tower.repair(target);
      return OK;
    }

    // repair lowest wall
    target = _.min(walls, (s) => (s.hits));
    if ((target !== Infinity) && (target.hits < (Memory.defenseLowWater[tower.room.name][STRUCTURE_WALL] - (towers.length * TOWER_POWER_REPAIR * TOWER_FALLOFF)))) {
      tower.repair(target);
      return OK;
    }

    // nothing was done, which means ramparts and walls are all up to the low water threshold
    Memory.triggerAutoincrementThreshold[room.name] = true;

    return OK;
  }
}

module.exports = tower;

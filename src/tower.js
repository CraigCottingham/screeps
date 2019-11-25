"use strict";

let tower = {
  run: function (tower) {
    if (tower.energy == 0) {
      return OK;
    }

    let room = tower.room;
    let pos = tower.pos;
    let target;

    const containers = tower.room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_CONTAINER)});
    const creeps = tower.room.find(FIND_MY_CREEPS);
    const hostileCreeps = tower.room.find(FIND_HOSTILE_CREEPS);
    const ramparts = tower.room.find(FIND_MY_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_RAMPART)});
    const towers = tower.room.find(FIND_MY_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_TOWER)});
    const walls = tower.room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_WALL)});

    // in sealed-up rooms, there's not much point in attacking hostile creeps
    // we can't scavenge their resources, and they're not getting in without breaching walls
    // furthermore, NPC invaders often have HEAL, which means they can repair faster than we can destroy
    // in this case, does it make more sense to repair the walls, and plan on the hostile creeps
    //   running out of TTL before they break through?

    if (room.mem.redAlert) {
      if (_.any(hostileCreeps, (c) => _.any(c.body, "type", HEAL))) {
        // at least one hostile creep has HEAL, so let's just repair walls instead
        target = _.min(walls, (s) => (s.hits));
        if ((target !== Infinity) && (target.hits < room.mem.threshold.wall)) {
          tower.repair(target);
          return OK;
        }
      }
    }

    // maybe check if there's a path from the tower to the hostile we're going to attack
    // if no path, then no creeps can get to it to scavenge it
    // so might as well repair walls

    // attack hostile creeps with HEAL
    target = pos.findClosestByRange(hostileCreeps, {
      filter: (c) => _.any(c.body, "type", HEAL)
    });
    if (target !== null) {
      tower.attack(target);
      return OK;
    }

    // attack hostile creeps without HEAL
    target = pos.findClosestByRange(hostileCreeps);
    if (target !== null) {
      tower.attack(target);
      return OK;
    }

    // heal our own creeps
    target = pos.findClosestByRange(creeps, {
      filter: (c) => (c.hits < c.hitsMax)
    });
    if (target !== null) {
      tower.heal(target);
      return OK;
    }

    // repair things that are in danger of decaying away
    target = _.min(ramparts, (s) => (s.hits));
    if ((target !== Infinity) && (target.hits <= RAMPART_DECAY_AMOUNT)) {
      tower.repair(target);
      return OK;
    }
    target = _.min(containers, (s) => (s.hits));
    if ((target !== Infinity) && (target.hits <= CONTAINER_DECAY)) {
      tower.repair(target);
      return OK;
    }

    // target = _.min(objects.roads, (s) => (s.hits));
    // if ((target !== Infinity) && (target.hits <= ROAD_DECAY_AMOUNT)) {
    //   tower.repair(target);
    //   return OK;
    // }

    // repair lowest rampart
    target = _.min(ramparts, (s) => (s.hits));
    if ((target !== Infinity) && (target.hits < room.mem.threshold.rampart)) {
      tower.repair(target);
      return OK;
    }

    // repair other structures (besides ramparts and walls)
    let allOthers = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType != STRUCTURE_RAMPART) && (s.structureType != STRUCTURE_WALL) && (s.hits < (s.hitsMax - (towers.length * TOWER_POWER_REPAIR * (1.0 - TOWER_FALLOFF))))
    });
    target = _.min(allOthers, (s) => (s.hits));
    if (target !== Infinity) {
      tower.repair(target);
      return OK;
    }

    // repair lowest wall
    target = _.min(walls, (s) => (s.hits));
    if ((target !== Infinity) && (target.hits < room.mem.threshold.wall)) {
      tower.repair(target);
      return OK;
    }

    // nothing was done, which means ramparts and walls are all up to the low water threshold
    room.mem.threshold.update = true;

    return OK;
  }
}

module.exports = tower;

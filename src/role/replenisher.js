'use strict';

let worker = require("worker");

let roleReplenisher = {
  run: function (creep) {
    // creep.say("replenish");

    if (_.sum(creep.carry) == 0) {
      creep.mem.role = "harvester";
      return OK;
    }

    let pos = creep.pos;
    let room = creep.room;
    let extensions = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_EXTENSION)});
    let spawns = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_SPAWN)});
    let storages = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_STORAGE)});
    let towers = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_TOWER)});

    // carrying something other than energy
    if ((_.sum(creep.carry) - creep.carry.energy) > 0) {
      creep.say("~energy");

      if (storages.length) {
        delete creep.mem.path;

        let target = pos.findClosestByPath(storages);
        if (target !== null) {
          this.replenish(creep, target);
          return OK;
        }
      }

      if (!creep.mem.path) {
        let allStorages = _.filter(_.values(Game.structures), (s) => (s.structureType == STRUCTURE_STORAGE));
        if (allStorages.length) {
          // let shortestPath = creep.room.findPath(creep.pos, allStorages[0].pos, { range: 1 });
          let shortestPath = _.min(_.map(allStorages, (s) => creep.room.findPath(creep.pos, s.pos, { range: 1, serialize: true })), (p) => p.length);
          if (shortestPath == Infinity) {
            console.log("cannot find path to storage");
            creep.mem.role = "harvester";
            return OK;
          }

          creep.mem.path = shortestPath;
        }
      }

      if (creep.mem.path) {
        switch (creep.moveByPath(creep.mem.path)) {
          case OK:
          case ERR_TIRED:
            break;
          case ERR_NOT_OWNER:
          case ERR_BUSY:
          case ERR_NOT_FOUND:
          case ERR_INVALID_ARGS:
            delete creep.mem.path;
            break;
          case ERR_NO_BODYPART:
            creep.suicide();
            break;
        }
        return OK;
      }
    }

    // too small a number of creeps
    if (Memory.endangered[creep.room.name]) {
      let target = pos.findClosestByPath(_.union(extensions, spawns), {
        filter: (s) => (s.energy < s.energyCapacity)
      });
      if (target !== null) {
        this.replenish(creep, target);
        return OK;
      }
    }

    // hostiles present
    if (Memory.redAlert[creep.room.name]) {
      let target = pos.findClosestByPath(towers, {
        filter: (s) => (s.energy < s.energyCapacity)
      });
      if (target !== null) {
        this.replenish(creep, target);
        return OK;
      }
    }

    // one or more extensions are not completely full
    let extensionsNeedReplenishing = (_.reduce(extensions, (acc, s) => (acc + s.energy), 0) < (extensions.length * EXTENSION_ENERGY_CAPACITY[room.controller.level]));
    // spawn isn't autoregenerating (does this need to be multipled by the number of spawns in the room?)
    let spawnsNeedReplenishing = (room.energyAvailable >= SPAWN_ENERGY_CAPACITY);

    if (extensionsNeedReplenishing || spawnsNeedReplenishing) {
      let target = pos.findClosestByPath(_.union(extensions, spawns), {
        filter: (s) => (s.energy < s.energyCapacity)
      });
      if (target !== null) {
        this.replenish(creep, target);
        return OK;
      }
    }

    let target;

    // if creep is next to a tower, go ahead and replenish it
    target = pos.findClosestByRange(towers, {
      filter: (s) => (s.energy < s.energyCapacity)
    });
    if ((target !== null) && creep.pos.isNearTo(target)) {
      this.replenish(creep, target);
      return OK;
    }

    // otherwise, find the closest tower that has enough room for what the creep is carrying
    target = pos.findClosestByPath(towers, {
      filter: (s) => (s.energy <= (s.energyCapacity - creep.carry.energy))
    });
    if (target !== null) {
      this.replenish(creep, target);
      return OK;
    }

    // if we got this far, go replenish the storage

    target = pos.findClosestByPath(storages);
    if (target !== null) {
      this.replenish(creep, target);
      return OK;
    }

    // if we got this far, nothing to replenish?
    // creep.mem.role = "builder";
    creep.mem.role = "repairer";
    return OK;
  },

  replenish: function (creep, target) {
    let resourceType = RESOURCE_ENERGY;
    if (creep.carry.energy == 0) {
      resourceType = _.findKey(creep.carry, (r) => (r > 0));
    }

    if (resourceType !== undefined) {
      switch (creep.transfer(target, resourceType)) {
        case ERR_NOT_OWNER:
          break;
        case ERR_BUSY:
          break;
        case ERR_NOT_ENOUGH_RESOURCES:
          creep.mem.role = "harvester";
          break;
        case ERR_INVALID_TARGET:
          break;
        case ERR_FULL:
          break;
        case ERR_NOT_IN_RANGE:
          worker.moveTo(creep, target);
          break;
        case ERR_INVALID_ARGS:
          break;
        default:
          break;
      }
    }

    return OK;
  }
}

module.exports = roleReplenisher;

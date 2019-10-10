let worker = require("worker");

let roleReplenisher = {
  run: function (creep) {
    // creep.say("replenish");

    if (_.sum(creep.carry) == 0) {
      creep.memory.role = "harvester";
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
        delete creep.memory.path;

        let target = pos.findClosestByPath(storages);
        if (target !== null) {
          this.replenish(creep, target);
          return OK;
        }
      }

      if (!creep.memory.path) {
        let allStorages = _.filter(_.values(Game.structures), (s) => (s.structureType == STRUCTURE_STORAGE));
        let goals = _.map(allStorages, function(storage) {
          return { pos: storage.pos, range: 1 };
        });

        results = PathFinder.search(pos, goals);
        creep.memory.path = results.path;
      }

      if (creep.memory.path) {
        creep.moveByPath(results.path);
        return OK;
      }
    }

    // too small a number of creeps
    if (Memory.endangered) {
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
    // creep.memory.role = "builder";
    creep.memory.role = "repairer";
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
          creep.memory.role = "harvester";
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

'use strict';

let worker = require("worker");

let roleHarvester = {
  run: function (creep) {
    // creep.say("harvest");

    let containers = creep.room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (creep.pos.getRangeTo(s) == 0)
    });
    if (containers.length > 0) {
      this.runParked(creep, containers[0]);
    }
    else {
      this.runFree(creep);
    }

    return OK;
  },

  runFree: function (creep) {
    // not parked
    creep.mem.parkedAt = undefined;

    let room = creep.room;

    if (_.sum(creep.carry) >= creep.carryCapacity) {
      if (room.mem.redAlert) {
        creep.mem.role = "replenisher";
        return OK;
      }

      let extensions = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_EXTENSION)});
      let spawns = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_SPAWN)});
      let extensionsNeedReplenishing = (_.reduce(extensions, (acc, s) => (acc + s.energy), 0) < (extensions.length * EXTENSION_ENERGY_CAPACITY[room.controller.level]));
      // let spawnsNeedReplenishing = _.any(spawns, (s) => (s.store[RESOURCE_ENERGY] < s.store.getCapacity[RESOURCE_ENERGY])) && (room.energyAvailable >= SPAWN_ENERGY_CAPACITY);
      let spawnsNeedReplenishing = _.any(spawns, (s) => (s.energy < s.energyCapacity)) && (room.energyAvailable >= SPAWN_ENERGY_CAPACITY);

      if (extensionsNeedReplenishing || spawnsNeedReplenishing) {
        creep.mem.role = "replenisher";
        return OK;
      }

      if (room.find(FIND_CONSTRUCTION_SITES).length) {
        creep.mem.role = "builder";
        return OK;
      }

      if (room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_TOWER)}).length) {
        creep.mem.role = "replenisher";
        return OK;
      }

      creep.mem.role = "repairer";
      return OK;
    }

    // TODO: only move to source if creep has a WORK part?
    let source = creep.pos.findClosestByPath(FIND_SOURCES);
    if (source !== null) {
      if (creep.pos.isNearTo(source)) {
        // adjacent, but there's no container
        switch (creep.pos.createConstructionSite(STRUCTURE_CONTAINER)) {
          case OK:
            break;
          case ERR_INVALID_TARGET:
            // console.log("The structure cannot be placed at the specified location.");
            break;
          case ERR_FULL:
            // console.log("You have too many construction sites.");
            break;
          case ERR_INVALID_ARGS:
            // console.log("The location is incorrect.")
            break;
          case ERR_RCL_NOT_ENOUGH:
            // console.log("Room Controller Level insufficient.");
            break;
          default:
            break;
        }

        switch (creep.harvest(source)) {
          case OK:
            break;
          case ERR_NOT_OWNER:
            break;
          case ERR_BUSY:
            break;
          case ERR_NOT_FOUND:
            break;
          case ERR_NOT_ENOUGH_RESOURCES:
            break;
          case ERR_INVALID_TARGET:
            break;
          case ERR_NOT_IN_RANGE:
              worker.moveTo(creep, source);
            break;
          case ERR_TIRED:
            break;
          case ERR_NO_BODYPART:
            break;
          default:
            break;
        }

        return OK;
      }
      else {
        // path to source is available

        worker.moveTo(creep, source);
        return OK;
      }
    }

    let fullContainer = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (_.sum(s.store) >= s.storeCapacity)
    });
    if (fullContainer !== null) {
      // path to full container is available

      // creep.say("milk");
      this.withdraw(creep, fullContainer);
      return OK;
    }

    if (room.mem.redAlert) {
      if (creep.carry.energy > 0) {
        // creep is carrying energy, so go put it somewhere useful

        creep.mem.role = "replenisher";
        return OK;
      }

      let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_STORAGE) && (s.store.energy > 0)
      });
      if (container !== null) {
        // there's energy available in the storage, so go get some

        this.withdraw(creep, container);
        return OK;
      }
    }

    let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (_.sum(s.store) > 0)
    });
    if (container !== null) {
      // path to a non-empty container is available

      this.withdraw(creep, container);
      return OK;
    }

    // let extractor = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    //   filter: (s) => (s.structureType == STRUCTURE_EXTRACTOR)
    // });
    // if (extractor !== null) {
    //   let mineral = extractor.pos.findClosestByRange(FIND_MINERALS);
    //   if (creep.pos.isNearTo(mineral)) {
    //     // creep.say("mineral!");
    //     // adjacent, but there's no container
    //     switch (creep.pos.createConstructionSite(STRUCTURE_CONTAINER)) {
    //       case OK:
    //         break;
    //       case ERR_INVALID_TARGET:
    //         // console.log("The structure cannot be placed at the specified location.");
    //         break;
    //       case ERR_FULL:
    //         // console.log("You have too many construction sites.");
    //         break;
    //       case ERR_INVALID_ARGS:
    //         // console.log("The location is incorrect.");
    //         break;
    //       case ERR_RCL_NOT_ENOUGH:
    //         // console.log("Room Controller Level insufficient.");
    //         break;
    //       default:
    //         break;
    //     }
    //
    //     switch (creep.harvest(mineral)) {
    //       case OK:
    //         break;
    //       case ERR_NOT_OWNER:
    //         // console.log("not owner");
    //         break;
    //       case ERR_BUSY:
    //         // console.log("busy");
    //         break;
    //       case ERR_NOT_FOUND:
    //         // console.log("not found");
    //         break;
    //       case ERR_NOT_ENOUGH_RESOURCES:
    //         // console.log("not enough resources");
    //         break;
    //       case ERR_INVALID_TARGET:
    //         // console.log("invalid target");
    //         break;
    //       case ERR_NOT_IN_RANGE:
    //         worker.moveTo(creep, mineral);
    //         break;
    //       case ERR_TIRED:
    //         // console.log("tired");
    //         break;
    //       case ERR_NO_BODYPART:
    //         // console.log("no body part");
    //         break;
    //       default:
    //         break;
    //     }
    //
    //     return OK;
    //   }
    //   else {
    //     // creep.say("extract");
    //     // path to source is available
    //
    //     worker.moveTo(creep, mineral);
    //     return OK;
    //   }
    // }

    // idle
    creep.mem.role = "repairer";
  },

  runParked: function (creep, container) {
    // creep.say("parked");
    creep.mem.parkedAt = container.id;

    if (creep.carry.energy >= creep.carryCapacity) {
      if (container.hits < container.hitsMax) {
        creep.repair(container);
        return OK;
      }

      let room = creep.room;
      let creepCount = room.find(FIND_MY_CREEPS).length;
      let containerCount = room.find(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_CONTAINER)
      }).length;
      if (creepCount > containerCount) {
        this.transferToNearbyContainer(creep);
      }
      else {
        if (room.find(FIND_CONSTRUCTION_SITES).length) {
          creep.mem.role = "builder";
          return OK;
        }
        if (room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_TOWER)}).length) {
          creep.mem.role = "replenisher";
          return OK;
        }
        creep.mem.role = "repairer";
        return OK;
      }
    }
    else {
      this.harvestFromNearbySource(creep);
    }
  },

  harvest: function (creep, source) {
    switch (creep.harvest(source)) {
      case ERR_NOT_OWNER:
        break;
      case ERR_BUSY:
        break;
      case ERR_NOT_FOUND:
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        // source is empty, so transfer all of our energy
        this.transferToNearbyContainer(creep);
        break;
      case ERR_INVALID_TARGET:
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, source);
        break;
      case ERR_TIRED:
        break;
      case ERR_NO_BODYPART:
        break;
      default:
        break;
    }
  },

  harvestFromNearbySource: function (creep) {
    let source = creep.pos.findClosestByRange(FIND_SOURCES);
    if (source !== null) {
      this.harvest(creep, source);
    }
  },

  transfer: function (creep, container) {
    switch (creep.transfer(container, RESOURCE_ENERGY)) { //, availableStore
      case ERR_NOT_OWNER:
        break;
      case ERR_BUSY:
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        break;
      case ERR_INVALID_TARGET:
        break;
      case ERR_FULL:
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, container);
        break;
      case ERR_INVALID_ARGS:
        break;
      default:
        break;
    }
  },

  transferToNearbyContainer: function (creep) {
    if (creep.mem.parkedAt === undefined) {
      return OK;
    }

    let container = Game.getObjectById(creep.mem.parkedAt);
    if (container == null) {
      creep.mem.parkedAt = undefined;
      return OK;
    }

    if ((container.storeCapacity - _.sum(container.store)) > 0) {
      this.transfer(creep, container);
    }
    else {
      let nearbyContainer = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (s) => {
          if ((s.structureType != STRUCTURE_CONTAINER) || (creep.pos.getRangeTo(s) != 1)) {
            return false;
          }
          return ((s.storeCapacity - _.sum(s.store)) > 0);
        }
      });
      if (nearbyContainer !== null) {
        this.transfer(creep, nearbyContainer);
      }
    }
  },

  withdraw: function (creep, container) {
    let resourceType = RESOURCE_ENERGY;

    if (container.store.energy == 0) {
      resourceType = _.findKey(container.store, (r) => (r > 0));
    }

    if (resourceType !== undefined) {
      switch (creep.withdraw(container, resourceType)) {
        case ERR_NOT_OWNER:
          break;
        case ERR_BUSY:
          break;
        case ERR_NOT_ENOUGH_RESOURCES:
          creep.mem.role = "replenisher";
          break;
        case ERR_INVALID_TARGET:
          break;
        case ERR_FULL:
          // creep.mem.role = "builder";
          // creep.mem.role = "replenisher";
          creep.mem.role = "repairer";
          break;
        case ERR_NOT_IN_RANGE:
          worker.moveTo(creep, container);
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

module.exports = roleHarvester;

'use strict';

let worker = require("worker");

let roleHarvester = {
  run: function (creep) {
    // creep.say("harvest");
    let room = creep.room;

    let containers = room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (creep.pos.getRangeTo(s) == 0)
    });
    if (containers.length > 0) {
      // creep.say("parked");
      let container = containers[0];
      creep.memory.parkedAt = container.id;

      if (creep.carry.energy >= creep.carryCapacity) {
        if (container.hits < container.hitsMax) {
          creep.repair(container);
          return OK;
        }

        let creepCount = room.find(FIND_MY_CREEPS).length;
        let containerCount = room.find(FIND_STRUCTURES, {
          filter: (s) => (s.structureType == STRUCTURE_CONTAINER)
        }).length;
        if (creepCount > containerCount) {
          this.transferToNearbyContainer(creep);
        }
        else {
          let towerCount = room.find(FIND_STRUCTURES, {
            filter: (s) => (s.structureType == STRUCTURE_TOWER)
          }).length;
          if (towerCount) {
            // switch to builder if there are any construction sites, or alternately
            //   if there's nothing to replenish?
            // creep.memory.role = "builder";
            creep.memory.role = "replenisher";
          }
          else {
            creep.memory.role = "repairer";
          }
          return OK;
        }
      }
      else {
        this.harvestFromNearbySource(creep);
      }
    }
    else {
      // not parked
      creep.memory.parkedAt = undefined;

      let redAlert = Memory.redAlert[room.name];

      if (_.sum(creep.carry) >= creep.carryCapacity) {
        // creep is full of energy and/or other resources

        creep.memory.role = "replenisher";
        return OK;
      }

      // only if room doesn't have containers?
      // if (room.name != creep.memory.birthRoom) {
        // let source = creep.pos.findClosestByRange(FIND_SOURCES);
        // if (source !== null) {
        //   switch (creep.harvest(source)) {
        //     case OK:
        //       {
        //         let sites = creep.pos.lookFor(LOOK_STRUCTURES);
        //         if (!sites.length || _.all(sites, (s) => (s.structureType != STRUCTURE_CONTAINER))) {
        //           creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
        //         }
        //       }
        //       break;
        //     case ERR_NOT_IN_RANGE:
        //       {
        //         let sites = creep.pos.lookFor(LOOK_STRUCTURES);
        //         if (!sites.length || _.all(sites, (s) => (s.structureType != STRUCTURE_ROAD))) {
        //           creep.pos.createConstructionSite(STRUCTURE_ROAD);
        //         }
        //         worker.moveTo(creep, source);
        //       }
        //       break;
        //   }
        // }
        // else {
        //   creep.memory.role = "builder";
        // }
        // return OK;
      // }

      // TODO: only move to source if creep has a WORK part
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

      if (redAlert) {
        if (creep.carry.energy > 0) {
          // creep is carrying energy, so go put it somewhere useful

          creep.memory.role = "replenisher";
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

      // idle
      creep.memory.role = "repairer";
    }

    return OK;
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
    if (creep.memory.parkedAt === undefined) {
      return OK;
    }

    let container = Game.getObjectById(creep.memory.parkedAt);
    if (container == null) {
      creep.memory.parkedAt = undefined;
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
          creep.memory.role = "replenisher";
          break;
        case ERR_INVALID_TARGET:
          break;
        case ERR_FULL:
          // creep.memory.role = "builder";
          // creep.memory.role = "replenisher";
          creep.memory.role = "repairer";
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

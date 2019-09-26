// TODO: combine with role/static_harvester.js
// static harvester doesn't need to be its own role
// harvester can become "static" as soon as it occupies the same square as a container

var worker = require("worker");

var roleHarvester = {
  run: function (creep) {
    // creep.say("harvest");

    var containers = creep.room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (creep.pos.getRangeTo(s) == 0)
    });
    if (containers.length > 0) {
      // parked on a container
      // creep.say("parked");
      var container = containers[0];
      creep.memory.parkedAt = container.id;

      if (creep.carry.energy >= creep.carryCapacity) {
        this.transferToNearbyContainer(creep);
      }
      else {
        this.harvestFromNearbySource(creep);
      }
    }
    else {
      // away from a container, but maybe near one
      if (creep.carry.energy >= creep.carryCapacity) {
        // creep is full, so change role

        // TODO: switch according to whether there are hostile creeps in the room
        creep.memory.role = "builder";
        // creep.memory.role = "replenisher";
      }
      else {
        var source = creep.pos.findClosestByPath(FIND_SOURCES);
        if (source !== null) {
          // open square at a source
          worker.moveTo(creep, source);
        }
        else {
          // all squares adjacent to sources are occupied
          var container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (_.sum(s.store) > 0)
          });
          if (container !== null) {
            this.withdraw(creep, container);
          }
        }
      }
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
    var source = creep.pos.findClosestByRange(FIND_SOURCES);
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

    var container = Game.getObjectById(creep.memory.parkedAt);
    if (container == null) {
      creep.memory.parkedAt = undefined;
      return OK;
    }

    if ((container.storeCapacity - _.sum(container.store)) > 0) {
      this.transfer(creep, container);
    }
    else {
      nearbyContainer = creep.pos.findClosestByRange(FIND_STRUCTURES, {
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
    switch (creep.withdraw(container, RESOURCE_ENERGY)) {
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
        creep.memory.role = "builder";
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
}

module.exports = roleHarvester;

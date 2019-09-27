var worker = require("worker");

var roleHarvester = {
  run: function (creep) {
    // creep.say("harvest");

    var containers = creep.room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (creep.pos.getRangeTo(s) == 0)
    });
    if (containers.length > 0) {
      // creep.say("parked");
      var container = containers[0];
      creep.memory.parkedAt = container.id;

      if (creep.carry.energy >= creep.carryCapacity) {
        var creepCount = creep.room.find(FIND_MY_CREEPS).length;
        var containerCount = creep.room.find(FIND_STRUCTURES, {
          filter: (s) => (s.structureType == STRUCTURE_CONTAINER)
        }).length;
        if (creepCount > containerCount) {
          this.transferToNearbyContainer(creep);
        }
        else {
          creep.memory.role = "replenisher";
          return OK;
        }
      }
      else {
        this.harvestFromNearbySource(creep);
      }
    }
    else {
      // not parked
      hostiles = (creep.room.find(FIND_HOSTILE_CREEPS).length > 0);

      if (_.sum(creep.carry) >= creep.carryCapacity) {
        if (hostiles) {
          // creep.say("redalert");
          creep.memory.role = "replenisher";
          return OK;
        }

        if (creep.carry.energy < creep.carryCapacity) {
          creep.memory.role = "replenisher";
        }
        else {
          creep.memory.role = "builder";
        }
        return OK;
      }

      var source = creep.pos.findClosestByPath(FIND_SOURCES);
      if (source !== null) {
        worker.moveTo(creep, source);
        return OK;
      }

      var fullContainer = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (_.sum(s.store) >= s.storeCapacity)
      });
      if (fullContainer !== null) {
        // creep.say("milk");
        this.withdraw(creep, fullContainer);
        return OK;
      }

      if (hostiles) {
        var container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (s) => (s.structureType == STRUCTURE_STORAGE) && (_.sum(s.store) > 0)
        });
        if (container !== null) {
          this.withdraw(creep, container);
          return OK;
        }
      }

      var container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (_.sum(s.store) > 0)
      });
      if (container === null) {
        container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (s) => (s.structureType == STRUCTURE_STORAGE) && (_.sum(s.store) > 0)
        });
      }
      if (container !== null) {
        this.withdraw(creep, container);
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
    var resourceType = RESOURCE_ENERGY;
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

    return OK;
  }
}

module.exports = roleHarvester;

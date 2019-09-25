// TODO: combine with role/harvester.js
// static harvester doesn't need to be its own role
// harvester can become "static" as soon as it occupies the same square as a container

var worker = require("worker");

var roleStaticHarvester = {
  run: function (creep) {
    // creep.say("static");

    var containers = creep.room.find(FIND_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_CONTAINER)
    });
    container = _.find(containers, (c) => (creep.pos.getRangeTo(c) == 0));
    if (container !== undefined) {
      if (creep.carry.energy < creep.carryCapacity) {
        this.staticHarvest(creep, creep.pos.findClosestByRange(FIND_SOURCES));
      }
      else {
        var store = _.sum(container.store);
        var availableStore = container.storeCapacity - store;
        if (availableStore > 0) {
          this.staticTransfer(creep, container);
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
            creep.transfer(nearbyContainer, RESOURCE_ENERGY);
          }
        }
      }
    }
    else {
      // TODO: find *closest* container that isn't occupied by a creep
      container = _.find(containers, (c) => !(_.any(_.values(Game.creeps), (candidate) => (candidate.pos.getRangeTo(c) == 0))));
      if (container !== undefined) {
        creep.moveTo(container, {visualizePathStyle: {stroke: "#FFFF00"}});
      }
    }

    return OK;
  },

  staticHarvest: function (creep, source) {
    switch (creep.harvest(source)) {
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
        break;
      case ERR_TIRED:
        break;
      case ERR_NO_BODYPART:
        break;
      default:
        break;
    }
  },

  staticTransfer: function (creep, container) {
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
        break;
      case ERR_INVALID_ARGS:
        break;
      default:
        break;
    }
  }
}

module.exports = roleStaticHarvester;

let worker = require("worker");

let roleRepairer = {
  run: function (creep) {
    if (creep.carry.energy == 0) {
      creep.memory.role = "harvester";
      return OK;
    }

    let pos = creep.pos;
    let room = creep.room;
    let ramparts = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_RAMPART)});
    let towers = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_TOWER)});
    let walls = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_WALL)});

    let tower = pos.findClosestByPath(towers, {
      filter: (s) => (s.energy < s.energyCapacity)
    });
    if (tower === null) {
      // no towers, so go looking for ramparts or walls that need repairing

      target = pos.findClosestByRange(ramparts, {
        filter: (s) => (s.hits <= (RAMPART_DECAY_AMOUNT * 5))
      });
      if (target !== null) {
        this.repair(creep, target);
        return OK;
      }

      // repair new walls up to a minimum safe level
      // (yes, I'm aware walls don't decay, but it's as good an initial level as any)
      target = pos.findClosestByRange(walls, {
        filter: (s) => (s.hits <= (RAMPART_DECAY_AMOUNT * 5))
      });
      if (target !== null) {
        this.repair(creep, target);
        return OK;
      }

      // repair ramparts that are below the low water threshold
      target = pos.findClosestByRange(ramparts, {
        filter: (s) => (s.hits < (Memory.defenseLowWater[room.name][STRUCTURE_RAMPART] - (towers.length * TOWER_POWER_REPAIR * TOWER_FALLOFF)))
      });
      if (target !== null) {
        this.repair(creep, target);
        return OK;
      }

      // repair walls that are below the low water threshold
      target = pos.findClosestByRange(walls, {
        filter: (s) => (s.hits < (Memory.defenseLowWater[room.name][STRUCTURE_WALL]))
      });
      if (target !== null) {
        this.repair(creep, target);
        return OK;
      }

      target = pos.findClosestByPath(FIND_STRUCTURES, {
        // filter out ramparts only if there aren't any towers in the room?
        filter: (s) => (s.structureType != STRUCTURE_RAMPART) && (s.structureType != STRUCTURE_WALL) && (s.hits < s.hitsMax)
      });
      if (target !== null) {
        // creep.say("repair");
        this.repair(creep, target);
        return OK;
      }

      // if we got this far, bump up the low water threshold
      // only bump the low water threshold if there aren't any towers in the room?
      Memory.triggerAutoincrementThreshold[room.name] = true;
      creep.memory.role = "builder";
      return OK;
    }
    else {
      let target = pos.findClosestByPath(FIND_STRUCTURES, {
        // filter out ramparts only if there aren't any towers in the room?
        filter: (s) => (s.structureType != STRUCTURE_RAMPART) && (s.structureType != STRUCTURE_WALL) && (s.hits < s.hitsMax)
      });
      if (target === null) {
        this.replenishTower(creep, tower);
        return OK;
      }
      else {
        // creep.say("repair");
        this.repair(creep, target);
        return OK;
      }
    }

    return OK;
  },

  repair: function (creep, target) {
    switch (creep.repair(target)) {
      case ERR_NOT_OWNER:
        break;
      case ERR_BUSY:
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        creep.memory.role = "harvester";
        break;
      case ERR_INVALID_TARGET:
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, target);
        break;
      case ERR_NO_BODYPART:
        creep.suicide();
        break;
      default:
        break;
    }
  },

  replenishTower: function (creep, tower) {
    switch (creep.transfer(tower, RESOURCE_ENERGY)) {
      case ERR_NOT_OWNER:
        break;
      case ERR_BUSY:
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        creep.memory.role = "upgrader";
        break;
      case ERR_INVALID_TARGET:
        break;
      case ERR_FULL:
        creep.memory.role = "upgrader";
        break;
      case ERR_NOT_IN_RANGE:
        worker.moveTo(creep, tower);
        break;
      case ERR_INVALID_ARGS:
        break;
      default:
        break;
    }
  }
}

module.exports = roleRepairer;

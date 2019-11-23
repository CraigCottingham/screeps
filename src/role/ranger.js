"use strict";

let worker = require("worker");

let roleRanger = {
  run: function (creep) {
    if (creep.mem.task === undefined) {
      if ((Memory.colonize === undefined) || (creep.pos.roomName == Memory.colonize)) {
        return this.switchTo(creep, "harvest");
      }
      else {
        creep.mem.targetRoomName = Memory.colonize;
        creep.mem.roomName = creep.pos.roomName;
        return this.switchTo(creep, "insert");
      }
    }

    switch (creep.mem.task) {
      case "build":
        creep.say(creep.mem.task);
        this.build(creep);
        break;
      case "claim":
        creep.say(creep.mem.task);
        this.claim(creep);
        break;
      case "dismantle":
        creep.say(creep.mem.task);
        this.dismantle(creep);
        break;
      case "harvest":
        creep.say(creep.mem.task);
        this.harvest(creep);
        break;
      case "insert":
        creep.say(creep.mem.task);
        this.insert(creep);
        break;
      case "repair":
        creep.say(creep.mem.task);
        this.repair(creep);
        break;
      case "replenish":
        creep.say(creep.mem.task);
        this.replenish(creep);
        break;
      case "upgrade":
        creep.say(creep.mem.task);
        this.upgrade(creep);
        break;
      default:
        console.log(`ranger.run: unknown task ${creep.mem.task}`);
        break;
    }

    return OK;
  },

  build: function (creep) {
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
      return this.switchTo(creep, "harvest");
    }

    if (creep.room.controller.ticksToDowngrade < (CONTROLLER_DOWNGRADE[creep.room.controller.level] - 1000)) {
      return this.switchTo(creep, "upgrade");
    }

    let site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
      filter: (cs) => (cs.structureType == STRUCTURE_SPAWN)
    });
    if (site === null) {
      site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    }

    switch (creep.build(site)) {
      case OK:
        break;
      case ERR_NOT_OWNER:
        console.log("ranger.build: not owner");
        break;
      case ERR_BUSY:
        console.log("ranger.build: busy");
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        console.log("ranger.build: not enough resources");
        return this.switchTo(creep, "harvest");
      case ERR_INVALID_TARGET:
        console.log("ranger.build: invalid target");
        break;
      case ERR_NOT_IN_RANGE:
        // console.log("ranger.build: not in range");
        break;
      case ERR_NO_BODYPART:
        console.log("ranger.build: no bodypart");
        creep.suicide();
        break;
    }

    if (creep.mem.path === undefined) {
      creep.mem.path = creep.room.findPath(creep.pos, site.pos, { range: 0 });
    }
    return this.moveByPath(creep);
  },

  claim: function (creep) {
    if (creep.room.controller.my && (!creep.room.controller.sign || creep.room.controller.sign.username != "CraigCottingham")) {
      return this.tryToSignController(creep);
    }

    if (!creep.room.controller.my && creep.pos.isNearTo(creep.room.controller)) {
      this.tryToClaimController(creep);
      return this.switchTo(creep, "harvest");
    }

    if (creep.room.controller.my) {
      return this.switchTo(creep, "harvest");
    }

    if (creep.mem.path === undefined) {
      creep.mem.path = creep.room.findPath(creep.pos, creep.room.controller.pos, { range: 1 });
    }
    return this.moveByPath(creep);
  },

  createContainer: function (pos) {
    switch (pos.createConstructionSite(STRUCTURE_CONTAINER)) {
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

    return OK;
  },

  dismantle: function (creep) {
    const target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
    if (target === null) {
      // console.log(`ranger.dismantle (${creep.name}): can't find anything to dismantle`);
      creep.mem.task = "harvest";
      delete creep.mem.path;
      // don't jump back to run(); that would enter an infinite loop
      return OK;
    }

    switch (creep.dismantle(target)) {
      case OK:
        break;
      case ERR_NOT_OWNER:
        console.log("ranger.dismantle: not owner");
        break;
      case ERR_BUSY:
        console.log("ranger.dismantle: busy");
        break;
      case ERR_INVALID_TARGET:
        console.log("ranger.dismantle: invalid target");
        break;
      case ERR_NOT_IN_RANGE:
        // console.log("ranger.dismantle: not in range");
        if (creep.mem.path === undefined) {
          creep.mem.path = creep.room.findPath(creep.pos, target.pos, { range: 0 });
        }
        this.moveByPath(creep);
        break;
      case ERR_NO_BODYPART:
        console.log("ranger.dismantle: no bodypart");
        creep.suicide();
        break;
    }

    return OK;
  },

  harvest: function (creep) {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
      if (creep.room.mem.endangered) {
        this.switchTo(creep, "replenish");
      }

      // if on top of a container, drop store into the container
      const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (s.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
      })
      if ((container !== null) && (creep.pos.getRangeTo(container) == 0)) {
        // console.log(`ranger.harvest (${creep.name}): transferring to container ${container.id}`);
        this.transfer(creep, container);
        return OK;
      }

      this.switchTo(creep, "repair");
    }

    let target = null;

    if (creep.mem.assignment) {
      target = Game.getObjectById(creep.mem.assignment);
      if ((target !== null) && (target.store !== undefined) && (target.store.getUsedCapacity(RESOURCE_ENERGY) > 0)) {
        creep.say("scavenge");
        return this.harvestFromStructure(creep, target);
      }
      delete creep.mem.assignment;
    }

    if (creep.room.mem.endangered) {
      target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
      });
      if (target !== null) {
        return this.harvestFromStructure(creep, target);
      }
    }

    if (false) {
      let candidateTargets = [];

      target = creep.pos.findClosestByPath(FIND_SOURCES);
      if (target !== null) {
        candidateTargets.push(target);
      }

      target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_EXTENSION) && (s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
      });
      if (target !== null) {
        candidateTargets.push(target);
      }

      target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
      });
      if (target !== null) {
        candidateTargets.push(target);
      }

      target = creep.pos.findClosestByPath(candidateTargets);
      if (target !== null) {
        if (target instanceof Source) {
          return this.harvestFromSource(creep, target);
        }
        else {
          return this.harvestFromStructure(creep, target);
        }
      }
    }
    else {
      target = creep.pos.findClosestByPath(FIND_SOURCES);
      if (target !== null) {
        return this.harvestFromSource(creep, target);
      }

      target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_EXTENSION) && (s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
      });
      if (target !== null) {
        return this.harvestFromStructure(creep, target);
      }

      target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
      });
      if (target !== null) {
        return this.harvestFromStructure(creep, target);
      }
    }

    return this.switchTo("dismantle");
  },

  harvestFromSource: function (creep, source) {
    if (creep.pos.isNearTo(source)) {
      const structures = creep.pos.lookFor(LOOK_STRUCTURES);
      if (!structures.length || _.all(structures, (s) => (s.structureType != STRUCTURE_CONTAINER))) {
        this.createContainer(creep.pos);
      }
    }

    switch (creep.harvest(source)) {
      case OK:
        break;
      case ERR_NOT_OWNER:
        console.log("ranger.harvestFromSource: not owner");
        break;
      case ERR_BUSY:
        console.log("ranger.harvestFromSource: busy");
        break;
      case ERR_NOT_FOUND:
        console.log("ranger.harvestFromSource: not found");
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        console.log("ranger.harvestFromSource: not enough resources");
        break;
      case ERR_INVALID_TARGET:
        console.log("ranger.harvestFromSource: invalid target");
        break;
      case ERR_NOT_IN_RANGE:
        // console.log("ranger.harvestFromSource: not in range");
        if (creep.mem.path === undefined) {
          creep.mem.path = creep.room.findPath(creep.pos, source.pos, { range: 1 });
        }
        this.moveByPath(creep);
        break;
      case ERR_TIRED:
        console.log("ranger.harvestFromSource: tired");
        break;
      case ERR_NO_BODYPART:
        console.log("ranger.harvestFromSource: no bodypart");
        break;
    }

    return OK;
  },

  harvestFromStructure: function (creep, structure) {
    switch (creep.withdraw(structure, RESOURCE_ENERGY)) {
      case OK:
        break;
      case ERR_NOT_OWNER:
        console.log("ranger.harvestFromStructure: not owner");
        break;
      case ERR_BUSY:
        console.log("ranger.harvestFromStructure: busy");
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        console.log("ranger.harvestFromStructure: not enough resources");
        break;
      case ERR_INVALID_TARGET:
        console.log("ranger.harvestFromStructure: invalid target");
        break;
      case ERR_FULL:
        // console.log("ranger.harvestFromStructure: full");
        return this.switchTo(creep, "repair");
      case ERR_NOT_IN_RANGE:
        // console.log("ranger.harvestFromStructure: not in range");
        if (creep.mem.path === undefined) {
          creep.mem.path = creep.room.findPath(creep.pos, structure.pos, { range: 0 });
        }
        this.moveByPath(creep);
        break;
      case ERR_INVALID_ARGS:
        console.log("ranger.harvestFromStructure: invalid args");
        break;
    }

    return OK;
  },

  insert: function (creep) {
    if (creep.pos.roomName != creep.mem.roomName) {
      // on the last move, we changed rooms, so recalculate path
      delete creep.mem.path;
      if (creep.pos.roomName == creep.mem.targetRoomName) {
        creep.mem.task = "claim";
        return this.run(creep);
      }
    }

    if (!creep.mem.path) {
      let destination = new RoomPosition(25, 25, creep.mem.targetRoomName);
      if (Game.rooms[creep.mem.targetRoomName] !== undefined) {
        // room to colonize is visible, so set destination to controller
        destination = Game.rooms[creep.mem.targetRoomName].controller.pos;
      }

      creep.mem.path = creep.room.findPath(creep.pos, destination, { range: 1 });
    }

    this.moveByPath(creep);
    return OK;
  },

  moveByPath: function (creep) {
    if ((creep.mem.pos !== undefined) && (creep.pos.x == creep.mem.pos.x) && (creep.pos.y == creep.mem.pos.y)) {
      if (creep.mem.watchdog == 0) {
        // console.log(`ranger.moveByPath (${creep.name}): recalculating`);
        delete creep.mem.path;
        delete creep.mem.pos;
        delete creep.mem.watchdog;
        return OK;
      }
      else {
        creep.mem.watchdog = creep.mem.watchdog - 1;
      }
    }

    switch (creep.moveByPath(creep.mem.path)) {
      case OK:
        creep.mem.roomName = creep.pos.roomName;
        break;
      case ERR_TIRED:
        console.log("ranger.moveByPath: tired");
        break;
      case ERR_NOT_OWNER:
        console.log("ranger.moveByPath: not owner");
        delete creep.mem.path;
        break;
      case ERR_BUSY:
        console.log("ranger.moveByPath: busy");
        delete creep.mem.path;
        break;
      case ERR_NOT_FOUND:
        // console.log("ranger.moveByPath: not found");
        delete creep.mem.path;
        break;
      case ERR_INVALID_ARGS:
        console.log("ranger.moveByPath: invalid args");
        delete creep.mem.path;
        break;
      case ERR_NO_BODYPART:
        console.log("ranger.moveByPath: no bodypart");
        creep.suicide();
        break;
    }

    creep.mem.pos = creep.pos;
    if (creep.mem.watchdog === undefined) {
      creep.mem.watchdog = 3;
    }

    return OK;
  },

  repair: function (creep) {
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
      creep.mem.task = "harvest";
      delete creep.mem.path;
      return this.run(creep);
    }

    const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => (s.structureType != STRUCTURE_ROAD) && (s.hits < s.hitsMax)
    });
    if (target === null) {
      // console.log(`ranger.repair (${creep.name}): nothing to repair except roads`);
      creep.mem.task = "replenish";
      delete creep.mem.path;
      return this.run(creep);
    }

    switch (creep.repair(target)) {
      case OK:
        break;
      case ERR_NOT_OWNER:
        console.log("ranger.repair: not owner");
        break;
      case ERR_BUSY:
        console.log("ranger.repair: busy");
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        console.log("ranger.repair: not enough resources");
        creep.mem.role = "harvester";
        delete creep.mem.path;
        return this.run(creep);
      case ERR_INVALID_TARGET:
        console.log("ranger.repair: invalid target");
        break;
      case ERR_NOT_IN_RANGE:
        // console.log("ranger.repair: not in range");
        break;
      case ERR_NO_BODYPART:
        console.log("ranger.repair: no bodypart");
        creep.suicide();
        break;
      default:
        break;
    }

    if (creep.mem.path === undefined) {
      creep.mem.path = creep.room.findPath(creep.pos, target.pos, { range: 0 });
    }
    return this.moveByPath(creep);
  },

  replenish: function (creep) {
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
      creep.mem.task = "harvest";
      delete creep.mem.path;
      return this.run(creep);
    }

    if (creep.room.controller.ticksToDowngrade < (CONTROLLER_DOWNGRADE[creep.room.controller.level] - 1000)) {
      creep.mem.task = "upgrade";
      delete creep.mem.path;
      return this.run(creep);
    }

    const extensions = creep.room.find(FIND_MY_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_EXTENSION) && (s.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
    });
    const spawns = creep.room.find(FIND_MY_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_SPAWN) && (s.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
    });
    const target = creep.pos.findClosestByPath(_.union(extensions, spawns));
    if (target !== null) {
      return this.transfer(creep, target);
    }

    return this.switchTo(creep, "build");
  },

  sign: function (creep) {
    switch (creep.signController(creep.room.controller, "CraigCottingham - github.com/CraigCottingham/screeps")) {
      case OK:
        break;
      case ERR_BUSY:
        console.log("ranger.sign: busy");
        break;
      case ERR_INVALID_TARGET:
        console.log("ranger.sign: invalid target");
        break;
      case ERR_NOT_IN_RANGE:
        // console.log("ranger.sign: not in range");
        if (creep.mem.path === undefined) {
          creep.mem.path = creep.room.findPath(creep.pos, creep.room.controller.pos, { range: 1 });
        }
        this.moveByPath(creep);
        break;
    }

    return OK;
  },

  switchTo(creep, task) {
    creep.mem.task = task;
    delete creep.mem.path;
    delete creep.mem.assignment;
    return this.run(creep);
  },

  transfer: function (creep, target) {
    switch (creep.transfer(target, RESOURCE_ENERGY)) {
      case OK:
        break;
      case ERR_NOT_OWNER:
        console.log("ranger.transfer: not owner");
        break;
      case ERR_BUSY:
        console.log("ranger.transfer: busy");
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        console.log("ranger.transfer: not enough resources");
        creep.mem.task = "harvest";
        delete creep.mem.path;
        break;
      case ERR_INVALID_TARGET:
        console.log("ranger.transfer: invalid target");
        break;
      case ERR_FULL:
        // console.log("ranger.transfer: full");
        creep.mem.task = "replenish";
        delete creep.mem.path;
        break;
      case ERR_NOT_IN_RANGE:
        // console.log("ranger.transfer: not in range");
        if (creep.mem.path === undefined) {
          creep.mem.path = creep.room.findPath(creep.pos, target.pos, { range: 1 });
        }
        this.moveByPath(creep);
        break;
      case ERR_INVALID_ARGS:
        console.log("ranger.transfer: invalid args");
        break;
    }

    return OK;
  },

  tryToClaimController: function (creep) {
    if (!creep.room.controller.my && creep.pos.isNearTo(creep.room.controller)) {
      switch (creep.claimController(creep.room.controller)) {
        case OK:
          break;
        case ERR_NOT_OWNER:
          console.log("ranger.tryToClaimController: not owner");
          break;
        case ERR_BUSY:
          console.log("ranger.tryToClaimController: busy");
          break;
        case ERR_INVALID_TARGET:
          console.log("ranger.tryToClaimController: invalid target");
          break;
        case ERR_FULL:
          console.log("ranger.tryToClaimController: full");
          break;
        case ERR_NOT_IN_RANGE:
          console.log("ranger.tryToClaimController: not in range");
          break;
        case ERR_NO_BODYPART:
          console.log("ranger.tryToClaimController: no bodypart");
          break;
        case ERR_GCL_NOT_ENOUGH:
          // this.tryToReserveController(creep);
          console.log("ranger.tryToClaimController: gcl not enough");
          break;
      }
    }

    return OK;
  },

  tryToReserveController: function (creep) {
    if (!creep.room.controller.my && creep.pos.isNearTo(creep.room.controller)) {
      switch (creep.reserveController(creep.room.controller)) {
        case OK:
          break;
        case ERR_NOT_OWNER:
          console.log("ranger.tryToReserveController: not owner");
          break;
        case ERR_BUSY:
          console.log("ranger.tryToReserveController: busy");
          break;
        case ERR_INVALID_TARGET:
          console.log("ranger.tryToReserveController: invalid target");
          break;
        case ERR_NOT_IN_RANGE:
          console.log("ranger.tryToReserveController: not in range");
          if (creep.mem.path === undefined) {
            creep.mem.path = creep.room.findPath(creep.pos, creep.room.controller.pos, { range: 1 });
          }
          this.moveByPath(creep);
          break;
        case ERR_NO_BODYPART:
          console.log("ranger.tryToReserveController: no bodypart");
          break;
      }
    }

    return OK;
  },

  upgrade: function (creep) {
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
      switch (creep.upgradeController(creep.room.controller)) {
        case OK:
          break;
        case ERR_NOT_OWNER:
          console.log("ranger.upgrade: not owner");
          break;
        case ERR_BUSY:
          console.log("ranger.upgrade: busy");
          break;
        case ERR_NOT_ENOUGH_RESOURCES:
          console.log("ranger.upgrade: not enough resources");
          creep.mem.task = "harvest";
          delete creep.mem.path;
          break;
        case ERR_INVALID_TARGET:
          console.log("ranger.upgrade: invalid target");
          break;
        case ERR_NOT_IN_RANGE:
          // console.log("ranger.upgrade: not in range");
          break;
        case ERR_NO_BODYPART:
          console.log("ranger.upgrade: no bodypart");
          creep.suicide();
          break;
      }

      this.sign(creep);

      if (creep.mem.path === undefined) {
        creep.mem.path = creep.room.findPath(creep.pos, creep.room.controller.pos, { range: 1 });
      }
      this.moveByPath(creep);
    }
    else {
      creep.mem.task = "harvest";
      delete creep.mem.path;
    }

    return OK;
  }
}

module.exports = roleRanger;

"use strict";

let roleRanger = {
  run: function (creep) {
    if (creep.mem.task === undefined) {
      if ((Memory.colonize === undefined) || (creep.pos.roomName == Memory.colonize)) {
        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
          // console.log(`ranger.run (${creep.name}): task is undefined and creep is full`);
          return this.switchTo(creep, "replenish");
        }
        else {
          // console.log(`ranger.run (${creep.name}): task is undefined and creep has capacity`);
          return this.switchTo(creep, "harvest");
        }
      }
      else {
        creep.mem.targetRoomName = Memory.colonize;
        creep.mem.roomName = creep.pos.roomName;
        // console.log(`ranger.run (${creep.name}): task is undefined because we're going colonizing`)
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
      // console.log(`ranger.build (${creep.name}): empty`);
      return this.switchTo(creep, "harvest");
    }

    if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
      // console.log(`ranger.build (${creep.name}): room needs replenishing`);
      return this.switchTo(creep, "replenish");
    }

    if (creep.room.controller.ticksToDowngrade < (CONTROLLER_DOWNGRADE[creep.room.controller.level] - 1000)) {
      // console.log(`ranger.build (${creep.name}): controller needs upgrading`);
      return this.switchTo(creep, "upgrade");
    }

    let target;

    target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
      filter: (cs) => (cs.structureType == STRUCTURE_SPAWN)
    });
    if (target !== null) {
      this.updateTarget(creep, target);
      return this.buildSite(creep, target);
    }

    target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (target !== null) {
      this.updateTarget(creep, target);
      return this.buildSite(creep, target);
    }

    const towers = creep.room.find(FIND_MY_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_TOWER)});
    if (towers.length) {
      target = creep.pos.findClosestByPath(towers, {
        filter: (s) => (s.store.getFreeCapacity(RESOURCE_ENERGY) >= creep.store.getUsedCapacity(RESOURCE_ENERGY))
      });
      if (target !== null) {
        this.updateTarget(creep, target);
        return this.transfer(creep, target);
      }

      target = creep.room.storage;
      if (target !== null) {
        this.updateTarget(creep, target);
        return this.transfer(creep, target);
      }
    }
    else {
      // repair critical ramparts
      target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_RAMPART) && (s.hits <= (RAMPART_DECAY_AMOUNT * 5))
      });
      if (target !== null) {
        // console.log(`ranger.build (${creep.name}): found critical rampart to repair`);
        this.updateTarget(creep, target);
        return this.repairStructure(creep, target);
      }

      // repair ramparts that are below the low water threshold
      target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_RAMPART) && (s.hits < creep.room.mem.threshold.rampart)
      });
      if (target !== null) {
        // console.log(`ranger.build (${creep.name}): found rampart to repair`);
        this.updateTarget(creep, target);
        return this.repairStructure(creep, target);
      }

      // repair walls thar are below the low water threshold
      // TODO: only if there aren't any towers in the room?
      target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_WALL) && (s.hits < creep.room.mem.threshold.wall)
      });
      if (target !== null) {
        // console.log(`ranger.build (${creep.name}): found wall to repair`);
        this.updateTarget(creep, target);
        return this.repairStructure(creep, target);
      }

      // if we got this far, bump up the low water threshold
      creep.room.mem.threshold.update = true;
    }

    return this.switchTo(creep, "upgrade");
  },

  buildSite: function (creep, target) {
    this.requireBodyPart(creep, WORK);

    switch (creep.build(target)) {
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

    this.recalculatePath(creep, target.pos, { range: 0 });
    return this.moveByPath(creep);
  },

  claim: function (creep) {
    if (creep.room.controller.my && (!creep.room.controller.sign || creep.room.controller.sign.username != "CraigCottingham")) {
      return this.tryToSignController(creep);
    }

    if (!creep.room.controller.my && creep.pos.isNearTo(creep.room.controller)) {
      this.claimController(creep);
      // console.log(`ranger.claim (${creep.name}): claimed controller`)
      return this.switchTo(creep, "harvest");
    }

    if (creep.room.controller.my) {
      // console.log(`ranger.claim (${creep.name}): already own controller`)
      return this.switchTo(creep, "harvest");
    }

    this.recalculatePath(creep, creep.room.controller.pos, { range: 1, calledFrom: "claim" });
    // if (creep.mem.path === undefined) {
    //   creep.mem.path = creep.room.findPath(creep.pos, creep.room.controller.pos, { range: 1 });
    // }
    return this.moveByPath(creep);
  },

  claimController: function (creep) {
    if (!creep.room.controller.my && creep.pos.isNearTo(creep.room.controller)) {
      switch (creep.claimController(creep.room.controller)) {
        case OK:
          break;
        case ERR_NOT_OWNER:
          console.log("ranger.claimController: not owner");
          break;
        case ERR_BUSY:
          console.log("ranger.claimController: busy");
          break;
        case ERR_INVALID_TARGET:
          console.log("ranger.claimController: invalid target");
          break;
        case ERR_FULL:
          console.log("ranger.claimController: full");
          break;
        case ERR_NOT_IN_RANGE:
          console.log("ranger.claimController: not in range");
          break;
        case ERR_NO_BODYPART:
          console.log("ranger.claimController: no bodypart");
          break;
        case ERR_GCL_NOT_ENOUGH:
          // this.reserveController(creep);
          console.log("ranger.claimController: gcl not enough");
          break;
      }
    }

    return OK;
  },

  createContainer: function (pos) {
    switch (pos.createConstructionSite(STRUCTURE_CONTAINER)) {
      case OK:
        break;
      case ERR_INVALID_TARGET:
        // console.log("ranger.createContainer: invalid target");
        break;
      case ERR_FULL:
        // console.log("ranger.createContainer: full");
        break;
      case ERR_INVALID_ARGS:
        // console.log("ranger.createContainer: invalid args");
        break;
      case ERR_RCL_NOT_ENOUGH:
        // console.log("ranger.createContainer: rcl not enough");
        break;
      default:
        break;
    }

    return OK;
  },

  dismantle: function (creep) {
    this.requireBodyPart(creep, WORK);

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
        this.recalculatePath(creep, target.pos, { range: 0, calledFrom: "dismantle" });
        // if (creep.mem.path === undefined) {
        //   creep.mem.path = creep.room.findPath(creep.pos, target.pos, { range: 0 });
        // }
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
    this.requireBodyPart(creep, WORK);

    let container = _.find(creep.pos.lookFor(LOOK_STRUCTURES), (s) => (s.structureType == STRUCTURE_CONTAINER) && (s.store.getFreeCapacity(RESOURCE_ENERGY) > 0));
    let source = null;
    const sources = creep.pos.findInRange(FIND_SOURCES, 1);
    if (sources.length && _.any(sources, (s) => (s.energy > 0))) {
      source = sources[0];
    }

    // creep is full
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
      if ((container !== undefined) && (source !== null)) {
        return this.transfer(creep, container);
      }

      // if (creep.room.controller.ticksToDowngrade < (CONTROLLER_DOWNGRADE[creep.room.controller.level] - 1000)) {
      //   return this.switchTo(creep, "upgrade");
      // }

      return this.switchTo(creep, "replenish");
    }

    // creep is parked on a container with free space
    if (container !== undefined) {
      if (creep.room.mem.endangered) {
        return this.withdraw(creep, container);
      }

      let target = creep.pos.findClosestByPath(FIND_SOURCES, {
        filter: (s) => (s.energy > 0)
      });
      if (target !== null) {
        this.updateTarget(creep, target);
        return this.harvestFromSource(creep, target);
      }

      // fall through, since apparently our source is empty
      // TODO: don't fall through, because that causes us to repeatedly withdraw and transfer
      // instead, find some *other* source and/or container
    }

    // creep is not parked on a container with free space
    let target = null;

    target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: (r) => (r.resourceType == RESOURCE_ENERGY)
    });
    if (target !== null) {
      creep.say("scavenge");
      this.updateTarget(creep, target);
      return this.pickup(creep, target);
    }

    target = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
      filter: (ts) => (ts.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
    });
    if (target !== null) {
      creep.say("scavenge");
      this.updateTarget(creep, target);
      return this.withdraw(creep, target);
    }

    target = creep.pos.findClosestByPath(FIND_RUINS, {
      filter: (r) => (r.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
    });
    if (target !== null) {
      creep.say("scavenge");
      this.updateTarget(creep, target);
      return this.withdraw(creep, target);
    }

    if (creep.room.mem.endangered) {
      target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
      });
      if (target !== null) {
        this.updateTarget(creep, target);
        return this.withdraw(creep, target);
      }

      target = creep.room.storage;
      if ((target !== undefined) && (target.store.getUsedCapacity(RESOURCE_ENERGY) > 0)) {
        this.updateTarget(creep, target);
        return this.withdraw(creep, target);
      }
    }

    if ((creep.room.energyAvailable < creep.room.energyCapacityAvailable) ||
        (creep.room.controller.ticksToDowngrade < (CONTROLLER_DOWNGRADE[creep.room.controller.level] - 1000))) {
      target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
      });
      if (target !== null) {
        this.updateTarget(creep, target);
        return this.withdraw(creep, target);
      }

      target = creep.pos.findClosestByPath(FIND_SOURCES, {
        filter: (s) => (s.energy > 0)
      });
      if (target !== null) {
        this.updateTarget(creep, target);
        return this.harvestFromSource(creep, target);
      }

      target = creep.room.storage;
      if ((target !== null) && (target.store.getUsedCapacity(RESOURCE_ENERGY) > 0)) {
        this.updateTarget(creep, target);
        return this.withdraw(creep, target);
      }
    }

    // see if all containers are occupied
    // equivalently, if there's not a path to any source?

    if (false) {
      let candidateTargets = [];

      target = creep.pos.findClosestByPath(FIND_SOURCES, {
        filter: (s) => (s.energy > 0)
      });
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
          return this.withdraw(creep, target);
        }
      }
    }
    else {
      target = creep.pos.findClosestByPath(FIND_SOURCES, {
        filter: (s) => (s.energy > 0)
      });
      if (target !== null) {
        this.updateTarget(creep, target);
        return this.harvestFromSource(creep, target);
      }

      target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_EXTENSION) && (s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
      });
      if (target !== null) {
        this.updateTarget(creep, target);
        return this.withdraw(creep, target);
      }

      target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && (s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
      });
      if (target !== null) {
        // TODO: only if target isn't the container we're sitting on
        this.updateTarget(creep, target);
        return this.withdraw(creep, target);
      }

      target = creep.room.storage;
      if ((target !== null) && (target.store.getUsedCapacity(RESOURCE_ENERGY) > 0)) {
        this.updateTarget(creep, target);
        return this.withdraw(creep, target);
      }
    }

    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
      return this.switchTo(creep, "upgrade");
    }
    else {
      return this.switchTo(creep, "dismantle");
    }
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
        this.recalculatePath(creep, source.pos, { range: 1 });
        this.moveByPath(creep);
        break;
      case ERR_TIRED:
        console.log("ranger.harvestFromSource: tired");
        break;
      case ERR_NO_BODYPART:
        console.log("ranger.harvestFromSource: no bodypart");
        creep.suicide();
        break;
    }

    return OK;
  },

  insert: function (creep) {
    if (creep.pos.roomName != creep.mem.roomName) {
      // on the last move, we changed rooms, so recalculate path
      delete creep.mem.path;
      if (creep.pos.roomName == creep.mem.targetRoomName) {
        return this.switchTo(creep, "claim");
      }
    }

    if (!creep.mem.path) {
      let destination = new RoomPosition(25, 25, creep.mem.targetRoomName);
      if (Game.rooms[creep.mem.targetRoomName] !== undefined) {
        // room to colonize is visible, so set destination to controller
        destination = Game.rooms[creep.mem.targetRoomName].controller.pos;
      }

      this.recalculatePath(creep, destination, { range: 1, calledFrom: "insert" });
      // creep.mem.path = creep.room.findPath(creep.pos, destination, { range: 1 });
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
        // console.log("ranger.moveByPath: tired");
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

  pickup: function (creep, target) {
    this.requireBodyPart(creep, CARRY);

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
      // console.log(`ranger.pickup (${creep.name}): full`);
      return this.switchTo(creep, "replenish");
    }

    switch (creep.pickup(target)) {
      case OK:
        break;
      case ERR_NOT_OWNER:
        console.log("ranger.pickup: not owner");
        break;
      case ERR_BUSY:
        console.log("ranger.pickup: busy");
        break;
      case ERR_INVALID_TARGET:
        console.log("ranger.pickup: invalid target");
        break;
      case ERR_FULL:
        console.log("ranger.pickup: full");
        return this.switchTo(creep, "replenish");
      case ERR_NOT_IN_RANGE:
        // console.log("ranger.pickup: not in range");
        this.recalculatePath(creep, target.pos, { range: 1 });
        this.moveByPath(creep);
        break;
    }

    return OK;
  },

  recalculatePath: function (creep, toPos, options) {
    if (!creep.mem.path) {
      let allOptions = {};
      allOptions["range"] = options.range || 0;

      if (config.desirePathing.enabled && config.desirePathing.terrain.swamp) {
        allOptions["swampCost"] = 1;
      }

      if (options.calledFrom) {
        console.log(`ranger.recalculatePath (<- ${options.calledFrom}): (${creep.pos.x},${creep.pos.y}) -> (${toPos.x},${toPos.y}) with range ${allOptions.range}`);
      }

      creep.mem.path = creep.room.findPath(creep.pos, toPos, allOptions);
    }
  },

  repair: function (creep) {
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
      // console.log(`ranger.repair (${creep.name}): empty`)
      return this.switchTo(creep, "harvest");
    }

    if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
      // console.log(`ranger.repair (${creep.name}): room needs replenishing`);
      return this.switchTo(creep, "replenish");
    }

    if (creep.room.controller.ticksToDowngrade < (CONTROLLER_DOWNGRADE[creep.room.controller.level] - 1000)) {
      return this.switchTo(creep, "upgrade");
    }

    const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => (s.structureType != STRUCTURE_RAMPART) && (s.structureType != STRUCTURE_ROAD) && (s.structureType != STRUCTURE_WALL) && (s.hits < s.hitsMax)
    });
    if (target !== null) {
      this.updateTarget(creep, target);
      return this.repairStructure(creep, target);
    }

    return this.switchTo(creep, "build");
  },

  repairStructure: function (creep, target) {
    this.requireBodyPart(creep, CARRY);
    this.requireBodyPart(creep, WORK);

    switch (creep.repair(target)) {
      case OK:
        // creep.moveTo(target);
        break;
      case ERR_NOT_OWNER:
        console.log("ranger.repairStructure: not owner");
        break;
      case ERR_BUSY:
        console.log("ranger.repairStructure: busy");
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        console.log("ranger.repairStructure: not enough resources");
        return this.switchTo(creep, "harvest");
      case ERR_INVALID_TARGET:
        console.log("ranger.repairStructure: invalid target");
        break;
      case ERR_NOT_IN_RANGE:
        // console.log("ranger.repairStructure: not in range");
        break;
      case ERR_NO_BODYPART:
        console.log("ranger.repairStructure: no bodypart");
        creep.suicide();
        break;
    }

    this.recalculatePath(creep, target.pos, { range: 3 });
    return this.moveByPath(creep);
  },

  replenish: function (creep) {
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
      // console.log(`ranger.replenish (${creep.name}): empty`);
      return this.switchTo(creep, "harvest");
    }

    if (creep.room.controller.ticksToDowngrade < (CONTROLLER_DOWNGRADE[creep.room.controller.level] - 1000)) {
      return this.switchTo(creep, "upgrade");
    }

    const extensions = creep.room.find(FIND_MY_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_EXTENSION) && (s.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
    });
    const spawns = creep.room.find(FIND_MY_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_SPAWN) && (s.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
    });
    const target = creep.pos.findClosestByPath(_.union(extensions, spawns));
    if (target !== null) {
      this.updateTarget(creep, target);
      return this.transfer(creep, target);
    }

    const tower = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: (s) => (s.structureType == STRUCTURE_TOWER) && (s.store.getFreeCapacity(RESOURCE_ENERGY) >= creep.store.getUsedCapacity(RESOURCE_ENERGY))
    });
    if (tower !== null) {
      this.updateTarget(creep, tower);
      return this.transfer(creep, tower);
    }

    return this.switchTo(creep, "repair");
  },

  requireBodyPart: function (creep, partType) {
    if (_.all(creep.body, (p) => (p.type != partType))) {
      creep.suicide();
    }
  },

  reserveController: function (creep) {
    if (!creep.room.controller.my && creep.pos.isNearTo(creep.room.controller)) {
      switch (creep.reserveController(creep.room.controller)) {
        case OK:
          break;
        case ERR_NOT_OWNER:
          console.log("ranger.reserveController: not owner");
          break;
        case ERR_BUSY:
          console.log("ranger.reserveController: busy");
          break;
        case ERR_INVALID_TARGET:
          console.log("ranger.reserveController: invalid target");
          break;
        case ERR_NOT_IN_RANGE:
          console.log("ranger.reserveController: not in range");
          this.recalculatePath(creep, creep.room.controller.pos, { range: 1, calledFrom: "reserveController" });
          // if (creep.mem.path === undefined) {
          //   creep.mem.path = creep.room.findPath(creep.pos, creep.room.controller.pos, { range: 1 });
          // }
          this.moveByPath(creep);
          break;
        case ERR_NO_BODYPART:
          console.log("ranger.reserveController: no bodypart");
          break;
      }
    }

    return OK;
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
        this.recalculatePath(creep, creep.room.controller.pos, { range: 1 });
        this.moveByPath(creep);
        break;
    }

    return OK;
  },

  switchTo: function (creep, task) {
    creep.mem.task = task;
    delete creep.mem.path;
    delete creep.mem.targetId;
    return this.run(creep);
  },

  transfer: function (creep, target) {
    switch (creep.transfer(target, RESOURCE_ENERGY)) {
      case OK:
        break;
      case ERR_NOT_OWNER:
        console.log(`ranger.transfer (${creep.room.name}.${creep.name}): not owner`);
        break;
      case ERR_BUSY:
        console.log(`ranger.transfer (${creep.room.name}.${creep.name}): busy`);
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        console.log(`ranger.transfer (${creep.room.name}.${creep.name}): not enough resources`);
        return this.switchTo(creep, "harvest");
      case ERR_INVALID_TARGET:
        console.log(`ranger.transfer (${creep.room.name}.${creep.name}): invalid target: ${target.id}`);
        break;
      case ERR_FULL:
        // console.log("ranger.transfer: full");
        return this.switchTo(creep, "replenish");
      case ERR_NOT_IN_RANGE:
        // console.log("ranger.transfer: not in range");
        this.recalculatePath(creep, target.pos, { range: 1 });
        this.moveByPath(creep);
        break;
      case ERR_INVALID_ARGS:
        console.log(`ranger.transfer (${creep.room.name}.${creep.name}): invalid args`);
        break;
    }

    return OK;
  },

  updateTarget: function (creep, target) {
    if (target.id != creep.mem.targetId) {
      // console.log(`ranger.updateTarget (${creep.name}): recalculating`);
      delete creep.mem.path;
      creep.mem.targetId = target.id;
    }
  },

  upgrade: function (creep) {
    this.requireBodyPart(creep, WORK);

    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
      // console.log(`ranger.upgrade (${creep.name}): empty`)
      return this.switchTo(creep, "harvest");
    }

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
        return this.switchTo(creep, "harvest");
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

    this.recalculatePath(creep, creep.room.controller.pos, { range: 1 });
    return this.moveByPath(creep);
  },

  withdraw: function (creep, structure) {
    switch (creep.withdraw(structure, RESOURCE_ENERGY)) {
      case OK:
        break;
      case ERR_NOT_OWNER:
        console.log("ranger.withdraw: not owner");
        break;
      case ERR_BUSY:
        console.log("ranger.withdraw: busy");
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        console.log("ranger.withdraw: not enough resources");
        break;
      case ERR_INVALID_TARGET:
        console.log("ranger.withdraw: invalid target");
        break;
      case ERR_FULL:
        // console.log("ranger.withdraw: full");
        return this.switchTo(creep, "replenish");
      case ERR_NOT_IN_RANGE:
        // console.log("ranger.withdraw: not in range");
        this.recalculatePath(creep, structure.pos, { range: 0 });
        this.moveByPath(creep);
        break;
      case ERR_INVALID_ARGS:
        console.log("ranger.withdraw: invalid args");
        break;
    }

    return OK;
  },
}

module.exports = roleRanger;

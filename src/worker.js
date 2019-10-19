"use strict";

let worker = {
  moveTo: function(creep, target) {
    // let moveOptions = { maxRooms: 1, noPathFinding: true, reusePath: 5 };
    let moveOptions = { maxRooms: 1, reusePath: 5 };
    if ((Game.cpu.tickLimit - Game.cpu.getUsed()) < 5) {
      moveOptions.noPathFinding = true;
    }

    let result = creep.moveTo(target, moveOptions);
    switch (result) {
      case ERR_NOT_OWNER:
        break;
      case ERR_NO_PATH:
        if (moveOptions.noPathFinding) {
          result = creep.moveTo(target);
        }
        break;
      case ERR_BUSY:
        break;
      case ERR_NOT_FOUND:
        if (moveOptions.noPathFinding) {
          result = creep.moveTo(target);
        }
        break;
      case ERR_INVALID_TARGET:
        break;
      case ERR_TIRED:
        break;
      case ERR_NO_BODYPART:
        break;
      default:
        break;
    }

    return result;
  },

  spawn: function(spawn, parts = [WORK, CARRY, MOVE], role = "harvester") {
    let result = spawn.spawnCreep(parts, ("Worker" + Game.time), {memory: {role: role}});
    if (result == OK) {
      // spawn.room.visual.text("🛠️ Worker", spawn.pos.x + 1, spawn.pos.y, {align: "left", opacity: 0.8});
    }
    return result;
  },

  //
  // stats reporting functions
  //

  activeCount: function() {
    return (this.totalCount() - this.spawningCount());
  },

  deadCount: function() {
    return _.reduce(Memory.creeps, function(count, creep, name) {
      if (!Game.creeps[name]) {
        return count + 1;
      }
      else {
        return count;
      }
    }, 0);
  },

  spawningCount: function() {
    return _.reduce(Game.spawns, function(count, spawn) {
      if (spawn.spawning) {
        return count + 1;
      }
      else {
        return count;
      }
    }, 0);
  },

  totalCount: function() {
    return _.values(Game.creeps).length;
  }
}

module.exports = worker;

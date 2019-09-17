var worker = {
  moveTo: function(creep, target) {
    moveOptions = {};
    if (Memory.enablePathStyle == "true") {
      moveOptions.visualizePathStyle = this.pathStyle(creep.memory.role);
    }
    if ((Game.cpu.tickLimit - Game.cpu.getUsed()) < 5) {
      moveOptions.noPathFinding = true;
    }

    var result = creep.moveTo(target, moveOptions);
    switch (result) {
      case ERR_NOT_FOUND:
        result = creep.moveTo(target);
        break;
    }

    return result;
  },

  pathStyle: function(role) {
    var style = {
      fill: "transparent",
      stroke: "#FFFFFF",
      lineStyle: "dashed",
      strokeWidth: .15,
      opacity: .1
    }

    switch (role) {
      case "builder":
        style.stroke = "#CFCFCF";
        break;
      case "harvester":
        style.stroke = "#00FF00";
        break;
      case "repairer":
        style.stroke = "#FF7F00";
        break;
      case "replenisher":
        style.stroke = "#FFFFFF";
        break;
      case "upgrader":
        style.stroke = "#0000FF";
        break;
    }

    return style;
  },

  say: function(creep, msg) {
    if (Memory.enableSay == "false") {
      return;
    }

    // check if enableSay is an object and if so, look for role in the object

    creep.say(msg);
  },

  spawn: function(spawn, parts = [WORK, CARRY, MOVE]) {
    var result = spawn.spawnCreep(parts, ("Worker" + Game.time), {memory: {role: "harvester"}});
    if (result == OK) {
      spawn.room.visual.text("🛠️ Worker", spawn.pos.x + 1, spawn.pos.y, {align: "left", opacity: 0.8});
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

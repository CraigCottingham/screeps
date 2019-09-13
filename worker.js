var worker = {
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

  spawn: function(spawn) {
    var result = spawn.spawnCreep([WORK, WORK, CARRY, MOVE, MOVE, MOVE], ('Worker' + Game.time), {memory: {role: 'harvester'}});
    if (result == OK) {
      spawn.room.visual.text('🛠️ Worker', spawn.pos.x + 1, spawn.pos.y, {align: 'left', opacity: 0.8});
    }
    return result;
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

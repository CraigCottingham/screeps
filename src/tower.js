var tower = {
  run: function(tower) {
    var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (target !== null) {
      tower.attack(target);
      return;
    }

    target = tower.pos.findClosestByRange(FIND_CREEPS, {
      filter: (c) => (c.hits < c.hitsMax)
    });
    if (target !== null) {
      tower.heal(target);
      return;
    }

    target = tower.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (s) => (s.hits < s.hitsMax) && (s.structureType != STRUCTURE_WALL)
    });
    if (target !== null) {
      tower.repair(target);
      return;
    }
  }
}

module.exports = tower;

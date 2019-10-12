"use strict";

global.visualizer = {};
if (config.visualizer.enabled) {
  global.visualizer = {
    drawPath: function (rv, path, color) {
      if (path.length) {
        rv.poly(_.map(path, (p) => [p.x, p.y]), {
          stroke: color,
          strokeWidth: 0.1,
          opacity: 0.5,
        });
      }
    },

    render: function () {
      // if (config.visualizer.showCostMatrixes) {
      //   this.showCostMatrixes();
      // }
      // if (config.visualizer.showRoomPaths) {
      //   this.showRoomPaths();
      // }
      if (config.visualizer.creepPaths) {
        this.renderCreepPaths();
      }
      // if (config.visualizer.showStructures) {
      //   this.showStructures();
      // }
      // if (config.visualizer.showCreeps) {
      //   this.showCreeps();
      // }
      // if (config.visualizer.showBlockers) {
      //   this.showBlockers();
      // }
    },

    renderCreepPaths: function () {
      for (const creep of _.values(Game.creeps)) {
        const rv = creep.room.visual;
        if (creep.memory._move) {
          const path = Room.deserializePath(creep.memory._move.path);
          this.drawPath(rv, path, 'red');
        }
      }
    }
  };
}

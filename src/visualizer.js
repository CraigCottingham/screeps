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
      if (config.visualizer.creepPaths) {
        for (const creep of _.values(Game.creeps)) {
          this.renderCreepPath(creep);
        }
      }
      if (config.visualizer.roomDetails) {
        for (const room of _.values(Game.rooms)) {
          this.renderRoomDetails(room);
        }
      }
    },

    renderCreepPath: function (creep) {
      if (creep.memory._move) {
        const rv = creep.room.visual;
        const path = Room.deserializePath(creep.memory._move.path);
        this.drawPath(rv, path, 'red');
      }
    },

    renderLine: function (rv, line, y) {
      const fontSize = 0.65;

      rv.text(line.label, 0.5, 0.75 + 2 * y * fontSize, {
        color: "rgb(192,192,192)",
        font: fontSize,
        align: "left"
      });
      if (line.value !== undefined) {
        // rv.text(`${line.value}`, 6, 1.5 * fontSize + 2 * y * fontSize, {
        rv.text(`${line.value}`, 4, 0.75 + 2 * y * fontSize, {
          color: "rgb(192,192,192)", // color(line.coeff),
          font: fontSize,
          align: "left"
        });
      }
    },

    renderRoomDetails: function (room) {
      const fontSize = 0.65;
      const rv = room.visual;
      const cpu = Game.cpu;
      const creepSpawningCount = _.reduce(_.filter(_.values(Game.spawns), (s) => s.room.name == room.name), (acc, s) => (s.spawning ? acc + 1 : acc), 0);
      const creepTotalCount = _.filter(_.values(Game.creeps), (c) => c.room.name == room.name).length;
      const energyAvailable = room.energyAvailable;
      const energyCapacityAvailable = room.energyCapacityAvailable;

      const lines = [];

      lines.push({label: "CPU:", value: `${cpu.getUsed()} / ${cpu.limit} / ${cpu.tickLimit} / ${cpu.bucket}`});
      lines.push({label: "Creeps:", value: `${creepTotalCount - creepSpawningCount} / ${creepSpawningCount}`})

      if ((room.controller !== undefined) && room.controller.my) {
        lines.push({label: "Controller:", value: `${room.controller.progress} / ${room.controller.progressTotal}`})
      }

      lines.push({label: "Energy:", value: `${energyAvailable} / ${energyCapacityAvailable}`});

      if ((room.storage !== undefined) && room.storage.my) {
        lines.push({label: "Storage:", value: `${room.storage.store.energy} / ${room.storage.storeCapacity}`})
      }

      let y = 0;

      for (let line of lines) {
        this.renderLine(rv, line, y);
        y++;
      }
    },
  };
}

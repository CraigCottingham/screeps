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

      for (const room of _.values(Game.rooms)) {
        if (config.visualizer.highLowRampart) {
          this.renderHighLow(room, room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_RAMPART)}));
        }

        if (config.visualizer.highLowRoad) {
          this.renderHighLow(room, room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_ROAD)}), 5000);
        }

        if (config.visualizer.highLowWall) {
          this.renderHighLow(room, room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_WALL)}));
        }

        if (config.visualizer.roomDetails) {
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

    renderHighLow: function (room, structures, clampMax = undefined) {
      if (structures.length) {
        const rv = room.visual;
        const low = _.min(structures, (s) => s.hits).hits;
        const high = (clampMax === undefined) ? _.max(structures, (s) => s.hits).hits : clampMax;
        const range = high - low;
        const half = range * 0.5;
        for (const s of structures) {
          const scale = (s.hits - low) * 1.0;   // 0.0 - range
          const percentR = (scale <= half) ? "100%" : `${100.0 - (((scale - half) * 2.0 / range) * 100.0)}%`;
          const percentG = (scale > half) ? "100%" : `${(scale * 2.0 / range) * 100.0}%`;
          rv.circle(s.pos, {radius: 0.25, fill: `rgb(${percentR}, ${percentG}, 0%)`});
        }
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

      const ramparts = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_RAMPART)});
      const roads = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_ROAD)});
      const walls = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType == STRUCTURE_WALL)});

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

      if (ramparts.length) {
        const weakestRampart = _.min(ramparts, (r) => r.hits);
        const strongestRampart = _.max(ramparts, (r) => r.hits);
        lines.push({label: "Ramparts:", value: `${weakestRampart.hits} / ${strongestRampart.hits} / ${Memory.defenseLowWater[room.name][STRUCTURE_RAMPART]} / ${RAMPART_HITS_MAX[room.controller.level]}`});
      }
      if (walls.length) {
        const weakestWall = _.min(walls, (w) => w.hits);
        const strongestWall = _.max(walls, (w) => w.hits);
        lines.push({label: "Walls:", value: `${weakestWall.hits} / ${strongestWall.hits} / ${Memory.defenseLowWater[room.name][STRUCTURE_WALL]} / ${WALL_HITS_MAX}`});
      }
      if (roads.length) {
        const weakestRoad = _.min(roads, (r) => r.hits);
        const strongestRoad = _.max(roads, (r) => r.hits);
        lines.push({label: "Roads:", value: `${weakestRoad.hits} / ${strongestRoad.hits} / ${ROAD_HITS}`});
      }

      let y = 0;

      for (let line of lines) {
        this.renderLine(rv, line, y);
        y++;
      }
    },
  };
}

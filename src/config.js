"use strict";

// enable logging
//   creeps
//   CPU
// enable path style (visualizations)
// enable say

global.config = {
  // profiler: {
  //   enabled: false,
  // },

  visualizer: {
    enabled: true,

    creepPaths: false,
    highLowRampart: false,
    highLowRoad: false,
    highLowWall: false,
    roomDetails: true,
  },

  // debug: {
  //   getPartsConfLogs: false,
  //   baseBuilding: false,
  //   queue: false,
  //   spawn: false,
  //   mineral: false,
  //   creepLog: {
  //     roles: [], // Roles for debug output, e.g. ['repairer']
  //     rooms: [], // Rooms for debug output, e.g. ['E21N8']
  //   },
  //   power: false,
  //   nextroomer: false,
  //   quests: false,
  //   revive: false,
  //   quest: false,
  //   market: false,
  //   invader: false,
  //   cpu: false,
  //   energyTransfer: false,
  //   constructionSites: false,
  //   routing: false,
  // },
};

try {
  require("config_local"); // eslint-disable-line global-require
} catch (e) {
  // empty
}

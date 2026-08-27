import Vue from "vue";
import { compressToEncodedURIComponent } from "lz-string";
import { cloneDeep, omit, sortBy } from "lodash";
import { THEMES, themeForExport } from "../../themes";
import { i18n } from "../../boot/i18n";

THEMES.forEach((theme) => {
  theme.name = i18n.t("theme." + theme.id);
});
Object.freeze(THEMES);

export const themes = (state) => {
  return sortBy([...THEMES, ...state.themes], "name");
};

export const theme = (state, getters) => (id) => {
  if (!id) {
    id = state.themeID;
  }
  return getters.themes.find((theme) => theme.id === id);
};

export const isValidSquare = (state) => (square) => {
  const game = Vue.prototype.$game;
  if (game) {
    return game.board.isValidSquare(square, false, state.disableStoneCycling);
  }
};

export const nextNeighbor = () => () => {
  const game = Vue.prototype.$game;
  if (game) {
    const square = game.board.getNextNeighbor();
    if (square) {
      return square.static.coord;
    }
  }
};

export const playerIcon =
  () =>
  (player, isPrivate = false) => {
    switch (player) {
      case 1:
        return isPrivate ? "player1_private" : "player1";
      case 2:
        return isPrivate ? "player2_private" : "player2";
      case 0:
        return isPrivate ? "online_private" : "online";
      case "random":
      case "tie":
        return isPrivate ? "players_private" : "players";
    }
  };

export const gif_filename =
  () =>
  ({ name, min, max }) => {
    return `${name} - ${min + 1}-${max}.gif`;
  };

export const pngFilename =
  () =>
  ({ name, plyID, plyIsDone }) => {
    return `${name} - ${plyID}${plyIsDone ? "" : "-"}.png`;
  };

export const imageFilename =
  () =>
  ({ name, plyID, plyIsDone, svg }) => {
    const ext = svg ? ".svg" : ".png";
    return `${name} - ${plyID}${plyIsDone ? "" : "-"}${ext}`;
  };

export const evalGraphFilename =
  () =>
  ({ name }) => {
    return `${name} - eval-graph.png`;
  };

const urlEncode = (url) => {
  return encodeURIComponent(url).replace(
    /([()])/g,
    (char) => "%" + char.charCodeAt(0).toString(16)
  );
};

export const url =
  (state, getters) =>
  (game, options = {}) => {
    if (!game) {
      return "";
    }
    if (game.config.isOnline) {
      return location.origin + "/game/" + game.config.id;
    }
    options = cloneDeep(options);

    const origin = location.origin + "/";
    const ptn =
      "names" in options && !options.names
        ? game.toString({ tags: omit(game.tags, ["player1", "player2"]) })
        : game.ptn;
    let url = compressToEncodedURIComponent(ptn);
    const params = {};

    if ("name" in options) {
      params.name = options.name
        ? compressToEncodedURIComponent(options.name)
        : "";
    } else if (game.name) {
      params.name = compressToEncodedURIComponent(game.name);
    }

    if (options.origin) {
      url = origin + url;
    }

    if (options.state) {
      if (options.state === true) {
        options.state = game.board;
      }
      if (options.state.targetBranch) {
        params.targetBranch = compressToEncodedURIComponent(
          options.state.targetBranch
        );
      }
      if (options.state.plyIndex >= 0) {
        params.ply = options.state.plyIndex;
        if (options.state.plyIsDone) {
          params.ply += "!";
        }
      }
    }

    if (options.ui) {
      if (options.ui.themeID) {
        let theme = getters.theme(options.ui.themeID) || state.theme;
        if (theme.isBuiltIn) {
          theme = theme.id;
        } else {
          theme = JSON.stringify(themeForExport(theme));
        }
        delete options.ui.themeID;
        options.ui.theme = compressToEncodedURIComponent(theme);
      }
      if (options.disableText) {
        delete options.showText;
      }
      if (options.disablePTN) {
        delete options.showPTN;
        delete options.showMove;
        delete options.showAllBranches;
        delete options.disablePTNTools;
      }
      if (options.disableBoard) {
        delete options.disableStoneCycling;
      }
      if (options.disableNavigation) {
        delete options.disableUndo;
        delete options.showControls;
        delete options.showPlayButton;
        delete options.playSpeed;
        delete options.showScrubber;
      }
      if (!options.showControls) {
        delete options.showPlayButton;
        delete options.playSpeed;
      }
      if (!options.turnIndicator) {
        delete options.includeNames;
        delete options.flatCounts;
        if (!options.verticalLayout) {
          delete options.evalText;
          delete options.moveNumber;
        }
      }
      if (!options.unplayedPieces) {
        delete options.verticalLayout;
        delete options.verticalLayoutAuto;
      }
      if (!options.moveNumber) {
        delete options.evalText;
      }
      if (!options.verticalLayout) {
        delete options.verticalLayoutAuto;
      }
      Object.keys(options.ui).forEach((key) => {
        const value = options.ui[key];
        if (key in state.defaults && value !== state.defaults[key]) {
          params[key] = value;
        }
      });
    }

    if (Object.keys(params).length) {
      url +=
        "&" +
        Object.keys(params)
          .map((key) => key + "=" + urlEncode(params[key]))
          .join("&");
    }
    return url;
  };

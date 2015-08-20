/**
 * Blockly Demo: Maze
 *
 * Copyright 2012 Google Inc.
 * http://code.google.com/p/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Demonstration of Blockly: Solving a maze.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * Create a namespace for the application.
 */
var Maze = {};

/**
 * Milliseconds between each animation frame.
 */
Maze.STEP_SPEED = 50;

/**
 * The maze's map is a 2D array of numbers.
 * 0: Wall.
 * 1: Open road.
 * 2: Starting square.
 * 3. Finish square.
 */
Maze.MAP = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

/**
 * Measure maze dimensions and set sizes.
 * ROWS: Number of tiles down.
 * COLS: Number of tiles across.
 * SQUARE_SIZE: Pixel height and width of each maze square (i.e. tile).
 */
Maze.ROWS = Maze.MAP.length;
Maze.COLS = Maze.MAP[0].length;

Maze.SQUARE_SIZE    = 50;
Maze.PEGMAN_HEIGHT  = 52;
Maze.PEGMAN_WIDTH   = 49;

Maze.MAZE_WIDTH   = Maze.SQUARE_SIZE * Maze.COLS;
Maze.MAZE_HEIGHT  = Maze.SQUARE_SIZE * Maze.ROWS;
// Maze.PATH_WIDTH   = Maze.SQUARE_SIZE / 3;

/**
 * Constants for cardinal directions.
 */
Maze.NORTH  = 0;
Maze.EAST   = 1;
Maze.SOUTH  = 2;
Maze.WEST   = 3;

Maze.RIGHT    = 0;
Maze.FORWARD  = 1;
Maze.LEFT     = 2;
Maze.BACKWARD = 3;

/**
 * Starting direction.
 */
Maze.startDirection = Maze.SOUTH;

/**
 * PIDs of animation tasks currently executing.
 */
Maze.pidList = [];

Maze.walls = [];

// Maze.tile_SHAPES = {
//   // '10010': [Maze.dead_end, 0],
//   // '10001': [Maze.dead_end, 90],
//   // '11000': [Maze.dead_end, 180],
//   // '10100': [Maze.dead_end, -90],
//   // '11010': [Maze.thru, 0],
//   // '10101': [Maze.thru, 90],
//   // '10110': [Maze.elbow, 0],
//   // '10011': [Maze.elbow, 90],
//   // '11001': [Maze.elbow, 180],
//   // '11100': [Maze.elbow, -90],
//   // '11110': [Maze.junction, 0],
//   // '10111': [Maze.junction, 90],
//   // '11011': [Maze.junction, 180],
//   // '11101': [Maze.junction, -90],
//   // '11111': [Maze.cross, -90]
// };

Maze.draw_map = function() {
    var svg = document.getElementById('svgMaze');

    while (svg.hasChildNodes()) {
        svg.removeChild(svg.lastChild);
    }

    // Draw the outer square.
    var mainSquare = Maze.square(0, 0);
    mainSquare.setAttribute('width', Maze.MAZE_WIDTH);
    mainSquare.setAttribute('height', Maze.MAZE_HEIGHT);
    mainSquare.setAttribute('fill', '#F1EEE7');

    svg.appendChild(mainSquare);

    // Draw the grid lines.
    for (var k = 1; k < Maze.ROWS; k++) {
        var h_line = document.createElementNS(Blockly.SVG_NS, 'line');
        h_line.setAttribute('y1', k * Maze.SQUARE_SIZE);
        h_line.setAttribute('x2', Maze.MAZE_WIDTH);
        h_line.setAttribute('y2', k * Maze.SQUARE_SIZE);
        h_line.setAttribute('stroke', '#C8BEAE');
        h_line.setAttribute('stroke-width', 2);
        svg.appendChild(h_line);
    }

    for (var k = 1; k < Maze.COLS; k++) {
        var v_line = document.createElementNS(Blockly.SVG_NS, 'line');
        v_line.setAttribute('x1', k * Maze.SQUARE_SIZE);
        v_line.setAttribute('x2', k * Maze.SQUARE_SIZE);
        v_line.setAttribute('y2', Maze.MAZE_HEIGHT);
        v_line.setAttribute('stroke', '#C8BEAE');
        v_line.setAttribute('stroke-width', 2);
        svg.appendChild(v_line);
    }

    // Pegman's clipPath element, whose (x, y) is reset by Maze.displayPegman
    var pegmanClip = document.createElementNS(Blockly.SVG_NS, 'clipPath');
    pegmanClip.setAttribute('id', 'pegmanClipPath');
    var clipRect = document.createElementNS(Blockly.SVG_NS, 'rect');
    clipRect.setAttribute('id', 'clipRect');
    clipRect.setAttribute('width', Maze.PEGMAN_WIDTH);
    clipRect.setAttribute('height', Maze.PEGMAN_HEIGHT);
    pegmanClip.appendChild(clipRect);
    // pegmanClip.style.zIndex = 9999;
    svg.appendChild(pegmanClip);

    // Add pegman.
    var pegmanIcon = document.createElementNS(Blockly.SVG_NS, 'image');
    pegmanIcon.setAttribute('id', 'pegman');
    pegmanIcon.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
            'romoman.png');

    pegmanIcon.setAttribute('height', Maze.PEGMAN_HEIGHT);
    pegmanIcon.setAttribute('width',  Maze.PEGMAN_WIDTH * 18);
    pegmanIcon.setAttribute('clip-path', 'url(#pegmanClipPath)');
    // pegmanIcon.style.zIndex = 9999;
    svg.appendChild(pegmanIcon);

    for (var i = 0; i < Maze.walls.length; ++i) {
        var store_wall = Maze.walls[i];
        svg.appendChild(Maze.wall(store_wall.x, store_wall.y));
    }
};

/**
 * Initialize Blockly and the maze.  Called on page load.
 * @param {!Blockly} blockly Instance of Blockly from iframe.
 */
Maze.init = function(blockly) {
    window.Blockly = blockly;
    Maze.draw_map();

    window.onbeforeunload = function() {
        if (Blockly.mainWorkspace.getAllBlocks().length > 1) {
            return 'Leaving this page will result in the loss of your work.';
        }
        return null;
    };

    // Load the editor with a starting block.
    var xml = Blockly.Xml.textToDom(
            '<xml><block type="maze_move" x="83" y="138"><title name="DIR">moveForward</title><next><block type="maze_turnLeft"><title name="DIR">turnLeft</title><next><block type="maze_turnLeft"><title name="DIR">turnLeft</title><next><block type="maze_moveSteps" inline="false"><title name="DIR">moveForwardSteps</title><value name="STEPS"><block type="math_number"><title name="NUM">5</title></block></value><next><block type="maze_turnRight"><title name="DIR">turnRight</title><next><block type="maze_move"><title name="DIR">moveForward</title><next><block type="maze_moveSteps" inline="false"><title name="DIR">moveBackwardSteps</title><value name="STEPS"><block type="math_number"><title name="NUM">2</title></block></value><next><block type="maze_move"><title name="DIR">moveForward</title><next><block type="maze_turnLeft"><title name="DIR">turnLeft</title><next><block type="maze_moveSteps" inline="false"><title name="DIR">moveBackwardSteps</title><value name="STEPS"><block type="math_number"><title name="NUM">5</title></block></value><next><block type="maze_turnRight"><title name="DIR">turnRight</title><next><block type="maze_moveSteps" inline="false"><title name="DIR">moveForwardSteps</title><value name="STEPS"><block type="math_number"><title name="NUM">3</title></block></value><next><block type="maze_turnLeft"><title name="DIR">turnLeft</title><next><block type="maze_moveSteps" inline="false"><title name="DIR">moveForwardSteps</title><value name="STEPS"><block type="math_number"><title name="NUM">5</title></block></value><next><block type="maze_turnRight"><title name="DIR">turnRight</title><next><block type="maze_move"><title name="DIR">moveForward</title><next><block type="maze_move"><title name="DIR">moveBackward</title><next><block type="maze_turnRight"><title name="DIR">turnRight</title><next><block type="maze_moveSteps" inline="true"><title name="DIR">moveForwardSteps</title><value name="STEPS"><block type="math_number"><title name="NUM">2</title></block></value><next><block type="maze_turnRight"><title name="DIR">turnLeft</title><next><block type="maze_move"><title name="DIR">moveForward</title><next><block type="maze_move"><title name="DIR">moveBackward</title><next><block type="maze_turnLeft"><title name="DIR">turnRight</title><next><block type="maze_moveSteps" inline="true"><title name="DIR">moveForwardSteps</title><value name="STEPS"><block type="math_number"><title name="NUM">2</title></block></value><next><block type="maze_turnLeft"><title name="DIR">turnLeft</title><next><block type="maze_move"><title name="DIR">moveForward</title><next><block type="maze_move"><title name="DIR">moveBackward</title><next><block type="maze_turnRight"><title name="DIR">turnRight</title><next><block type="maze_move"><title name="DIR">moveForward</title><next><block type="maze_turnLeft"><title name="DIR">turnLeft</title><next><block type="maze_moveSteps" inline="true"><title name="DIR">moveForwardSteps</title><value name="STEPS"><block type="math_number"><title name="NUM">3</title></block></value><next><block type="maze_turnLeft"><title name="DIR">turnLeft</title><next><block type="maze_moveSteps" inline="false"><title name="DIR">moveForwardSteps</title><value name="STEPS"><block type="math_number"><title name="NUM">5</title></block></value><next><block type="maze_turnRight"><title name="DIR">turnRight</title><next><block type="maze_move"><title name="DIR">moveForward</title><next><block type="maze_move"><title name="DIR">moveBackward</title><next><block type="maze_turnRight"><title name="DIR">turnRight</title><next><block type="maze_moveSteps" inline="false"><title name="DIR">moveForwardSteps</title><value name="STEPS"><block type="math_number"><title name="NUM">4</title></block></value><next><block type="maze_turnLeft"><title name="DIR">turnLeft</title><next><block type="maze_move"><title name="DIR">moveForward</title><next><block type="maze_move"><title name="DIR">moveBackward</title><next><block type="maze_turnRight"><title name="DIR">turnRight</title><next><block type="maze_move"><title name="DIR">moveForward</title><next><block type="maze_turnLeft"><title name="DIR">turnLeft</title><next><block type="maze_moveSteps" inline="false"><title name="DIR">moveForwardSteps</title><value name="STEPS"><block type="math_number"><title name="NUM">3</title></block></value><next><block type="maze_turnLeft"><title name="DIR">turnLeft</title><next><block type="maze_moveSteps" inline="false"><title name="DIR">moveForwardSteps</title><value name="STEPS"><block type="math_number"><title name="NUM">2</title></block></value><next><block type="maze_turnLeft"><title name="DIR">turnLeft</title><next><block type="maze_move"><title name="DIR">moveForward</title><next><block type="maze_turnLeft"><title name="DIR">turnLeft</title><next><block type="maze_moveSteps" inline="false"><title name="DIR">moveBackwardSteps</title><value name="STEPS"><block type="math_number"><title name="NUM">3</title></block></value></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></xml>');
            // '<xml>' +
            // '  <block type="maze_move" x="85" y="100"></block>' +
            // '</xml>');
    Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);

    // Locate the start and finish squares.
    // for (var y = 0; y < Maze.ROWS; y++) {
    //   for (var x = 0; x < Maze.COLS; x++) {
    //     if (Maze.MAP[y][x] == 2) {
    //       Maze.start_ = {x: x, y: y};
    //     } else if (Maze.MAP[y][x] == 3) {
    //       Maze.finish_ = {x: x, y: y};
    //     }
    //   }
    // }

    Maze.reset();

    auto_save_and_restore_blocks();

    // X-mas Tree Ornaments
    // Maze.addWall(4,2);
    // Maze.addWall(5,2);

    // Maze.addWall(3,4);
    // Maze.addWall(6,4);

    // Maze.addWall(2,6);
    // Maze.addWall(7,6);
};

/**
 * Reset the maze to the start position and kill any pending animation tasks.
 */
Maze.reset = function() {
    // Move Pegman into position.
    Maze.draw_map();
    Maze.pegmanX = 1;
    Maze.pegmanY = Maze.ROWS - 1;
    Maze.pegmanD = Maze.startDirection;

    Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4);

    // Move the finish icon into position.
    // var finishIcon = document.getElementById('finish');
    // finishIcon.setAttribute('x', Maze.SQUARE_SIZE * (Maze.finish_.x + 0.5) -
    //     finishIcon.getAttribute('width') / 2);
    // finishIcon.setAttribute('y', Maze.SQUARE_SIZE * (Maze.finish_.y + 0.6) -
    //     finishIcon.getAttribute('height'));

    // Kill all tasks.
    for (var x = 0; x < Maze.pidList.length; x++) {
        window.clearTimeout(Maze.pidList[x]);
    }
    Maze.pidList = [];
};

/**
 * Click the run button.  Start the program.
 */
Maze.runButtonClick = function() {
    document.getElementById('runButton').style.display = 'none';
    document.getElementById('resetButton').style.display = 'inline';
    Blockly.mainWorkspace.traceOn(true);
    Maze.execute();
};

/**
 * Click the reset button.  Reset the maze.
 */
Maze.resetButtonClick = function() {
    document.getElementById('runButton').style.display = 'inline';
    document.getElementById('resetButton').style.display = 'none';
    Blockly.mainWorkspace.traceOn(false);

    Maze.reset();
};

Maze.centerRomo = function() {
    Maze.pegmanX = (Maze.COLS / 2) - 1;
    Maze.pegmanY = (Maze.ROWS / 2) - 1;
    Maze.pegmanD = Maze.startDirection;

    Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4);

}

Maze.mazeClick = function(e) {
    var squareX = ~~(e.offsetX / Maze.SQUARE_SIZE);
    var squareY = ~~(e.offsetY / Maze.SQUARE_SIZE);

    Maze.addWall(squareX, squareY);
};

Maze.addWall = function(x, y) {
    for (var i = 0; i < Maze.walls.length; ++i) {
        if (Maze.walls[i].x === x && Maze.walls[i].y === y) {
            Maze.removeWallAtIndex(i);
            return;
        }
    }

    Maze.walls.push({'x':x, 'y':y});

    var svg = document.getElementById('svgMaze');
    svg.appendChild(Maze.wall(x, y));
};

Maze.clearWalls = function() {
    for (var i = 0; i < Maze.walls.length; ++i) {
        Maze.removeWallAtIndex(i);
    }

    Maze.reset();

    if (Maze.walls.length > 0) {
        Maze.clearWalls();
    }
}

Maze.wall = function(x, y) {
    var wall = Maze.square(x, y);
    wall.setAttribute('id', 'wall');
    wall.setAttribute('fill', '#0093E0');

    return wall;
};

Maze.square = function(x, y) {
    var square = document.createElementNS(Blockly.SVG_NS, 'rect');
    square.setAttribute('x', x * Maze.SQUARE_SIZE);
    square.setAttribute('y', y * Maze.SQUARE_SIZE);
    square.setAttribute('width', Maze.SQUARE_SIZE);
    square.setAttribute('height', Maze.SQUARE_SIZE);
    square.setAttribute('fill', '#d43');
    square.setAttribute('stroke-width', 2);
    square.setAttribute('stroke', '#C8BEAE');

    return square;
};

Maze.wallAt = function(x, y) {
    for (var i = 0; i < Maze.walls.length; ++i) {
        if (Maze.walls[i].x == x && Maze.walls[i].y == y) {
            return Maze.walls[i];
        }
    }
    return null;
};

Maze.removeWallAtIndex = function(index) {
    var wall = Maze.walls[index],
        x = wall.x * Maze.SQUARE_SIZE,
        y = wall.y * Maze.SQUARE_SIZE;

    var svg = document.getElementById('svgMaze');
    var children = svg.childNodes;
    for (var i = 0; i < children.length; ++i) {
        if (children[i].id == 'wall'
            && parseInt(children[i].getAttribute('x')) === x 
            && parseInt(children[i].getAttribute('y')) === y) {
            svg.removeChild(children[i]);
        }
    }
    Maze.walls.splice(index, 1);
};

/**
 * Execute the user's code.  Heaven help us...
 */
Maze.execute = function() {
    Maze.path = [];
    Maze.ticks = 10000;
    var code = Blockly.Generator.workspaceToCode('JavaScript');
    console.log('code: '+code);
    try {
        eval(code);
    } catch (e) {
        console.log('error: '+e)
    }
    // Maze.path now contains a transcript of all the user's actions.
    // Reset the maze and animate the transcript.
    Maze.reset();
    Maze.pidList.push(window.setTimeout(Maze.animate, 100));
};

/**
 * Iterate through the recorded path, highlight the block that is being 
 * executed, and animate pegman's actions.
 */
Maze.animate = function() {
    // All tasks should be complete now.  Clean up the PID list.
    Maze.pidList = [];
    var action;
    do {
        var pair = Maze.path.shift();
        if (!pair) {
            return;
        }
        action = pair[0];
        Blockly.mainWorkspace.highlightBlock(pair[1]);
    } while (action == 'look');

    var svg = document.getElementById('svgMaze');
    svg.appendChild(Maze.square(Maze.pegmanX, Maze.pegmanY));

    if (action == 'north') {
        Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4],
                                    [Maze.pegmanX, Maze.pegmanY - 1, Maze.pegmanD * 4]);
        Maze.pegmanY--;
    } else if (action == 'east') {
        Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4],
                                    [Maze.pegmanX + 1, Maze.pegmanY, Maze.pegmanD * 4]);
        Maze.pegmanX++;
    } else if (action == 'south') {
        Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4],
                                    [Maze.pegmanX, Maze.pegmanY + 1, Maze.pegmanD * 4]);
        Maze.pegmanY++;
    } else if (action == 'west') {
        Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4],
                                    [Maze.pegmanX - 1, Maze.pegmanY, Maze.pegmanD * 4]);
        Maze.pegmanX--;
    } else if (action.substring(0, 4) == 'fail') {
        Maze.scheduleFail(action.substring(5) == 'forward');
    } else if (action == 'left') {
        Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4],
                                    [Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4 - 4]);
        Maze.pegmanD = Maze.constrainDirection4(Maze.pegmanD - 1);
    } else if (action == 'right') {
        Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4],
                                    [Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4 + 4]);
        Maze.pegmanD = Maze.constrainDirection4(Maze.pegmanD + 1);
    } else if (action == 'finish') {
        Maze.scheduleFinish();
    }

    // Ensures that Romo will be on top of the path that he has drawn
    var pegman = document.getElementById('pegman');
    svg.removeChild(pegman);
    svg.appendChild(pegman);

    Maze.pidList.push(window.setTimeout(Maze.animate, Maze.STEP_SPEED * 5));
};

/**
 * Schedule the animations for a move or turn.
 * @param {!Array.<number>} startPos X, Y and direction starting points.
 * @param {!Array.<number>} endPos X, Y and direction ending points.
 */
Maze.schedule = function(startPos, endPos) {
    var deltas = [(endPos[0] - startPos[0]) / 4,
                                (endPos[1] - startPos[1]) / 4,
                                (endPos[2] - startPos[2]) / 4];
    Maze.displayPegman(startPos[0] + deltas[0],
                                         startPos[1] + deltas[1],
                                         Maze.constrainDirection16(startPos[2] + deltas[2]));
    Maze.pidList.push(window.setTimeout(function() {
            Maze.displayPegman(startPos[0] + deltas[0] * 2,
                    startPos[1] + deltas[1] * 2,
                    Maze.constrainDirection16(startPos[2] + deltas[2] * 2));
        }, Maze.STEP_SPEED));
    Maze.pidList.push(window.setTimeout(function() {
            Maze.displayPegman(startPos[0] + deltas[0] * 3,
                    startPos[1] + deltas[1] * 3,
                    Maze.constrainDirection16(startPos[2] + deltas[2] * 3));
        }, Maze.STEP_SPEED * 2));
    Maze.pidList.push(window.setTimeout(function() {
            Maze.displayPegman(endPos[0], endPos[1],
                    Maze.constrainDirection16(endPos[2]));
        }, Maze.STEP_SPEED * 3));
};

/**
 * Schedule the animations for a failed move.
 * @param {boolean} forward True if forward, false if backward.
 */
// Maze.scheduleFail = function(forward) {
//   var deltaX = 0;
//   var deltaY = 0;
//   if (Maze.pegmanD == 0) {
//     deltaY = -0.25;
//   } else if (Maze.pegmanD == 1) {
//     deltaX = 0.25;
//   } else if (Maze.pegmanD == 2) {
//     deltaY = 0.25;
//   } else if (Maze.pegmanD == 3) {
//     deltaX = -0.25;
//   }
//   if (!forward) {
//     deltaX = - deltaX;
//     deltaY = - deltaY;
//   }
//   var direction16 = Maze.constrainDirection16(Maze.pegmanD * 4);
//   Maze.displayPegman(Maze.pegmanX + deltaX,
//                      Maze.pegmanY + deltaY,
//                      direction16);
//   Maze.pidList.push(window.setTimeout(function() {
//     Maze.displayPegman(Maze.pegmanX,
//                        Maze.pegmanY,
//                        direction16);
//     }, Maze.STEP_SPEED));
//   Maze.pidList.push(window.setTimeout(function() {
//     Maze.displayPegman(Maze.pegmanX + deltaX,
//                        Maze.pegmanY + deltaY,
//                        direction16);
//     }, Maze.STEP_SPEED * 2));
//   Maze.pidList.push(window.setTimeout(function() {
//       Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, direction16);
//     }, Maze.STEP_SPEED * 3));
// };

/**
 * Schedule the animations for a victory dance.
 */
// Maze.scheduleFinish = function() {
//   var direction16 = Maze.constrainDirection16(Maze.pegmanD * 4);
//   Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, 16);
//   Maze.pidList.push(window.setTimeout(function() {
//     Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, 17);
//     }, Maze.STEP_SPEED));
//   Maze.pidList.push(window.setTimeout(function() {
//     Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, 16);
//     }, Maze.STEP_SPEED * 2));
//   Maze.pidList.push(window.setTimeout(function() {
//       Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, direction16);
//     }, Maze.STEP_SPEED * 3));
// };

/**
 * Display Pegman at a the specified location, facing the specified direction.
 * @param {number} x Horizontal grid (or fraction thereof).
 * @param {number} y Vertical grid (or fraction thereof).
 * @param {number} d Direction (0 - 15) or dance (16 - 17).
 */
Maze.displayPegman = function(x, y, d) {
    var pegmanIcon = document.getElementById('pegman');
    pegmanIcon.setAttribute('x', x * Maze.SQUARE_SIZE - d * Maze.PEGMAN_WIDTH + 1);
    pegmanIcon.setAttribute('y', Maze.SQUARE_SIZE * (y + 0.5) - Maze.PEGMAN_HEIGHT / 2);

    var clipRect = document.getElementById('clipRect');
    clipRect.setAttribute('x', x * Maze.SQUARE_SIZE + 1);
    clipRect.setAttribute('y', pegmanIcon.getAttribute('y'));
};

/**
 * Keep the direction within 0-3, wrapping at both ends.
 * @param {number} d Potentially out-of-bounds direction value.
 * @return {number} Legal direction value.
 */
Maze.constrainDirection4 = function(d) {
    return Maze.constrainDirection(d, 4);
};

/**
 * Keep the direction within 0-15, wrapping at both ends.
 * @param {number} d Potentially out-of-bounds direction value.
 * @return {number} Legal direction value.
 */
Maze.constrainDirection16 = function(d) {
    return Maze.constrainDirection(d, 16);
};

Maze.constrainDirection = function(d, num) {
    if (d < 0) {
        d += num;
    } else if (d > (num - 1)) {
        d -= num;
    }
    return d;
};


/**
 * If the user has executed too many actions, we're probably in an infinite
 * loop.  Sadly I wasn't able to solve the Halting Problem for this demo.
 * @param {?string} id ID of loop block to highlight if timeout is reached.
 * @throws {false} Throws an error to terminate the user's program.
 */
Maze.checkTimeout = function(id) {
    if (Maze.ticks-- <= 1) {
        if (id) {
            // Highlight an infinite loop on death.
            Maze.path.push(['loop', id]);
        }
        throw false;
    }
};

/**
 * Show the user's code in raw JavaScript.
 */
Maze.showCode = function() {
    var code = Blockly.Generator.workspaceToCode('JavaScript');
    // Strip out serial numbers.
    code = code.replace(/"[a-z][-:\.\w]+"/g, '');
    alert(code);
};

// API
// Human-readable aliases.

Maze.moveForward = function(id) {
    Maze.move(0, id);
};

Maze.moveBackward = function(id) {
    Maze.move(2, id);
};

Maze.moveForwardSteps = function(id, steps) {
    Maze.moveSteps(0, id, steps);
}

Maze.moveBackwardSteps = function(id, steps) {
    Maze.moveSteps(2, id, steps);
}

Maze.turnLeft = function(id) {
    Maze.turn(0, id);
};

Maze.turnRight = function(id) {
    Maze.turn(1, id);
};

Maze.isWall = function(direction) {
    var constraint = Maze.constrainDirection4;

    if (Maze.pegmanD == (0 + direction)) { // EAST
        return Maze.pegmanX == (Maze.COLS - 1) || (Maze.wallAt(Maze.pegmanX + 1, Maze.pegmanY));
    }
    else if (Maze.pegmanD == constraint(1 + direction)) { // SOUTH
        return Maze.pegmanY == (Maze.ROWS - 1) || (Maze.wallAt(Maze.pegmanX, Maze.pegmanY + 1));
    }
    else if (Maze.pegmanD == constraint(2 + direction)) { // WEST
        return Maze.pegmanX == 0 || (Maze.wallAt(Maze.pegmanX - 1, Maze.pegmanY));
    }
    else if (Maze.pegmanD == constraint(3 + direction)) { // NORTH
        return Maze.pegmanY == 0 || (Maze.wallAt(Maze.pegmanX, Maze.pegmanY - 1));
    }
    else
    {
        return false;
    }
};

Maze.isWallForward = function() {
    return Maze.isWall(Maze.FORWARD);
};

Maze.isWallRight = function() {
    return Maze.isWall(Maze.RIGHT);
};

Maze.isWallBackward = function() {
    return Maze.isWall(Maze.BACKWARD);
};

Maze.isWallLeft = function() {
    return Maze.isWall(Maze.LEFT);
};

Maze.isVisible = function() {
    var tooRight  = Maze.pegmanX > (Maze.COLS - 1);
    var tooLeft   = Maze.pegmanX < 0;
    var tooHigh   = Maze.pegmanY < 0;
    var tooLow    = Maze.pegmanY > (Maze.ROWS - 1);
    return !(tooRight || tooLeft || tooHigh || tooLow);
};

// Core functions.

/**
 * Move pegman forward or backward.
 * @param {number} direction Direction to move (0 = forward, 2 = backward).
 * @param {string} id ID of block that triggered this action.
 */
Maze.move = function(direction, id) {
    // If moving backward, flip the effective direction.
    var effectiveDirection = Maze.pegmanD + direction;
    effectiveDirection = Maze.constrainDirection4(effectiveDirection);
    var command;
    if (effectiveDirection == Maze.NORTH) {
        Maze.pegmanY--;
        command = 'north';
    } else if (effectiveDirection == Maze.EAST) {
        Maze.pegmanX++;
        command = 'east';
    } else if (effectiveDirection == Maze.SOUTH) {
        Maze.pegmanY++;
        command = 'south';
    } else if (effectiveDirection == Maze.WEST) {
        Maze.pegmanX--;
        command = 'west';
    }
    Maze.path.push([command, id]);
    // if (Maze.pegmanX == Maze.finish_.x && Maze.pegmanY == Maze.finish_.y) {
    //   // Finished.  Terminate the user's program.
    //   Maze.path.push(['finish', null]);
    //   throw true;
    // }
};

Maze.moveSteps = function(direction, id, steps) {
    for (var i = 0; i < steps; ++i) {
        Maze.move(direction, id);
    }
}

/**
 * Turn pegman left or right.
 * @param {number} direction Direction to turn (0 = left, 1 = right).
 * @param {string} id ID of block that triggered this action.
 */
Maze.turn = function(direction, id) {
    if (direction) {
        // Right turn (clockwise).
        Maze.pegmanD++;
        Maze.path.push(['right', id]);
    } else {
        // Left turn (counterclockwise).
        Maze.pegmanD--;
        Maze.path.push(['left', id]);
    }
    Maze.pegmanD = Maze.constrainDirection4(Maze.pegmanD);
};

/**
 * Is there a wall next to pegman?
 * @param {number} direction Direction to look
 *     (0 = forward, 1 = right, 2 = backward, 3 = left).
 * @return {boolean} True if there is a wall.
 */
// Maze.isWall = function(direction) {
//   var effectiveDirection = Maze.pegmanD + direction;
//   effectiveDirection = Maze.constrainDirection4(effectiveDirection);
//   var square;

//   // console.log('pegMan\'s position: (' + Maze.pegmanX + ', ' + Maze.pegmanY + ')');


//   if (effectiveDirection == Maze.NORTH) {
//     square = Maze.MAP[Maze.pegmanY - 1][Maze.pegmanX];
//   } else if (effectiveDirection == Maze.EAST) {
//     square = Maze.MAP[Maze.pegmanY][Maze.pegmanX + 1];
//   } else if (effectiveDirection == Maze.SOUTH) {
//     square = Maze.MAP[Maze.pegmanY + 1][Maze.pegmanX];
//   } else if (effectiveDirection == Maze.WEST) {
//     square = Maze.MAP[Maze.pegmanY][Maze.pegmanX - 1];
//   }
//   return square == 0;
// };

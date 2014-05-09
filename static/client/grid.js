function World(canvasName) {
    this.stage = new createjs.Stage(canvasName);
    this.stage.enableMouseOver(20);
    this.mapContainer = new createjs.Container();
    this.baseTerrain = new createjs.Container();
    this.grid = {};
    this.units = {};
}
World.prototype = {
    initGrid: function(mapDict) {
        for(var i in mapDict) {
            var coords = i.split(",");
            this.addSpace(new Space({ x:+coords[0], y:+coords[1], terrain: mapDict[i].terrain }));
        }
	this.mapContainer.addChild(this.baseTerrain);
	this.mapContainer.setChildIndex(this.baseTerrain, 0);
        this.stage.addChild(this.mapContainer);
	this.resizeCanvasToWindow();
	this.stage.update();
    },

    resizeCanvasToWindow: function() {
	this.stage.canvas.height = $(window).height() - $("#top-bar").height() - 6;
	this.stage.canvas.width = $(window).width() - $("#right-column").width() - 21;
	$("#top-bar").width($(window).width() - 3);
	this.stage.update();
    },
    
    addSpace: function(space) {
        this.grid[space.x+","+space.y] = space;
        this.baseTerrain.addChild(space.shape);
        this.mapContainer.addChild(space.overlayShape);
    },
    
    getSpaceByCoords: function(x, y) {
        if(y == undefined) {
            if(typeof x == "object" && x.x != undefined && x.y != undefined) {
                return this.grid[x.x+","+x.y]
            }
            return this.grid[x];
        }
        
        return this.grid[x+","+y];
    },
    
    getNeighbors: function(space) {
	var neighbors = [];
	var coords = Terrain.getNeighborCoords(space);
        
        for(var i=0; i<coords.length; ++i) {
            var prospect = this.getSpaceByCoords(coords[i]);
            if(prospect && prospect != space) { neighbors.push(prospect); }
        }
        return neighbors;
    },
    
    addUnit: function(unit, space) {
        unit.shape.x = space.shape.x - 1;
        unit.shape.y = space.shape.y - 1;
        
        unit.x = space.x;
        unit.y = space.y;
        this.units[unit.x+","+unit.y] = unit;
        
        world.mapContainer.addChild(unit.shape);
        world.stage.update();
    },

    positionUnit: function(unit, spaceCoords) {
	delete world.units[unit.x+","+unit.y];

	unit.x = spaceCoords.x;
	unit.y = spaceCoords.y;

	world.units[unit.x+","+unit.y] = unit;
    },

    removeUnit: function(unit) {
	delete this.units[unit.x+","+unit.y];
        
        world.mapContainer.removeChild(unit.shape);
        world.stage.update();
    },
    
    moveUnit: function(unit, path, attackIndex) {
        ui.moveHappening = true;

        socket.emit("move", {
            gameId: gameInfo.gameId,
            path: path.map(function(a) { return {x:a.space.x, y:a.space.y};}),
	    attackIndex: attackIndex
        });
    },
    
    getUnitAt: function(space) {
        return this.units[space.x+","+space.y];
    }
}

function Space(options) {
    this.x = options.x;
    this.y = options.y;
    this.shape = options.shape;
    this.terrain = options.terrain;
    this.unit = null;
    
    if(!options.shape) {
        this.setShape(options.terrain);
    }
}
Space.WIDTH = 70;
Space.HEIGHT = 70;
Space.prototype = {
    width: Space.WIDTH,
    height: Space.HEIGHT,
    padding: Space.PADDING,
    toString: function() { return this.x + "," + this.y; },
    
    setShape: function(terrain) {
        this.shape = new createjs.Container();
	this.baseShape = new createjs.Bitmap(terrain.imgObj);
	this.shape.addChild(this.baseShape);

	this.baseShape.owner = this;
        this.shape.x = this.x * Math.ceil(this.width * 3/4 + 1);
        this.shape.y = this.y * (this.height) + (this.x%2?0:this.height/2);
        this.baseShape.addEventListener("click", ui.onSpaceClick);
        this.baseShape.addEventListener("rollover", ui.onSpaceHover);

	if(terrain.overlayImgObj) {
	    var overlay = new createjs.Bitmap(terrain.overlayImgObj);
	    overlay.x = this.x * Math.ceil(this.width * 3/4 + 1) - overlay.image.width / 4;
	    overlay.y = this.y * (this.height) + (this.x%2?0:this.height/2) - overlay.image.height/4;
	    this.overlayShape = overlay;
	    this.overlayShape.owner = this;
        }
    },

    setVillageFlag: function(team) {
	if(this.flag) { world.mapContainer.removeChild(this.flag); }
	this.flag = new createjs.Shape();
	this.flag.graphics.beginFill(team-1?"#00F":"#F00").rect(this.shape.x, this.shape.y, 15, 10);
	world.mapContainer.addChild(this.flag);
	world.stage.update();
    }
}

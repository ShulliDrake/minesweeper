//namespace - MineSweeper
var MS = MS || {};

//Backbone views and models
MS.views = {};
MS.models = {};

$(function(e){
    var mainView = new MS.views.MainView({
	el: $("#container"),
	model: new MS.models.MineSweeperModel
    });
});

MS.models.MineSweeperModel = Backbone.Model.extend({
    defaults: {
	rows: 7,
	maxBombs: 17,
	minBombs: 10,
	numOfBombs: 13,
	bombLocations: [],
	grid: []
    },

    initialize: function() {
	this.setGrid();
    },

    setNumOfBombs: function() {
	//randomly pick a number of bombs
	var max = this.get('maxBombs');
	var min = this.get('minBombs');
	var num = Math.floor(Math.random() * (max - min + 1)) + min;

	this.set('numOfBombs', num);
    },

    setGrid: function() {
	//initialze grid
	var rows = this.get("rows");
	var gridSize = rows * rows;

	var grid = [];
	var i = 0;
	for (i = 0; i < gridSize; i++) {
	    grid[i] = 0;
	}

	//set bombs
	this.setNumOfBombs();
	//select bomb locations
	var bombs = this.get('numOfBombs');
	var bombLocations = [];

	while (bombLocations.length < bombs) {
	    var randomLocation = Math.ceil(Math.random() * gridSize);

	    if (_.indexOf(bombLocations, randomLocation, false) === -1) {
		grid[randomLocation] = 1; //1 for bomb
		bombLocations.push(randomLocation);
	    }
	}
	this.set("grid", grid);
    },

    startNewGame: function() {
	this.setGrid();
    },

    resize: function(newSize) {
	this.set("rows", newSize);
	this.setGrid();
    }

});

MS.views.MainView = Backbone.View.extend({
    events: {
	"click .new": "startNewGame",
	"click .resize": "resize"
    },

    initialize: function() {
	this.minesweeperView = new MS.views.MineSweeperView({
	    el: $("#sweeper"),
	    model: this.model
	});

    },

    startNewGame: function() {
	this.model.startNewGame();
    },

    resize: function(e) {
	var size = $(e.target).data("size");
	this.model.resize(size);
    }

});

MS.views.MineSweeperView = Backbone.View.extend({
    events: {
	"click span": "tileClicked",
	"click .validate": "validate"
    },

    template: _.template("<span class=\"l<%= location %> unchecked\" data-loc=\"<%= location %>\">&nbsp </span>"),

    initialize: function() {
	this.render();
	this.model.bind("change:grid", this.render, this);
    },

    render: function() {
	var rows = this.model.get("rows");
	var gridHtml = "";
	var rowCount = 0;
	while (rowCount < rows) {
	    columnCount = 0;
	    while (columnCount < rows) {
		var currentPosition = (rowCount*rows) + (columnCount+1);
		gridHtml += this.template({location: currentPosition});
		columnCount++;
	    }
	    gridHtml += "<br />";
	    rowCount++;
	}
	this.$el.removeClass();
	this.$(".grid").html(gridHtml);
	this.delegateEvents();
    },

    tileClicked: function(e) {
	var clickedLocation = $(e.target).data("loc");
	this.checkBomb(clickedLocation);
    },

    checkBomb: function(clickedLocation) {
	//a tile is clicked, check if there is a bomb
	var grid = this.model.get("grid");

	if (grid[clickedLocation] === -1) {
	    //already checked
	    return false;
	}

	if(grid[clickedLocation] === 1) {
	    //Clicked on a bomb! Reveal all bombs and game over.
	    this.showBombs(clickedLocation);
	} else {
	    grid[clickedLocation] = -1;
	    this.checkAdjacent(clickedLocation);
	}

    },

    checkAdjacent: function(clickedLocation) {
	//check bombs in adjacent locations
	var rows = this.model.get("rows");
	var adjacentBombCount = 0;
	var grid = this.model.get("grid");
	var adjacentLocations = [];
	//find adjacent locations
	if (clickedLocation > rows) {
	    //top
	    adjacentLocations.push(clickedLocation-rows);
	    //top right
	    if (clickedLocation % rows !== 0) {
		adjacentLocations.push(clickedLocation-rows+1);
	    }
	    //top left
	    if (clickedLocation % rows !== 1) {
		adjacentLocations.push(clickedLocation-rows-1);
	    }
	}
	if (clickedLocation <= (rows * rows - 1)) {
	    //bottom
	    adjacentLocations.push(clickedLocation+rows);
	    //bottom right
	    if (clickedLocation % rows !== 0) {
		adjacentLocations.push(clickedLocation+rows+1);
	    }
	    //bottom left
	    if (clickedLocation % rows !== 1) {
		adjacentLocations.push(clickedLocation+rows-1);
	    }
	}
	if (clickedLocation % rows !== 0) {
	    //right
	    adjacentLocations.push(clickedLocation+1);
	}
	if (clickedLocation % rows !== 1) {
	    //left
	    adjacentLocations.push(clickedLocation-1);
	}

	for (var a = 0; a < adjacentLocations.length; a++) {
	    if (grid[adjacentLocations[a]] === 1) {
		//found a bomb in adjacent location
		adjacentBombCount++;
	    }
	}

	if (adjacentBombCount === 0) {
	    //imitate click on adjacent tiles
	    for (var c = 0; c < adjacentLocations.length; c++) {
		this.checkBomb(adjacentLocations[c]);
	    }
	} else {
	    this.$(".l"+clickedLocation).html(adjacentBombCount);
	}
	this.$(".l"+clickedLocation).removeClass("unchecked");

    },

    showBombs: function(clickedLocation) {
	var grid = this.model.get("grid");
	for (var i = 1; i <= grid.length; i++) {
	    if (grid[i] === 1) {
		this.$(".l"+ i).addClass("bomb");
	    }
	}
	if (clickedLocation) {
	    this.$(".l"+clickedLocation).addClass("trigger");
	}
	this.undelegateEvents();
	this.$el.addClass("fail");
    },

    validate: function() {
	//check if a user clicked all non-bomb tiles.
	var grid = this.model.get("grid");
	var uncheckedTiles = this.$(".unchecked");
	var location;
	var success = true;
	for (var i = 0; i < uncheckedTiles.length; i++) {
	    location = $(uncheckedTiles[i]).data("loc");
	    if (grid[location] !== 1) {
		this.$(".l"+location).addClass("nobomb");
		success = false;
	    }
	}
	if (success) {
	    alert("Congrats! You won!");
	} else {
	    this.showBombs();
	}
    }

});

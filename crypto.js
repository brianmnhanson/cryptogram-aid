$(document).ready(function() {
	
	// Two dimensional array that represents the playing field
	var lines = [];

	var delta = 30;
	var q12Delta = 0;
	var q20Width = 0;
	var size = 40;

	var puzzle = document.getElementById("puzzle");
	var selection = document.getElementById("selection");
	var quip_ta = document.getElementById("quip");
	var setup_b = document.getElementById("setup");
	var run_b = document.getElementById("run");
	
	if ("quip" in localStorage) {
		quip.value = localStorage["quip"];
	}

	var keys = {};
	$("option").each(function () {
		keys[this.value] = 1;
	});
	for (var i=0; i<localStorage.length; i++) {
		var s = localStorage.key(i);
		if (s.indexOf("keep ") == 0) {
			var value = localStorage[s];
			if (value in keys)
				continue;
			var words = value.split(" ");
			var key = words[0] + " " + words[1];
			$("#load").append('<option value="' + value + '">'+key+'</option>');
			keys[value] = 1;
		}
	}

	var letter = 'a';
	var alphabet = "aeiou bcdfghjklmnpqrstvwxyz";
	var dict = {};
	
	function buildLines(quip)
	{
		dict = {};
		if (localStorage["quip"] != quip) {
			localStorage["quip"] = quip;
			letter = quip[0];
		} else if ("dict" in localStorage){
			var key = localStorage["dict"];
			for (var i=1; i<key.length; i+=2) {
				dict[key[i]] = key[i+1];
				dict[key[i+1]] = key[i];
			}
			letter = key[0];
		}

		lines = [""];
		var words = quip.toUpperCase().split(" ");
		var line=0;
		for (var i=0; i<words.length; i++) {
			if (words[i].length + lines[line].length + 1 > size) {
				lines[++line] = "";
			} else if (lines[line].length > 0) {
				lines[line] += " ";
			}
			lines[line] += words[i];
		}
	}
	
	function save() {
		var key = letter;
		for (var i=0; i<alphabet.length; i++) {
			var c = alphabet[i];
			if (c in dict) 
				key += c + dict[c];
		}
		localStorage["dict"] = key;
	}
	
	// Check if the browser supports <puzzle>
	if (!puzzle.getContext){
		alert("This demo requires a browser that supports the <puzzle> element.");
		return;
	} 
	
	$("#go").click(function(e) {
		buildLines(quip_ta.value);
		repaintPuzzle();
		setup_b.hidden = true;
		run_b.hidden = false;
	});
	$("#done").click(function(e) {
		setup_b.hidden = false;
		run_b.hidden = true;
	});
	$("#reset").click(function(e) {
		dict = {};
		delete localStorage["dict"];
		repaintPuzzle();
	});
	$("#load").change(function(e) {
		quip.value = this.value;
	});
	$("#keep").click(function(e) {
		var value = quip.value.toUpperCase();
		var words = value.split(" ");
		if (words.length < 2 || value in keys)
			return;
		var key = words[0] + " " + words[1];
		localStorage["keep " + key] = value;
		$("#load").append('<option value="' + value + '">'+key+'</option>');
		keys[value] = 1;
	});
	run_b.hidden = true;

	$(puzzle).click(function(e) {
		
		// e will give us absolute x, y so we need to calculate relative to
		// puzzle position
		var pos = $(puzzle).position();
		var ox = e.pageX - pos.left;
		var oy = e.pageY - pos.top;
		
		var yField = Math.floor(oy / delta);
		var xField = Math.floor(ox / q12Delta);
		if (yField % 3 > 0)
			return;
		
		yField = yField/3;
		char = lines[yField][xField];
		if (char >= "A" && char <= "Z" && letter != char) {
			letter = char;
			repaintPuzzle();
			save();
		}
		
	});

	$(selection).click(function(e) {
		
		// e will give us absolute x, y so we need to calculate relative to
		// puzzle position
		var pos = $(selection).position();
		var ox = e.pageX - pos.left;
		
		var xField = Math.floor(ox / q20Width);
		
		char = alphabet[xField];
		if (char >= "a" && char <= "z") {
			if (char in dict) {
				delete dict[dict[char]];
				delete dict[char];
			}
			if (letter in dict) {
				delete dict[dict[letter]];
				delete dict[letter];
			}
			
			dict[letter] = char;
			dict[char] = letter;			
			repaintPuzzle();
		}
		save();
		
	});
	
	function decode(c) {
		if (c in dict) {
			return dict[c];
		}
		return ' ';
	}
	
	/*
	 * Repaints the puzzle
	 */
	function repaintPuzzle() {
		
		// Get the context to draw on
		var ctx = puzzle.getContext("2d");
	    
		// Create the fields
		ctx.font = "24pt courier";
		ctx.textAlign = "center";
		if (q12Delta == 0) {
			metrics = ctx.measureText("Q");
			q12Delta = metrics.width;
			puzzle.width = size * q12Delta + 10;
			repaintPuzzle();
			return;
		}
		
		// clear the canvas
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		for(var i = 0; i < lines.length; i++) {
			var line = lines[i];  
			for (var j = 0; j<line.length; j++) {
				c = line[j];
				ctx.fillStyle = c == letter ? "#DC143C" : "#006400";
				ctx.fillText(c, j*q12Delta + q12Delta/2, i*delta*3+delta);
			}
			line = line.replace(/[A-Z]/g, decode);
			ctx.fillStyle = '#000000';
			for (var j = 0; j<line.length; j++) {
				ctx.fillText(line[j], j*q12Delta + q12Delta/2, i*delta*3+2*delta);
			}
		}
		repaintSelection();
	}
	
	/*
	 * Repaints the selection
	 */
	function repaintSelection() {
		
		// Get the context to draw on
		var ctx = selection.getContext("2d");
	    
		// draw the alphabet
		ctx.font = "32pt courier";
		ctx.textAlign = "center";
		if (q20Width == 0) {
			metrics = ctx.measureText("Q");
			q20Width = metrics.width;
			selection.width = alphabet.length * q20Width + 10;
			ctx.width = selection.width;
			repaintSelection();
			return
		}
		
		// clear the canvas
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		for (var j = 0; j<alphabet.length; j++) {
			var c=alphabet[j];
			ctx.fillStyle = c in dict ? '#A00000' : '#000000';
			ctx.fillText(c, j*q20Width + q20Width/2, 30);
		}
	}

});
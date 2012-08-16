$(document).ready(function() {
	
	// Two dimensional array that represents the playing field
	var lines = [];

	var q12Delta = 0;
	var q12DeltaY = 30;
	var q20Width = 0;
	var q20DeltaY = 40;
	var size = 40;

	var puzzle = document.getElementById("puzzle");
	var selection = document.getElementById("selection");
	var quip_ta = document.getElementById("quip");
	var setup_b = document.getElementById("setup");
	var run_b = document.getElementById("run");
	var delete_b = document.getElementById("delete");
	var keep_b = document.getElementById("keep");
	var title_t = document.getElementById("title");

	function make_id(key) {
		return "crypt_" + key.replace("[^A-Za-z0-9-]", "_");
	}

	function loadFromStorage() {
		var keys = [];
		for (var i=0; i<localStorage.length; i++) {
			var s = localStorage.key(i);
			if (s.indexOf("keep ") == 0) {
				keys.push(s.substring(s.indexOf(" ")+1));
			}
		}

		keys.sort();
		for (k in keys) {
			var key = keys[k];
			$("#load").append('<option id="' + make_id(key) +'" value="' + key + '">'+key+'</option>');
		}
		
		if ("quip" in localStorage) {
			quip_ta.value = localStorage["quip"];
		}
	}

	var letter = 'a';
	var alphabet = "aeiou bcdfghjklmnpqrstvwxyz";
	var dict = {};
	var key = "";
	
	loadFromStorage();
	
	function buildLines(quip)
	{
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
		quip_ta.value = localStorage["keep " +this.value];
		key = this.value;
		title_t.value = key;
		delete_b.disabled = false;
		keep_b.disabled = false;
	});
	$("#title").change(function(e) {
		keep_b.disabled = this.value == ""; 
	});
	$("#keep").click(function(e) {
		var value = quip_ta.value.toUpperCase();
		if (key != title_t.value) {
			if ( key != "") {
				delete localStorage["keep " + key];
				$("#" + make_id(key)).remove();
				document.getElementById("keep").selectedIndex = 0;
			}
			key = title_t.value;
			$("#load").append('<option id="' + make_id(key) +'" value="' + key + '">'+key+'</option>');
		}
		
		localStorage["keep " + key] = value;
		
		delete_b.disabled = false;
	});
	$("#delete").click(function(e) {
		delete localStorage["keep " + key];
		$("#" + make_id(key)).remove();
		this.disabled = true;
	});
	$("#clear").click(function(e) {
		quip_ta.value = "";
		key = "";
		var date = new Date().toDateString();
		date = date.substring(date.indexOf(" ")+1);
		title_t.value = "STrib " + date;
		dict = {};
		quip_ta.focus();
		keep_b.disabled = false;
	});
	run_b.hidden = true;

	$(puzzle).click(function(e) {
		
		// e will give us absolute x, y so we need to calculate relative to
		// puzzle position
		var pos = $(puzzle).position();
		var ox = e.pageX - pos.left;
		var oy = e.pageY - pos.top;
		
		var yField = Math.floor(oy / q12DeltaY);
		var xField = Math.floor(ox / q12Delta);
		if (yField % 3 > 0)
			return;
		
		yField = yField/3;
		char = lines[yField][xField];
		if (char >= "A" && char <= "Z" && letter != char) {
			updatePuzzle(char);
			save();
		}
		
		//e.stopPropagation();
		
	});

	$(selection).click(function(e) {
		
		// e will give us absolute x, y so we need to calculate relative to
		// puzzle position
		var pos = $(selection).position();
		var ox = e.pageX - pos.left;
		
		var xField = Math.floor(ox / q20Width);
		
		char = alphabet[xField];
		if (char >= "a" && char <= "z") {
			var drops = {};
			if (char in dict) {
				drops[dict[char]] = 1;
				delete dict[dict[char]];
				delete dict[char];
			}
			if (letter in dict) {
				drops[dict[letter]] = 1;
				delete dict[dict[letter]];
				delete dict[letter];
			}
			
			dict[letter] = char;
			dict[char] = letter;			
			changeSub(char, drops);
		}
		save();
		//e.stopPropagation();
		
	});
	
	function decode(c) {
		if (c in dict) {
			return dict[c];
		}
		return ' ';
	}
	
	/* Change the highlighted letter */
	function updatePuzzle(l) {
		if (l == letter)
			return;
		var ctx = puzzle.getContext("2d");
		ctx.font = "24pt courier";
		ctx.textAlign = "center";
		ctx.textBaseline = "bottom";

		for(var i = 0; i < lines.length; i++) {
			var line = lines[i];  
			for (var j = 0; j<line.length; j++) {
				c = line[j];
				if (c != l && c != letter)
					continue;
				ctx.fillStyle = c == l ? "#DC143C" : "#006400";
				var x = j*q12Delta;
				var y = i*q12DeltaY*3;
				ctx.clearRect(x, y, q12Delta, q12DeltaY);
				ctx.fillText(c, x + q12Delta/2, y+q12DeltaY);
			}
		}
		letter = l;
	}
	
	/* Change the highlighted letter */
	function changeSub(s, drops) {
		var ctx = puzzle.getContext("2d");
		ctx.font = "24pt courier";
		ctx.textAlign = "center";
		ctx.textBaseline = "bottom";
		ctx.fillStyle = '#000000';

		for(var i = 0; i < lines.length; i++) {
			var line = lines[i];  
			for (var j = 0; j<line.length; j++) {
				var c = line[j];
				if (c == letter || c in drops) {
					var x = j*q12Delta;
					var y = i*q12DeltaY*3+q12DeltaY;
					ctx.clearRect(x, y, q12Delta, q12DeltaY);
					if (c == letter)
						ctx.fillText(s, x + q12Delta/2, y+q12DeltaY);
				}
			}
		}
		
		ctx = selection.getContext("2d");
		ctx.font = "32pt courier";
		ctx.textAlign = "center";
		ctx.textBaseline = "bottom";
		
		for (var j = 0; j<alphabet.length; j++) {
			var c=alphabet[j];
			if (c == s || c in drops) {
				var x = j*q20Width;
				ctx.clearRect(x, 0, q20Width, q20DeltaY);
				ctx.fillStyle = c == s ? '#A00000' : '#000000';
				ctx.fillText(c, x + q20Width/2, q20DeltaY);
			}
		}
		
	}
	
	/*
	 * Repaints the puzzle
	 */
	function repaintPuzzle() {
		
		puzzle.height = lines.length * 3 * q12DeltaY;

		// Get the context to draw on
		var ctx = puzzle.getContext("2d");
		if (q12Delta == 0) {
			ctx.font = "24pt courier";
			q12Delta = ctx.measureText("Q").width;
			puzzle.width = size * q12Delta + 10;
			ctx = puzzle.getContext("2d");
		}
		
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		ctx.font = "24pt courier";
		ctx.textAlign = "center";
		ctx.textBaseline = "bottom";
		for(var i = 0; i < lines.length; i++) {
			var line = lines[i];  
			for (var j = 0; j<line.length; j++) {
				c = line[j];
				ctx.fillStyle = c == letter ? "#DC143C" : "#006400";
				ctx.fillText(c, j*q12Delta + q12Delta/2, i*q12DeltaY*3+q12DeltaY);
			}
			line = line.replace(/[A-Z]/g, decode);
			ctx.fillStyle = '#000000';
			for (var j = 0; j<line.length; j++) {
				ctx.fillText(line[j], j*q12Delta + q12Delta/2, i*q12DeltaY*3+2*q12DeltaY);
			}
		}
		
		// Get the context to draw on
		ctx = selection.getContext("2d");
		if (q20Width == 0) {
			ctx.font = "32pt courier";
			q20Width = ctx.measureText("Q").width;
			selection.width = alphabet.length * q20Width + 10;
			ctx.width = selection.width;
			ctx = selection.getContext("2d");
		}
		
		// clear the canvas
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		ctx.font = "32pt courier";
		ctx.textAlign = "center";
		ctx.textBaseline = "bottom";
		for (var j = 0; j<alphabet.length; j++) {
			var c=alphabet[j];
			ctx.fillStyle = c in dict ? '#A00000' : '#000000';
			ctx.fillText(c, j*q20Width + q20Width/2, q20DeltaY);
		}
	}

});
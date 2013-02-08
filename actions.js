$(document)
		.ready(
				function() {

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
					var quips_ta = document.getElementById("quips");
					var delete_b = document.getElementById("delete");
					var store_b = document.getElementById("store");
					var title_t = document.getElementById("title");
					var hide = true;

					var theQuip = {
						value : "",
						name : "Sample",
						key : "",
						time : 0,
						valid : true
					};

					var letter = 'a';
					var alphabet = "aeiou bcdfghjklmnpqrstvwxyz";
					var dict = {};

					function loadFromStorage() {
						var keys = [];
						for ( var i = 0; i < localStorage.length; i++) {
							var s = localStorage.key(i);
							if (s.indexOf("keep ") == 0) {
								keys.push(s.substring(s.indexOf(" ") + 1));
							}
						}

						keys.sort();
						for (k in keys) {
							add(keys[k]);
						}

						if ("quip" in localStorage) {
							try {
								var q = JSON.parse(localStorage["quip"]);
								if (q.valid) {
									theQuip = q;
								}
							} catch (e) {
								theQuip.value = "";
								theQuip.name = "Sample";
								theQuip.key = "";
								theQuip.valid = true;
							}
							quip_ta.value = theQuip.value;
							title_t.value = theQuip.name;
						}
					}

					loadFromStorage();
					showPanel("setup");

					function save() {
						theQuip.value = quip_ta.value.toUpperCase();
						theQuip.name = title_t.value;
						localStorage["quip"] = JSON.stringify(theQuip, 0, 1);
						quip_ta.value = theQuip.value;
					}

					function saveDict() {
						var key = letter;
						for ( var i = 0; i < alphabet.length; i++) {
							var c = alphabet[i];
							if (c in dict) {
								key += c + dict[c];
							}
						}
						theQuip.key = key;
						save();
					}

					function buildLines() {
						save();

						if (theQuip.key.length > 1) {
							var key = theQuip.key;
							for ( var i = 1; i < key.length; i += 2) {
								dict[key[i]] = key[i + 1];
								dict[key[i + 1]] = key[i];
							}
							letter = key[0];
						} else {
							letter = theQuip.value[0];
						}

						lines = [ "" ];
						var words = theQuip.value.split(" ");
						var line = 0;
						for ( var i = 0; i < words.length; i++) {
							if (words[i].length + lines[line].length + 1 > size) {
								lines[++line] = "";
							} else if (lines[line].length > 0) {
								lines[line] += " ";
							}
							lines[line] += words[i];
						}
					}

					function store(e) {
						var value = quip_ta.value.toUpperCase();
						if (theQuip.name != title_t.value) {
							if (theQuip.name != "" && theQuip.value == value) {
								delete localStorage["keep " + theQuip.name];
								delete localStorage["solved " + theQuip.name];
								find(theQuip.name).remove();
							}
							theQuip.name = title_t.value;
						}
						theQuip.value = value;
						quip_ta.value = theQuip.value;

						if (localStorage["keep " + theQuip.name] != theQuip.value) {
							find(theQuip.name).remove();
							localStorage["keep " + theQuip.name] = theQuip.value;
							add(theQuip.name);
						}

						delete_b.disabled = false;
						store_b.disabled = true;
					}

					function select_row(e) {
						theQuip.name = e.currentTarget.title;
						theQuip.value = localStorage["keep " + theQuip.name];
						theQuip.key = "";

						quip_ta.value = theQuip.value;
						title_t.value = theQuip.name;
						dict = {};

						delete_b.disabled = false;
						store_b.disabled = false;
						showPanel("run");
					}
					function add(name) {
						var solved = localStorage["solved " + name] ? "&check;"
								: "";
						$("#items").append('<tr title="' + name + '"><td>' //
								+ solved + '</td><td>' //
								+ name + '</td><td>' //
								+ localStorage["keep " + name].small() //
								+ '</td></tr>' //
						);
						$("tr:last").click(select_row);
						if (hide && solved)
							$("tr:last").hide();
					}
					function find(name) {
						return $("tr").filter(function(i) {
							return this.title == name;
						});
					}
					function findSolved() {
						return $("tr").filter(function(i) {
							return localStorage["solved " + this.title] == "Y";
						});
					}
					function showPanel(p) {
						$("#setup").hide();
						$("#choose").hide();
						$("#run").hide();
						$("#load").hide();
						if (p == "setup") {
							$("#setup").show();
							setEditButtons(p);
						}
						else if (p == "choose")
							$("#choose").show();
						else if (p == "run") {
							buildLines();
							repaintPuzzle();
							$("#run").show();
						} else if (p == "load") {
							quips_ta.value = "";
							$("#load").show();
						}
					}
					function setEditButtons(p) {
						if (title_t.value == "") {
							store_b.disabled = true;
							delete_b.disabled = true;
						} else {
							var found = "keep " + title_t.value in localStorage;
							delete_b.disabled = ! found;
							store_b.disabled = quip_ta.value == "" || found && quip_ta.value == localStorage["keep " + title_t.value];
						}
					}

					// Check if the browser supports <canvas>
					if (!puzzle.getContext) {
						alert("This demo requires a browser that supports the <canvas> element.");
						return;
					}

					// Global actions
					$('button[name^="new"]').click(function(e) {
						var date = new Date().toDateString();
						date = date.substring(date.indexOf(" ") + 1);
						theQuip.value = "";
						theQuip.name = "STrib " + date;
						theQuip.key = "";

						title_t.value = theQuip.name;
						quip_ta.value = theQuip.value;
						dict = {};

						saveDict();
						quip_ta.focus();
						store_b.disabled = false;
						showPanel("setup");
					});
					$('button[name^="open"]').click(function(e) {
						showPanel("choose");
					});
					$('button[name^="back"]').click(function(e) {
						showPanel("setup");
					});

					// Setup panel actions
					$("#solve").click(function(e) {
						showPanel("run");
					});
					$("#title").keyup(setEditButtons);
					$("#quip").keyup(setEditButtons);
					$("#store").click(store);
					$("#delete").click(function(e) {
						delete localStorage["keep " + theQuip.name];
						delete localStorage["solved " + theQuip.name];
						find(theQuip.name).remove();
						this.disabled = true;
					});

					// Choose panel actions
					$("#hide").click(function(e) {
						findSolved().hide();
						$("#show").show();
						$("#hide").hide();
						hide = true;
					});
					$("#show").click(function(e) {
						findSolved().show();
						$("#hide").show();
						$("#show").hide();
						hide = false;
					});
					$("#maint").click(function(e) {
						showPanel("load");
					});

					// Solve panel actions
					$("#solved").click(function(e) {
						localStorage["solved " + theQuip.name] = "Y";
						find(theQuip.name).remove();
						add(theQuip.name);
						showPanel("setup");
					});
					$("#reset").click(function(e) {
						dict = {};
						saveDict();

						repaintPuzzle();
					});

					// Load panel actions
					$("#export").click(function(e) {
						var map = {};
						for ( var i = 0; i < localStorage.length; i++) {
							var s = localStorage.key(i);
							if (s.indexOf("keep ") == 0) {
								var name = s.substring(s.indexOf(" ") + 1);
								map[name] = {
									v : localStorage[s],
									s : localStorage["solved " + name]
								};
							}
						}

						quips_ta.value = JSON.stringify(map, 0, 1);
					});
					$("#import").click(function(e) {
						var map = JSON.parse(quips_ta.value);
						for ( var name in map) {
							localStorage["keep " + name] = map[name].v;
							if (map[name].s == "Y")
								localStorage["solved " + name] = "Y";
							find(name).remove();
							add(name);
						}
					});
					showPanel("setup");

					$(puzzle).click(function(e) {

						// e will give us absolute x, y so we need to calculate
						// relative to puzzle position
						var pos = $(puzzle).position();
						var ox = e.pageX - pos.left;
						var oy = e.pageY - pos.top;

						var yField = Math.floor(oy / q12DeltaY);
						var xField = Math.floor(ox / q12Delta);
						if (yField % 3 > 0)
							return;

						yField = yField / 3;
						char = lines[yField][xField];
						if (char >= "A" && char <= "Z" && letter != char) {
							updatePuzzle(char);
							saveDict();
						}

						// e.stopPropagation();

					});

					$(selection).click(function(e) {

						// e will give us absolute x, y so we need to calculate
						// relative to puzzle position
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
							saveDict();
							changeSub(char, drops);
						}
						// e.stopPropagation();

					});

					function decode(c) {
						if (c < 'A' || c > 'Z') {
							return c;
						}
						if (c in dict) {
							return dict[c];
						}
						return ' ';
					}

					function complete() {
						for ( var i = 0; i < lines.length; i++) {
							var line = lines[i];
							for ( var j = 0; j < line.length; j++) {
								var c = line[j];
								if (c != ' ' && decode(c) == ' ') {
									return false;
								}
							}
						}
						return true;
					}

					/* Change the highlighted letter */
					function updatePuzzle(l) {
						if (l == letter)
							return;
						var ctx = puzzle.getContext("2d");
						ctx.font = "24pt courier";
						ctx.textAlign = "center";
						ctx.textBaseline = "bottom";

						for ( var i = 0; i < lines.length; i++) {
							var line = lines[i];
							for ( var j = 0; j < line.length; j++) {
								var c = line[j];
								if (c != l && c != letter)
									continue;
								ctx.fillStyle = c == l ? "#DC143C" : "#006400";
								var x = j * q12Delta;
								var y = i * q12DeltaY * 3;
								ctx.clearRect(x, y, q12Delta, q12DeltaY);
								ctx
										.fillText(c, x + q12Delta / 2, y
												+ q12DeltaY);
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

						for ( var i = 0; i < lines.length; i++) {
							var line = lines[i];
							for ( var j = 0; j < line.length; j++) {
								var c = line[j];
								if (c == letter || c in drops) {
									var x = j * q12Delta;
									var y = i * q12DeltaY * 3 + q12DeltaY;
									ctx.clearRect(x, y, q12Delta, q12DeltaY);
									if (c == letter)
										ctx.fillText(s, x + q12Delta / 2, y
												+ q12DeltaY);
								}
							}
						}

						ctx = selection.getContext("2d");
						ctx.font = "32pt courier";
						ctx.textAlign = "center";
						ctx.textBaseline = "bottom";

						for ( var j = 0; j < alphabet.length; j++) {
							var c = alphabet[j];
							if (c == s || c in drops) {
								var x = j * q20Width;
								ctx.clearRect(x, 0, q20Width, q20DeltaY);
								ctx.fillStyle = c == s ? '#A00000' : '#000000';
								ctx.fillText(c, x + q20Width / 2, q20DeltaY);
							}
						}

						$("#solved")[0].disabled = !complete();
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

						ctx
								.clearRect(0, 0, ctx.canvas.width,
										ctx.canvas.height);

						// Write the cryptogram and current solution
						ctx.font = "24pt courier";
						ctx.textAlign = "center";
						ctx.textBaseline = "bottom";
						for ( var i = 0; i < lines.length; i++) {
							var line = lines[i];
							for ( var j = 0; j < line.length; j++) {
								var c = line[j];
								ctx.fillStyle = c == letter ? "#DC143C"
										: "#006400";
								ctx.fillText(c, j * q12Delta + q12Delta / 2, i
										* q12DeltaY * 3 + q12DeltaY);
								c = decode(c);
								if (c == ' ')
									continue;
								ctx.fillStyle = '#000000';
								ctx.fillText(c, j * q12Delta + q12Delta / 2, i
										* q12DeltaY * 3 + 2 * q12DeltaY);
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
						ctx
								.clearRect(0, 0, ctx.canvas.width,
										ctx.canvas.height);

						// Write the alphabet line
						ctx.font = "32pt courier";
						ctx.textAlign = "center";
						ctx.textBaseline = "bottom";
						for ( var j = 0; j < alphabet.length; j++) {
							var c = alphabet[j];
							ctx.fillStyle = c in dict ? '#A00000' : '#000000';
							ctx.fillText(c, j * q20Width + q20Width / 2,
									q20DeltaY);
						}

						$("#solved")[0].disabled = !complete();
					}

				});
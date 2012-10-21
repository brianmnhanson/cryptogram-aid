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

					function make_id(key) {
						return "crypt_" + key.replace("[^A-Za-z0-9-]", "_");
					}

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
							quip_ta.value = localStorage["quip"];
						}
					}

					var letter = 'a';
					var alphabet = "aeiou bcdfghjklmnpqrstvwxyz";
					var dict = {};
					var key = "";

					loadFromStorage();

					function buildLines(quip) {
						if (localStorage["quip"] != quip) {
							localStorage["quip"] = quip;
							letter = quip[0];
						} else if ("dict" in localStorage) {
							var key = localStorage["dict"];
							for ( var i = 1; i < key.length; i += 2) {
								dict[key[i]] = key[i + 1];
								dict[key[i + 1]] = key[i];
							}
							letter = key[0];
						}

						lines = [ "" ];
						var words = quip.toUpperCase().split(" ");
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

					function save() {
						var key = letter;
						for ( var i = 0; i < alphabet.length; i++) {
							var c = alphabet[i];
							if (c in dict)
								key += c + dict[c];
						}
						localStorage["dict"] = key;
					}

					function store(e) {
						var value = quip_ta.value.toUpperCase();
						if (key != title_t.value) {
							if (key != ""
									&& localStorage["keep " + key] == value) {
								delete localStorage["keep " + key];
								delete localStorage["solved " + key];
								find(key).remove();
							}
							key = title_t.value;
							localStorage["keep " + key] = value;
							add(key);
							quip_ta.value = value;
						} else if (localStorage["keep " + key] != value) {
							localStorage["keep " + key] = value;
							find(key).remove();
							add(key);
						}

						delete_b.disabled = false;
					}

					function select_row(e) {
						key = e.currentTarget.title;
						quip_ta.value = localStorage["keep " + key];
						title_t.value = key;
						delete_b.disabled = false;
						store_b.disabled = false;
						buildLines(quip_ta.value);
						repaintPuzzle();
						dict = {};
						delete localStorage["dict"];
						showPanel("run");
					}
					function add(key) {
						var solved = localStorage["solved " + key] ? "&check;"
								: "";
						$("#items").append('<tr title="' + key + '"><td>' //
								+ solved + '</td><td>' //
								+ key + '</td><td>' //
								+ localStorage["keep " + key].small() //
								+ '</td></tr>' //
						);
						$("tr:last").click(select_row);
					}
					function find(key) {
						return $("tr").filter(function(i) {
							return this.title == key;
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
						if (p == "setup")
							$("#setup").show();
						else if (p == "choose")
							$("#choose").show();
						else if (p == "run")
							$("#run").show();
						else if (p == "load") {
							quips_ta.value = "";
							$("#load").show();
						}
					}

					// Check if the browser supports <canvas>
					if (!puzzle.getContext) {
						alert("This demo requires a browser that supports the <canvas> element.");
						return;
					}

					// Global actions
					$('button[name^="new"]').click(function(e) {
						quip_ta.value = "";
						key = "";
						var date = new Date().toDateString();
						date = date.substring(date.indexOf(" ") + 1);
						title_t.value = "STrib " + date;
						dict = {};
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
						buildLines(quip_ta.value);
						repaintPuzzle();
						showPanel("run");
					});
					$("#title").change(function(e) {
						store_b.disabled = this.value == "";
					});
					$("#store").click(store);
					$("#delete").click(function(e) {
						delete localStorage["keep " + key];
						delete localStorage["solved " + key];
						find(key).remove();
						this.disabled = true;
					});

					// Choose panel actions
					$("#hide").click(function(e) {
						findSolved().hide();
						$("#show").show();
						$("#hide").hide();
					});
					$("#show").click(function(e) {
						findSolved().show();
						$("#hide").show();
						$("#show").hide();
					});
					$("#maint").click(function(e) {
						showPanel("load");
					});

					// Solve panel actions
					$("#solved").click(function(e) {
						localStorage["solved " + key] = "Y";
						find(key).remove();
						add(key);
						showPanel("setup");
					});
					$("#reset").click(function(e) {
						dict = {};
						delete localStorage["dict"];
						repaintPuzzle();
					});

					// Load panel actions
					$("#export").click(function(e) {
						var map = {};
						for ( var i = 0; i < localStorage.length; i++) {
							var s = localStorage.key(i);
							if (s.indexOf("keep ") == 0) {
								var key = s.substring(s.indexOf(" ") + 1);
								map[key] = {
									v : localStorage[s],
									s : localStorage["solved " + key]
								};
							}
						}

						quips_ta.value = JSON.stringify(map);
					});
					$("#import").click(function(e) {
						var map = JSON.parse(quips_ta.value);
						for ( var key in map) {
							localStorage["keep " + key] = map[key].v;
							if (map[key].s == "Y")
								localStorage["solved " + key] = "Y";
							find(key).remove();
							add(key);
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
							save();
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
							changeSub(char, drops);
						}
						save();
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
export function resizeGameboard (numLetters, numHops) { 
  var totWidth = $(".game-container").width ();
  var totHeight = $(".game-container").height ();
  
  var numHCells = numLetters + 2; // To account for icons on either side
  var numVCells = numHops + 1; // There are 1 more rows than number of hops
  
  // Figure out width/height size of a single letter square cell
  var hSize = totWidth / numHCells;
  var vSize = totHeight / numVCells;
  var cellHV = Math.min(hSize, vSize);
  
  // Calc the size of the board based on cell size
  var hBoard = cellHV * numHCells;
  var vBoard = cellHV * numVCells;

  // Resize the board
  $(".game-board").css ({"width": hBoard, "height": vBoard});

  // Resize the word rows to the proper % based on numHops
  $(".word-row").css ({"height": (100/numVCells) + "%"});
}

$(document).ready(function () {
  function resizeDiv() {
    var gameContainer = $('.game-container'),
      containerWidth = gameContainer.map(function () {
        return $(this).width();
      }),
      containerHeight = gameContainer.map(function () {
        return $(this).height();
      });

    var totWidth = containerWidth[0];
    var totHeight = containerHeight[0];
    var numLetters = $('#data').data('letters');
    var numHops = $('#data').data('hops');
    var numHCells = numLetters + 2; // To account for icons on either side
    var numVCells = numHops + 1;

    // Figure out width/height size of a single letter square cell
    var hSize = totWidth / numHCells;
    var vSize = totHeight / numVCells;
    var cellHV = Math.min(hSize, vSize);

    // Calc the size of the board based on cell size
    var hBoard = cellHV * numHCells;
    var vBoard = cellHV * numVCells;

    // Resize the board
    $('.game-board').css({ width: hBoard, height: vBoard });

    // Resize the word rows to the proper % based on numHops
    $('.word-row').css({ height: 100 / numVCells + '%' });
  }
  resizeDiv();

  $(window).resize(function () {
    resizeDiv();
  });
});

function test() {
  alert('My JS IS LOADED BITCHES!');
}

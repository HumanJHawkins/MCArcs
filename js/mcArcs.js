let theCanvas;
let theContext;
let windowHeight;
let windowWidth;
let canvasSize;
let drawAreaSize;
let gridExtent;
let gridSize;
let arcArray;
let radius;

function doIt() {
    radius = document.getElementById("radius").value;
    arcArray = getCircleArray(radius);
    document.getElementById("data").innerHTML = getCircleHTML(arcArray);
    onDisplaySize();
}

function getCircleHTML(circleArray) {
    let longest = lengthLongestNumber(circleArray);
    let html = "<pre>";
    for(let i = 0; i< circleArray.length; i++) {
        html += "setblock " +
            formatCoordinate(circleArray[i][0],longest) +
            " ~-1 " +
            formatCoordinate(circleArray[i][1],longest) +
            " minecraft:stone<br />";
    }
    html += "<br /></pre>";
    return html;
}

function formatCoordinate(number, length){
    let result = "000000000" + Math.abs(number);
    if(number < 0){
        result = "~-" + result.substr(result.length - (length - 1));
    } else {
        result = " ~" + result.substr(result.length - (length - 1));
    }
    return result;
}

function lengthLongestNumber(array2d) {
    let longest = 0;
    for(let i = 0; i < array2d.length; i++){
        for(let j = 0; j < array2d[i].length; j++){
            if(array2d[i][j].toString().length > longest) {
                longest = array2d[i][j].toString().length;
            }
        }
    }
    return longest;
}
function onDisplaySize() {
    // Window dimensions in pixels. Although we use view width for almost everything, most decisions about layout are
    //   best made based on actual pixel count, or aspect ratio.
    windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    if (windowWidth < windowHeight) {
        canvasSize = windowWidth * 0.75;
    } else {
        canvasSize = windowHeight * 0.75;
    }
    drawAreaSize = canvasSize * 0.95;
    gridExtent = drawAreaSize / 2;
    gridSize = drawAreaSize / (2 * radius + 2);

    drawScreen();
}

function drawScreen() {
    drawCanvas();
    drawGrid();
    drawGridCircle(arcArray);
}

function drawCanvas() {
    theCanvas = document.getElementById("arcCanvas");
    theContext = theCanvas.getContext("2d");
    theCanvas.width = canvasSize;
    theCanvas.height = canvasSize;
    theCanvas.style.background = "#FBFBFF";
    theContext.restore();
    theContext.clearRect(0, 0, theCanvas.width, theCanvas.height);
    theContext.translate(theCanvas.width / 2, theCanvas.height / 2);
    theContext.lineWidth = "1";
}

function drawGrid() {
    theContext.strokeStyle = "lightgray";
    theContext.beginPath();
    // theContext.moveTo(-gridExtent, 0);
    // theContext.lineTo( gridExtent, 0);
    // theContext.moveTo(0, -gridExtent);
    // theContext.lineTo( 0, gridExtent);

    for (let i = gridSize / 2; i <= gridExtent; i += gridSize) {
        theContext.moveTo(-gridExtent, i);
        theContext.lineTo(gridExtent, i);
        theContext.moveTo(-gridExtent, -i);
        theContext.lineTo(gridExtent, -i);
        theContext.moveTo(i, -gridExtent);
        theContext.lineTo(i, gridExtent);
        theContext.moveTo(-i, -gridExtent);
        theContext.lineTo(-i, gridExtent);
    }
    theContext.stroke();
}

function drawGridCircle(circleArray) {
    drawGridArc(circleArray, 0, 360)
}

function drawGridArc(circleArray, startDegree, endDegree) {
    startDegree = startDegree || 0;
    endDegree = endDegree || 360;
    let startPoint = [];
    let endPoint = [];

    // Light circle line
    theContext.strokeStyle = "red";
    theContext.beginPath();
    theContext.arc(0, 0, radius * gridSize, 0, 2 * Math.PI);
    theContext.stroke();

    if (circleArray) {
        for (let i = 0; i < circleArray.length; i++) {
            squareAt(circleArray[i]);
        }
        squareAt([0, 0], "red");
    }
}

function squareAt(p, color) {
    color = color || "black";

    let sizeAdjust = gridSize / 2;
    p[0] *= gridSize;
    p[1] *= -gridSize;

    theContext.strokeStyle = color;
    theContext.beginPath();
    theContext.moveTo(p[0] - sizeAdjust, p[1] - sizeAdjust);
    theContext.lineTo(p[0] - sizeAdjust, p[1] + sizeAdjust);
    theContext.lineTo(p[0] + sizeAdjust, p[1] + sizeAdjust);
    theContext.lineTo(p[0] + sizeAdjust, p[1] - sizeAdjust);
    theContext.lineTo(p[0] - sizeAdjust, p[1] - sizeAdjust);
    theContext.stroke();
}

function getCircleArray(radius) {
    let currentX = 0;
    let currentY = radius;

    // The first point (element 0) of our 1/8th circle arc is is always (0, radius).
    let circleArray = [currentX, currentY];
    let endPoint = rotatePointInt([0, 0], circleArray, 45);

    // The last point of our 1/8th circle arc is the closest integer point to a 45 degree rotation of the first point.
    // It's x-value will also be it's element position in our array, as each x-value of this arc segment can only have
    //   one point.
    circleArray[endPoint[0]] = endPoint;

    // For each x-value through 1/8th of the circle, the y-value will be either the same, or one less than the previous
    //   point's y-value. Between these two, use the y-value that is closest to the radius of the circle.
    while (currentX <= endPoint[0]) {
        if (Math.abs(radius - getDistance(0, 0, currentX, currentY - 1))
            < Math.abs(radius - getDistance(0, 0, currentX, currentY))) {
            currentY--;
        }

        // alert("Y-1: " + Math.abs(radius - getDistance(0,0, currentX,currentY - 1)) +
        //     "\nY-0: " +Math.abs(radius - getDistance(0,0, currentX, currentY)));
        //
        circleArray[currentX] = [currentX, currentY];
        currentX++;
    }

    // Create the rest of the circle from our 1/8th circle arc-segment.
    // Keep all points in clockwise-order to allow easy cutting of arc-segments from the array.
    let lastElement = circleArray.length - 1;
    for (let i = 0; i < lastElement; i++) {
        circleArray[lastElement + i + 1] = [circleArray[lastElement - i][1], circleArray[lastElement - i][0]];
    }

    // Some squares at 45 degrees are unnecessary because the squares on either side connect at a point. Remove these.
    if (circleArray[lastElement][1] === circleArray[lastElement - 1][1]
        && circleArray[lastElement][0] === circleArray[lastElement + 1][0]) {
        circleArray.splice(lastElement, 2);
    }

    // If a block was right at 45degrees, it will have been duplicated. Remove the extra.
    if (circleArray[lastElement][0] === circleArray[lastElement + 1][0]
        && circleArray[lastElement][1] === circleArray[lastElement + 1][1]) {
        circleArray.splice(lastElement, 1);
    }

    let segmentLength = circleArray.length;
    for (let i = 0; i < segmentLength; i++) {
        circleArray[segmentLength + i] = rotatePointInt([0, 0], circleArray[i], 90);
        circleArray[segmentLength * 2 + i] = rotatePointInt([0, 0], circleArray[i], 180);
        circleArray[segmentLength * 3 + i] = rotatePointInt([0, 0], circleArray[i], 270);
    }
    return circleArray;
}


function rotatePoint(c, p, angle) {
    let radians = (Math.PI / 180) * angle;
    let cos = Math.cos(radians);
    let sin = Math.sin(radians);
    return [
        (cos * (p[0] - c[0])) + (sin * (p[1] - c[1])) + c[0],
        (cos * (p[1] - c[1])) - (sin * (p[0] - c[0])) + c[1]
    ];
}

function rotatePointInt(c, p, angle) {
    let n = rotatePoint(c, p, angle);
    return [
        Math.round(n[0]),
        Math.round(n[1])
    ];
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

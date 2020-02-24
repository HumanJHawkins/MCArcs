// To DO:
// - getCircleArray() is duplicating squares when they are right on the 45 and do not transpose to a different location.
//     (works fine, but will make extra command rows.)
// - Currently using "closest square" algorithm. I am notising that it might be better to round corners more by
//     measuring area away from the circle... Two squares close to the line may be replaced by one that is slightly
//     further away, for a better overall appearance.

let windowHeight;
let windowWidth;

let theCanvas;
let theContext;
let canvasSize;
let drawAreaSize;
let gridExtent;
let gridSize;

let circleArray;
let diameter;
let radius;
let gridOffset;

function validate() {
    let inputDiamater = document.getElementById("diameter").value;
    if (inputDiamater >= 4 && inputDiamater <= 256) {
        diameter = inputDiamater;
        radius = diameter / 2;
        handleGridOffset();
        newCircle();
    }
}

function handleGridOffset() {
    if (Math.round(diameter) % 2 === 0) {
        gridOffset = [0.5, 0.5];
    } else {
        gridOffset = [0, 0];
    }
}

function newCircle() {
    circleArray = getCircleArray();
    document.getElementById("data").innerHTML = getCircleHTML(circleArray);
    onDisplaySize();
}

function getCircleArray() {
    let i = 0;
    let currentPoint = [];
    circleArray = [];

    do {     // do-while loop will go one too far
        currentPoint = addPointMetadata(getPoint(i));
        circleArray[i] = currentPoint;
        i++;
    } while (currentPoint[3] < 45);

    // If the last y-value is more than one away from the second to last, increment y.
    if (circleArray[i - 1][1] < circleArray[i - 2][1] - 1) {
        circleArray[i - 1][1]++;
        circleArray[i - 1] = addPointMetadata(circleArray[i - 1]);
    }

    // If the last two are straddling the 45 degree line,
    //   or the last element is at 45 degrees with the same y-value as the prior element, remove the last one.
    if (circleArray[i - 1][2] === circleArray[i - 2][2] ||
        (circleArray[i - 1][3] === 45 && circleArray[i - 1][1] === circleArray[i - 2][1])) {
        circleArray.pop();
    }

    // Transpose the 1/8th to make a 1/4.
    // Keep all points in clockwise-order to allow easy cutting of arc-segments from the array.
    let lastElement = circleArray.length - 1;
    for (let i = 0; i <= lastElement; i++) {
        circleArray[lastElement + i + 1] =
            addPointMetadata([circleArray[lastElement - i][1], circleArray[lastElement - i][0]]);
    }

    // Rotate the quarter (x3) to make a circle.
    // For odd diameters, we will be one too long.
    if (!gridOffset[0]) {
        circleArray.pop();
    }

    let segmentLength = circleArray.length;
    for (let i = 0; i < segmentLength; i++) {
        circleArray[segmentLength + i] = addPointMetadata(rotatePointInt([0, 0], circleArray[i], 90));
        circleArray[segmentLength * 2 + i] = addPointMetadata(rotatePointInt([0, 0], circleArray[i], 180));
        circleArray[segmentLength * 3 + i] = addPointMetadata(rotatePointInt([0, 0], circleArray[i], 270));
    }
    return circleArray;
}

function getPoint(i) {
    let currentX = i + gridOffset[0];
    let currentY = Math.round(radius + 1) + gridOffset[0];    // Start at highest possible y-value
    let dP1 = Math.abs(getDistance([0, 0], [currentX, currentY]) - radius);
    let dP2;
    do {
        dP2 = Math.abs(getDistance([0, 0], [currentX, currentY - 1]) - radius);
        // alert("currentX: " + currentX + "\ncurrentY: " + currentY + "\ndP1: " + dP1 + "\ndP2: " + dP2);
        if (Math.abs(dP2) <= Math.abs(dP1)) {
            dP1 = dP2; // If distance equal, choose the lesser y-value to avoid ugly odd-diameter circles.
        } else {
            return [currentX, currentY];
        }
        currentY -= 1;
    } while (true);
}

function addPointMetadata(p) {
    let distance = getDistance([0, 0], p) - radius;
    let angle = getAngle([0, 0], p);
    return [p[0], p[1], distance, angle];
}


function getCircleHTML(circleArray) {
    // let longest = lengthLongestNumber(circleArray);
    let html = "<pre>";
    for (let i = 0; i < circleArray.length; i++) {
        html += "" + i +
            "   x: " + circleArray[i][0] +
            "   y: " + circleArray[i][1] +
            "   d: " + circleArray[i][2] +
            "   a: " + circleArray[i][3] + "<br />";


        // html += "setblock " +
        //     formatCoordinate(circleArray[i][0], longest) +
        //     " ~-1 " +
        //     formatCoordinate(circleArray[i][1], longest) +
        //     " minecraft:stone<br />";
    }
    html += "<br /></pre>";
    return html;
}

function formatCoordinate(number, length) {
    let result = "000000000" + Math.abs(number);
    if (number < 0) {
        result = "~-" + result.substr(result.length - (length - 1));
    } else {
        result = " ~" + result.substr(result.length - (length - 1));
    }
    return result;
}

function lengthLongestNumber(array2d) {
    let longest = 0;
    for (let i = 0; i < array2d.length; i++) {
        for (let j = 0; j < array2d[i].length; j++) {
            if (array2d[i][j].toString().length > longest) {
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
    drawGridCircle(circleArray);
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
    theContext.fillRect(-1, -1, 2, 2);
    let gridStart = gridSize / 2;

    if (gridOffset[0]) {
        theContext.strokeStyle = "#CCCCCC";
        theContext.beginPath();
        theContext.moveTo(-gridExtent, 0);
        theContext.lineTo(gridExtent, 0);
        theContext.moveTo(0, -gridExtent);
        theContext.lineTo(0, gridExtent);
        theContext.stroke();
        gridStart = gridSize;
    }

    theContext.strokeStyle = "#EBEBEB";
    theContext.beginPath();
    for (let i = gridStart; i <= gridExtent; i += gridSize) {
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

    drawTargetCircle();
    drawCenterSquare();
}

function drawTargetCircle() {
    theContext.strokeStyle = "lightblue";
    theContext.beginPath();
    theContext.arc(0, 0, radius * gridSize, 0, 2 * Math.PI);
    theContext.stroke();
}

function drawCenterSquare() {
    if (!gridOffset[0]) {
        squareAt([0, 0], "lightblue");
    } else {
        squareAt([0.5, 0.5], "lightblue");
        squareAt([0.5, -0.5], "lightblue");
        squareAt([-0.5, -0.5], "lightblue");
        squareAt([-0.5, 0.5], "lightblue");
    }
}

function drawGridCircle(circleArray) {
    drawGridArc(circleArray, 0, 360)
}

function drawGridArc(circleArray, startDegree, endDegree) {
    startDegree = startDegree || 0;
    endDegree = endDegree || 360;
    let startPoint = [];
    let endPoint = [];

    if (circleArray) {
        for (let i = 0; i < circleArray.length; i++) {
            squareAt(circleArray[i]);
        }
    }
}

function squareAt(p, color) {
    color = color || "black";

    let sizeAdjust = gridSize / 2;
    p[0] *= gridSize;
    p[1] *= -gridSize;

    // if (gridOffset[0]) {
    //     if (p[0] >= 0) p[0] -= sizeAdjust; else p[0] += sizeAdjust;
    //     if (p[1] > 0) p[1] -= sizeAdjust; else p[1] += sizeAdjust;
    // }

    theContext.strokeStyle = color;
    theContext.beginPath();
    theContext.moveTo(p[0] - sizeAdjust, p[1] - sizeAdjust);
    theContext.lineTo(p[0] - sizeAdjust, p[1] + sizeAdjust);
    theContext.lineTo(p[0] + sizeAdjust, p[1] + sizeAdjust);
    theContext.lineTo(p[0] + sizeAdjust, p[1] - sizeAdjust);
    theContext.lineTo(p[0] - sizeAdjust, p[1] - sizeAdjust);
    theContext.stroke();
}


function closestToCircle(p1, p2, r, c, constraint) {
    const constraints = Object.freeze({"notOuside": -1, "notInside": 1});
    c = c || [0, 0];
    constraint = constraint || 0;

    let dp1 = r - getDistance(c, p1);
    let dp2 = r - getDistance(c, p2);
    switch (constraint) {
        case constraints.notOuside:
            if (dp1 >= 0 && (dp2 < 0 || dp1 <= dp2)) return p1;
            if (dp2 >= 0 && (dp1 < 0 || dp2 <= dp1)) return p2;
            break;
        case constraints.notInside:
            if (dp1 <= 0 && (dp2 > 0 || dp1 >= dp2)) return p1;
            if (dp2 <= 0 && (dp1 > 0 || dp2 >= dp1)) return p2;
            break;
        default:
            if (Math.abs(dp1) <= Math.abs(dp2)) return p1; else return p2;
    }

    throw "Error: No point meets constraints in closestToCircle function.\n" +
    "p1: " + p1.toString() + "\n" +
    "p2: " + p2.toString() + "\n" +
    "r : " + r + "\n" +
    "c : " + c.toString() + "\n" +
    "constraint: " + constraint + "\n" +
    "dp1: " + dp1 + "\n" +
    "dp2: " + dp2 + "\n"
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
    return [n[0], n[1]];
}

function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
}

function getAngle(c, p) {
    let nx = p[0] - c[0];
    let ny = p[1] - c[1];
    let angle = Math.atan2(nx, ny) / Math.PI * 180;
    if (angle < 0) angle += 360;
    return angle;
}

function alertArray(arr2d) {
    let output = "";
    for (let i = 0; i < arr2d.length; i++) {
        if (Array.isArray(arr2d[i])) {
            for (let j = 0; j < arr2d[i].length; j++) {
                if (Array.isArray(arr2d[i][j])) {
                    output += arr2d[i][j].toString() + "\n";
                } else {
                    output += arr2d[i][j] + "\n";
                }
            }
            output += arr2d[i].toString() + "\n";
        } else {
            output += arr2d[i] + "\n";
        }
    }
    alert(output);
}


// To DO:
// - Should we (and how should we) include unused grid squares data? I.e. Squares not used, but that have a piece
//    of the circle running through them.
// - Add data for actual largest point to point outside dimension
// - Add data for actual smallest point to point inside dimension

const pd =   //  Point data
    Object.freeze({
        "x": 0,
        "y": 1,
        "distance": 2,
        "angle": 3
    });

const sd =   //  Square data
    Object.freeze({
        "x": pd.x,
        "y": pd.y,
        "distance": pd.distance,
        "angle": pd.angle,
        "arcDegrees":4,
        "areaIn": 5,
        "areaOut": 6,
        "areaScore":7
    });

const cd =   //  Circle data
    Object.freeze({
        qDistance: 0,
        qInside: 1,
        qOutside: 2,
        qOverall: 3
    });

let windowHeight;
let windowWidth;

let theCanvas;
let theContext;
let canvasSize;
let drawAreaSize;
let gridExtent;
let gridSize;

let diameter;
let radius;
let oddDiameter;
let gridOffset;

let circles = [];   //

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
    oddDiameter = true;
    gridOffset = [0, 0];
    if (Math.round(diameter) % 2 === 0) {
        oddDiameter = false;
        gridOffset = [0.5, 0.5];
    }
}

function newCircle() {
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
    } while (currentPoint[pd.angle] < 45);

    // If the last y-value is more than one away from the second to last, increment y.
    if (circleArray[i - 1][sd.y] < circleArray[i - 2][sd.y] - 1) {
        circleArray[i - 1][sd.y]++;
        circleArray[i - 1] = addPointMetadata(circleArray[i - 1]);
    }

    // If the last two are straddling the 45 degree line,
    //   or the last element is at 45 degrees with the same y-value as the prior element, remove the last one.
    if (circleArray[i - 1][sd.distance] === circleArray[i - 2][sd.distance] ||
        (circleArray[i - 1][sd.angle] === 45 && circleArray[i - 1][sd.y] === circleArray[i - 2][sd.y])) {
        circleArray.pop();
    }

    circleArray = transposeEighth(circleArray);
    circleArray = mirror(circleArray, "Y");
    circleArray = mirror(circleArray, "X");

    return circleArray;
}

function mirror(arr, doXYO) {
    // doXYO is mirror across X, Y, or Origin
    let last = arr.length - 1;
    if (!oddDiameter) {
        for (let i = last; i >= 0; i--) {
            arr[last + (last - i) + 1] = mirrorPoint(arr[i], doXYO);
        }
    } else {
        // Kluge alert: Ugly, but works. Be careful messing with this
        if (doXYO === "Y") arr[2 * last] = mirrorPoint(arr[0], doXYO); // needed 1/4 of the time. Harmless the other 3.
        let j = 1;
        for (let i = last - 1; i > 0; i--) {
            arr[last + j] = mirrorPoint(arr[i], doXYO);
            j++;
        }
    }
    return arr;
}

function mirrorPoint(p, doXYO) {
    // doXYO is mirror across X, Y, or Origin
    let temp = p.slice(0);  // Make a copy, as it is an object passed by reference.
    switch (doXYO) {
        case "X":
            temp[pd.x] = -temp[pd.x];
            break;
        case "Y":
            temp[pd.y] = -temp[pd.y];
            break;
        case "O":
            temp = mirrorPoint(mirrorPoint(temp, "X"), "Y");
    }
    // Update the angle. It is the only data that is different based on mirroring.
    temp[pd.angle] = getAngle([0, 0], temp);
    return temp;
}

function transposeEighth(arr) {
    // Transpose the 1/8th to make a 1/4.
    // Keep all points in clockwise-order to allow easy cutting of arc-segments from the array.
    let last = arr.length - 1;
    for (let i = 0; i <= last; i++) {
        arr[last + i + 1] =
            [arr[last - i][sd.y], arr[last - i][sd.x],
                arr[last - i][sd.distance],
                getAngle([0, 0], [arr[last - i][sd.y], arr[last - i][sd.x]]), // updated angle,
                arr[last - i][sd.arcDegrees],
                arr[last - i][sd.areaIn],
                arr[last - i][sd.areaOut],
                arr[last - i][sd.areaScore]
            ];
    }

    // If our last element was at the 45, clean up the extra copy.
    if (arr[last][sd.x] === arr[last][sd.y]) {
        arr.splice(last, 1);
    }
    return arr;
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

function addPointMetadata(p, doArea) {
    doArea = doArea === undefined;
    let distance = getDistance([0, 0], p) - radius;
    let angle = getAngle([0, 0], p);
    if (doArea) {
        let areaData = getAreaInsideCircle(p);
        let areaIn = areaData[1];
        let areaOut = 1 - areaIn;
        let areaScore = Math.abs(areaIn - areaOut);
        return [p[pd.x], p[pd.y], distance, angle, areaData[0], areaIn, areaOut, areaScore];
    }
    return [p[pd.x], p[pd.y], distance, angle];
}
function getAreaInsideCircle(p) {
    // As written, requires:
    //   - Point is at angle > 0 and <= 45.
    //   - The point data format of this program... Needs rewrite to work elsewhere.
    let area = 0;
    let p1a = addPointMetadata([p[pd.x] - 0.5, p[pd.y] - 0.5], false);
    let p2a = addPointMetadata([p[pd.x] + 0.5, p[pd.y] - 0.5], false);
    let p1b = addPointMetadata([p1a[pd.x], getTopCircleIntercept(p1a, radius, false)], false);
    let p2b = addPointMetadata([p2a[pd.x], getTopCircleIntercept(p2a, radius, false)], false);

    if (p2a[pd.distance] < 0) {
        // We know dist p1-p2 is 1. And, p2a-p2b is shorter than p1a-p1b. So area of rect
        //   is just p2a[pd.y] - p2b[pd.y]
        area += Math.abs(p2a[pd.y] - p2b[pd.y]);
    } else {
        // No rectangle under the arc, so area still zero.
        // Make p2b the horizontal intercept with the circle.
        p2b = addPointMetadata([getTopCircleIntercept(p2a, radius, true), p2a[pd.y]], false);
    }

    // Add the area of the triangle formed by the two arc contact points and the appropriate p1 line point.
    area += Math.abs((p2b[pd.x] - p1b[pd.x]) * (p1b[pd.y] - p2b[pd.y]) / 2);

    // Finally, add the area of the segment of the circle identified by p1b and p2b.
    // handle p1 points being to left of zero angle (first square of odd diameter circle).
    let p1bAngle = p1b[pd.angle];
    if(p1bAngle > 90) p1bAngle -= 360;
    let centralAngle = p2b[pd.angle] - p1bAngle;
    area += (centralAngle * Math.PI / 360 - Math.sin(centralAngle * Math.PI / 180) / 2) * Math.pow(radius,2);

    return [centralAngle, area];
}

function getTopCircleIntercept(p, r, returnX) {
    if (returnX) {
        return Math.sqrt(Math.pow(r, 2) - Math.pow(p[pd.y], 2));
    } else {
        return Math.sqrt(Math.pow(r, 2) - Math.pow(p[pd.x], 2));
    }
}

function getCircleHTML(circleArray) {
    // let longest = lengthLongestNumber(circleArray);
    let html = "<pre>";
    for (let i = 0; i < circleArray.length; i++) {
        html += ("" + i).padStart(3, "0") + ":" +
            " (" + padNumber(circleArray[i][sd.x], 3, 2) +
            "," + padNumber(circleArray[i][sd.y], 3, 2) +
            ")&nbsp;&nbsp;&nbsp;&nbsp;dist: " + padNumber(circleArray[i][sd.distance], 0, 2) +
            "&nbsp;&nbsp;&nbsp;&nbsp;angle: " + padNumber(circleArray[i][sd.angle], 3, 0) +
            "&nbsp;&nbsp;&nbsp;&nbsp;area in: " + padNumber(circleArray[i][sd.areaIn], 0, 3) +
            "&nbsp;&nbsp;&nbsp;&nbsp;area out: " + padNumber(circleArray[i][sd.areaOut], 0, 3) +
            "&nbsp;&nbsp;&nbsp;&nbsp;score: " + padNumber(circleArray[i][sd.areaScore], 0, 3) +
            "&nbsp;&nbsp;&nbsp;&nbsp;arcDegrees: " + padNumber(circleArray[i][sd.arcDegrees], 0, 3) +
            "<br />";

        // html += "setblock " +
        //     formatCoordinate(circleArray[i][[pd.x]], longest) +
        //     " ~-1 " +
        //     formatCoordinate(circleArray[i][pd.y], longest) +
        //     " minecraft:stone<br />";
    }
    html += "<br /></pre>";
    return html;
}

function padNumber(n, zeroes, digits) {
    let isNegative = n < 0;
    n = Math.abs(n);
    let integerPart = Math.floor(n).toString().padStart(zeroes, "0");
    let decimalPart = (n % 1).toFixed(digits).substring(1);
    if (isNegative) integerPart = "-" + integerPart;
    else integerPart = " " + integerPart;
    return integerPart + decimalPart;
}

function roundTo(n, precision) {
    // precision is how precise the result will be. for rounding to the nearest 10, enter 10.
    //   To the nearest .001, enter .001. Can also enter arbitrary intervals such as 3.
    precision = precision || 1;
    if (n < 0) precision *= -1;
    return n + precision / 2 - ((n + precision / 2) % precision);
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
    drawGrid(theContext, gridSize, gridExtent, oddDiameter);
    drawTargetCircle(); //   ???
    drawCenterSquare();
    drawCenterPoint(theContext);
    circleArray = getCircleArray();
    drawGridCircle(circleArray);
    document.getElementById("data").innerHTML = getCircleHTML(circleArray);
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
    theContext.lineWidth = 1.00;
}

function drawGrid(theContext, gridSize, gridExtent, hasCenterSquare) {
    gridSize = gridSize || 20;

    let maxExtent = theContext.width;
    if (maxExtent < theContext.height) {
        maxExtent = theContext.height * 0.9
    }
    gridExtent = gridExtent || maxExtent;

    let gridStart = gridSize / 2;
    if (!hasCenterSquare) {
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
}

function drawCenterPoint(theContext) {
    theContext.fillRect(-1, -1, 2, 2);
}

function drawTargetCircle() {
    theContext.strokeStyle = "lightblue";
    theContext.beginPath();
    theContext.arc(0, 0, radius * gridSize, 0, 2 * Math.PI);
    theContext.stroke();
}

function drawCenterSquare() {
    if (oddDiameter) {
        squareAt([0, 0], "lightblue");
    } else {
        squareAt([0.5, 0.5], "lightblue");
        squareAt([0.5, -0.5], "lightblue");
        squareAt([-0.5, -0.5], "lightblue");
        squareAt([-0.5, 0.5], "lightblue");
    }
}

function drawGridCircle(circleArray) {
    drawGridArc(circleArray, 0, 360);
}

function drawGridArc(circleArray) {
    //, startDegree, endDegree) {
    // startDegree = startDegree || 0;
    // endDegree = endDegree || 360;
    // let startPoint = [];
    // let endPoint = [];

    if (circleArray) {
        for (let i = 0; i < circleArray.length; i++) {
            squareAt(circleArray[i]);
        }
    }
}

function squareAt(p_original, color) {
    color = color || "black";

    // Don't modify the contents of the incoming original, which is a reference to the point object.
    let p = [p_original[pd.x],p_original[pd.y]];

    let sizeAdjust = gridSize / 2;
    p[pd.x] *= gridSize;
    p[pd.y] *= -gridSize;

    theContext.strokeStyle = color;
    theContext.beginPath();
    theContext.moveTo(p[pd.x] - sizeAdjust, p[pd.y] - sizeAdjust);
    theContext.lineTo(p[pd.x] - sizeAdjust, p[pd.y] + sizeAdjust);
    theContext.lineTo(p[pd.x] + sizeAdjust, p[pd.y] + sizeAdjust);
    theContext.lineTo(p[pd.x] + sizeAdjust, p[pd.y] - sizeAdjust);
    theContext.lineTo(p[pd.x] - sizeAdjust, p[pd.y] - sizeAdjust);
    theContext.stroke();
}

function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2[pd.x] - p1[pd.x], 2) + Math.pow(p2[pd.y] - p1[pd.y], 2));
}


function getAngle(c, p) {
    let nx = p[pd.x] - c[pd.x];
    let ny = p[pd.y] - c[pd.y];
    let angle = Math.atan2(nx, ny) / Math.PI * 180;
    if (angle < 0) angle += 360;
    return angle;
}

function rotatePoint(c, p, angle) {
    let radians = (Math.PI / 180) * angle;
    let cos = Math.cos(radians);
    let sin = Math.sin(radians);
    return [
        (cos * (p[pd.x] - c[pd.x])) + (sin * (p[pd.y] - c[pd.y])) + c[pd.x],
        (cos * (p[pd.y] - c[pd.y])) - (sin * (p[pd.x] - c[pd.x])) + c[pd.y]
    ];
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

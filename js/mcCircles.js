// To DO:
// - Area inside done. Just need to subtract from one to get area outside.
//     Then produce inside and outside quality scores.

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
let oddDiameter;
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
    oddDiameter = true;
    gridOffset = [0, 0];
    if (Math.round(diameter) % 2 === 0) {
        oddDiameter = false;
        gridOffset = [0.5, 0.5];
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

    circleArray = transposeEighth(circleArray);
    circleArray = mirror(circleArray, "Y");
    circleArray = mirror(circleArray, "X");
    return circleArray;
}

function mirror(arr, doXYO) {
    // doXYO is mirror across X, Y, or Origin
    let last = arr.length-1;
    if (!oddDiameter) {
        for (let i = last; i >= 0; i--) {
            arr[last+(last-i)+1] = mirrorPoint(arr[i], doXYO);
        }
    } else {
        // Kluge alert: Ugly, but works. Be careful messing with this
        if(doXYO === "Y") arr[2*last] = mirrorPoint(arr[0], doXYO); // needed 1/4 of the time. Harmless the other 3.
        let j = 1;
        for (let i = last-1; i > 0; i--) {
            arr[last+j] = mirrorPoint(arr[i], doXYO);
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
            temp[0] = -temp[0];
            break;
        case "Y":
            temp[1] = -temp[1];
            break;
        case "O":
            temp = mirrorPoint(mirrorPoint(temp, "X"), "Y");
    }
    // Update the angle. It is the only data that is different based on mirroring.
    temp[3] = getAngle([0,0], temp);
    return temp;
}

function transposeEighth(arr) {
    // Transpose the 1/8th to make a 1/4.
    // Keep all points in clockwise-order to allow easy cutting of arc-segments from the array.
    let last = arr.length - 1;
    for (let i = 0; i <= last; i++) {
        arr[last + i + 1] =
            [arr[last - i][1], arr[last - i][0],
             arr[last - i][2],
             getAngle([0,0], [arr[last - i][1], arr[last - i][0]]), // updated angle
             arr[last - i][4]];
    }

    // If our last element was at the 45, clean up the extra copy.
    if(arr[last][0] === arr[last][1]) { arr.splice(last, 1); }
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
    if(doArea) {
        let insideArea = getAreaInsideCircle(p);
        return [p[0], p[1], distance, angle, insideArea];
    }
    return [p[0], p[1], distance, angle];
}

function getAreaInsideCircle(p) {
    // As written, requires:
    //   - Point is at angle > 0 and <= 45.
    //   - The point data format of this program... Needs rewrite to work elsewhere.
    let Area = 0;
    let p1a = addPointMetadata([p[0] - 0.5, p[1] - 0.5], false);
    let p2a = addPointMetadata([p[0] + 0.5, p[1] - 0.5], false);
    let p1b = addPointMetadata([p1a[0], getTopCircleIntercept(p1a, radius, false)], false);
    let p2b = addPointMetadata([p2a[0], getTopCircleIntercept(p2a, radius, false)], false);

    if (p2a[2] < 0) {
        // We know dist p1-p2 is 1. And, p2a-p2b is shorter than p1a-p1b. So area of rect
        //   is just p2a[1] - p2b[1]
        Area += Math.abs(p2a[1] - p2b[1]);
    } else {
        // Make p2b the horizontal intercept with the circle.
        p2b = addPointMetadata([getTopCircleIntercept(p2a, radius, true), p2a[1]], false);
    }

    Area += Math.abs((p2b[0] - p1b[0]) * (p1b[1] - p2b[1]) / 2);

    // Ideally, add the area under the arc of the circle from p1b to p2b. But this is likely
    //  near zero, so run as is for now.
    return Area;
}

function getTopCircleIntercept(p, r, returnX) {
    if (returnX) {
        return Math.sqrt(Math.pow(r,2) - Math.pow(p[1],2));
    } else {
        return Math.sqrt(Math.pow(r,2) - Math.pow(p[0],2));
    }
}

function getCircleHTML(circleArray) {
    // let longest = lengthLongestNumber(circleArray);
    let html = "<pre>";
    for (let i = 0; i < circleArray.length; i++) {
        html += ("" + i).padStart(3, "0") + ":" +
            "  x: " + padNumber(circleArray[i][0], 1, 2) +
            "  y: " + padNumber(circleArray[i][1], 1, 2) +
            "  d: " + padNumber(circleArray[i][2], 2) +
            " an: " + padNumber(circleArray[i][3], 2, 4) +
            " ar: " + padNumber(circleArray[i][4], 4, 1) +
            "<br />";


        // html += "setblock " +
        //     formatCoordinate(circleArray[i][0], longest) +
        //     " ~-1 " +
        //     formatCoordinate(circleArray[i][1], longest) +
        //     " minecraft:stone<br />";
    }
    html += "<br /></pre>";
    return html;
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
    drawGrid(theContext, gridSize, gridExtent, true, oddDiameter);
    drawGridCircle(circleArray);

    drawTargetCircle(); //   ???
    drawCenterSquare();
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

function drawGrid(theContext, gridSize, gridExtent, drawCenterPoint, hasCenterSquare) {
    gridSize = gridSize || 20;

    let maxExtent = theContext.width;
    if(maxExtent < theContext.height) { maxExtent = theContext.height * 0.9 }
    gridExtent = gridExtent || maxExtent;

    if(drawCenterPoint) { theContext.fillRect(-1, -1, 2, 2); }

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
    drawGridArc(circleArray, 0, 360)
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


function padNumber(n, digits, zeroes) {
    zeroes = zeroes || 2;
    let lead = "";
    if (n >= 0) {
        lead = " ";
    }
    return lead + n.toFixed(digits).padStart(zeroes,"0");
}

function roundTo(n, precision) {
    // precision is how precise the result will be. for rounding to the nearest 10, enter 10.
    //   To the nearest .001, enter .001. Can also enter arbitrary intervals such as 3.
    precision = precision || 1;
    if (n < 0) precision *= -1;
    return n + precision / 2 - ((n + precision / 2) % precision);
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

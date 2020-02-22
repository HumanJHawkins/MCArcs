let theCanvas;
let theContext;
let windowHeight;
let windowWidth;
let resultArray;
let radius;

function newInstance(){
    radius = document.getElementById("radius").value;
    // alert(getDistance(0,0,0,6));
    getFirstEighth(radius);
    topEighthToQuarter();
    quarterToHalf();
    halfToFull();
    handleDisplaySize();
}

function handleDisplaySize() {
    // Window dimensions in pixels. Although we use view width for almost everything, most decisions about layout are
    //   best made based on actual pixel count, or aspect ratio.
    windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    handleDisplayRefresh();
}

function handleDisplayRefresh() {
    // Create canvas in new divs before continuing
    theCanvas = document.getElementById("arcCanvas");
    theContext = theCanvas.getContext("2d");
    theCanvas.width = 1000;
    theCanvas.height = 1000;
    theCanvas.style.background = "lightblue";
    draw();
}

function draw() {
    theContext.restore();
    theContext.clearRect(0, 0, theCanvas.width, theCanvas.height);
    theContext.translate(theCanvas.width/2, theCanvas.height/2);
    theContext.lineWidth = "1";

    if(resultArray) {
        for(let i = 0; i < resultArray.length; i++) {
            squareAt(resultArray[i]);
        }

        squareAt([0,0]);
    }

    // Light circle line
    theContext.strokeStyle = "gray";
    theContext.beginPath();
    theContext.arc(0, 0, radius*20, 0, 2 * Math.PI);
    theContext.stroke();
}

function squareAt(point) {
    let multiplier = 20;
    let boxAdjust = multiplier/2;
    let x = point[0] * multiplier;
    let y = point[1] * -multiplier;

    theContext.beginPath();
    theContext.moveTo(x-boxAdjust, y-boxAdjust);
    theContext.lineTo(x-boxAdjust, y+boxAdjust);
    theContext.lineTo(x+boxAdjust, y+boxAdjust);
    theContext.lineTo(x+boxAdjust, y-boxAdjust);
    theContext.lineTo(x-boxAdjust, y-boxAdjust);
    theContext.stroke();
}

function getFirstEighth(radius){
    let htmlOutput = "";
    let curX = 0;
    let curY = radius;
    let startPoint = [curX, curY];
    let endPoint = rotatePointInt(0,0,startPoint[0],startPoint[1],45);

    resultArray = [startPoint];
    resultArray[endPoint[0]] = endPoint;

    while(curX < endPoint[0]){
        let deltaYMinusZero = Math.abs(radius - getDistance(0,0, curX, curY));
        let deltaYMinusOne  = Math.abs(radius - getDistance(0,0, curX,curY - 1));

        htmlOutput += "<p>X: " + curX + "  Y: " + curY +
            "</p><p><dd>Delta Radius at Y0: " +
               parseFloat(Math.abs(radius - getDistance(0,0, curX, curY))).toFixed(4) +
            "</p><p>Delta Radius at Y1: " +
               parseFloat(Math.abs(radius - getDistance(0,0, curX,curY - 1))).toFixed(4) + "</dd></p>";

        // if one lower than Y is closer to the radius, make that the current Y
        if(deltaYMinusOne < deltaYMinusZero){
            curY--;
        }

        resultArray[curX] = [curX, curY];
        curX++;
    }

    // Clean up blocky 1/8th corner.
    let lastElement = resultArray.length-1;
    if(resultArray[lastElement][1] === resultArray[lastElement-1][1]) {
        resultArray.pop();
    } else if(resultArray[lastElement-1][1] - resultArray[lastElement][1] === 2){
        resultArray[lastElement][1]++;
    }

    document.getElementById("data").innerHTML = htmlOutput;
}

// Based on https://stackoverflow.com/questions/17410809/how-to-calculate-rotation-in-2d-in-javascript
function rotatePointInt(cx, cy, x, y, angle) {
    let radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return [Math.round(nx), Math.round(ny)];
}

function getDistance(pointAx, pointAy, pointBx, pointBy) {
    return Math.sqrt(
        Math.pow(pointBx - pointAx,2) + Math.pow(pointBy - pointAy,2)
    );
}

function topEighthToQuarter() {
    let appendArray = [];
    if(resultArray) {
        for(let i = resultArray.length-1; i >= 0; i--) {
            appendArray[i] = [resultArray[i][1], resultArray[i][0]];
        }
        resultArray = resultArray.concat(appendArray);
    }
}

function quarterToHalf() {
    let appendArray = [];
    if(resultArray) {
        for(let i = 0; i < resultArray.length; i++) {
            appendArray[i] = [resultArray[i][0], -resultArray[i][1]];
        }
        resultArray = resultArray.concat(appendArray);
    }
}

function halfToFull() {
    let appendArray = [];
    if(resultArray) {
        for(let i = 0; i < resultArray.length; i++) {
            appendArray[i] = [-resultArray[i][0], resultArray[i][1]];
        }
        resultArray = resultArray.concat(appendArray);
    }
}

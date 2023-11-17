/*const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");


function addMessage(message, isUser = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = isUser ? "user-message" : "bot-message";
    messageDiv.innerText = message;

    if (!isUser) {
        // If it's not a user message (i.e., a bot message), add a space before it
        const spaceDiv = document.createElement("div");
        spaceDiv.className = "message-space";
        chatBox.appendChild(spaceDiv);
    }


    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

sendButton.addEventListener("click", handleUserInput);
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        handleUserInput();
    }
});*/

const fs = require("fs");


function loadStationData(filePath) {
    try {
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading station data:", error);
        return null;
    }
}

function loadStationData(filePath) {
    try {
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading station data:", error);
        return null;
    }
}

function findTrainRouteWithTransfers(graph, originName, destinationName) {
    const stations = graph.stations;
    const edges = graph.edges;

    const adjacencyList = new Map();
    stations.forEach(station => {
        adjacencyList.set(station.id, []);
    });

    edges.forEach(edge => {
        adjacencyList.get(edge.source).push({ id: edge.target, time: edge.transitTime, distance: edge.distance, type: edge.type });
        adjacencyList.get(edge.target).push({ id: edge.source, time: edge.transitTime, distance: edge.distance, type: edge.type });
    });

    const transferStations = ["BL1"];

    const visited = new Set();
    const queue = [
        [stations.find(station => station.name === originName).id, [stations.find(station => station.name === originName).id], 0, 0, {}]
    ];

    const routes = [];

    while (queue.length > 0) {
        const [currentStationId, routeSoFar, totalTime, totalDistance, typeCount] = queue.shift();

        if (currentStationId === stations.find(station => station.name === destinationName).id) {
            routes.push({ route: routeSoFar, time: totalTime, distance: totalDistance, typeCount });
            continue; // Skip exploring neighbors if the destination is reached
        }

        visited.add(currentStationId);
        const neighbors = adjacencyList.get(currentStationId);

        for (const neighbor of neighbors) {
            if (!visited.has(neighbor.id) && !routeSoFar.includes(neighbor.id)) {
                const newRouteSoFar = routeSoFar.concat(neighbor.id);
                const newTotalTime = totalTime + neighbor.time;
                const newTotalDistance = totalDistance + neighbor.distance;
                const newTypeCount = { ...typeCount };

                // Count the occurrences of each edge type
                newTypeCount[neighbor.type] = (newTypeCount[neighbor.type] || 0) + 1;

                if (neighbor.id === stations.find(station => station.name === destinationName).id) {
                    queue.push([neighbor.id, newRouteSoFar, newTotalTime, newTotalDistance, newTypeCount]);
                } else if (transferStations.includes(getStationName(neighbor.id, stations))) {
                    queue.push([neighbor.id, newRouteSoFar, newTotalTime, newTotalDistance, newTypeCount]);
                } else {
                    queue.push([neighbor.id, newRouteSoFar, newTotalTime, newTotalDistance, newTypeCount]);
                }
            }
        }
    }

    if (routes.length === 0) {
        return "No route found.";
    }

    // Find the route with the least time
    const minTimeRoute = routes.reduce((minRoute, route) => {
        if (route.time < minRoute.time) {
            return route;
        } else if (route.time === minRoute.time && route.distance < minRoute.distance) {
            return route;
        }
        return minRoute;
    }, routes[0]);

    const routeWithNames = {
        route: minTimeRoute.route.map(stationId => stations.find(station => station.id === stationId).name),
        time: minTimeRoute.time,
        distance: minTimeRoute.distance.toFixed(3),
        typeCount: minTimeRoute.typeCount
    };

    return [routeWithNames];
}

function calculateFareForEdge(edge, typeCount) {
    let fare = 0;

    switch (edge.type) {
        case "BTS":
            const nBTS = (typeCount['BTS'] || 0);
            typeCount['BTS'] = nBTS;
            if (nBTS === 1) fare = 17;
            else if (nBTS === 2) fare = 25;
            else if (nBTS === 3) fare = 28;
            else if (nBTS === 4) fare = 32;
            else if (nBTS === 5) fare = 35;
            else if (nBTS === 6) fare = 40;
            else if (nBTS === 7) fare = 43;
            else if (nBTS >= 8) fare = 47;
            break;

        case "fifteen":
            fare = 15;
            break;

        case "Blue":
            const nBlue = (typeCount['Blue'] || 0);
            typeCount['Blue'] = nBlue;
            if (nBlue === 1) fare = 17;
            else if (nBlue === 2) fare = 19;
            else if (nBlue === 3) fare = 21;
            else if (nBlue === 4) fare = 24;
            else if (nBlue === 5) fare = 26;
            else if (nBlue === 6) fare = 29;
            else if (nBlue === 7) fare = 31;
            else if (nBlue === 8) fare = 33;
            else if (nBlue === 9) fare = 36;
            else if (nBlue === 10) fare = 38;
            else if (nBlue === 11) fare = 41;
            else if (nBlue >= 12) fare = 43;
            break;
        case "Purple":
            const b = (typeCount['Blue'] || 0);
            const n = (typeCount['Purple'] || 0);
            typeCount['Blue'] = b;
            typeCount['Purple'] = n;
            if(b>0){
                if(n == 1){
                    fare += 3;
                }else{
                    fare += 6;
                }
            }else{
                if(n == 1){
                    fare += 17;
                }else if(n >= 2){
                    fare += 20;
                }else{
                    fare+=0;
                }
            }
            break;
        case "Air":
            const nAir = (typeCount['Air'] || 0);
            typeCount['Air'] = nAir;
            if (nAir === 1) fare = 15;
            else if (nAir === 2) fare = 20;
            else if (nAir === 3) fare = 25;
            else if (nAir === 4) fare = 30;
            else if (nAir === 5) fare = 35;
            else if (nAir === 6) fare = 40;
            else if (nAir >= 7) fare = 45;
            break;

        default:
            fare = 0;
            break;
    }

    return fare;
}

function calculateFare(route){

     // If there are more types, please put the fare calculation here
    let fare = 0;

    for (const type in route.typeCount) {
        // If you have a separate function for edge fare calculation,
        // you can call that function here instead of repeating the logic
        switch (type) {
            case "BTS":
            case "fifteen":
            case "Blue":
            case "Air":
            case "Purple":
                fare += calculateFareForEdge({ type, id: null, time: 0, distance: 0 }, route.typeCount);
                break;
            
        

            default:
                fare += 0;
                break;
        }
    }

    return fare;
}

function getRouteInfo(route, stations) {
    const routeInfo = [];
    let currentLine = null;
    let currentRoute = [route[0]]; // Include the starting station

    let totalEdges = 0;

    for (let i = 0; i < route.length - 1; i++) {
        const currentStationInfo = stations.find(station => station.name === route[i]);
        const nextStationInfo = stations.find(station => station.name === route[i + 1]);

        if (currentStationInfo.lines && nextStationInfo.lines) {
            const commonLine = findCommonLine(currentStationInfo.lines, nextStationInfo.lines);
            if (commonLine) {
                if (commonLine !== currentLine) {
                    if (currentRoute.length > 1) {
                        routeInfo.push(`${currentLine}: ${currentRoute.join(" -> ")}`);
                        totalEdges += currentRoute.length - 1;
                    }
                    currentRoute = [route[i]];
                }
                currentLine = commonLine;
            }
            currentRoute.push(route[i + 1]);
        }
    }

    if (currentRoute.length > 1) {
        routeInfo.push(`${currentLine}: ${currentRoute.join(" -> ")}`);
        totalEdges += currentRoute.length - 1;
    }

    return routeInfo.join("\n");
}

function findCommonLine(lines1, lines2) {
    return lines1.find(line1 => lines2.includes(line1));
}

function getStationName(stationId, stations) {
    const station = stations.find(station => station.id === stationId);
    return station ? station.name : "";
}

function enterStation(originName, destinationName) {
    const graph = loadStationData("static/metro.json");

    const routes = findTrainRouteWithTransfers(graph, originName, destinationName);

    if (Array.isArray(routes) && routes.length > 0) {
        let routeInfo = "";

        for (const route of routes) {
            routeInfo += getRouteInfo(route.route, graph.stations) + `\nใช้เวลา    : ${route.time} นาที \nระยะทาง   : ${route.distance} กิโลเมตร\n`;

            // Display the count of each type in the route
            routeInfo += "ราคา      : " + calculateFare(route) + " บาท";
        }

        return "เส้นทางที่ใช้ระยะเวลาน้อยที่สุด: " + "\n" + routeInfo.trim();
    } else {
        return String(routes);
    }
}

console.log(enterStation("พญาไท", "บางอ้อ"));



/*function handleUserInput() {
    const userMessage = userInput.value;
    addMessage(userMessage, true);

    let botResponse;

    if (userMessage.includes("ไป")){
        const userMessageParts = userMessage.split("ไป");
        const originName = userMessageParts[0].trim();
        const destinationName = userMessageParts[1].trim();
        
        if (originName && destinationName){
            const routesWithTime = findTrainRoute(graph, originName, destinationName);

        if (Array.isArray(routesWithTime) && routesWithTime.length > 0) {
            
            
            botResponse = "Temp"
        } else {
            botResponse = "No route found.";
        }
        }
        
    } else {
        botResponse = "I'm sorry, I didn't understand. Please ask a different question.";
    }
    addMessage(botResponse);
    userInput.value = "";
}*/
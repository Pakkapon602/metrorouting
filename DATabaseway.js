const chatBox = document.getElementById("chat-box");
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
});


const fs = require("fs");
const admin = require("firebase-admin");

const serviceAccount = require("C:/Users/Dell/Desktop/metrodata-804c8-firebase-adminsdk-8r6oz-9ff50bc30c.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://metrodata-804c8-default-rtdb.asia-southeast1.firebasedatabase.app"
});


function initMap(){
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 13.754966598462394, lng: 100.5104362570219 },
        zoom: 13,
        mapId: 'b47156cd498d73e0'
    });
    
}


async function loadStationData() {
    try {
        const snapshot = await admin.database().ref('/').once('value');
        const data = snapshot.val();
        const stations = Object.values(data.stations);
        const edges = Object.values(data.edges);

        return { stations, edges };
    } catch (error) {
        console.error("Error loading station data from Firebase:", error);
        return null;
    }
}

function findCheapestRoute(graph, originName, destinationName) {
    if(originName.lines === destinationName.lines){
        return findRoute(graph, originName, destinationName,(route1, route2)=> {
            return route1.time < route2.time
        },true);
    }else{
        return findRoute(graph, originName, destinationName, (route1, route2) => {
            return route1.time < route2.time;
        },false);
    }
    
    }
        
function findLeastTimeRoute(graph, originName, destinationName) {
    return findRoute(graph, originName, destinationName, (route1, route2) => {
        return route1.time < route2.time;
    },false);
}

function findRoute(graph, originName, destinationName, isBetterRoute, sameLine) {
    const stations = graph.stations || []; // Ensure stations is an array

    const edges = graph.edges || [];

    const adjacencyList = new Map();
    stations.forEach(station => {
        adjacencyList.set(station.id, []);
    });

    edges.forEach(edge => {
        if (!adjacencyList.has(edge.source)) {
            adjacencyList.set(edge.source, []);
        }
    
        if (!adjacencyList.has(edge.target)) {
            adjacencyList.set(edge.target, []);
        }
    
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

    //console.log("All routes:", JSON.stringify(routes, null, 2));
    if (routes.length === 0) {
        return "No route found.";
    }

    // Find the best route based on the specified criteria
    const bestRoute = routes.reduce((best, current) => {
        return isBetterRoute(current, best) ? current : best;
    }, routes[0]);

    const routeWithNames = {
        route: bestRoute.route.map(stationId => {
            const station = stations.find(station => station.id === stationId);
            return station ? station.name : 'Unknown Station';
        }),
        time: bestRoute.time,
        distance: bestRoute.distance.toFixed(3),
        typeCount: bestRoute.typeCount,
        fare: calculateFare(bestRoute)
    };
    

    return routeWithNames;
}

function calculateFareForEdge(edge, typeCount) {
    let fare = 0;
    const d = edge.distance;
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
        case "sixteen":
            fare = 16;
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
        case "Red":
            fare = 20;
            break;
        case "Yellow":
            fare=15
            if(d < 1) fare +=3;
            else if(d < 1.250) fare += 3;
            else if(d < 1.5) fare += 4;
            else if (d < 1.6) fare += 5;
            else if(d< 1.640) fare += 6;
            else if(d< 2.1) fare += 7;
            else if(d< 2.7) fare += 8;
            else if(d< 3.1) fare += 9;
            else if(d< 3.5) fare += 10;
            else if(d< 3.9) fare += 11;
            else if(d< 4.3) fare += 12;
            else if(d< 4.7) fare += 13;
            else if(d< 5.0) fare += 14;
            else if(d< 5.3) fare += 15;
            else if(d< 5.6) fare += 16;
            else if(d< 5.9) fare += 17;
            else if(d< 6.2) fare += 18;
            else if(d< 6.5) fare += 19;
            else if(d< 6.8) fare += 20;
            else if(d< 7.1) fare += 21;
            else if(d< 7.4) fare += 22;
            else if(d< 7.7) fare += 23;
            else if(d< 8.0) fare += 24;
            else if(d< 8.3) fare += 25;
            else if(d< 8.6) fare += 26;
            else if(d< 9.2) fare += 27;
            else if(d< 9.8) fare += 28;
            else if(d< 10.5) fare += 29;
            else fare += 30;
            
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
    const distance = route.distance;
    for (const type in route.typeCount) {
        // If you have a separate function for edge fare calculation,
        // you can call that function here instead of repeating the logic
        switch (type) {
            case "BTS":
            case "fifteen":
            case "sixteen":
            case "Blue":
            case "Air":
            case "Purple":
            case "Red":
            
                fare += calculateFareForEdge({ type, id: null, time: 0, distance: 0 }, route.typeCount);
                break;
            case "Yellow":
                fare += calculateFareForEdge({ type, id: null, time: 0, distance }, route.typeCount);

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
    const graph = loadStationData();

    const leastTimeRoute = findLeastTimeRoute(graph, originName, destinationName);
    const cheapestRoute = findCheapestRoute(graph, originName, destinationName);

    if (leastTimeRoute && cheapestRoute) {
        let routeInfo = "";

        routeInfo += `เส้นทางที่ใช้เวลาเดินทางน้อยที่สุด:\n${getRouteInfo(leastTimeRoute.route, graph.stations)}\nใช้เวลา    : ${leastTimeRoute.time} นาที \nระยะทาง   : ${leastTimeRoute.distance} กิโลเมตร\n`;
        routeInfo += `ราคา      : ${calculateFare(leastTimeRoute)} บาท\n\n`;

        routeInfo += `เส้นทางที่ถูกที่สุด:\n${getRouteInfo(cheapestRoute.route, graph.stations)}\nใช้เวลา    : ${cheapestRoute.time} นาที \nระยะทาง   : ${cheapestRoute.distance} กิโลเมตร\n`;
        routeInfo += `ราคา      : ${cheapestRoute.fare} บาท\n\n`;

        return routeInfo.trim();
    } else {
        return "No route found.";
    }
}

// Example usage:
console.log(enterStation("ศรีกรีฑา", "ทิพวัล"));


/*
function handleUserInput() {
    const userMessage = userInput.value;
    addMessage(userMessage, true);

    let botResponse;

    if (userMessage.includes("-")) {
        const userMessageParts = userMessage.split("-");
        const originName = userMessageParts[0].trim();
        const destinationName = userMessageParts[1].trim();
    
        if (originName && destinationName) {
            // Call your function to find the route

            //const routeInfo = enterStation(originName, destinationName);
            const routeInfo = originName +" " + destinationName;
            console.log("Route Info:", routeInfo);  // Add this line for debugging
    
            // Display the route information
            botResponse = routeInfo;
        } else {
            botResponse = "โปรดพิมพ์สถานีต้นทาง-สถานีปลายทาง";
        }
    } else {
        botResponse = "ขออภัย โปรดลองใหม่";
    }
    
    addMessage(botResponse);
    userInput.value = "";
}*/
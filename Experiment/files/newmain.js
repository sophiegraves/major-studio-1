// Load the data
d3.json('datagems.json').then(data => {
    processData(data);
});

function processData(data) {
    let groupedByPrimaryColor = {};
    let totalCarat = 0;

    data.forEach(gem => {
        if (gem.primaryColor !== null) { // Filter out gems with null primaryColor
            totalCarat += gem.numericCarat;
            const primaryColor = gem.primaryColor;
            if (!groupedByPrimaryColor[primaryColor]) {
                groupedByPrimaryColor[primaryColor] = { totalCarat: 0, gems: [] };
            }
            groupedByPrimaryColor[primaryColor].totalCarat += gem.numericCarat;
            groupedByPrimaryColor[primaryColor].gems.push(gem);
        }
    });

    console.log("Grouped by Primary Color:", groupedByPrimaryColor);
    createHexagonalPacking(groupedByPrimaryColor, totalCarat);
}

function createHexagonalPacking(groupedByPrimaryColor, totalCarat) {
    const container = d3.select("#visual-container");

    let width = container.node().clientWidth;
    let height = container.node().clientHeight;

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .style("width", "100%")
        .style("height", "100%");

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    let hexagons = [];

    Object.keys(groupedByPrimaryColor).forEach((primaryColor, i) => {
        const primaryColorGroup = groupedByPrimaryColor[primaryColor];
        hexagons.push({
            x: width / 2,
            y: height / 2,
            radius: Math.sqrt(primaryColorGroup.totalCarat / totalCarat) * 150, // Adjust radius based on percentage
            primaryColor: primaryColor,
            gems: primaryColorGroup.gems
        });
    });

    let hexRadius = calculateHexRadius(hexagons, width, height, 1.5); // Pass the scale factor here

    const hexbin = d3.hexbin()
        .radius(hexRadius)
        .extent([[0, 0], [width, height]]);

    // Create a force simulation to avoid overlap and cluster towards the middle
    let simulation = d3.forceSimulation(hexagons)
        .force("x", d3.forceX(width / 2).strength(0.2))
        .force("y", d3.forceY(height / 2).strength(0.2))
        .force("collide", d3.forceCollide(d => d.radius + 3))
        .force("boundary", forceBoundary(0, 0, width, height))
        .on("tick", ticked);

    function ticked() {
        const hexagonGroup = svg.selectAll(".hexagon-group")
            .data(hexagons)
            .join("g")
            .attr("class", "hexagon-group")
            .attr("transform", d => `translate(${d.x},${d.y})`);

        hexagonGroup.append("path")
            .attr("class", "hexagon")
            .attr("d", d => hexbin.hexagon(d.radius))
            .attr("fill", d => colorScale(d.primaryColor))
            .attr("stroke", "#fff")
            .on("click", function (event, d) {
                showGroupDetails(d.gems, d.primaryColor, totalCarat);
            });

        hexagonGroup.append("text")
            .attr("class", "hexagon-label")
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .text(d => d.primaryColor.toUpperCase());
    }

    console.log("Hexagons:", hexagons);

    // Add event listener for window resize
    window.addEventListener('resize', () => {
        width = container.node().clientWidth;
        height = container.node().clientHeight;
        svg.attr("viewBox", `0 0 ${width} ${height}`)
            .style("width", "100%")
            .style("height", "100%");

        hexRadius = calculateHexRadius(hexagons, width, height, 1.5); // Pass the scale factor here
        hexbin.radius(hexRadius).extent([[0, 0], [width, height]]);

        simulation = d3.forceSimulation(hexagons)
            .force("x", d3.forceX(width / 2).strength(0.1))
            .force("y", d3.forceY(height / 2).strength(0.1))
            .force("collide", d3.forceCollide(d => d.radius + 2))
            .force("boundary", forceBoundary(0, 0, width, height))
            .on("tick", ticked);

        simulation.alpha(1).restart();
    });
}

function calculateHexRadius(hexagons, width, height) {
    const numHexagons = hexagons.length;
    const area = width * height;
    const hexArea = area / numHexagons;
    const hexRadius = Math.sqrt(hexArea / (3 * Math.sqrt(3) / 2));
    return hexRadius;
}

function forceBoundary(x0, y0, x1, y1) {
    let nodes;
    function force(alpha) {
        for (const node of nodes) {
            if (node.x - node.radius < x0) node.x = x0 + node.radius;
            if (node.x + node.radius > x1) node.x = x1 - node.radius;
            if (node.y - node.radius < y0) node.y = y0 + node.radius;
            if (node.y + node.radius > y1) node.y = y1 - node.radius;
        }
    }
    force.initialize = _ => nodes = _;
    return force;
}

function showGroupDetails(gems, primaryColor, totalCarat) {
    if (!gems || !Array.isArray(gems)) {
        console.error("Invalid gems array:", gems);
        return;
    }

    const container = d3.select("#visual-container");
    let width = container.node().clientWidth;
    let height = container.node().clientHeight;

    const svg = container.select("svg");

    svg.selectAll("*").remove(); // Clear the existing SVG content

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Group gems by colorSubcat within the selected primaryColor group
    let groupedByColorSubcat = {};
    let totalColorSubcatCarat = 0;

    gems.forEach(gem => {
        totalColorSubcatCarat += gem.numericCarat;
        if (gem.colorSubcat) {
            const colorSubcat = gem.colorSubcat;
            if (!groupedByColorSubcat[colorSubcat]) {
                groupedByColorSubcat[colorSubcat] = { totalCarat: 0, gems: [] };
            }
            groupedByColorSubcat[colorSubcat].totalCarat += gem.numericCarat;
            groupedByColorSubcat[colorSubcat].gems.push(gem);
        } else {
            console.warn("colorSubcat is not defined for gem:", gem);
        }
    });

    let hexagons = [];

    Object.keys(groupedByColorSubcat).forEach((colorSubcat, i) => {
        const colorSubcatGroup = groupedByColorSubcat[colorSubcat];
        hexagons.push({
            x: width / 2,
            y: height / 2,
            radius: Math.sqrt(colorSubcatGroup.totalCarat / totalColorSubcatCarat) * 100, // Adjust radius based on percentage
            primaryColor: primaryColor,
            colorSubcat: colorSubcat,
            gems: colorSubcatGroup.gems
        });
    });

    let hexRadius = calculateHexRadius(hexagons, width, height);

    const hexbin = d3.hexbin()
        .radius(hexRadius)
        .extent([[0, 0], [width, height]]);

    // Create a force simulation to avoid overlap and cluster towards the middle
    let simulation = d3.forceSimulation(hexagons)
        .force("x", d3.forceX(width / 2).strength(0.1))
        .force("y", d3.forceY(height / 2).strength(0.1))
        .force("collide", d3.forceCollide(d => d.radius + 2))
        .on("tick", ticked);

    function ticked() {
        const hexagonGroup = svg.selectAll(".hexagon-group")
            .data(hexagons)
            .join("g")
            .attr("class", "hexagon-group")
            .attr("transform", d => `translate(${d.x},${d.y})`);

        hexagonGroup.append("path")
            .attr("class", "hexagon")
            .attr("d", d => hexbin.hexagon(d.radius))
            .attr("fill", d => colorScale(d.colorSubcat))
            .attr("stroke", "#fff");

        hexagonGroup.append("text")
            .attr("class", "hexagon-label")
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .text(d => `${d.colorSubcat.toUpperCase()}\n${d.primaryColor.toUpperCase()}`);
    }

    console.log("Group Details Hexagons:", hexagons);

    // Add event listener for window resize
    window.addEventListener('resize', () => {
        width = container.node().clientWidth;
        height = container.node().clientHeight;
        svg.attr("viewBox", `0 0 ${width} ${height}`)
            .style("width", "100%")
            .style("height", "100%");

        hexRadius = calculateHexRadius(hexagons, width, height);
        hexbin.radius(hexRadius).extent([[0, 0], [width, height]]);

        simulation = d3.forceSimulation(hexagons)
            .force("x", d3.forceX(width / 2).strength(0.1))
            .force("y", d3.forceY(height / 2).strength(0.1))
            .force("collide", d3.forceCollide(d => d.radius + 2))
            .on("tick", ticked);

        simulation.alpha(1).restart();
    });
}

function calculateHexRadius(hexagons, width, height, scaleFactor = 1.5) {
    const numHexagons = hexagons.length;
    const area = width * height;
    const hexArea = area / numHexagons;
    const hexRadius = Math.sqrt(hexArea / (3 * Math.sqrt(3) / 2)) * scaleFactor;
    return hexRadius;
}
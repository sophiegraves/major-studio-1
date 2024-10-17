let gems;
let allGems = [];

// Load the data
d3.json('Data/revised2.json').then(data => {
    gems = data;
    console.log("Loaded Data:", gems); // Debugging log
    const Columns = Object.keys(data[0]);
    analyzeData();
    sortAndGroupGems(); // Perform sorting and grouping after data is analyzed
    //displayData();
});

// Analyze the data
function analyzeData() {
    // Go through the list of gems
    gems.forEach(n => {
        const title = n.title;
        const mineraltype = n.type;
        const caratInt = n.numericCarat;
        const fullColor = n.color;
        const link = n.link;
        const id = n.id;
        const firstColor = mapHue(n.hues[0]);
        const secondColor = mapHue(n.hues[1]);
        const combinedHues = [firstColor, secondColor].filter(Boolean).sort().join(" ");
        let match = false;

        // See if their location already exists in the array
        allGems.forEach(p => {
            if (p.title == id) {
                p.count++;
                match = true;
            }
        });

        // If not, create a new entry for that place name
        if (!match) {
            allGems.push({
                title: title,
                mineraltype: mineraltype,
                caratInt: caratInt,
                fullColor: fullColor,
                firstColor: firstColor,
                secondColor: secondColor,
                combinedHues: combinedHues,
                id: id,
                link: link,
                //imgLink: imgLink,
            });
        }
    });
    console.log("Analyzed Data:", allGems); // Debugging log
}

// Function to map specific hues to desired categories
function mapHue(hue) {
    const hueMapping = {
        "violet": "purple",
        "turquoise": "blue",
        "golden": "yellow"
    };
    return hueMapping[hue] || hue;
}

// Sort and group gems by firstColor and secondColor
function sortAndGroupGems() {
    // Create a new array to hold gems categorized by both hues
    let categorizedGems = [];

    // Categorize each gem under both firstColor and secondColor
    allGems.forEach(gem => {
        if (gem.firstColor) {
            categorizedGems.push({ ...gem, colorCategory: gem.firstColor });
        }
        if (gem.secondColor) {
            categorizedGems.push({ ...gem, colorCategory: gem.secondColor });
        }
    });

    console.log("Categorized Gems:", categorizedGems); // Debugging log

    // Sort categorizedGems by colorCategory
    categorizedGems.sort((a, b) => {
        const colorA = a.colorCategory ? a.colorCategory.toLowerCase().trim() : "";
        const colorB = b.colorCategory ? a.colorCategory.toLowerCase().trim() : "";

        if (colorA < colorB) return -1;
        if (colorA > colorB) return 1;
        return 0;
    });

    // Group gems by colorCategory
    const groupedByColor = categorizedGems.reduce((acc, gem) => {
        const colorCategory = gem.colorCategory ? gem.colorCategory.toLowerCase().trim() : "";

        if (!acc[colorCategory]) {
            acc[colorCategory] = { color: colorCategory, totalCarat: 0, gems: [] };
        }
        acc[colorCategory].totalCarat += gem.caratInt;
        acc[colorCategory].gems.push(gem);

        return acc;
    }, {});

    console.log("Grouped by Color Category:", groupedByColor); // Debugging log

    // Prepare data for D3.js
    const data = Object.values(groupedByColor).map(colorGroup => {
        return {
            color: colorGroup.color,
            totalCarat: colorGroup.totalCarat,
            values: colorGroup.gems
        };
    });

    console.log("Data for D3.js:", data); // Debugging log

    // Set up the SVG canvas dimensions
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    // Create the SVG canvas
    const svg = d3.select("#visual-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create a treemap layout
    const treemap = d3.treemap()
        .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
        .padding(1);

    // Create a hierarchy from the data
    const root = d3.hierarchy({ values: data }, d => d.values)
        .sum(d => d.totalCarat)
        .sort((a, b) => b.value - a.value);

    // Apply the treemap layout to the hierarchy
    treemap(root);

    console.log("Treemap Root:", root); // Debugging log

    // Create the rectangles for the treemap
    const nodes = svg.selectAll("g")
        .data(root.leaves())
        .enter().append("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    nodes.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => d.data.color) // Ensure the color is taken from the data
        .attr("stroke", "#fff");

    nodes.append("text")
        .attr("x", 3)
        .attr("y", 13)
        .text(d => `${d.data.color}: ${d.value.toFixed(2)}`)
        .attr("font-size", "10px")
        .attr("fill", "#000");
}
/*

let gems;
let allGems = [];

// Load the data
d3.json('Data/datagems.json').then(data => {
    gems = data;
    const Columns = Object.keys(data[0]);
    analyzeData();
    sortAndGroupGems(); // Perform sorting and grouping after data is analyzed
});

// Analyze the data
function analyzeData() {
    // Go through the list of gems
    gems.forEach(n => {
        const title = n.title;
        const mineraltype = n.type;
        const caratInt = n.numericCarat;
        const fullColor = n.color;
        const link = n.link;
        const id = n.id;
        const firstColor = mapHue(n.hues[0]);
        const secondColor = mapHue(n.hues[1]);
        const combinedHues = [firstColor, secondColor].filter(Boolean).sort().join(" ");
        let match = false;

        // See if their location already exists in the array
        allGems.forEach(p => {
            if (p.title == id) {
                p.count++;
                match = true;
            }
        });

        // If not, create a new entry for that place name
        if (!match) {
            allGems.push({
                title: title,
                mineraltype: mineraltype,
                caratInt: caratInt,
                fullColor: fullColor,
                firstColor: firstColor,
                secondColor: secondColor,
                combinedHues: combinedHues,
                id: id,
                link: link,
                //imgLink: imgLink,
            });
        }
    });
}

// Function to map specific hues to desired categories
function mapHue(hue) {
    const hueMapping = {
        "violet": "purple",
        "turquoise": "blue",
        "golden": "yellow"
    };
    return hueMapping[hue] || hue;
}

// Sort and group gems by firstColor
function sortAndGroupGems() {
    // Sort allGems by firstColor
    allGems.sort((a, b) => {
        const colorA = a.firstColor ? a.firstColor.toLowerCase().trim() : "";
        const colorB = b.firstColor ? b.firstColor.toLowerCase().trim() : "";

        if (colorA < colorB) return -1;
        if (colorA > colorB) return 1;
        return 0;
    });

    // Group gems by firstColor
    const groupedByColor = allGems.reduce((acc, gem) => {
        const firstColor = gem.firstColor ? gem.firstColor.toLowerCase().trim() : "";

        if (!acc[firstColor]) {
            acc[firstColor] = { color: firstColor, totalCarat: 0, gems: [] };
        }
        acc[firstColor].totalCarat += gem.caratInt;
        acc[firstColor].gems.push(gem);

        return acc;
    }, {});

    // Log the grouped data to the console
    console.log("Grouped by First Color:", groupedByColor);

    // Prepare data for D3.js
    const data = Object.values(groupedByColor).map(colorGroup => {
        return {
            color: colorGroup.color,
            totalCarat: colorGroup.totalCarat,
            values: colorGroup.gems
        };
    });

    // Set up the SVG canvas dimensions
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    // Create the SVG canvas
    const svg = d3.select("#visual-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create a treemap layout
    const treemap = d3.treemap()
        .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
        .padding(1);

    // Create a hierarchy from the data
    const root = d3.hierarchy({ values: data }, d => d.values)
        .sum(d => d.totalCarat)
        .sort((a, b) => b.value - a.value);

    // Apply the treemap layout to the hierarchy
    treemap(root);

    // Create the rectangles for the treemap
    const nodes = svg.selectAll("g")
        .data(root.leaves())
        .enter().append("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    nodes.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => d.data.color) // Ensure the color is taken from the data
        .attr("stroke", "#fff");

    nodes.append("text")
        .attr("x", 3)
        .attr("y", 13)
        .text(d => `${d.data.color}: ${d.value.toFixed(2)}`)
        .attr("font-size", "10px")
        .attr("fill", "#000");
}*/
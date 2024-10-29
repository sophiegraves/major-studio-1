// Define the wrapText function
function wrapText(text, maxWidth) {
    text.each(function () {
        const text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 3).attr("y", y).attr("dy", dy + "em");

        let word,
            line = [],
            lineNumber = 0;

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > maxWidth) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 3).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}



// Initialize rectanglesVisible variable
let rectanglesVisible = true;
let isSubTreemapVisible = false; // Flag to track if sub-treemap is visible
let currentPrimaryColor = null; // Store the current primary color for sub-treemap
let currentData = null; // Store the current data for sub-treemap

// Define the calculateFontSize function
function calculateFontSize(key, width, height) {
    // Example logic to calculate font size based on rectangle dimensions
    const area = width * height;
    const baseFontSize = 12; // Base font size
    const scaleFactor = Math.sqrt(area) / 50; // Scale factor based on area
    return Math.max(baseFontSize, baseFontSize * scaleFactor);
}

// Define specific colors for specific groups
const colorMapping = {
    "yellow": "#fff700",
    "blue": "#004EE0",
    "green": "#228b22",
    "orange": "#ff7700",
    "purple": "#a200bf",
    "pink": "#fb00d1",
    "red": "#ee0000",
    "black": "#000000",
    "brown": "#874400",
    "white": "#ffffff",
    "gray": "#7e7e7e",
};

// Function to determine if a color is dark
function isColorDark(color) {
    const rgb = d3.color(color).rgb();
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness < 128;
}

d3.select("#info-container").style("width", "500px");

d3.json('datagems.json').then(data => {
    // Filter out data points with null primaryColor
    const filteredData = data.filter(d => d.primaryColor !== null);

    // Define the specific gem types to include in the dropdown
    const gemTypes = ["All", "diamond", "sapphire", "quartz", "topaz", "pearl", "beryl"];

    // Select the treemap div
    const container = d3.select("#treemap");


    // Add header and description text
    const header = container.append("h1")
        .text("Carats of Color")
        .style("text-align", "left")
        .style("margin-top", "20px");


    // Create a dropdown menu
    const dropdown = container.append("select")
        .attr("id", "gem-type-dropdown")
        .on("change", function () {
            const selectedType = this.value;
            if (isSubTreemapVisible) {
                drawSubTreemap(currentPrimaryColor, currentData, selectedType === "All" ? null : selectedType);
            } else {
                drawTreemap(selectedType === "All" ? null : selectedType);
            }
        });
    // Add options to the dropdown
    dropdown.selectAll("option")
        .data(gemTypes)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d.charAt(0).toUpperCase() + d.slice(1)); // Capitalize the first letter

    // Add back button
    const backButton = container.append("button")
        .attr("id", "back-button")
        .text("Back")
        .style("display", "none")
        .on("click", function () {
            isSubTreemapVisible = false;
            const selectedType = dropdown.property("value");
            drawTreemap(selectedType === "All" ? null : selectedType);
            backButton.style("display", "none");
        });

    // Initial call to draw the treemap with all data
    drawTreemap();

    // Add event listener for window resize
    window.addEventListener('resize', () => {
        const selectedType = dropdown.property("value");
        if (isSubTreemapVisible) {
            drawSubTreemap(currentPrimaryColor, currentData, selectedType === "All" ? null : selectedType);
        } else {
            drawTreemap(selectedType === "All" ? null : selectedType);
        }
    });

    function drawTreemap(filterType = null) {
        const width = window.innerWidth * 0.75;
        const height = window.innerHeight * 0.70;

        // Clear any existing SVG elements
        container.selectAll("svg").remove();

        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`);

        // Define the gradient
        const defs = svg.append("defs");
        const clearGradient = defs.append("linearGradient")
            .attr("id", "clear-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%");
        clearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#ffffff");
        clearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#6fb0c9"); // Slightly different shade

        // Define the gradient for the shiny effect
        const shinyGradient = defs.append("linearGradient")
            .attr("id", "shiny-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%");
        shinyGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "rgba(255, 255, 255, 0.5)")
            .attr("stop-opacity", 0.5);
        shinyGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "rgba(255, 255, 255, 0)")
            .attr("stop-opacity", 0);

        // Filter the data based on the selected gem type
        const filteredTypeData = filterType ? filteredData.filter(d => d.title.toLowerCase().includes(filterType.toLowerCase())) : filteredData;

        const groupedData = d3.rollup(
            filteredTypeData,
            v => ({
                totalCarat: d3.sum(v, d => d.numericCarat),
                count: v.length,
                largestGem: v.reduce((max, gem) => gem.numericCarat > max.numericCarat ? gem : max, v[0]), // Find the largest gem
                data: v // Store the original data points
            }),
            d => d.primaryColor
        );

        // Convert the grouped data into a hierarchical structure
        const root = d3.hierarchy({ children: Array.from(groupedData, ([key, value]) => ({ key, ...value })) })
            .sum(d => d.totalCarat)
            .sort((a, b) => b.value - a.value);

        const treemap = d3.treemap()
            .size([width, height])
            .padding(10) // Increase the padding between rectangles
            .round(true);

        treemap(root);

        const node = svg.selectAll("g")
            .data(root.leaves())
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        node.append("rect")
            .attr("id", d => d.data.key)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => d.data.key === "clear" ? "url(#clear-gradient)" : (colorMapping[d.data.key] || "#87c9e2")) // Default color if not found in mapping
            .each(function (d) {
                const uniqueColorSubcats = new Set(d.data.data.map(gem => gem.colorSubcat));
                if (uniqueColorSubcats.size > 1) {
                    d3.select(this).on("click", function (event, d) {
                        isSubTreemapVisible = true; // Update the flag
                        currentPrimaryColor = d.data.key; // Store the current primary color
                        currentData = d.data.data; // Store the current data for the sub-treemap
                        svg.selectAll("g").remove();
                        const selectedType = dropdown.property("value");
                        drawSubTreemap(d.data.key, d.data.data, selectedType === "All" ? null : selectedType);
                        backButton.style("display", "block"); // Show the button
                    });
                }
            });

        node.append("text")
            .attr("x", 3)
            .attr("y", function (d) {
                const rectHeight = d.y1 - d.y0;
                const textHeight = this.getBBox().height;
                return Math.min((d.y1 - d.y0) / 2, rectHeight - textHeight - 5); // Ensure text is at least 5 pixels above the bottom
            })
            .attr("dy", ".35em")
            .style("font-size", d => {
                let fontSize = calculateFontSize(d.data.key, d.x1 - d.x0, d.y1 - d.y0);
                return `${Math.min(fontSize, 60)}px`; // Ensure font size does not exceed 40pt
            })
            .style("fill", d => {
                const color = colorMapping[d.data.key] || "#33eedd";
                return isColorDark(color) ? "#ffffff" : "#000000"; // Set text color based on background color
            })
            .text(d => {
                console.log("d.data.key:", d.data.key); // Debugging line
                return d.data.key ? d.data.key.toUpperCase() : "";
            })
            .each(function (d) {
                const text = d3.select(this);
                const rectWidth = (d.x1 - d.x0) * 0.8; // Use 80% of the rectangle's width
                const rectHeight = d.y1 - d.y0;
                let words = text.text().split(/\s+/).reverse();
                let word;
                let line = [];
                let lineNumber = 0;
                const lineHeight = 1.1; // ems
                const y = text.attr("y");
                const dy = parseFloat(text.attr("dy"));
                let tspan = text.text(null).append("tspan").attr("x", 3).attr("y", y).attr("dy", dy + "em");

                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > rectWidth) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", 3).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }

                // Adjust font size if text overflows the rectangle height
                while (text.node().getBBox().height > rectHeight) {
                    let currentFontSize = parseFloat(text.style("font-size"));
                    if (currentFontSize <= 1) break; // Prevent font size from becoming too small
                    text.style("font-size", `${currentFontSize - 1}px`);
                    text.selectAll("tspan").each(function () {
                        d3.select(this).text(function () {
                            return d3.select(this).text();
                        });
                    });
                }

                // Adjust font size if any word is wider than the rectangle width
                text.selectAll("tspan").each(function () {
                    let tspan = d3.select(this);
                    while (tspan.node().getComputedTextLength() > rectWidth) {
                        let currentFontSize = parseFloat(text.style("font-size"));
                        if (currentFontSize <= 1) break; // Prevent font size from becoming too small
                        text.style("font-size", `${currentFontSize - 1}px`);
                        text.selectAll("tspan").each(function () {
                            d3.select(this).text(function () {
                                return d3.select(this).text();
                            });
                        });
                    }
                });

                // Ensure font size does not exceed 40pt
                let finalFontSize = parseFloat(text.style("font-size"));
                if (finalFontSize > 60) {
                    text.style("font-size", "60px");
                }

                // Hide text if font size is below 10pt
                if (finalFontSize < 12) {
                    text.style("visibility", "hidden");
                }
            });

        // Add this function to create a bar chart
        function createBarChart(data, containerId, barColor) {
            const margin = { top: 20, right: 50, bottom: 30, left: 0 };
            const containerWidth = 410; // Fixed width of the container
            const width = containerWidth - margin.left - margin.right;
            const height = 200 - margin.top - margin.bottom;

            // Remove any existing SVG elements
            d3.select(`#${containerId} svg`).remove();

            const svg = d3.select(`#${containerId}`).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const x = d3.scaleBand()
                .range([0, width])
                .padding(0.3); // Adjust padding to fit bars within the container

            const y = d3.scaleLinear()
                .range([height, 0]);

            x.domain(data.map(d => d.type));
            y.domain([0, d3.max(data, d => d.count)]);

            svg.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.type))
                .attr("width", x.bandwidth())
                .attr("y", d => y(d.count))
                .attr("height", d => height - y(d.count))
                .attr("fill", barColor); // Use the passed color



            const xAxis = svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));

            // Add labels to the bars
            svg.selectAll(".label")
                .data(data)
                .enter().append("text")
                .attr("class", "label")
                .attr("x", d => x(d.type) + x.bandwidth() / 2)
                .attr("y", d => y(d.count) - 5)
                .attr("text-anchor", "middle")
                .attr("fill", "white") // Set text color to white
                .text(d => d.count);


            // Set x-axis text to white and split into multiple lines
            xAxis.selectAll("text")
                .attr("fill", "white")
                .each(function () {
                    const text = d3.select(this);
                    let words = text.text().split(/\s+/);
                    if (words.length > 2) {
                        words = words.slice(0, 2); // Keep only the first two words
                    }
                    text.text(null);
                    words.forEach((word, i) => {
                        text.append("tspan")
                            .attr("x", 0)
                            .attr("dy", i === 0 ? 0 : "1.2em")
                            .text(word);
                    });
                });

        }

        node.on("mouseover", function (event, d) {
            const originalColor = colorMapping[d.data.key] || "#87c9e2"; // Default color if not found in mapping
            let highlightColor;

            // Check if the primaryColor is "clear" or "black" and set highlightColor to light gray
            if (d.data.key === "clear" || d.data.key === "black") {
                highlightColor = "lightgray";
            } else {
                const colorObj = d3.color(originalColor);
                if (colorObj) {
                    highlightColor = colorObj.brighter(1.5); // Adjust the brightness factor as needed
                } else {
                    highlightColor = "lightgray"; // Fallback color
                }
            }

            const largestGem = d.data.largestGem;
            d3.select("#info-container").style("border-left-color", originalColor);
            d3.select("#info-content").html(`
                <strong>Number of Gemstones:</strong><br> ${d.data.count}<br><br>
                <strong>Average Weight:</strong><br> ${(d.value / d.data.count).toFixed(2)} ct<br><br>
                <strong style="color: ${highlightColor};">LARGEST GEM IN THE COLLECTION</strong><br>
                <strong>Name/Type:</strong><br> ${largestGem.title}<br><br>
                <strong>Carat:</strong><br>${largestGem.numericCarat} ct<br><br><br>
                <strong style="color: ${highlightColor};">TOP TYPES OF GEMS IN THE COLLECTION</strong><br><br>
            `);
            d3.select("#info-container h2")
                .text(d.data.key.toUpperCase())
                .style("color", highlightColor);

            // Update bar colors on hover
            d3.selectAll(".bar")
                .attr("fill", function (d) {
                    if (d.data.key === "clear") {
                        return "lightblue"; // Set color to light blue for "clear" group
                    } else {
                        return baseColor; // Use the base color for other groups
                    }
                });

            // Determine the text color (white or black) based on the rectangle color
            const color = colorMapping[d.data.key];
            const textColor = getTextColorBasedOnBackground(color);
            d3.select(this).select("text").style("stroke", textColor).style("stroke-width", 2);

            // Create bar chart data
            const barChartData = d.data.data.reduce((acc, gem) => {
                let type = gem.title.toLowerCase();

                // Check if the type contains "(var."
                const varMatch = type.match(/\(var\.\s*([^)]+)\)/);
                if (varMatch) {
                    // Extract the word after "(var." and before ")"
                    type = varMatch[1];
                }

                // Capitalize the type
                type = type.toUpperCase();

                if (!acc[type]) {
                    acc[type] = { type, count: 0 };
                }
                acc[type].count += 1;

                return acc;
            }, {});

            const top5Data = Object.values(barChartData)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Determine bar color
            const barColor = (d.data.key === "clear" || d.data.key === "black") ? "lightblue" : originalColor;

            // Create the bar chart with the determined color
            createBarChart(top5Data, "info-container", barColor);
        })
            .on("mouseout", function () {
                d3.select("#info-container").style("border-left-color", "#ccc");
                d3.select("#info-content").html("Hover over a rectangle to see details.");
                d3.select("#info-container h2")
                    .text("Gemstone Information")
                    .style("color", ""); // Reset the text color;
                d3.select(this).select("text").style("stroke", "none");

                // Remove the bar chart
                d3.select("#info-container svg").remove();
            });
        function getTextColorBasedOnBackground(bgColor) {
            // Function to determine if the text color should be white or black based on the background color
            const color = d3.color(bgColor);
            if (!color) {
                return "black"; // Default to black if color parsing fails
            }
            const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
            return brightness > 125 ? "black" : "white";
        }


    }


    // Define the createBarChart function in the global scope
    function createBarChart(data, containerId, barColor) {
        const margin = { top: 20, right: 50, bottom: 30, left: 0 };
        const containerWidth = 410; // Fixed width of the container
        const width = containerWidth - margin.left - margin.right;
        const height = 200 - margin.top - margin.bottom;

        // Remove any existing SVG elements
        d3.select(`#${containerId} svg`).remove();

        const svg = d3.select(`#${containerId}`).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .range([0, width])
            .padding(0.3); // Adjust padding to fit bars within the container

        const y = d3.scaleLinear()
            .range([height, 0]);

        x.domain(data.map(d => d.type));
        y.domain([0, d3.max(data, d => d.count)]);

        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.type))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.count))
            .attr("height", d => height - y(d.count))
            .attr("fill", barColor); // Use the passed color

        const xAxis = svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Add labels to the bars
        svg.selectAll(".label")
            .data(data)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => x(d.type) + x.bandwidth() / 2)
            .attr("y", d => y(d.count) - 5)
            .attr("text-anchor", "middle")
            .attr("fill", "white") // Set text color to white
            .text(d => d.count);

        // Set x-axis text to white and split into multiple lines
        xAxis.selectAll("text")
            .attr("fill", "white")
            .each(function () {
                const text = d3.select(this);
                let words = text.text().split(/\s+/);
                if (words.length > 2) {
                    words = words.slice(0, 2); // Keep only the first two words
                }
                text.text(null);
                words.forEach((word, i) => {
                    text.append("tspan")
                        .attr("x", 0)
                        .attr("dy", i === 0 ? 0 : "1.2em")
                        .text(word);
                });
            });

        // Add hover event to animate bars
        svg.selectAll(".bar")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(500) // Duration of the animation in milliseconds
                    .attr("y", y(d.count))
                    .attr("height", height - y(d.count));
            })
            .on("mouseout", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200) // Duration of the animation in milliseconds
                    .attr("y", height)
                    .attr("height", 0);
            });
    }

    // Your existing drawSubTreemap function
    function drawSubTreemap(primaryColor, data, filterType = null) {
        const width = window.innerWidth * 0.75;
        const height = window.innerHeight * 0.70;

        // Define specific colors for specific groups
        const colorMapping = {
            "yellow": "#fff700",
            "blue": "#004EE0",
            "green": "#228b22",
            "orange": "#ff7700",
            "purple": "#a200bf",
            "pink": "#fb00d1",
            "red": "#ee0000",
            "black": "#000000",
            "brown": "#874400",
            "white": "#ffffff",
            "gray": "#7e7e7e",
        };
        const colorSubcatMapping = {
            "light": "#ffffff", // light
            "dark": "#000000", // dark
            "light blue": "#BAE8FF", // light blue
            "light yellow": "#FEFF5E", // light yellow
            "light red": "#FF7171", // light red
            "light green": "#98FFA4", // light green
            "light purple": "#D8A9FF", // light purple
            "light pink": "#FFA9F2", // light pink
            "light brown": "#C48322", // light brown
            "light orange": "#FFD18E", // light orange
            "light gray": "#BDBDBD", // light gray
            "medium yellow": "#f1db00",
            "medium blue": "#0064ce",
            "medium green": "#1DB719",
            "medium orange": "#ff7700",
            "medium purple": "#a200bf",
            "medium pink": "#fb00d1",
            "medium red": "#ff0004",
            "medium black": "#000000",
            "medium brown": "#b86100",
            "medium white": "#ffffff",
            "medium gray": "#7e7e7e",
            "dark blue": "#001672",
            "dark green": "#005911",
            "dark red": "#A40000",
            "dark purple": "#7000A4",
            "dark pink": "#A50080",
            "dark brown": "#7A4100",
            "dark orange": "#A45C00",
            "dark gray": "#4C4C4C",
            "dark yellow": "#A4A400",
            "dark brown": "#8C3C00",
            "yellow": "#fff700",
            "blue": "#004EE0",
            "green": "#228b22",
            "orange": "#ff7700",
            "purple": "#a200bf",
            "pink": "#fb00d1",
            "red": "#ee0000",
            "black": "#000000",
            "brown": "#874400",
            "white": "#ffffff",
            "gray": "#7e7e7e",
        };

        // Function to get the color based on primaryColor and colorSubcat
        function getColor(primaryColor, subcat) {
            return colorSubcatMapping[subcat] || colorMapping[primaryColor] || "#000000";
        }

        // Clear any existing SVG elements
        container.selectAll("svg").remove();

        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`);

        // Filter the data based on the primaryColor and selected gem type, and exclude null primaryColor
        const filteredData = data.filter(d =>
            d.primaryColor !== null &&
            d.primaryColor !== undefined &&
            d.primaryColor === primaryColor &&
            d.title !== undefined &&
            (!filterType || d.title.toLowerCase().includes(filterType.toLowerCase()))
        );

        const groupedData = d3.rollup(
            filteredData,
            v => ({
                totalCarat: d3.sum(v, d => d.numericCarat),
                count: v.length,
                largestGem: v.reduce((max, gem) => gem.numericCarat > max.numericCarat ? gem : max, v[0]), // Find the largest gem
                data: v // Store the original data points
            }),
            d => d.colorSubcat
        );

        // Convert the grouped data into an array and sort by totalCarat
        const sortedGroups = Array.from(groupedData, ([key, value]) => ({ key, ...value }))
            .sort((a, b) => b.totalCarat - a.totalCarat)
            .slice(0, 12); // Take the top 12 groups

        // Convert the sorted groups into a hierarchical structure
        const root = d3.hierarchy({ children: sortedGroups })
            .sum(d => d.totalCarat)
            .sort((a, b) => b.value - a.value);

        const treemap = d3.treemap()
            .size([width, height])
            .padding(10) // Increase the padding between rectangles
            .round(true);

        treemap(root);

        const node = svg.selectAll("g")
            .data(root.leaves())
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        node.append("rect")
            .attr("id", d => d.data.key)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => colorMapping[primaryColor]); // Set the fill color to primaryColor

        // Adjust the color based on the subcategory
        node.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => {
                if (colorSubcatMapping[d.data.key] === "medium") {
                    return primaryColor;
                }
                return colorSubcatMapping[d.data.key] || "#000000"; // Use colorSubcat or default to black
            })
            .attr("opacity", d => colorSubcatMapping[d.data.key] ? 0.45 : 0.0);

        node.append("text")
            .attr("x", 3)
            .attr("y", function (d) {
                const rectHeight = d.y1 - d.y0;
                const textHeight = this.getBBox().height;
                return Math.min((d.y1 - d.y0) / 2, rectHeight - textHeight - 5); // Ensure text is at least 5 pixels above the bottom
            })
            .attr("dy", ".35em")
            .style("font-size", d => {
                let fontSize = calculateFontSize(d.data.key, d.x1 - d.x0, d.y1 - d.y0);
                return `${Math.min(fontSize, 60)}px`; // Ensure font size does not exceed 40pt
            })
            .style("fill", d => {
                const color = colorSubcatMapping[d.data.key] || "#33eedd";
                return isColorDark(color) ? "#ffffff" : "#000000"; // Set text color based on background color
            })
            .text(d => {
                console.log("d.data.key:", d.data.key); // Debugging line
                return d.data.key ? d.data.key.toUpperCase() : "";
            })
            .each(function (d) {
                const text = d3.select(this);
                const rectWidth = (d.x1 - d.x0) * 0.8; // Use 80% of the rectangle's width
                const rectHeight = d.y1 - d.y0;

                // Append subTreecat text
                text.append("tspan")
                    .attr("x", 3)
                    .attr("y", text.attr("y"))
                    .attr("dy", text.attr("dy"))
                    .text(d.data.key ? d.data.key.toUpperCase() : ""); // Ensure d.data.key is not null or undefined

                // Append primaryColor text on the next line
                text.append("tspan")
                    .attr("x", 3)
                    .attr("y", text.attr("y"))
                    .attr("dy", "1.2em") // Adjust dy to move to the next line
                    .text(primaryColor ? primaryColor.toUpperCase() : ""); // Ensure primaryColor is not null or undefined

                // Adjust font size if text overflows the rectangle height
                while (text.node().getBBox().height > rectHeight) {
                    let currentFontSize = parseFloat(text.style("font-size"));
                    if (currentFontSize <= 1) break; // Prevent font size from becoming too small
                    text.style("font-size", `${currentFontSize - 1}px`);
                    text.selectAll("tspan").each(function () {
                        d3.select(this).text(function () {
                            return d3.select(this).text();
                        });
                    });
                }

                // Adjust font size if any word is wider than the rectangle width
                text.selectAll("tspan").each(function () {
                    let tspan = d3.select(this);
                    while (tspan.node().getComputedTextLength() > rectWidth) {
                        let currentFontSize = parseFloat(text.style("font-size"));
                        if (currentFontSize <= 1) break; // Prevent font size from becoming too small
                        text.style("font-size", `${currentFontSize - 1}px`);
                        text.selectAll("tspan").each(function () {
                            d3.select(this).text(function () {
                                return d3.select(this).text();
                            });
                        });
                    }
                });

                // Ensure font size does not exceed 40pt
                let finalFontSize = parseFloat(text.style("font-size"));
                if (finalFontSize > 60) {
                    text.style("font-size", "60px");
                }

                // Hide text if font size is below 10pt
                if (finalFontSize < 10) {
                    text.style("visibility", "hidden");
                }
            });

        node.on("mouseover", function (event, d) {
            const originalColor = colorMapping[primaryColor] || "#87c9e2"; // Default color if not found in mapping
            let highlightColor;

            // Check if the primaryColor is "clear" or "black" and set highlightColor to light gray
            if (d.data.key === "clear" || d.data.key === "black") {
                highlightColor = "lightgray";
            } else {
                const colorObj = d3.color(originalColor);
                if (colorObj) {
                    highlightColor = colorObj.brighter(1.5); // Adjust the brightness factor as needed
                } else {
                    highlightColor = "lightgray"; // Fallback color
                }
            }
            const color = getColor(primaryColor, d.data.key);
            const largestGem = d.data.largestGem;
            d3.select("#info-container").style("border-left-color", colorMapping[primaryColor]);
            d3.select("#info-content").html(`
                    <strong>Number of Gemstones:</strong><br> ${d.data.count}<br><br>
                    <strong>Average Weight:</strong><br> ${(d.value / d.data.count).toFixed(2)} ct<br><br>
                    <strong style="color: ${highlightColor};">LARGEST GEM IN THE COLLECTION</strong><br>
                    <strong>Name:</strong><br> ${largestGem.title}<br><br>
                    <strong>Carat:</strong><br> ${largestGem.numericCarat} ct<br><br><br>
                     <strong style="color: ${highlightColor};">TOP TYPES OF GEMS IN THE COLLECTION</strong><br><br>
                `);
            d3.select("#info-container h2").text(d.data.key.toUpperCase() + " " + primaryColor.toUpperCase());

            // Determine the text color (white or black) based on the rectangle color
            const textColor = getTextColorBasedOnBackground(color);
            d3.select(this).select("text").style("stroke", textColor).style("stroke-width", 3);

            // Create bar chart data
            const barChartData = d.data.data.reduce((acc, gem) => {
                let type = gem.title.toLowerCase();

                // Check if the type contains "(var."
                const varMatch = type.match(/\(var\.\s*([^)]+)\)/);
                if (varMatch) {
                    // Extract the word after "(var." and before ")"
                    type = varMatch[1];
                }

                // Capitalize the type
                type = type.toUpperCase();

                if (!acc[type]) {
                    acc[type] = { type, count: 0 };
                }
                acc[type].count += 1;

                return acc;
            }, {});

            const top5Data = Object.values(barChartData)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Determine bar color
            const baseColor = colorMapping[primaryColor];
            const overlayColor = colorSubcatMapping[d.data.key] || "#000000";

            // Create the bar chart with the determined color
            createBarChart(top5Data, "info-container", baseColor, overlayColor);
        })
            .on("mouseout", function () {
                d3.select("#info-container").style("border-left-color", "#ccc");
                d3.select("#info-content").html("Hover over a rectangle to see details.");
                d3.select("#info-container h2").text("Gemstone Information");
                d3.select(this).select("text").style("stroke", "none");

                // Remove the bar chart
                d3.select("#info-container svg").remove();
            });

        function getTextColorBasedOnBackground(bgColor) {
            // Function to determine if the text color should be white or black based on the background color
            const color = d3.color(bgColor);
            const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
            return brightness > 125 ? "black" : "white";
        }
    }

});
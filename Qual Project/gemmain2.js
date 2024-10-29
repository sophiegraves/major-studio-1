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

d3.json('datagems.json').then(data => {
    // Filter out data points with null primaryColor
    const filteredData = data.filter(d => d.primaryColor !== null);

    // Define the specific gem types to include in the dropdown
    const gemTypes = ["All", "diamond", "sapphire", "quartz", "topaz", "pearl", "beryl"];

    // Select the treemap div
    const container = d3.select("#treemap");

    // Create a dropdown menu
    const dropdown = container.append("select")
        .attr("id", "gem-type-dropdown")
        .on("change", function () {
            const selectedType = this.value;
            drawTreemap(selectedType === "All" ? null : selectedType); // Pass the selected type to the drawTreemap function
        });

    dropdown.selectAll("option")
        .data(gemTypes)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d.charAt(0).toUpperCase() + d.slice(1)); // Capitalize the first letter


    // Group the data by primaryColor and calculate the total numericCarat for each group
    const groupedData = d3.rollup(
        filteredData,
        v => ({
            totalCarat: d3.sum(v, d => d.numericCarat),
            count: v.length,
            data: v // Store the original data points
        }),
        d => d.primaryColor
    );

    // Convert the grouped data into a hierarchical structure
    const root = d3.hierarchy({ children: Array.from(groupedData, ([key, value]) => ({ key, ...value })) })
        .sum(d => d.totalCarat)
        .sort((a, b) => b.value - a.value);


    // Add header and description text
    const header = container.append("h1")
        .text("Carats of Color")
        .style("text-align", "left")
        .style("margin-top", "20px");

    const description = container.append("p")
        .html("Hover over any color to see the breakdown of the total carats of all of the gems in the Smithsonian’s collection, and the types of gems in that color. Click on any color to see an additional breakdown of color variations within that specific color.")
        .style("text-align", "left")
        .style("margin", "10px 20px");

    const svg = container.append("svg");

    const backButton = container.append("button")
        .attr("id", "backButton")
        .text("Back to All Colors")
        .style("display", "none") // Initially hidden
        .style("background-color", "#4CAF50") // Green background
        .style("color", "white") // White text
        .style("padding", "10px 20px") // Padding
        .style("border", "3px") // No border
        .style("border-radius", "5px") // Rounded corners
        .style("cursor", "pointer") // Pointer cursor on hover
        .style("font-size", "16px") // Font size
        .style("margin-top", "10px") // Margin at the top
        .on("click", () => {
            rectanglesVisible = true;
            isSubTreemapVisible = false; // Update the flag
            svg.selectAll("g").remove();
            drawTreemap();
            backButton.style("display", "none"); // Hide the button
        });


    // Function to calculate the appropriate font size
    function calculateFontSize(text, width, height) {
        const maxFontSize = Math.min(height / 3, 40); // Maximum font size
        const maxWidth = width * 0.6; // Maximum width is 60% of the rectangle width
        const testText = svg.append("text").attr("class", "temp-text").text(text).style("font-size", `${maxFontSize}px`);
        let fontSize = maxFontSize;
        while ((testText.node().getComputedTextLength() > maxWidth || testText.node().getBBox().height > height) && fontSize > 1) {
            fontSize -= 0.5; // Decrease font size more gradually
            testText.style("font-size", `${fontSize}px`);
        }
        testText.remove();
        return fontSize;
    }

    // Function to wrap text within a given width
    function wrapText(text, width) {
        text.each(function () {
            const text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", dy + "em");

            let line = [],
                lineNumber = 0,
                word,
                tspanWidth;

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                tspanWidth = tspan.node().getComputedTextLength();
                if (tspanWidth > width && line.length > 1) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }

            // Handle long words that don't fit in a single line
            if (tspan.node().getComputedTextLength() > width) {
                const word = tspan.text();
                tspan.text('');
                for (let i = 0; i < word.length; i++) {
                    const char = word[i];
                    tspan.text(tspan.text() + char);
                    if (tspan.node().getComputedTextLength() > width && tspan.text().length > 1) {
                        tspan.text(tspan.text().slice(0, -1));
                        tspan = text.append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(char);
                    }
                }
            }
        });
    }
    // Define the gradient outside of the drawTreemap function
    const defs = svg.append("defs");

    const gradient = defs.append("linearGradient")
        .attr("id", "clear-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#87c9e2")
        .attr("stop-opacity", 1);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#87c9e2")
        .attr("stop-opacity", 0);

    let rectanglesVisible = true;

    function drawTreemap() {
        const width = window.innerWidth * 0.75;
        const height = window.innerHeight * 0.70;

        svg.attr("width", width)
            .attr("height", height);

        // Set the height of the info container to match the treemap
        d3.select("#info-container").style("height", `${height}px`);

        // Ensure header and description elements are available before accessing their properties
        const headerElement = header.node();
        const descriptionElement = description.node();

        if (headerElement && descriptionElement) {
            const headerHeight = headerElement.getBoundingClientRect().height;
            const descriptionHeight = descriptionElement.getBoundingClientRect().height;
            const totalTextHeight = headerHeight + descriptionHeight + 30; // Add some margin

            // Set the top margin of the info container to align with the bottom of the text
            d3.select("#info-container").style("margin-top", `${totalTextHeight}px`);
        }

        // Filter the data based on the selected gem type
        const filteredData = filterType ? data.filter(d => d.type.toLowerCase().includes(filterType.toLowerCase())) : data;

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
            .on("click", function (event, d) {
                rectanglesVisible = !rectanglesVisible;
                if (rectanglesVisible) {
                    drawTreemap();
                } else {
                    isSubTreemapVisible = true; // Update the flag
                    currentPrimaryColor = d.data.key; // Store the current primary color
                    currentData = d.data.data; // Store the current data for the sub-treemap
                    svg.selectAll("g").remove();
                    drawSubTreemap(d.data.key, d.data.data);
                    backButton.style("display", "block"); // Show the button
                }
            });

        node.append("text")
            .attr("x", 3)
            .attr("y", 25) // Position the text at the top of the rectangle
            .attr("dy", ".35em")
            .style("font-size", d => {
                let fontSize = calculateFontSize(d.data.key, d.x1 - d.x0, d.y1 - d.y0);
                return `${fontSize}px`;
            })
            .style("fill", d => {
                const color = colorMapping[d.data.key] || "#33eedd";
                return isColorDark(color) ? "#ffffff" : "#000000"; // Set text color based on background color
            })
            .text(d => d.data.key.toUpperCase())
            .call(wrapText, d => d.x1 - d.x0)

            // Add hover event to display information and update border color
            .on("mouseover", function (event, d) {
                const color = colorMapping[d.data.key] || "#33eedd";
                d3.select("#info-container").style("border-left-color", color);
                d3.select("#info-content").html(`
                <strong>Total Carat Weight:</strong> ${d.value.toFixed(2)} ct<br>
                <strong>Number of Gemstones:</strong> ${d.data.count}<br>
                <strong>Average Weight:</strong> ${(d.value / d.data.count).toFixed(2)} ct
            `);
                d3.select("#info-container h2").text(d.data.key.toUpperCase());
                d3.select(this).style("stroke", "#000").style("stroke-width", 2);
            })
            .on("mouseout", function () {
                d3.select("#info-container").style("border-left-color", "#ccc");
                d3.select("#info-content").html("Hover over a rectangle to see details.");
                d3.select("#info-container h2").text("Gemstone Information");
                d3.select(this).style("stroke", "none");
            });

        function drawSubTreemap(primaryColor, data) {
            // Group the data by colorSubcat and calculate the total numericCarat for each group
            const groupedData = d3.rollup(
                data,
                v => ({
                    totalCarat: d3.sum(v, d => d.numericCarat),
                    count: v.length,
                    largestGem: v.reduce((max, gem) => gem.numericCarat > max.numericCarat ? gem : max, v[0]) // Find the largest gem
                }),
                d => d.colorSubcat
            );

            // Convert the grouped data into an array, filter, sort by totalCarat, and take the top 15 entries
            const sortedData = Array.from(groupedData, ([key, value]) => ({ key, ...value }))
                .filter(d => d.count >= 3) // Include only entries with at least 3 data points
                .sort((a, b) => b.totalCarat - a.totalCarat)
                .slice(0, 15); // Take the top 15 entries

            // Convert the sorted and limited data into a hierarchical structure
            const root = d3.hierarchy({ children: sortedData })
                .sum(d => d.totalCarat)
                .sort((a, b) => b.value - a.value);

            const width = window.innerWidth * 0.75;
            const height = window.innerHeight * 0.70;

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
                // Add more mappings as needed
            };

            svg.attr("width", width)
                .attr("height", height);

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
                .attr("fill", d => colorMapping[primaryColor] || "#87c9e2"); // Use the primary color for the sub-treemap

            // Append the 25% opacity rectangle
            node.append("rect")
                .attr("width", d => d.x1 - d.x0)
                .attr("height", d => d.y1 - d.y0)
                .attr("fill", d => colorSubcatMapping[d.data.key] || "#000000") // Use the color mapping for colorSubcat
                .attr("opacity", d => colorSubcatMapping[d.data.key] ? 0.55 : 0.0); // Set opacity to 55% if color exists, otherwise 0%

            node.append("text")
                .attr("x", 3)
                .attr("y", 25) // Position the text at the top of the rectangle
                .attr("dy", ".35em")
                .style("font-size", d => {
                    let fontSize = calculateFontSize(d.data.key, d.x1 - d.x0, d.y1 - d.y0);
                    return `${fontSize}px`;
                })
                .style("fill", d => {
                    const color = colorSubcatMapping[d.data.key] || "#000000";
                    return isColorDark(color) ? "#ffffff" : "#000000"; // Set text color based on background color
                })
                .each(function (d) {
                    const text = d3.select(this);
                    text.append("tspan")
                        .attr("x", 3)
                        .text(d.data.key.toUpperCase());
                    text.append("tspan")
                        .attr("x", 3)
                        .attr("dy", "1em") // Move to the next line
                        .text(primaryColor.toUpperCase());
                });


            // Add hover event to display information and update border color
            node.on("mouseover", function (event, d) {
                const largestGem = d.data.largestGem;
                d3.select("#info-container").style("border-left-color", colorSubcatMapping[d.data.key] || '#ccc');
                d3.select("#info-content").html(`
        <strong>Number of Gemstones:</strong><br> ${d.data.count}<br><br>
        <strong>Average Weight:</strong><br> ${(d.value / d.data.count).toFixed(2)} ct<br><br>
        <strong>LARGEST GEM IN THE COLLECTION</strong><br>
        <strong>Name:</strong> ${largestGem.title}<br>
        <strong>Carat:</strong> ${largestGem.numericCarat} ct<br>
    `);
                d3.select("#info-container h2").html(`${d.data.key.toUpperCase()} ${primaryColor.toUpperCase()}`);
            });

            node.on("mouseout", function () {
                d3.select("#info-container").style("border-left-color", "#ccc");
                d3.select("#info-content").html("Hover over a rectangle to see details.");
                d3.select("#info-container h2").html(`${primaryColor.toUpperCase()} GEMS`);
            });
        }

        // Initial draw
        drawTreemap();

        // Redraw on window resize
        window.addEventListener("resize", () => {
            svg.selectAll("g").remove(); // Clear the nodes but keep the gradient
            if (isSubTreemapVisible) {
                // Redraw the sub-treemap if it is currently visible
                drawSubTreemap(currentPrimaryColor, currentData);
            } else {
                // Redraw the primary treemap
                drawTreemap();
            }
        });
    }
});
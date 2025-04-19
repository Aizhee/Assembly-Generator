// Description: This script creates a pixel art editor that allows users to draw on a canvas, add text variables, and generate assembly code for VGA graphics. 
// The generated code can be copied to the clipboard for use in assembly programming.

const vgaColors = [
  "#000000",
  "#000080",
  "#008000",
  "#008080",
  "#800000",
  "#800080",
  "#808000",
  "#c0c0c0",
  "#808080",
  "#0000ff",
  "#00ff00",
  "#00ffff",
  "#ff0000",
  "#ff00ff",
  "#ffff00",
  "#ffffff",
];

const vgaColorsRGB = [
  [0x00, 0x00, 0x00],
  [0x00, 0x00, 0xaa],
  [0x00, 0xaa, 0x00],
  [0x00, 0xaa, 0xaa],
  [0xaa, 0x00, 0x00],
  [0xaa, 0x00, 0xaa],
  [0xaa, 0x55, 0x00],
  [0xaa, 0xaa, 0xaa],
  [0x55, 0x55, 0x55],
  [0x55, 0x55, 0xff],
  [0x55, 0xff, 0x55],
  [0x55, 0xff, 0xff],
  [0xff, 0x55, 0x55],
  [0xff, 0x55, 0xff],
  [0xff, 0xff, 0x55],
  [0xff, 0xff, 0xff],
];

const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");
const output = document.getElementById("output");
const copyBtn = document.getElementById("copyBtn");
const colorPicker = document.getElementById("colorPicker");
let grid = [],
  currentColor = 0,
  isDrawing = false,
  cols,
  rows,
  textVariables = [];

// Initialize color picker
vgaColors.forEach((color, index) => {
  const swatch = document.createElement("div");
  swatch.className = "color-swatch";
  swatch.style.backgroundColor = color;
  swatch.addEventListener("click", () => {
    document.querySelector(".selected")?.classList.remove("selected");
    swatch.classList.add("selected");
    currentColor = index;
  });
  colorPicker.appendChild(swatch);
});
colorPicker.children[0].classList.add("selected");

// Initialize canvas
function initCanvas() {
  cols = Math.min(100, parseInt(document.getElementById("pixelWidth").value));
  rows = Math.min(100, parseInt(document.getElementById("pixelHeight").value));
  canvas.width = cols * 10;
  canvas.height = rows * 10;
  grid = Array(rows)
    .fill()
    .map(() => Array(cols).fill(0));
  drawGrid();
  saveState()
}

function drawGrid() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cellWidth = canvas.width / cols;
  const cellHeight = canvas.height / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      ctx.fillStyle = vgaColors[grid[y][x]];
      ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
    }
  }
  drawTextVariables();
}

function drawTextVariables() {
  const cellWidth = canvas.width / cols;
  const cellHeight = canvas.height / rows;
  ctx.font = `${cellHeight}px Terminal`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  textVariables.forEach((v) => {
    for (let i = 0; i < v.text.length; i++) {
      const char = v.text[i];
      const charX = (v.col + i) * cellWidth;
      const charY = v.row * cellHeight;
      const bgColor = grid[v.row][v.col + i] || 0; // Get background color for each character
      ctx.fillStyle = vgaColors[bgColor];
      ctx.fillRect(charX, charY, cellWidth, cellHeight); // Fill background
      ctx.fillStyle = bgColor >= 7 ? "#000000" : "#ffffff"; // Set text color
      ctx.fillText(char, charX, charY); // Draw character
    }
  });
}

// Drawing logic
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

let lastDrawn = { x: -1, y: -1 };

function getCanvasPosition(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function startDrawing(e) {
  const pos = getCanvasPosition(e);
  const cellWidth = canvas.width / cols;
  const cellHeight = canvas.height / rows;
  const x = Math.floor(pos.x / cellWidth);
  const y = Math.floor(pos.y / cellHeight);
  if (x >= 0 && x < cols && y >= 0 && y < rows) {
    saveState(); // Save before drawing starts
  }
  isDrawing = true;
  lastDrawn = { x: -1, y: -1 }; // Reset tracking
  draw(e);
}

function draw(e) {
  if (!isDrawing) return;
  const pos = getCanvasPosition(e);
  const cellWidth = canvas.width / cols;
  const cellHeight = canvas.height / rows;
  const x = Math.floor(pos.x / cellWidth);
  const y = Math.floor(pos.y / cellHeight);

  // Avoid re-drawing the same cell repeatedly
  if (x === lastDrawn.x && y === lastDrawn.y) return;

  if (x >= 0 && x < cols && y >= 0 && y < rows) {
    grid[y][x] = currentColor;
    lastDrawn = { x, y };
    drawGrid();
  }
}

function stopDrawing() {
  isDrawing = false;
  lastDrawn = { x: -1, y: -1 };
}

// Undo/Redo functionality
let undoStack = [];
let redoStack = [];

function saveState() {
  undoStack.push(JSON.parse(JSON.stringify(grid)));
  redoStack = []; // Clear redo stack on new action
}

function undo() {
  if (undoStack.length > 0) {
    redoStack.push(JSON.parse(JSON.stringify(grid)));
    grid = undoStack.pop();
    drawGrid();
  }
}

function redo() {
  if (redoStack.length > 0) {
    undoStack.push(JSON.parse(JSON.stringify(grid)));
    grid = redoStack.pop();
    drawGrid();
  }
}

// Keyboard shortcuts for undo/redo
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "z") {
    e.preventDefault();
    undo();
  } else if (e.ctrlKey && e.key === "y") {
    e.preventDefault();
    redo();
  }
});


// Clear canvas
document.getElementById("clearBtn").addEventListener("click", () => {
  if (confirm("Are you sure you want to clear the canvas? This action cannot be undone.")) {
    initCanvas();
  }
});

// Handle dimension changes
let dimensionChangeWarned = false;

["pixelWidth", "pixelHeight"].forEach((id) => {
  document.getElementById(id).addEventListener("change", () => {
    if (!dimensionChangeWarned) {
      if (confirm("Changing dimensions will clear the canvas. Are you sure?")) {
        initCanvas();
      }
      dimensionChangeWarned = true;
    } else {
      initCanvas();
    }
  });
});

// Add text variables
document.getElementById("addTextBtn").addEventListener("click", () => {
  const varName = document.getElementById("varName").value.trim();
  const varText = document.getElementById("varText").value.trim();
  const varRow = parseInt(document.getElementById("varRow").value);
  const varCol = parseInt(document.getElementById("varCol").value);

  if (!varName || !varText || isNaN(varRow) || isNaN(varCol)) return;

  // Check for duplicate variable names
  if (textVariables.some((v) => v.name === varName)) {
    alert("Variable name must be unique.");
    return;
  }

  // Check for overlapping text
  const textLength = varText.length;
  if (
    textVariables.some((v) => {
      const overlapRow = v.row === varRow;
      const overlapCol =
        varCol < v.col + v.text.length && varCol + textLength > v.col;
      return overlapRow && overlapCol;
    })
  ) {
    alert("Text overlaps with an existing variable.");
    return;
  }

  textVariables.push({
    name: varName,
    text: varText,
    row: varRow,
    col: varCol,
  });

  updateTextList();
  drawGrid();
});

function updateTextList() {
  const list = document.getElementById("textList");
  list.innerHTML = textVariables
    .map(
      (v, i) => `
    <div class="text-input">
    <input type="text" value="${v.name}" onchange="updateVariable(${i}, 'name', this.value)" placeholder="Variable name">
    <input type="text" value="${v.text}" onchange="updateVariable(${i}, 'text', this.value)" placeholder="Text content">
    <input type="number" value="${v.row}" onchange="updateVariable(${i}, 'row', parseInt(this.value))" placeholder="Row" min="0" max="100">
    <input type="number" value="${v.col}" onchange="updateVariable(${i}, 'col', parseInt(this.value))" placeholder="Col" min="0" max="100">
    <button onclick="if(confirm('Are you sure you want to delete this variable?')) { textVariables.splice(${i},1); updateTextList(); drawGrid(); }">❌</button>
    </div>
    `
    )
    .join("");
}

function updateVariable(index, key, value) {
  if (key === "row" || key === "col") {
    if (isNaN(value)) return;
  }
  textVariables[index][key] = value;
  drawGrid();
}

// VGA color matching
function getClosestVgaColor(r, g, b) {
  let minDist = Infinity,
    bestIndex = 0;
  for (let i = 0; i < vgaColorsRGB.length; i++) {
    const [vgaR, vgaG, vgaB] = vgaColorsRGB[i];
    const dist = Math.sqrt((r - vgaR) ** 2 + (g - vgaG) ** 2 + (b - vgaB) ** 2);
    if (dist < minDist) {
      minDist = dist;
      bestIndex = i;
    }
  }
  return bestIndex;
}

// Generate assembly
document.getElementById("generateBtn").addEventListener("click", () => {
  const drawn = Array.from({ length: rows }, () => Array(cols).fill(false));
  let asm = `.model small\n.stack\n.data\n`;

  // Add text variables to data section
  textVariables.forEach((v) => {
    asm += `    ${v.name} DB '${v.text.replace(/'/g, "''")}',13,10,'$'\n`;
  });

  asm += `.code\nstart:\n\n`;
  
  // Determine the most frequent color in the grid
  const colorFrequency = Array(16).fill(0);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      colorFrequency[grid[y][x]]++;
    }
  }
  const mostFrequentColor = colorFrequency.indexOf(Math.max(...colorFrequency));
  const shiftedColor = mostFrequentColor << 4;
  let hex = shiftedColor.toString(16).padStart(2, "0").toUpperCase();
  if (/^[A-F]/.test(hex)) hex = "0" + hex;
  const bhValue = mostFrequentColor === 0 ? "07" : hex;

  // Draw the entire screen with the most frequent color
  asm += `; Draw Background\n`;
  asm += `mov ah, 07h\nmov bh, ${bhValue}h\nmov ch, 0\nmov cl, 0\nmov dh, ${
    rows - 1
  }\nmov dl, ${cols - 1}\nint 10h\n\n`;

  // Generate rectangles
  for (let color = 0; color < 16; color++) {
    if (color === mostFrequentColor) continue; // Skip the most frequent color
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x] === color && !drawn[y][x]) {
          let width = 1;
          while (
            x + width < cols &&
            grid[y][x + width] === color &&
            !drawn[y][x + width]
          )
            width++;
          let fullHeight = 1,
            expand = true;
          while (expand && y + fullHeight < rows) {
            for (let k = 0; k < width; k++) {
              if (
                grid[y + fullHeight][x + k] !== color ||
                drawn[y + fullHeight][x + k]
              ) {
                expand = false;
                break;
              }
            }
            if (expand) fullHeight++;
          }
          for (let dy = 0; dy < fullHeight; dy++) {
            for (let dx = 0; dx < width; dx++) {
              drawn[y + dy][x + dx] = true;
            }
          }
          const shiftedColor = color << 4;
          let hex = shiftedColor.toString(16).padStart(2, "0").toUpperCase();
          if (/^[A-F]/.test(hex)) hex = "0" + hex;
          const bhValue = color === 0 ? "07" : hex; // Set bh to 07 if the background is black
          asm += `; Draw rectangle at (${x}, ${y}) with color ${hex}\n`;
          asm += `mov ah, 07h\nmov bh, ${bhValue}h\nmov ch, ${y}\nmov cl, ${x}\nmov dh, ${
            y + fullHeight - 1
          }\nmov dl, ${x + width - 1}\nint 10h\n\n`;
        }
      }
    }
  }

  // add to datasegment
  asm += `mov ax, @data\nmov ds, ax\n\n`;

  // Add text display code
  textVariables.forEach((v) => {
    asm += `
; Set cursor position for ${v.name}
mov ah, 02h
mov bh, 00
mov dh, ${v.row}
mov dl, ${v.col}
int 10h
  
; Display ${v.name}
mov ah, 09h
mov dx, offset ${v.name}
int 21h\n\n`;
  });

  asm += `mov ah, 4Ch\nint 21h\nend start`;
  output.textContent = asm;
});

// Copy to clipboard
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(output.textContent).then(() => {
    copyBtn.textContent = "✅ Copied!";
    setTimeout(() => (copyBtn.textContent = "📋 Copy to Clipboard"), 1500);
  });
});

// Warn user if they reload content, changes will not be saved
window.addEventListener("beforeunload", (e) => {
  e.preventDefault();
  confirm("Are you sure you want to leave? Changes will not be saved.");
});

// Save canvas and text variables to JSON
document.getElementById("saveBtn").addEventListener("click", () => {
  const data = {
    grid,
    textVariables,
    cols,
    rows,
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "canvas_data.json";
  a.click();
  URL.revokeObjectURL(url);
});

// Trigger file input when load button is clicked
document.getElementById("loadBtn").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});

// Handle file selection and load JSON
document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (data.grid && data.textVariables && data.cols && data.rows) {
        grid = data.grid;
        textVariables = data.textVariables;
        cols = data.cols;
        rows = data.rows;
        canvas.width = cols * 10;
        canvas.height = rows * 10;
        drawGrid();
        updateTextList();
      } else {
        alert("Invalid file format.");
      }
    } catch (error) {
      alert("Error loading file: " + error.message);
    }
  };
  reader.readAsText(file);
});


// Initialize canvas
initCanvas();

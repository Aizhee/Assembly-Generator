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
  isDrawing = true;
  draw(e);
}

function draw(e) {
  if (!isDrawing) return;
  const pos = getCanvasPosition(e);
  const cellWidth = canvas.width / cols;
  const cellHeight = canvas.height / rows;
  const x = Math.floor(pos.x / cellWidth);
  const y = Math.floor(pos.y / cellHeight);
  if (x >= 0 && x < cols && y >= 0 && y < rows) {
    grid[y][x] = currentColor;
    drawGrid();
  }
}

function stopDrawing() {
  isDrawing = false;
}

// Clear canvas
document.getElementById("clearBtn").addEventListener("click", initCanvas);

// Handle dimension changes
document.getElementById("pixelWidth").addEventListener("change", initCanvas);
document.getElementById("pixelHeight").addEventListener("change", initCanvas);

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
    <div>
    <input type="text" value="${v.name}" onchange="updateVariable(${i}, 'name', this.value)" placeholder="Variable name">
    <input type="text" value="${v.text}" onchange="updateVariable(${i}, 'text', this.value)" placeholder="Text content">
    <input type="number" value="${v.row}" onchange="updateVariable(${i}, 'row', parseInt(this.value))" placeholder="Row" min="0" max="24">
    <input type="number" value="${v.col}" onchange="updateVariable(${i}, 'col', parseInt(this.value))" placeholder="Col" min="0" max="79">
    <button onclick="textVariables.splice(${i},1); updateTextList(); drawGrid()">❌</button>
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

  // Generate rectangles
  for (let color = 0; color < 16; color++) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x] === color && !drawn[y][x]) {
          let width = 1,
            height = 1;
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
          //   comment
          asm += `; Draw rectangle at (${x}, ${y}) with color ${hex}\n`;
          asm += `mov ah, 07h\nmov bh, ${bhValue}h\nmov ch, ${y}\nmov cl, ${x}\nmov dh, ${
            y + fullHeight - 1
          }\nmov dl, ${x + width - 1}\nint 10h\n\n`;
        }
      }
    }
  }

  // add to datasegment
  // mov ax,@data
  // mov ds,ax
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

// Initialize canvas
initCanvas();

# A simple script to generate assembly code to print String from a text file
# The generated assembly code is compatible with emu8086
# ================================================================

# Read input from a text file and generate assembly code

def generate_assembly(input_file, output_file):
    with open(input_file, 'r') as file:
        lines = file.readlines()
    
    with open(output_file, 'w') as file:
        file.write(".model small\n")
        file.write(".data\n\n")
        
        for i, line in enumerate(lines):
            line = line.strip()
            file.write(f"var{i} db '{line}', 13, 10, '$'\n")  # Store each line with CRLF and '$' for printing
        
        file.write("\n.code\n")
        file.write("start:\n")
        file.write("mov ax, @data\n")
        file.write("mov ds, ax\n")
        file.write("mov ah, 09h\n\n")
        
        for i in range(len(lines)):
            file.write(f"mov dx, offset var{i}\n")
            file.write("int 21h\n")
        
        file.write("\nmov ah, 4Ch\n")
        file.write("int 21h\n")
        file.write("end start\n")


# Example usage
generate_assembly('input.txt', 'output.asm')